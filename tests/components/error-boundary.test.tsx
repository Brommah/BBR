import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { 
  ErrorBoundary, 
  LoadingSpinner, 
  PageLoader, 
  EmptyState 
} from '@/components/error-boundary'
import { Inbox } from 'lucide-react'

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

describe('Error Boundary Components', () => {
  describe('LoadingSpinner', () => {
    it('should render with default message', () => {
      render(<LoadingSpinner />)
      expect(screen.getByText('Laden...')).toBeInTheDocument()
    })

    it('should render with custom message', () => {
      render(<LoadingSpinner message="Bezig met laden..." />)
      expect(screen.getByText('Bezig met laden...')).toBeInTheDocument()
    })

    it('should render without message when empty string', () => {
      render(<LoadingSpinner message="" />)
      expect(screen.queryByText('Laden...')).not.toBeInTheDocument()
    })

    it('should apply correct size classes', () => {
      const { container, rerender } = render(<LoadingSpinner size="small" />)
      expect(container.querySelector('.w-4')).toBeInTheDocument()
      
      rerender(<LoadingSpinner size="default" />)
      expect(container.querySelector('.w-8')).toBeInTheDocument()
      
      rerender(<LoadingSpinner size="large" />)
      expect(container.querySelector('.w-12')).toBeInTheDocument()
    })
  })

  describe('PageLoader', () => {
    it('should render with default message', () => {
      render(<PageLoader />)
      expect(screen.getByText('Laden...')).toBeInTheDocument()
    })

    it('should render with custom message', () => {
      render(<PageLoader message="Pagina wordt geladen..." />)
      expect(screen.getByText('Pagina wordt geladen...')).toBeInTheDocument()
    })

    it('should use large spinner', () => {
      const { container } = render(<PageLoader />)
      expect(container.querySelector('.w-12')).toBeInTheDocument()
    })
  })

  describe('EmptyState', () => {
    it('should render title', () => {
      render(<EmptyState title="Geen items" />)
      expect(screen.getByText('Geen items')).toBeInTheDocument()
    })

    it('should render description', () => {
      render(
        <EmptyState 
          title="Geen items" 
          description="Er zijn nog geen items toegevoegd." 
        />
      )
      expect(screen.getByText('Er zijn nog geen items toegevoegd.')).toBeInTheDocument()
    })

    it('should render icon', () => {
      render(<EmptyState title="Leeg" icon={Inbox} />)
      // Icon should be rendered (checking for SVG)
      expect(document.querySelector('svg')).toBeInTheDocument()
    })

    it('should render action button', () => {
      render(
        <EmptyState 
          title="Leeg" 
          action={<button>Voeg toe</button>}
        />
      )
      expect(screen.getByRole('button', { name: 'Voeg toe' })).toBeInTheDocument()
    })
  })

  describe('ErrorBoundary', () => {
    // Store original console.error
    const originalError = console.error
    
    beforeEach(() => {
      // Suppress React error boundary console output
      console.error = vi.fn()
    })
    
    afterEach(() => {
      console.error = originalError
    })

    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should render fallback when error occurs', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Er is iets misgegaan')).toBeInTheDocument()
    })

    it('should render custom fallback', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('should show retry button', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /opnieuw/i })).toBeInTheDocument()
    })

    it('should show home button', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
    })

    it('should call onError callback', () => {
      const onError = vi.fn()
      const ThrowError = () => {
        throw new Error('Test error')
      }

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalled()
    })
  })
})
