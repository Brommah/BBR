/**
 * @fileoverview Lead Store - Client-side state management with Zustand
 * 
 * This store manages the client-side state for leads with:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on server action failures
 * - Integration with server actions for persistence
 * 
 * @module lib/store
 */

import { create } from 'zustand'
import { toast } from 'sonner'
import {
  getLeads,
  updateLeadStatus as updateLeadStatusAction,
  updateLeadAssignee as updateLeadAssigneeAction,
  updateLeadDetails as updateLeadDetailsAction,
  createLead as createLeadAction,
  updateLeadSpecs as updateLeadSpecsAction,
  submitQuoteForApproval as submitQuoteForApprovalAction,
  approveQuote as approveQuoteAction,
  rejectQuote as rejectQuoteAction,
  updateLeadTeamAssignments as updateLeadTeamAssignmentsAction,
  updateLeadAanZet as updateLeadAanZetAction,
  type QuoteLineItem,
  type QuoteFeedbackItem,
  type QuoteSubmission
} from './db-actions'

// Re-export types for backwards compatibility
export type { QuoteLineItem, QuoteFeedbackItem as QuoteFeedback, QuoteSubmission }

/** Possible lead statuses in the pipeline */
export type LeadStatus = "Nieuw" | "Calculatie" | "Offerte Verzonden" | "Opdracht" | "Archief"

/** Quote approval workflow statuses */
export type QuoteApprovalStatus = "none" | "pending" | "approved" | "rejected"

/**
 * Project specification key-value pair
 */
export interface ProjectSpec {
  /** Specification name/key */
  key: string
  /** Specification value */
  value: string
  /** Optional unit (e.g., "m²", "stuks") */
  unit?: string
}

/** Who is currently "aan zet" (working on the project) */
export type AanZet = 'rekenaar' | 'tekenaar' | 'projectleider' | null

/**
 * Lead entity representing a potential project
 */
export interface Lead {
  /** Unique identifier (CUID) */
  id: string
  /** Client's full name */
  clientName: string
  /** Client's email address */
  clientEmail?: string
  /** Client's phone number */
  clientPhone?: string
  /** Type of construction project */
  projectType: string
  /** City/location of the project */
  city: string
  /** Full street address */
  address?: string
  /** Current pipeline status */
  status: LeadStatus
  /** Estimated project value in EUR */
  value: number
  /** ISO timestamp of creation */
  createdAt: string
  /** ISO timestamp of last update */
  updatedAt?: string
  /** Name of assigned engineer (DEPRECATED - use assignedRekenaar/Tekenaar) */
  assignee?: string
  /** Whether address has been validated */
  addressValid?: boolean
  /** Work number for the project */
  werknummer?: string
  /** Current quote approval status */
  quoteApproval?: QuoteApprovalStatus
  /** Quote total value in EUR */
  quoteValue?: number
  /** Quote description/justification */
  quoteDescription?: string
  /** Quote line items breakdown */
  quoteLineItems?: QuoteLineItem[]
  /** Estimated hours for the work */
  quoteEstimatedHours?: number
  /** Project specifications */
  specifications?: ProjectSpec[]
  /** Admin feedback on quotes */
  quoteFeedback?: QuoteFeedbackItem[]
  
  // Team assignments
  /** Name of assigned Projectleider (responsible for delivery) */
  assignedProjectleider?: string | null
  /** Name of assigned Rekenaar (calculator) */
  assignedRekenaar?: string | null
  /** Name of assigned Tekenaar (draftsman) */
  assignedTekenaar?: string | null
  /** Who is currently "aan zet" (working on the project) */
  aanZet?: AanZet
}

/**
 * Lead store state and actions interface
 */
interface LeadState {
  /** Array of all leads */
  leads: Lead[]
  /** Whether data is being loaded */
  isLoading: boolean
  /** Current error message, if any */
  error: string | null
  
  // Data fetching
  /** Load all leads from database */
  loadLeads: () => Promise<void>
  
  // Mutations (all async with optimistic updates)
  /** Update a lead's pipeline status */
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<boolean>
  /** Assign a lead to an engineer (DEPRECATED - use updateTeamAssignments) */
  assignLead: (id: string, assignee: string) => Promise<boolean>
  /** Create a new lead */
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<boolean>
  /** Submit a quote for admin approval */
  submitQuoteForApproval: (id: string, submission: QuoteSubmission) => Promise<boolean>
  /** Approve a pending quote (admin only) */
  approveQuote: (id: string, feedback?: { authorId: string; authorName: string; message: string }, adjustedValue?: number) => Promise<boolean>
  /** Reject a pending quote with feedback (admin only) */
  rejectQuote: (id: string, feedback: { authorId: string; authorName: string; message: string }) => Promise<boolean>
  /** Update project specifications */
  updateProjectSpecs: (id: string, specs: ProjectSpec[]) => Promise<boolean>
  /** Update lead details (clientName, email, phone, address, werknummer, etc.) */
  updateLead: (id: string, data: Partial<Pick<Lead, 'clientName' | 'clientEmail' | 'clientPhone' | 'address' | 'city' | 'projectType' | 'value' | 'werknummer'>>) => Promise<boolean>
  
  // Team management
  /** Update team assignments (Projectleider, Rekenaar and/or Tekenaar) */
  updateTeamAssignments: (id: string, data: { assignedProjectleider?: string | null; assignedRekenaar?: string | null; assignedTekenaar?: string | null }) => Promise<boolean>
  /** Update "aan zet" status (who is currently working) */
  updateAanZet: (id: string, aanZet: AanZet) => Promise<boolean>
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
        // Extract leads from paginated response
        const paginatedData = result.data as { data: Lead[]; pagination: unknown }
        set({ 
          leads: paginatedData.data, 
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
  },

  /**
   * Update lead details with optimistic update
   */
  updateLead: async (id, data) => {
    const previousLeads = get().leads
    
    // Optimistic update
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, ...data } : lead
      )
    }))

    try {
      const result = await updateLeadDetailsAction(id, data)
      
      if (!result.success) {
        set({ leads: previousLeads })
        toast.error('Opslaan mislukt', {
          description: result.error || 'Kon gegevens niet opslaan'
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
   * Update team assignments (Rekenaar and/or Tekenaar)
   */
  updateTeamAssignments: async (id, data) => {
    const previousLeads = get().leads
    
    // Optimistic update
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, ...data } : lead
      )
    }))

    try {
      const result = await updateLeadTeamAssignmentsAction(id, data)
      
      if (!result.success) {
        set({ leads: previousLeads })
        toast.error('Toewijzing mislukt', {
          description: result.error || 'Kon teamleden niet toewijzen'
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
   * Update "aan zet" status (who is currently working)
   */
  updateAanZet: async (id, aanZet) => {
    const previousLeads = get().leads
    
    // Optimistic update
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === id ? { ...lead, aanZet } : lead
      )
    }))

    try {
      const result = await updateLeadAanZetAction(id, aanZet)
      
      if (!result.success) {
        set({ leads: previousLeads })
        toast.error('Update mislukt', {
          description: result.error || 'Kon "aan zet" status niet wijzigen'
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
