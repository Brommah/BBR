import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLeadStore } from '@/lib/store'

// Mock db-actions
vi.mock('@/lib/db-actions', () => ({
  getLeads: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  updateLeadStatus: vi.fn(() => Promise.resolve({ success: true })),
  updateLeadAssignee: vi.fn(() => Promise.resolve({ success: true })),
  createLead: vi.fn(() => Promise.resolve({ success: true, data: { id: 'new-lead' } })),
  submitQuoteForApproval: vi.fn(() => Promise.resolve({ success: true })),
  approveQuote: vi.fn(() => Promise.resolve({ success: true })),
  rejectQuote: vi.fn(() => Promise.resolve({ success: true })),
  updateLeadSpecs: vi.fn(() => Promise.resolve({ success: true })),
}))

describe('useLeadStore', () => {
  beforeEach(() => {
    // Reset store state
    useLeadStore.setState({ leads: [], isLoading: false, error: null })
  })

  describe('initial state', () => {
    it('should have empty leads array', () => {
      const { leads } = useLeadStore.getState()
      expect(leads).toEqual([])
    })

    it('should not be loading initially', () => {
      const { isLoading } = useLeadStore.getState()
      expect(isLoading).toBe(false)
    })

    it('should have no error initially', () => {
      const { error } = useLeadStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('loadLeads', () => {
    it('should set isLoading to true while loading', async () => {
      const { loadLeads } = useLeadStore.getState()
      
      // Start loading
      const loadPromise = loadLeads()
      
      // Check loading state is true during load
      expect(useLeadStore.getState().isLoading).toBe(true)
      
      await loadPromise
    })

    it('should set isLoading to false after loading completes', async () => {
      const { loadLeads } = useLeadStore.getState()
      await loadLeads()
      
      expect(useLeadStore.getState().isLoading).toBe(false)
    })
  })

  describe('updateLeadStatus', () => {
    beforeEach(() => {
      // Setup test leads
      useLeadStore.setState({
        leads: [
          {
            id: 'lead-1',
            clientName: 'Test Client',
            projectType: 'Dakkapel',
            city: 'Amsterdam',
            status: 'Nieuw',
            value: 5000,
            createdAt: new Date().toISOString(),
          },
        ],
      })
    })

    it('should optimistically update lead status', async () => {
      const { updateLeadStatus } = useLeadStore.getState()
      
      // Start update (don't await yet)
      const updatePromise = updateLeadStatus('lead-1', 'Calculatie')
      
      // Check optimistic update happened
      const lead = useLeadStore.getState().leads.find(l => l.id === 'lead-1')
      expect(lead?.status).toBe('Calculatie')
      
      await updatePromise
    })

    it('should return true on successful update', async () => {
      const { updateLeadStatus } = useLeadStore.getState()
      const result = await updateLeadStatus('lead-1', 'Calculatie')
      expect(result).toBe(true)
    })
  })

  describe('assignLead', () => {
    beforeEach(() => {
      useLeadStore.setState({
        leads: [
          {
            id: 'lead-1',
            clientName: 'Test Client',
            projectType: 'Dakkapel',
            city: 'Amsterdam',
            status: 'Nieuw',
            value: 5000,
            createdAt: new Date().toISOString(),
            assignee: undefined,
          },
        ],
      })
    })

    it('should optimistically update assignee', async () => {
      const { assignLead } = useLeadStore.getState()
      
      const assignPromise = assignLead('lead-1', 'Angelo')
      
      // Check optimistic update
      const lead = useLeadStore.getState().leads.find(l => l.id === 'lead-1')
      expect(lead?.assignee).toBe('Angelo')
      
      await assignPromise
    })

    it('should handle unassignment', async () => {
      // First assign
      useLeadStore.setState({
        leads: [
          {
            id: 'lead-1',
            clientName: 'Test Client',
            projectType: 'Dakkapel',
            city: 'Amsterdam',
            status: 'Nieuw',
            value: 5000,
            createdAt: new Date().toISOString(),
            assignee: 'Angelo',
          },
        ],
      })
      
      const { assignLead } = useLeadStore.getState()
      await assignLead('lead-1', '')
      
      const lead = useLeadStore.getState().leads.find(l => l.id === 'lead-1')
      expect(lead?.assignee).toBe('')
    })
  })

  describe('submitQuoteForApproval', () => {
    beforeEach(() => {
      useLeadStore.setState({
        leads: [
          {
            id: 'lead-1',
            clientName: 'Test Client',
            projectType: 'Dakkapel',
            city: 'Amsterdam',
            status: 'Calculatie',
            value: 5000,
            createdAt: new Date().toISOString(),
            quoteApproval: 'none',
          },
        ],
      })
    })

    it('should optimistically set quote approval to pending', async () => {
      const { submitQuoteForApproval } = useLeadStore.getState()
      
      const submitPromise = submitQuoteForApproval('lead-1', {
        quoteValue: 850,
        quoteDescription: 'Test quote',
        quoteLineItems: [{ description: 'Constructieberekening', amount: 850 }],
      })
      
      // Check optimistic update
      const lead = useLeadStore.getState().leads.find(l => l.id === 'lead-1')
      expect(lead?.quoteApproval).toBe('pending')
      expect(lead?.quoteValue).toBe(850)
      
      await submitPromise
    })
  })

  describe('approveQuote', () => {
    beforeEach(() => {
      useLeadStore.setState({
        leads: [
          {
            id: 'lead-1',
            clientName: 'Test Client',
            projectType: 'Dakkapel',
            city: 'Amsterdam',
            status: 'Calculatie',
            value: 5000,
            createdAt: new Date().toISOString(),
            quoteApproval: 'pending',
            quoteValue: 850,
          },
        ],
      })
    })

    it('should optimistically approve quote', async () => {
      const { approveQuote } = useLeadStore.getState()
      
      const approvePromise = approveQuote('lead-1')
      
      // Check optimistic update
      const lead = useLeadStore.getState().leads.find(l => l.id === 'lead-1')
      expect(lead?.quoteApproval).toBe('approved')
      expect(lead?.status).toBe('Offerte Verzonden')
      
      await approvePromise
    })

    it('should allow adjusting quote value on approval', async () => {
      const { approveQuote } = useLeadStore.getState()
      
      await approveQuote('lead-1', undefined, 900)
      
      const lead = useLeadStore.getState().leads.find(l => l.id === 'lead-1')
      expect(lead?.quoteValue).toBe(900)
    })
  })

  describe('rejectQuote', () => {
    beforeEach(() => {
      useLeadStore.setState({
        leads: [
          {
            id: 'lead-1',
            clientName: 'Test Client',
            projectType: 'Dakkapel',
            city: 'Amsterdam',
            status: 'Calculatie',
            value: 5000,
            createdAt: new Date().toISOString(),
            quoteApproval: 'pending',
            quoteValue: 850,
            quoteFeedback: [],
          },
        ],
      })
    })

    it('should optimistically reject quote', async () => {
      const { rejectQuote } = useLeadStore.getState()
      
      const rejectPromise = rejectQuote('lead-1', {
        authorId: 'admin-1',
        authorName: 'Admin',
        message: 'Prijs te laag',
      })
      
      // Check optimistic update
      const lead = useLeadStore.getState().leads.find(l => l.id === 'lead-1')
      expect(lead?.quoteApproval).toBe('rejected')
      expect(lead?.quoteFeedback).toHaveLength(1)
      expect(lead?.quoteFeedback?.[0].type).toBe('rejection')
      
      await rejectPromise
    })
  })
})
