import { create } from 'zustand'
import { toast } from 'sonner'
import {
  getLeads,
  updateLeadStatus as updateLeadStatusAction,
  updateLeadAssignee as updateLeadAssigneeAction,
  createLead as createLeadAction,
  updateLeadSpecs as updateLeadSpecsAction,
  submitQuoteForApproval as submitQuoteForApprovalAction,
  approveQuote as approveQuoteAction,
  rejectQuote as rejectQuoteAction,
  type QuoteLineItem,
  type QuoteFeedbackItem,
  type QuoteSubmission
} from './db-actions'

// Re-export types for backwards compatibility
export type { QuoteLineItem, QuoteFeedbackItem as QuoteFeedback, QuoteSubmission }

export type LeadStatus = "Nieuw" | "Triage" | "Calculatie" | "Offerte Verzonden" | "Opdracht" | "Archief"
export type QuoteApprovalStatus = "none" | "pending" | "approved" | "rejected"

export interface ProjectSpec {
  key: string
  value: string
  unit?: string
}

export interface Lead {
  id: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  projectType: string
  city: string
  address?: string
  status: LeadStatus
  value: number
  createdAt: string
  updatedAt?: string
  assignee?: string
  isUrgent?: boolean
  addressValid?: boolean
  quoteApproval?: QuoteApprovalStatus
  quoteValue?: number
  quoteDescription?: string
  quoteLineItems?: QuoteLineItem[]
  quoteEstimatedHours?: number
  specifications?: ProjectSpec[]
  quoteFeedback?: QuoteFeedbackItem[]
}

interface LeadState {
  leads: Lead[]
  isLoading: boolean
  error: string | null
  
  // Data fetching
  loadLeads: () => Promise<void>
  
  // Mutations (all async with optimistic updates)
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<boolean>
  assignLead: (id: string, assignee: string) => Promise<boolean>
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<boolean>
  submitQuoteForApproval: (id: string, submission: QuoteSubmission) => Promise<boolean>
  approveQuote: (id: string, feedback?: { authorId: string; authorName: string; message: string }, adjustedValue?: number) => Promise<boolean>
  rejectQuote: (id: string, feedback: { authorId: string; authorName: string; message: string }) => Promise<boolean>
  updateProjectSpecs: (id: string, specs: ProjectSpec[]) => Promise<boolean>
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  isLoading: false,
  error: null,

  /**
   * Load all leads from database
   */
  loadLeads: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const result = await getLeads()
      
      if (result.success && result.data) {
        set({ 
          leads: result.data as Lead[], 
          isLoading: false,
          error: null 
        })
      } else {
        set({ 
          isLoading: false, 
          error: result.error || 'Kon leads niet laden' 
        })
        toast.error('Fout bij laden', {
          description: result.error || 'Kon leads niet laden'
        })
      }
    } catch (error) {
      console.error('[Store] Failed to load leads:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Onbekende fout' 
      })
      toast.error('Netwerkfout', {
        description: 'Kon geen verbinding maken met de server'
      })
    }
  },

  /**
   * Update lead status with optimistic update and rollback
   */
  updateLeadStatus: async (id, status) => {
    const previousLeads = get().leads
    
    // Optimistic update
    set((state) => ({
    leads: state.leads.map((lead) => 
      lead.id === id ? { ...lead, status } : lead
    )
    }))

    try {
      const result = await updateLeadStatusAction(id, status)
      
      if (!result.success) {
        // Rollback on failure
        set({ leads: previousLeads })
        toast.error('Update mislukt', {
          description: result.error || 'Kon status niet wijzigen'
        })
        return false
      }
      
      return true
    } catch (error) {
      // Rollback on error
      set({ leads: previousLeads })
      toast.error('Netwerkfout', {
        description: error instanceof Error ? error.message : 'Probeer opnieuw'
      })
      return false
    }
  },

  /**
   * Assign lead to user with optimistic update
   */
  assignLead: async (id, assignee) => {
    const previousLeads = get().leads
    
    // Optimistic update
    set((state) => ({
    leads: state.leads.map((lead) =>
      lead.id === id ? { ...lead, assignee } : lead
    )
    }))

    try {
      const result = await updateLeadAssigneeAction(id, assignee)
      
      if (!result.success) {
        set({ leads: previousLeads })
        toast.error('Toewijzing mislukt', {
          description: result.error || 'Kon toewijzing niet wijzigen'
        })
        return false
      }
      
      return true
    } catch (error) {
      set({ leads: previousLeads })
      toast.error('Netwerkfout', {
        description: error instanceof Error ? error.message : 'Probeer opnieuw'
      })
      return false
    }
  },

  /**
   * Add new lead
   */
  addLead: async (leadData) => {
    try {
      const result = await createLeadAction({
        clientName: leadData.clientName,
        clientEmail: leadData.clientEmail,
        clientPhone: leadData.clientPhone,
        projectType: leadData.projectType,
        city: leadData.city,
        address: leadData.address,
        value: leadData.value,
        isUrgent: leadData.isUrgent,
        specifications: leadData.specifications
      })
      
      if (!result.success) {
        toast.error('Aanmaken mislukt', {
          description: result.error || 'Kon lead niet aanmaken'
        })
        return false
      }
      
      // Add new lead to state
      if (result.data) {
        set((state) => ({
          leads: [result.data as Lead, ...state.leads]
        }))
      }
      
      return true
    } catch (error) {
      toast.error('Netwerkfout', {
        description: error instanceof Error ? error.message : 'Probeer opnieuw'
      })
      return false
    }
  },

  /**
   * Submit quote for admin approval
   */
  submitQuoteForApproval: async (id, submission) => {
    const previousLeads = get().leads
    
    // Optimistic update
    set((state) => ({
    leads: state.leads.map((lead) =>
        lead.id === id ? {
          ...lead,
          quoteApproval: 'pending' as QuoteApprovalStatus,
          quoteValue: submission.quoteValue,
          quoteDescription: submission.quoteDescription,
          quoteLineItems: submission.quoteLineItems,
          quoteEstimatedHours: submission.quoteEstimatedHours
        } : lead
      )
    }))

    try {
      const result = await submitQuoteForApprovalAction(id, submission)
      
      if (!result.success) {
        set({ leads: previousLeads })
        toast.error('Indienen mislukt', {
          description: result.error || 'Kon offerte niet indienen'
        })
        return false
      }
      
      return true
    } catch (error) {
      set({ leads: previousLeads })
      toast.error('Netwerkfout', {
        description: error instanceof Error ? error.message : 'Probeer opnieuw'
      })
      return false
    }
  },

  /**
   * Approve quote (admin only)
   */
  approveQuote: async (id, feedback, adjustedValue) => {
    const previousLeads = get().leads
    const lead = previousLeads.find(l => l.id === id)
    
    // Optimistic update
    set((state) => ({
      leads: state.leads.map((l) => {
        if (l.id !== id) return l
        
        const newFeedback: QuoteFeedbackItem[] = [...(l.quoteFeedback || [])]
        if (feedback?.message) {
        newFeedback.push({
          id: crypto.randomUUID(),
          authorId: feedback.authorId,
          authorName: feedback.authorName,
          message: feedback.message,
          createdAt: new Date().toISOString(),
          type: 'approval'
        })
      }
        
      return { 
          ...l,
          quoteApproval: 'approved' as QuoteApprovalStatus,
          status: 'Offerte Verzonden' as LeadStatus,
          quoteValue: adjustedValue !== undefined ? adjustedValue : l.quoteValue,
        quoteFeedback: newFeedback
      }
    })
    }))

    try {
      const result = await approveQuoteAction(id, feedback, adjustedValue)
      
      if (!result.success) {
        set({ leads: previousLeads })
        toast.error('Goedkeuring mislukt', {
          description: result.error || 'Kon offerte niet goedkeuren'
        })
        return false
      }
      
      return true
    } catch (error) {
      set({ leads: previousLeads })
      toast.error('Netwerkfout', {
        description: error instanceof Error ? error.message : 'Probeer opnieuw'
      })
      return false
    }
  },

  /**
   * Reject quote (admin only)
   */
  rejectQuote: async (id, feedback) => {
    const previousLeads = get().leads
    
    // Optimistic update
    set((state) => ({
    leads: state.leads.map((lead) => {
      if (lead.id !== id) return lead
        
        const newFeedback: QuoteFeedbackItem[] = [...(lead.quoteFeedback || []), {
        id: crypto.randomUUID(),
        authorId: feedback.authorId,
        authorName: feedback.authorName,
        message: feedback.message,
        createdAt: new Date().toISOString(),
        type: 'rejection'
      }]
        
      return { 
        ...lead, 
          quoteApproval: 'rejected' as QuoteApprovalStatus,
        quoteFeedback: newFeedback
      }
    })
    }))

    try {
      const result = await rejectQuoteAction(id, feedback)
      
      if (!result.success) {
        set({ leads: previousLeads })
        toast.error('Afkeuring mislukt', {
          description: result.error || 'Kon offerte niet afkeuren'
        })
        return false
      }
      
      return true
    } catch (error) {
      set({ leads: previousLeads })
      toast.error('Netwerkfout', {
        description: error instanceof Error ? error.message : 'Probeer opnieuw'
      })
      return false
    }
  },

  /**
   * Update project specifications
   */
  updateProjectSpecs: async (id, specs) => {
    const previousLeads = get().leads
    
    // Optimistic update
    set((state) => ({
    leads: state.leads.map((lead) =>
      lead.id === id ? { ...lead, specifications: specs } : lead
    )
  }))

    try {
      const result = await updateLeadSpecsAction(id, specs)
      
      if (!result.success) {
        set({ leads: previousLeads })
        toast.error('Opslaan mislukt', {
          description: result.error || 'Kon specificaties niet opslaan'
        })
        return false
      }
      
      return true
    } catch (error) {
      set({ leads: previousLeads })
      toast.error('Netwerkfout', {
        description: error instanceof Error ? error.message : 'Probeer opnieuw'
      })
      return false
    }
  }
}))
