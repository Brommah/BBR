import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables at build time
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured && typeof window !== 'undefined') {
  console.warn(
    '[Supabase] Environment variables not configured.\n' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local\n' +
    'Get these from: Supabase Dashboard > Settings > API'
  )
}

/**
 * Supabase client singleton
 * Returns null if not configured (allows graceful degradation)
 */
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured
}

/**
 * Type for Supabase user metadata
 */
export interface SupabaseUserMetadata {
  name?: string
  role?: 'admin' | 'engineer' | 'viewer'
  avatar_url?: string
}

/**
 * Type for Supabase Auth user
 */
export interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: SupabaseUserMetadata
}

/**
 * Get current session (server-safe)
 */
export async function getSession() {
  if (!supabase) return null
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('[Supabase] Error getting session:', error)
    return null
  }
}

/**
 * Get current user (server-safe)
 */
export async function getCurrentUser() {
  if (!supabase) return null
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('[Supabase] Error getting user:', error)
    return null
  }
}
