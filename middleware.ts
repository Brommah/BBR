import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession, isSupabaseConfigured } from '@/lib/supabase-middleware'

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/admin',
  '/pipeline',
  '/inbox',
  '/leads',
  '/templates',
  '/incentives',
  '/settings',
  '/planning',
  '/roadmap',
  '/feedback',
  '/improvements',
  '/marketing-preview',
]

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = [
  '/admin',
]

/**
 * API routes that require admin access
 */
const ADMIN_API_ROUTES = [
  '/api/notion-sync',
]

/**
 * Public routes (no auth required)
 */
const PUBLIC_ROUTES = [
  '/login',
  '/intake',
  '/api/intake',
  '/monitoring', // Sentry tunnel route - must be public
]

/**
 * API routes that require CSRF validation (state-changing)
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Check if path matches any route in the list
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => 
    path === route || path.startsWith(`${route}/`)
  )
}

/**
 * Generate a CSRF token
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token from request against stored cookie
 */
function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf-token')?.value
  const headerToken = request.headers.get('x-csrf-token')
  
  if (!cookieToken || !headerToken) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Extract user role from Supabase user metadata
 * Note: Role is primarily stored in the database User table, not user_metadata
 * The middleware allows access if role is not in metadata, 
 * and defers to client-side AccessGuard for final authorization
 */
function getUserRole(user: { user_metadata?: { role?: string } } | null): string | null {
  return user?.user_metadata?.role || null
}

/**
 * Middleware for authentication and authorization
 * Runs on every request before the page/API handler
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  // Allow public routes without session update
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next()
  }

  // Check if route requires protection
  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES)
  const isAdminRoute = matchesRoute(pathname, ADMIN_ROUTES)
  const isAdminApiRoute = matchesRoute(pathname, ADMIN_API_ROUTES)
  const isApiRoute = pathname.startsWith('/api/')
  
  // For protected routes and APIs, verify Supabase session
  if (isProtectedRoute || isAdminApiRoute || pathname === '/') {
    if (!isSupabaseConfigured()) {
      // Supabase not configured - allow access (dev mode)
      console.warn('[Middleware] Supabase not configured, skipping auth check')
      return NextResponse.next()
    }

    // Update session and get user
    const { response, user } = await updateSession(request)
    
    if (!user) {
      // No authenticated user
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        )
      }
      // Redirect to login for pages
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Server-side admin role verification for admin routes
    // Note: Role is stored in database, not always in Supabase user_metadata
    // If role is not in metadata, allow access and let AccessGuard handle it client-side
    if (isAdminRoute || isAdminApiRoute) {
      const userRole = getUserRole(user)
      
      // Only block if we explicitly know the user is NOT an admin
      // If role is null/undefined (not set in metadata), allow through to client-side check
      if (userRole && userRole !== 'admin') {
        if (isApiRoute) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Admin access required' },
            { status: 403 }
          )
        }
        // Redirect non-admins to pipeline
        return NextResponse.redirect(new URL('/pipeline', request.url))
      }
    }
    
    // CSRF validation for state-changing API requests
    if (isApiRoute && CSRF_PROTECTED_METHODS.includes(method)) {
      // Skip CSRF for public intake API
      if (!matchesRoute(pathname, PUBLIC_ROUTES)) {
        if (!validateCSRFToken(request)) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Invalid or missing CSRF token' },
            { status: 403 }
          )
        }
      }
    }

    // Add security headers to the response
    addSecurityHeaders(response)
    
    // CSRF Protection - Generate new token for GET requests
    if (method === 'GET') {
      const csrfToken = generateCSRFToken()
      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: false, // Must be readable by JS to include in headers
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })
    }

    return response
  }

  // For non-protected routes, still update session (for fresh cookies)
  const { response } = await updateSession(request)
  addSecurityHeaders(response)
  
  return response
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/health).*)',
  ],
}
