import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryProvider, queryKeys } from '@/lib/query-client'

describe('QueryProvider', () => {
  it('should render children', () => {
    render(
      <QueryProvider>
        <div data-testid="child">Test Child</div>
      </QueryProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide QueryClient to children', () => {
    // This test verifies the provider doesn't throw
    expect(() => {
      render(
        <QueryProvider>
          <div>Content</div>
        </QueryProvider>
      )
    }).not.toThrow()
  })
})

describe('queryKeys', () => {
  describe('leads', () => {
    it('should have correct base key', () => {
      expect(queryKeys.leads.all).toEqual(['leads'])
    })

    it('should generate list keys', () => {
      expect(queryKeys.leads.lists()).toEqual(['leads', 'list'])
    })

    it('should generate filtered list keys', () => {
      const filters = { status: 'Nieuw', assignee: 'Angelo' }
      expect(queryKeys.leads.list(filters)).toEqual(['leads', 'list', filters])
    })

    it('should generate detail keys', () => {
      expect(queryKeys.leads.details()).toEqual(['leads', 'detail'])
    })

    it('should generate specific detail key', () => {
      const id = 'clxyz123'
      expect(queryKeys.leads.detail(id)).toEqual(['leads', 'detail', id])
    })
  })

  describe('users', () => {
    it('should have correct base key', () => {
      expect(queryKeys.users.all).toEqual(['users'])
    })

    it('should generate current user key', () => {
      expect(queryKeys.users.current()).toEqual(['users', 'current'])
    })

    it('should generate list key', () => {
      expect(queryKeys.users.list()).toEqual(['users', 'list'])
    })
  })

  describe('activities', () => {
    it('should have correct base key', () => {
      expect(queryKeys.activities.all).toEqual(['activities'])
    })

    it('should generate lead-specific key', () => {
      const leadId = 'lead123'
      expect(queryKeys.activities.byLead(leadId)).toEqual(['activities', 'lead', leadId])
    })
  })

  describe('quotes', () => {
    it('should have correct base key', () => {
      expect(queryKeys.quotes.all).toEqual(['quotes'])
    })

    it('should generate pending quotes key', () => {
      expect(queryKeys.quotes.pending()).toEqual(['quotes', 'pending'])
    })
  })

  describe('documents', () => {
    it('should have correct base key', () => {
      expect(queryKeys.documents.all).toEqual(['documents'])
    })

    it('should generate lead-specific key', () => {
      const leadId = 'lead456'
      expect(queryKeys.documents.byLead(leadId)).toEqual(['documents', 'lead', leadId])
    })
  })

  describe('key uniqueness', () => {
    it('should generate unique keys for different entities', () => {
      const leadKey = queryKeys.leads.detail('123')
      const activityKey = queryKeys.activities.byLead('123')
      const documentKey = queryKeys.documents.byLead('123')

      expect(leadKey).not.toEqual(activityKey)
      expect(leadKey).not.toEqual(documentKey)
      expect(activityKey).not.toEqual(documentKey)
    })

    it('should generate unique keys for different IDs', () => {
      const key1 = queryKeys.leads.detail('id1')
      const key2 = queryKeys.leads.detail('id2')

      expect(key1).not.toEqual(key2)
    })
  })
})
