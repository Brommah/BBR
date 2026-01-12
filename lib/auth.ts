import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured, SupabaseUser } from './supabase'
import { getUserByEmail } from './db-actions'

/**
 * User roles in the system:
 * - admin: Full access, can approve quotes, manage users, view all data
 * - engineer: Can work on assigned leads, submit quotes for approval
 * - viewer: Read-only access (for stakeholders)
 */
export type UserRole = 'admin' | 'engineer' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

/**
 * Granular permissions for feature access
 */
export type Permission = 
  | 'quotes:approve'
  | 'quotes:reject'
  | 'quotes:submit'
  | 'quotes:view'
  | 'quotes:feedback'
  | 'leads:create'
  | 'leads:assign'
  | 'leads:view-all'
  | 'leads:view-own'
  | 'leads:edit'
  | 'admin:access'
  | 'admin:manage-users'
  | 'admin:manage-pricing'
  | 'settings:view'
  | 'settings:edit'

/**
 * Permission matrix per role
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'quotes:approve',
    'quotes:reject',
    'quotes:submit',
    'quotes:view',
    'quotes:feedback',
    'leads:create',
    'leads:assign',
    'leads:view-all',
    'leads:edit',
    'admin:access',
    'admin:manage-users',
    'admin:manage-pricing',
    'settings:view',
    'settings:edit',
  ],
  engineer: [
    'quotes:submit',
    'quotes:view',
    'leads:view-own',
    'leads:edit',
    'settings:view',
  ],
  viewer: [
    'leads:view-all',
    'quotes:view',
    'settings:view',
  ]
}

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  clearError: () => void
  
  // Permission checks
  hasPermission: (permission: Permission) => boolean
  isAdmin: () => boolean
  isEngineer: () => boolean
}

/**
 * Convert Supabase user to our User type
 */
function convertSupabaseUser(supabaseUser: SupabaseUser): User {
  const metadata = supabaseUser.user_metadata || {}
  return {
    id: supabaseUser.id,
    name: metadata.name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    role: (metadata.role as UserRole) || 'viewer',
    avatar: metadata.avatar_url
  }
}

/**
 * Auth store with Supabase integration
 * NO development bypass - all auth goes through Supabase
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Login with email and password via Supabase
       */
      login: async (email: string, password: string): Promise<boolean> => {
        if (!isSupabaseConfigured() || !supabase) {
          set({ 
            error: 'Authenticatie niet geconfigureerd. Configureer Supabase omgevingsvariabelen.' 
          })
          return false
        }

        set({ isLoading: true, error: null })

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          })

          if (error) {
            let errorMessage = 'Inloggen mislukt'
            
            // Translate common Supabase errors to Dutch
            if (error.message.includes('Invalid login credentials')) {
              errorMessage = 'Ongeldige inloggegevens'
            } else if (error.message.includes('Email not confirmed')) {
              errorMessage = 'E-mail niet bevestigd'
            } else if (error.message.includes('Too many requests')) {
              errorMessage = 'Te veel pogingen. Probeer later opnieuw.'
            }
            
            set({ isLoading: false, error: errorMessage })
            return false
          }

          if (data.user) {
            // Fetch user from database to get the correct role
            const dbResult = await getUserByEmail(data.user.email || '')
            
            if (dbResult.success && dbResult.data) {
              // Use database user with correct role
              const dbUser = dbResult.data as { id: string; name: string; email: string; role: string; avatar?: string }
              set({ 
                currentUser: {
                  id: dbUser.id,
                  name: dbUser.name,
                  email: dbUser.email,
                  role: dbUser.role as UserRole,
                  avatar: dbUser.avatar
                }, 
                isAuthenticated: true, 
                isLoading: false,
                error: null 
              })
              return true
            } else {
              // Fallback to Supabase user if not in database (shouldn't happen)
              console.warn('[Auth] User not found in database, using Supabase metadata')
              const user = convertSupabaseUser(data.user as SupabaseUser)
              set({ 
                currentUser: user, 
                isAuthenticated: true, 
                isLoading: false,
                error: null 
              })
              return true
            }
          }

          set({ isLoading: false, error: 'Inloggen mislukt' })
          return false
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Onbekende fout'
          set({ isLoading: false, error: message })
          return false
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.auth.signOut()
          } catch (err) {
            console.error('[Auth] Logout error:', err)
          }
        }
        set({ currentUser: null, isAuthenticated: false, error: null })
      },

      /**
       * Check for existing session on app load
       */
      checkSession: async () => {
        if (!isSupabaseConfigured() || !supabase) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })

        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('[Auth] Session check error:', error)
            set({ currentUser: null, isAuthenticated: false, isLoading: false })
            return
          }

          if (session?.user) {
            // Fetch user from database to get the correct role
            const dbResult = await getUserByEmail(session.user.email || '')
            
            if (dbResult.success && dbResult.data) {
              const dbUser = dbResult.data as { id: string; name: string; email: string; role: string; avatar?: string }
              set({ 
                currentUser: {
                  id: dbUser.id,
                  name: dbUser.name,
                  email: dbUser.email,
                  role: dbUser.role as UserRole,
                  avatar: dbUser.avatar
                }, 
                isAuthenticated: true, 
                isLoading: false 
              })
            } else {
              // Fallback to Supabase user if not in database
              console.warn('[Auth] User not found in database during session check')
              const user = convertSupabaseUser(session.user as SupabaseUser)
              set({ 
                currentUser: user, 
                isAuthenticated: true, 
                isLoading: false 
              })
            }
          } else {
            set({ 
              currentUser: null, 
              isAuthenticated: false, 
              isLoading: false 
            })
          }
        } catch (err) {
          console.error('[Auth] Session check failed:', err)
          set({ 
            currentUser: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        }
      },

      clearError: () => set({ error: null }),

      hasPermission: (permission: Permission) => {
        const { currentUser } = get()
        if (!currentUser) return false
        return ROLE_PERMISSIONS[currentUser.role].includes(permission)
      },

      isAdmin: () => {
        const { currentUser } = get()
        return currentUser?.role === 'admin'
      },

      isEngineer: () => {
        const { currentUser } = get()
        return currentUser?.role === 'engineer'
      },
    }),
    {
      name: 'broersma-auth',
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

/**
 * Hook to check if user can access a feature
 */
export function usePermission(permission: Permission): boolean {
  return useAuthStore(state => state.hasPermission(permission))
}

/**
 * Hook to get current user
 */
export function useCurrentUser(): User | null {
  return useAuthStore(state => state.currentUser)
}

/**
 * Get all available users (from database in production)
 * This is used for assignee dropdowns
 */
export function getEngineers(): User[] {
  // In production, this should fetch from the database
  // For now, return empty array - components should handle this
  return []
}

/**
 * Get user by name (for backwards compatibility)
 */
export function getUserByName(name: string): User | undefined {
  // In production, this should query the database
  return undefined
}

// Re-export USERS as empty for backwards compatibility
// Components should migrate to fetching users from database
export const USERS: User[] = []
