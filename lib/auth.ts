import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase-browser'
import { getUserByEmail } from './db-actions'

/**
 * Type for Supabase Auth user
 */
interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    role?: 'admin' | 'engineer' | 'viewer'
    avatar_url?: string
  }
}

/**
 * User roles in the system:
 * - admin: Projectleider - Full access, can approve quotes, manage users, assign team members
 * - engineer: Rekenaar or Tekenaar - Can work on assigned leads when "aan zet"
 * - viewer: Read-only access (for stakeholders)
 */
export type UserRole = 'admin' | 'engineer' | 'viewer'

/**
 * Engineer specialization types:
 * - rekenaar: Calculator/Structural engineer - does calculations
 * - tekenaar: Draftsman - creates technical drawings
 * Only applicable when role === 'engineer'
 */
export type EngineerType = 'rekenaar' | 'tekenaar'

/**
 * Display names for roles (Dutch)
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Projectleider',
  engineer: 'Engineer',
  viewer: 'Viewer'
}

/**
 * Display names for engineer types (Dutch)
 */
export const ENGINEER_TYPE_DISPLAY_NAMES: Record<EngineerType, string> = {
  rekenaar: 'Rekenaar',
  tekenaar: 'Tekenaar'
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  engineerType?: EngineerType // Only for engineers: 'rekenaar' or 'tekenaar'
  avatar?: string
}

/**
 * Get display name for a user (includes engineer type if applicable)
 */
export function getUserDisplayRole(user: User): string {
  if (user.role === 'engineer' && user.engineerType) {
    return ENGINEER_TYPE_DISPLAY_NAMES[user.engineerType]
  }
  return ROLE_DISPLAY_NAMES[user.role]
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
  | 'leads:assign'           // Can assign Rekenaar/Tekenaar to leads (Projectleider only)
  | 'leads:view-all'         // Can see all leads in all statuses
  | 'leads:view-own'         // Can only see leads assigned to them and "aan zet"
  | 'leads:view-offerte'     // Can see leads in offerte phase (Projectleider only)
  | 'leads:edit'
  | 'leads:delete'
  | 'leads:set-aan-zet'      // Can change who is "aan zet" (Projectleider only)
  | 'admin:access'
  | 'admin:manage-users'
  | 'admin:manage-pricing'
  | 'settings:view'
  | 'settings:edit'

/**
 * Permission matrix per role
 * 
 * Projectleider (admin) role:
 * - Full access to pipeline
 * - Can assign Rekenaar and Tekenaar to leads
 * - Can set "aan zet" status
 * - Can approve/reject quotes
 * - Only role that sees leads in offerte phase
 * 
 * Rekenaar/Tekenaar (engineer) role:
 * - Only sees leads when:
 *   1. Assigned to them (as rekenaar or tekenaar)
 *   2. Status is "Opdracht" (quote accepted)
 *   3. They are "aan zet" (their turn to work)
 * - Can register hours
 * - Can submit calculations/drawings
 * 
 * Workflow: Lead → Offerte accepted → Projectleider assigns team → Sets "aan zet"
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
    'leads:view-offerte',  // Can see leads in offerte phase
    'leads:edit',
    'leads:delete',
    'leads:set-aan-zet',   // Can change who is "aan zet"
    'admin:access',
    'admin:manage-users',
    'admin:manage-pricing',
    'settings:view',
    'settings:edit',
  ],
  engineer: [
    // Engineers (Rekenaar/Tekenaar) can:
    // - View only leads assigned to them AND "aan zet" AND status = Opdracht
    // - Register hours
    // - Download documents
    // - View quote details (read-only)
    'leads:view-own',
    'quotes:view',      // Can view quote details (read-only)
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
  isInitialized: boolean // Prevents redirects during HMR until session is checked
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
  isRekenaar: () => boolean
  isTekenaar: () => boolean
  isProjectleider: () => boolean  // Alias for isAdmin
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
    engineerType: (metadata.engineerType as EngineerType) || undefined,
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
      isInitialized: false, // Set to true after first session check
      error: null,

      /**
       * Login with email and password via Supabase
       */
      login: async (email: string, password: string): Promise<boolean> => {
        const supabase = getSupabaseBrowserClient()
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
              const dbUser = dbResult.data as { id: string; name: string; email: string; role: string; engineerType?: string; avatar?: string }
              set({ 
                currentUser: {
                  id: dbUser.id,
                  name: dbUser.name,
                  email: dbUser.email,
                  role: dbUser.role as UserRole,
                  engineerType: dbUser.engineerType as EngineerType | undefined,
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
        const supabase = getSupabaseBrowserClient()
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
        const supabase = getSupabaseBrowserClient()
        if (!isSupabaseConfigured() || !supabase) {
          set({ isLoading: false, isInitialized: true })
          return
        }

        set({ isLoading: true })

        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('[Auth] Session check error:', error)
            set({ currentUser: null, isAuthenticated: false, isLoading: false, isInitialized: true })
            return
          }

          if (session?.user) {
            // Fetch user from database to get the correct role
            const dbResult = await getUserByEmail(session.user.email || '')
            
            if (dbResult.success && dbResult.data) {
              const dbUser = dbResult.data as { id: string; name: string; email: string; role: string; engineerType?: string; avatar?: string }
              set({ 
                currentUser: {
                  id: dbUser.id,
                  name: dbUser.name,
                  email: dbUser.email,
                  role: dbUser.role as UserRole,
                  engineerType: dbUser.engineerType as EngineerType | undefined,
                  avatar: dbUser.avatar
                }, 
                isAuthenticated: true, 
                isLoading: false,
                isInitialized: true
              })
            } else {
              // Fallback to Supabase user if not in database
              console.warn('[Auth] User not found in database during session check')
              const user = convertSupabaseUser(session.user as SupabaseUser)
              set({ 
                currentUser: user, 
                isAuthenticated: true, 
                isLoading: false,
                isInitialized: true
              })
            }
          } else {
            set({ 
              currentUser: null, 
              isAuthenticated: false, 
              isLoading: false,
              isInitialized: true
            })
          }
        } catch (err) {
          console.error('[Auth] Session check failed:', err)
          set({ 
            currentUser: null, 
            isAuthenticated: false, 
            isLoading: false,
            isInitialized: true
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
      
      isRekenaar: () => {
        const { currentUser } = get()
        return currentUser?.role === 'engineer' && currentUser?.engineerType === 'rekenaar'
      },
      
      isTekenaar: () => {
        const { currentUser } = get()
        return currentUser?.role === 'engineer' && currentUser?.engineerType === 'tekenaar'
      },
      
      isProjectleider: () => {
        const { currentUser } = get()
        return currentUser?.role === 'admin'
      },
    }),
    {
      name: 'broersma-auth',
      // Only persist currentUser, NOT isAuthenticated
      // isAuthenticated should be verified on each page load via checkSession
      partialize: (state) => ({ 
        currentUser: state.currentUser
      }),
      // On rehydration, keep currentUser but mark as needing session verification
      // isInitialized stays false until checkSession completes
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If we have a persisted user, tentatively set authenticated
          // This prevents flashing login screens during HMR
          // checkSession will verify and update if needed
          if (state.currentUser) {
            state.isAuthenticated = true
          } else {
            state.isAuthenticated = false
          }
          state.isInitialized = false
        }
      }
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
 * Get all available users (from database)
 * This is used for assignee dropdowns
 * @deprecated Use useEngineers hook instead for React components
 */
export function getEngineers(): User[] {
  console.warn('[Auth] getEngineers() is synchronous and returns cached data. Use useEngineers hook instead.')
  return cachedEngineers
}

/**
 * Get user by name (for backwards compatibility)
 * @deprecated Use useUserByName hook or getUserByNameAsync instead
 */
export function getUserByName(name: string): User | undefined {
  return cachedEngineers.find(u => u.name.toLowerCase() === name.toLowerCase())
}

// Cached engineers list (populated by hooks)
let cachedEngineers: User[] = []

/**
 * Update the cached engineers list
 * Called internally by useEngineers hook
 */
export function setCachedEngineers(engineers: User[]): void {
  cachedEngineers = engineers
}

/**
 * Hook to fetch and cache engineers
 * Use this in components that need the engineers list
 */
export function useEngineers(): { engineers: User[]; isLoading: boolean; error: string | null } {
  const [engineers, setEngineers] = useState<User[]>(cachedEngineers)
  const [isLoading, setIsLoading] = useState(cachedEngineers.length === 0)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchEngineers() {
      // Use dynamic import to avoid circular dependency
      const { getUsers } = await import('./db-actions')
      
      try {
        const result = await getUsers('engineer')
        if (isMounted) {
          if (result.success && result.data) {
            const engineerUsers = result.data as User[]
            setEngineers(engineerUsers)
            setCachedEngineers(engineerUsers)
          } else {
            setError(result.error || 'Failed to load engineers')
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    // Only fetch if we don't have cached data
    if (cachedEngineers.length === 0) {
      fetchEngineers()
    } else {
      setIsLoading(false)
    }
    
    return () => {
      isMounted = false
    }
  }, [])
  
  return { engineers, isLoading, error }
}

/**
 * Hook to fetch all users (admins + engineers)
 */
export function useAllUsers(): { users: User[]; isLoading: boolean; error: string | null } {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchUsers() {
      const { getUsers } = await import('./db-actions')
      
      try {
        const result = await getUsers()
        if (isMounted) {
          if (result.success && result.data) {
            setUsers(result.data as User[])
          } else {
            setError(result.error || 'Failed to load users')
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    fetchUsers()
    
    return () => {
      isMounted = false
    }
  }, [])
  
  return { users, isLoading, error }
}

/**
 * Async function to get user by name from database
 */
export async function getUserByNameAsync(name: string): Promise<User | null> {
  const { getUsers } = await import('./db-actions')
  const result = await getUsers()
  
  if (result.success && result.data) {
    const users = result.data as User[]
    return users.find(u => u.name.toLowerCase() === name.toLowerCase()) || null
  }
  
  return null
}

// Re-export USERS as empty for backwards compatibility
// Components should migrate to useEngineers or useAllUsers hooks
export const USERS: User[] = []
