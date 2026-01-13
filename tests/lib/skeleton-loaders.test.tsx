import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  LeadCardSkeleton,
  PipelineColumnSkeleton,
  PipelineSkeleton,
  KpiCardSkeleton,
  DashboardSkeleton,
  LeadDetailSkeleton,
  TableSkeleton,
  FormSkeleton,
  SidebarSkeleton,
  ContentSkeleton,
} from '@/components/ui/skeleton-loaders'

describe('Skeleton Loaders', () => {
  describe('Skeleton (base)', () => {
    it('should render with default props', () => {
      render(<Skeleton data-testid="skeleton" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('role', 'status')
      expect(skeleton).toHaveAttribute('aria-label', 'Laden...')
    })

    it('should accept custom className', () => {
      render(<Skeleton className="custom-class" data-testid="skeleton" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('custom-class')
    })
  })

  describe('LeadCardSkeleton', () => {
    it('should render with proper accessibility', () => {
      render(<LeadCardSkeleton />)
      const skeleton = screen.getByLabelText('Lead kaart laden...')
      expect(skeleton).toHaveAttribute('role', 'status')
    })
  })

  describe('PipelineColumnSkeleton', () => {
    it('should render default number of cards', () => {
      const { container } = render(<PipelineColumnSkeleton />)
      // Default is 3 cards
      const cards = container.querySelectorAll('[aria-label="Lead kaart laden..."]')
      expect(cards).toHaveLength(3)
    })

    it('should render custom number of cards', () => {
      const { container } = render(<PipelineColumnSkeleton cardCount={5} />)
      const cards = container.querySelectorAll('[aria-label="Lead kaart laden..."]')
      expect(cards).toHaveLength(5)
    })
  })

  describe('PipelineSkeleton', () => {
    it('should render with proper accessibility', () => {
      render(<PipelineSkeleton />)
      const skeleton = screen.getByLabelText('Pipeline laden...')
      expect(skeleton).toHaveAttribute('role', 'status')
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
    })

    it('should include screen reader text', () => {
      render(<PipelineSkeleton />)
      expect(screen.getByText('Pipeline wordt geladen, even geduld...')).toBeInTheDocument()
    })
  })

  describe('KpiCardSkeleton', () => {
    it('should render with proper accessibility', () => {
      render(<KpiCardSkeleton />)
      const skeleton = screen.getByLabelText('KPI kaart laden...')
      expect(skeleton).toHaveAttribute('role', 'status')
    })
  })

  describe('DashboardSkeleton', () => {
    it('should render with proper accessibility', () => {
      render(<DashboardSkeleton />)
      const skeleton = screen.getByLabelText('Dashboard laden...')
      expect(skeleton).toHaveAttribute('role', 'status')
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
    })

    it('should include screen reader text', () => {
      render(<DashboardSkeleton />)
      expect(screen.getByText('Dashboard wordt geladen, even geduld...')).toBeInTheDocument()
    })
  })

  describe('LeadDetailSkeleton', () => {
    it('should render with proper accessibility', () => {
      render(<LeadDetailSkeleton />)
      const skeleton = screen.getByLabelText('Lead details laden...')
      expect(skeleton).toHaveAttribute('role', 'status')
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('TableSkeleton', () => {
    it('should render default rows and columns', () => {
      const { container } = render(<TableSkeleton />)
      // Default is 5 rows + 1 header
      const rows = container.querySelectorAll('.border-b')
      expect(rows.length).toBeGreaterThanOrEqual(5)
    })

    it('should render custom rows and columns', () => {
      const { container } = render(<TableSkeleton rows={3} columns={6} />)
      const skeleton = container.querySelector('[role="status"]')
      expect(skeleton).toHaveAttribute('aria-label', 'Tabel laden...')
    })
  })

  describe('FormSkeleton', () => {
    it('should render default number of fields', () => {
      render(<FormSkeleton />)
      const skeleton = screen.getByLabelText('Formulier laden...')
      expect(skeleton).toHaveAttribute('role', 'status')
    })

    it('should render custom number of fields', () => {
      const { container } = render(<FormSkeleton fields={6} />)
      expect(container.querySelector('[role="status"]')).toBeInTheDocument()
    })
  })

  describe('SidebarSkeleton', () => {
    it('should render with proper accessibility', () => {
      render(<SidebarSkeleton />)
      const skeleton = screen.getByLabelText('Navigatie laden...')
      expect(skeleton).toHaveAttribute('role', 'status')
    })
  })

  describe('ContentSkeleton', () => {
    it('should render with proper accessibility', () => {
      render(<ContentSkeleton />)
      const skeleton = screen.getByLabelText('Inhoud laden...')
      expect(skeleton).toHaveAttribute('role', 'status')
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
    })
  })
})
