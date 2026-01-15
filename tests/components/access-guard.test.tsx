import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AccessGuard, Can, useCanAccess } from '@/components/auth/access-guard'
import { useAuthStore } from '@/lib/auth'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

// Helper to set auth state
function setAuthState(state: Partial<ReturnType<typeof useAuthStore.getState>>) {
  useAuthStore.setState(state)
}

describe('Access Guard Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth store to default state
    useAuthStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  describe('AccessGuard', () => {
    it('should handle initial render without crashing', () => {
      const { container } = render(
        <AccessGuard>
          <div>Protected content</div>
        </AccessGuard>
      )
      
      // Should render something (either loading, content, or empty)
      expect(container).toBeDefined()
    })

    it('should render children when authenticated and has permission', async () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'admin',
        },
      })

      render(
        <AccessGuard permission="admin:access">
          <div>Protected content</div>
        </AccessGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected content')).toBeInTheDocument()
      })
    })

    it('should show access denied when lacking permission', async () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'engineer',
        },
      })

      render(
        <AccessGuard permission="admin:access">
          <div>Protected content</div>
        </AccessGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Geen Toegang')).toBeInTheDocument()
      })
    })

    it('should render custom fallback', async () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'engineer',
        },
      })

      render(
        <AccessGuard 
          permission="admin:access"
          fallback={<div>Custom denied message</div>}
        >
          <div>Protected content</div>
        </AccessGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Custom denied message')).toBeInTheDocument()
      })
    })

    it('should check role-based access', async () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'engineer',
        },
      })

      render(
        <AccessGuard roles={['admin', 'engineer']}>
          <div>Engineer content</div>
        </AccessGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Engineer content')).toBeInTheDocument()
      })
    })

    it('should deny access when role not in list', async () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'engineer',
        },
      })

      render(
        <AccessGuard roles={['admin', 'engineer']}>
          <div>Restricted content</div>
        </AccessGuard>
      )

      await waitFor(() => {
        expect(screen.getByText('Geen Toegang')).toBeInTheDocument()
      })
    })
  })

  describe('Can component', () => {
    it('should render children when permission granted', () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'admin',
        },
      })

      render(
        <Can permission="leads:create">
          <button>Create Lead</button>
        </Can>
      )

      expect(screen.getByRole('button', { name: 'Create Lead' })).toBeInTheDocument()
    })

    it('should render fallback when permission denied', () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'engineer',
        },
      })

      render(
        <Can 
          permission="leads:create"
          fallback={<span>No permission</span>}
        >
          <button>Create Lead</button>
        </Can>
      )

      expect(screen.getByText('No permission')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should render nothing when permission denied and no fallback', () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'engineer',
        },
      })

      const { container } = render(
        <Can permission="leads:create">
          <button>Create Lead</button>
        </Can>
      )

      expect(container.textContent).toBe('')
    })
  })

  describe('useCanAccess hook', () => {
    function TestComponent({ permission }: { permission: string }) {
      const canAccess = useCanAccess(permission as Parameters<typeof useCanAccess>[0])
      return <div>{canAccess ? 'granted' : 'denied'}</div>
    }

    it('should return true when permission granted', () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'admin',
        },
      })

      render(<TestComponent permission="admin:access" />)
      
      expect(screen.getByText('granted')).toBeInTheDocument()
    })

    it('should return false when permission denied', () => {
      setAuthState({
        isAuthenticated: true,
        currentUser: {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          role: 'engineer',
        },
      })

      render(<TestComponent permission="admin:access" />)
      
      expect(screen.getByText('denied')).toBeInTheDocument()
    })
  })
})
