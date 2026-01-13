import { NextRequest, NextResponse } from 'next/server'
import { syncAllDocumentationToNotion, syncRoadmapToNotion, syncSimpleBackofficeWiki } from '@/app/actions'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Get authenticated user from Supabase session
 * Returns null if not authenticated or not admin
 */
async function getAuthenticatedAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured - allow in development
    if (process.env.NODE_ENV === 'development') {
      return { isAdmin: true }
    }
    return { isAdmin: false, error: 'Supabase not configured' }
  }
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Not needed for read-only operations
        },
      },
    }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { isAdmin: false, error: 'Not authenticated' }
  }
  
  const userRole = user.user_metadata?.role
  if (userRole !== 'admin') {
    return { isAdmin: false, error: 'Admin access required' }
  }
  
  return { isAdmin: true }
}

/**
 * API Route to trigger Notion documentation sync
 * 
 * GET /api/notion-sync - Sync all documentation pages
 * GET /api/notion-sync?type=roadmap - Sync only roadmap tasks
 * 
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const { isAdmin, error: authError } = await getAuthenticatedAdmin()
  
  if (!isAdmin) {
    return NextResponse.json(
      { 
        success: false, 
        error: authError || 'Unauthorized',
        message: 'Admin access required for Notion sync'
      },
      { status: authError === 'Not authenticated' ? 401 : 403 }
    )
  }
  
  const searchParams = request.nextUrl.searchParams
  const syncType = searchParams.get('type') || 'all'

  try {
    if (syncType === 'roadmap') {
      const result = await syncRoadmapToNotion()
      return NextResponse.json({
        success: result.success,
        message: `Synced ${result.count} roadmap items to Notion`,
        type: 'roadmap'
      })
    }
    
    if (syncType === 'wiki') {
      const result = await syncSimpleBackofficeWiki()
      return NextResponse.json({
        success: result.success,
        message: result.success ? result.message : result.error,
        blocksAdded: result.success ? result.blocksAdded : undefined,
        type: 'wiki'
      })
    }

    // Default: sync all documentation
    const result = await syncAllDocumentationToNotion()
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      results: result.results,
      type: 'all'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
