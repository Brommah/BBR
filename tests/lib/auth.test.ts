import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/lib/auth'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  },
  isSupabaseConfigured: vi.fn(() => true),
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  describe('initial state', () => {
    it('should have no current user', () => {
      const { currentUser } = useAuthStore.getState()
      expect(currentUser).toBeNull()
    })

    it('should not be authenticated', () => {
      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(false)
    })

    it('should not be loading', () => {
      const { isLoading } = useAuthStore.getState()
      expect(isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    beforeEach(() => {
      // Setup authenticated state
      useAuthStore.setState({
        currentUser: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'engineer',
        },
        isAuthenticated: true,
      })
    })

    it('should clear current user on logout', async () => {
      const { logout } = useAuthStore.getState()
      await logout()
      
      const { currentUser } = useAuthStore.getState()
      expect(currentUser).toBeNull()
    })

    it('should set isAuthenticated to false on logout', async () => {
      const { logout } = useAuthStore.getState()
      await logout()
      
      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(false)
    })

    it('should clear any error on logout', async () => {
      useAuthStore.setState({ error: 'Some error' })
      
      const { logout } = useAuthStore.getState()
      await logout()
      
      const { error } = useAuthStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('hasPermission', () => {
    it('should return false when not logged in', () => {
      const { hasPermission } = useAuthStore.getState()
      expect(hasPermission('leads:view-all')).toBe(false)
    })

    it('should return true for admin permissions when user is admin', () => {
      useAuthStore.setState({
        currentUser: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
        isAuthenticated: true,
      })
      
      const { hasPermission } = useAuthStore.getState()
      expect(hasPermission('admin:access')).toBe(true)
      expect(hasPermission('quotes:approve')).toBe(true)
      expect(hasPermission('leads:assign')).toBe(true)
    })

    it('should return false for admin permissions when user is engineer', () => {
      useAuthStore.setState({
        currentUser: {
          id: 'eng-1',
          name: 'Engineer User',
          email: 'engineer@example.com',
          role: 'engineer',
        },
        isAuthenticated: true,
      })
      
      const { hasPermission } = useAuthStore.getState()
      expect(hasPermission('admin:access')).toBe(false)
      expect(hasPermission('quotes:approve')).toBe(false)
    })

    it('should allow engineers to submit quotes', () => {
      useAuthStore.setState({
        currentUser: {
          id: 'eng-1',
          name: 'Engineer User',
          email: 'engineer@example.com',
          role: 'engineer',
        },
        isAuthenticated: true,
      })
      
      const { hasPermission } = useAuthStore.getState()
      expect(hasPermission('quotes:submit')).toBe(true)
      expect(hasPermission('quotes:view')).toBe(true)
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin users', () => {
      useAuthStore.setState({
        currentUser: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
        isAuthenticated: true,
      })
      
      const { isAdmin } = useAuthStore.getState()
      expect(isAdmin()).toBe(true)
    })

    it('should return false for non-admin users', () => {
      useAuthStore.setState({
        currentUser: {
          id: 'eng-1',
          name: 'Engineer User',
          email: 'engineer@example.com',
          role: 'engineer',
        },
        isAuthenticated: true,
      })
      
      const { isAdmin } = useAuthStore.getState()
      expect(isAdmin()).toBe(false)
    })

    it('should return false when not logged in', () => {
      const { isAdmin } = useAuthStore.getState()
      expect(isAdmin()).toBe(false)
    })
  })

  describe('isEngineer', () => {
    it('should return true for engineer users', () => {
      useAuthStore.setState({
        currentUser: {
          id: 'eng-1',
          name: 'Engineer User',
          email: 'engineer@example.com',
          role: 'engineer',
        },
        isAuthenticated: true,
      })
      
      const { isEngineer } = useAuthStore.getState()
      expect(isEngineer()).toBe(true)
    })

    it('should return false for admin users', () => {
      useAuthStore.setState({
        currentUser: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
        isAuthenticated: true,
      })
      
      const { isEngineer } = useAuthStore.getState()
      expect(isEngineer()).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear the error state', () => {
      useAuthStore.setState({ error: 'Some error message' })
      
      const { clearError } = useAuthStore.getState()
      clearError()
      
      const { error } = useAuthStore.getState()
      expect(error).toBeNull()
    })
  })
})
