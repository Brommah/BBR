"use server"

import prisma from './db'
import { LeadStatus, QuoteApprovalStatus } from '@prisma/client'

// ============================================================
// Type Definitions
// ============================================================

export interface QuoteLineItem {
  description: string
  amount: number
}

export interface QuoteFeedbackItem {
  id: string
  authorId: string
  authorName: string
  message: string
  createdAt: string
  type: 'approval' | 'rejection' | 'comment'
}

export interface QuoteSubmission {
  quoteValue: number
  quoteDescription?: string
  quoteLineItems?: QuoteLineItem[]
  quoteEstimatedHours?: number
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================
// Status Conversion Helpers
// ============================================================

const statusDbToFrontend: Record<LeadStatus, string> = {
  Nieuw: "Nieuw",
  Calculatie: "Calculatie",
  OfferteVerzonden: "Offerte Verzonden",
  Opdracht: "Opdracht",
  Archief: "Archief"
}

const statusFrontendToDb: Record<string, LeadStatus> = {
  "Nieuw": "Nieuw",
  "Calculatie": "Calculatie",
  "Offerte Verzonden": "OfferteVerzonden",
  "Opdracht": "Opdracht",
  "Archief": "Archief"
}

// ============================================================
// Input Validation
// ============================================================

function validateId(id: unknown): string | null {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return null
  }
  return id.trim()
}

function validateStatus(status: unknown): LeadStatus | null {
  if (!status || typeof status !== 'string') return null
  return statusFrontendToDb[status] || null
}

function validateNumber(value: unknown, min = 0): number | null {
  if (typeof value !== 'number' || isNaN(value) || value < min) {
    return null
  }
  return value
}

function validateString(value: unknown, maxLength = 10000): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > maxLength) return null
  return trimmed
}

// ============================================================
// User Operations
// ============================================================

export async function getUsers(role?: string): Promise<ActionResult> {
  try {
    const users = await prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true
      }
    })
    return { success: true, data: users }
  } catch (error) {
    console.error('[DB] Error fetching users:', error)
    return { success: false, error: 'Failed to load users' }
  }
}

export async function getEngineers(): Promise<ActionResult> {
  return getUsers('engineer')
}

export async function getUserByEmail(email: string): Promise<ActionResult> {
  const validEmail = validateString(email, 255)
  if (!validEmail) {
    return { success: false, error: 'Invalid email' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: validEmail.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true
      }
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    return { success: true, data: user }
  } catch (error) {
    console.error('[DB] Error fetching user:', error)
    return { success: false, error: 'Failed to load user' }
  }
}

// ============================================================
// Lead Operations
// ============================================================

export async function getLeads(): Promise<ActionResult> {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        specifications: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const formattedLeads = leads.map(lead => ({
      ...lead,
      status: statusDbToFrontend[lead.status] || lead.status,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      quoteLineItems: lead.quoteLineItems as QuoteLineItem[] | null,
      quoteFeedback: lead.quoteFeedback as QuoteFeedbackItem[] | null,
      specifications: lead.specifications.map(spec => ({
        key: spec.key,
        value: spec.value,
        unit: spec.unit || undefined
      }))
    }))
    
    return { success: true, data: formattedLeads }
  } catch (error) {
    console.error('[DB] Error fetching leads:', error)
    return { success: false, error: 'Failed to load leads' }
  }
}

export async function getLead(id: string): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) {
    return { success: false, error: 'Invalid lead ID' }
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: validId },
      include: {
        specifications: true,
        notes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 }
      }
    })
    
    if (!lead) {
      return { success: false, error: 'Lead not found' }
    }
    
    return {
      success: true,
      data: {
        ...lead,
        status: statusDbToFrontend[lead.status] || lead.status,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
        quoteLineItems: lead.quoteLineItems as QuoteLineItem[] | null,
        quoteFeedback: lead.quoteFeedback as QuoteFeedbackItem[] | null,
        specifications: lead.specifications.map(spec => ({
          key: spec.key,
          value: spec.value,
          unit: spec.unit || undefined
        }))
      }
    }
  } catch (error) {
    console.error('[DB] Error fetching lead:', error)
    return { success: false, error: 'Failed to load lead' }
  }
}

export async function createLead(data: {
  clientName: string
  clientEmail?: string
  clientPhone?: string
  projectType: string
  city: string
  address?: string
  value?: number
  isUrgent?: boolean
  specifications?: { key: string; value: string; unit?: string }[]
}): Promise<ActionResult> {
  // Validate required fields
  const clientName = validateString(data.clientName, 200)
  const projectType = validateString(data.projectType, 100)
  const city = validateString(data.city, 100)
  
  if (!clientName) return { success: false, error: 'Client name is required' }
  if (!projectType) return { success: false, error: 'Project type is required' }
  if (!city) return { success: false, error: 'City is required' }

  try {
    const lead = await prisma.lead.create({
      data: {
        clientName,
        clientEmail: data.clientEmail?.trim() || null,
        clientPhone: data.clientPhone?.trim() || null,
        projectType,
        city,
        address: data.address?.trim() || null,
        value: data.value || 0,
        isUrgent: data.isUrgent || false,
        specifications: {
          create: data.specifications?.map(spec => ({
            key: spec.key.trim(),
            value: spec.value.trim(),
            unit: spec.unit?.trim() || null
          })) || []
        }
      },
      include: {
        specifications: true
      }
    })
    
    // Create activity log
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: 'lead_created',
        content: `Lead aangemaakt: ${clientName} (${projectType})`
      }
    })
    
    return {
      success: true,
      data: {
        ...lead,
        status: statusDbToFrontend[lead.status],
        createdAt: lead.createdAt.toISOString()
      }
    }
  } catch (error) {
    console.error('[DB] Error creating lead:', error)
    return { success: false, error: 'Failed to create lead' }
  }
}

export async function updateLeadStatus(id: string, status: string): Promise<ActionResult> {
  const validId = validateId(id)
  const dbStatus = validateStatus(status)
  
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  if (!dbStatus) return { success: false, error: 'Invalid status' }

  try {
    const lead = await prisma.lead.update({
      where: { id: validId },
      data: { status: dbStatus }
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'status_change',
        content: `Status gewijzigd naar ${status}`
      }
    })
    
    return {
      success: true,
      data: { ...lead, status: statusDbToFrontend[lead.status] }
    }
  } catch (error) {
    console.error('[DB] Error updating lead status:', error)
    return { success: false, error: 'Failed to update status' }
  }
}

export async function updateLeadAssignee(id: string, assignee: string): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  const assigneeName = assignee?.trim() || null

  try {
    const lead = await prisma.lead.update({
      where: { id: validId },
      data: { assignee: assigneeName }
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'assignment',
        content: assigneeName 
          ? `Toegewezen aan ${assigneeName}` 
          : 'Toewijzing verwijderd'
      }
    })
    
    return { success: true, data: lead }
  } catch (error) {
    console.error('[DB] Error updating assignee:', error)
    return { success: false, error: 'Failed to update assignee' }
  }
}

export async function updateLeadSpecs(
  id: string, 
  specs: { key: string; value: string; unit?: string }[]
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    // Delete existing specs and create new ones in transaction
    await prisma.$transaction([
      prisma.projectSpec.deleteMany({ where: { leadId: validId } }),
      ...specs.map(spec => 
        prisma.projectSpec.create({
          data: {
            leadId: validId,
            key: spec.key.trim(),
            value: spec.value.trim(),
            unit: spec.unit?.trim() || null
          }
        })
      )
    ])
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'specs_updated',
        content: 'Specificaties bijgewerkt'
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error('[DB] Error updating specs:', error)
    return { success: false, error: 'Failed to update specifications' }
  }
}

// ============================================================
// Quote Operations
// ============================================================

export async function submitQuoteForApproval(
  id: string, 
  submission: QuoteSubmission
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  
  const quoteValue = validateNumber(submission.quoteValue, 0.01)
  if (!quoteValue) return { success: false, error: 'Quote value must be greater than 0' }

  // Validate line items if provided
  if (submission.quoteLineItems) {
    for (const item of submission.quoteLineItems) {
      if (!item.description?.trim()) {
        return { success: false, error: 'All line items must have a description' }
      }
      if (typeof item.amount !== 'number' || item.amount < 0) {
        return { success: false, error: 'All line items must have a valid amount' }
      }
    }
  }

  try {
    const lead = await prisma.lead.update({
      where: { id: validId },
      data: {
        quoteApproval: 'pending' as QuoteApprovalStatus,
        quoteValue,
        quoteDescription: submission.quoteDescription?.trim() || null,
        quoteLineItems: submission.quoteLineItems || null,
        quoteEstimatedHours: submission.quoteEstimatedHours || null
      }
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'quote_submitted',
        content: `Offerte van €${quoteValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })} ingediend ter goedkeuring`
      }
    })
    
    return { success: true, data: lead }
  } catch (error) {
    console.error('[DB] Error submitting quote:', error)
    return { success: false, error: 'Failed to submit quote' }
  }
}

export async function approveQuote(
  id: string, 
  feedback?: { authorId: string; authorName: string; message: string },
  adjustedValue?: number
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    // Get current lead to preserve existing feedback
    const currentLead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { quoteFeedback: true, quoteValue: true }
    })
    
    if (!currentLead) {
      return { success: false, error: 'Lead not found' }
    }

    const existingFeedback = (currentLead.quoteFeedback as QuoteFeedbackItem[]) || []
    const newFeedback: QuoteFeedbackItem[] = [...existingFeedback]
    
    if (feedback?.message?.trim()) {
      newFeedback.push({
        id: crypto.randomUUID(),
        authorId: feedback.authorId,
        authorName: feedback.authorName,
        message: feedback.message.trim(),
        createdAt: new Date().toISOString(),
        type: 'approval'
      })
    }

    const finalValue = adjustedValue !== undefined ? adjustedValue : currentLead.quoteValue

    const lead = await prisma.lead.update({
      where: { id: validId },
      data: {
        quoteApproval: 'approved' as QuoteApprovalStatus,
        status: 'OfferteVerzonden' as LeadStatus,
        quoteValue: finalValue,
        quoteFeedback: newFeedback
      }
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'quote_approved',
        content: `Offerte goedgekeurd${adjustedValue !== undefined ? ` (aangepast naar €${adjustedValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })})` : ''}`,
        author: feedback?.authorName
      }
    })
    
    return { success: true, data: lead }
  } catch (error) {
    console.error('[DB] Error approving quote:', error)
    return { success: false, error: 'Failed to approve quote' }
  }
}

export async function rejectQuote(
  id: string, 
  feedback: { authorId: string; authorName: string; message: string }
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  
  if (!feedback?.message?.trim()) {
    return { success: false, error: 'Feedback message is required for rejection' }
  }

  try {
    const currentLead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { quoteFeedback: true }
    })
    
    if (!currentLead) {
      return { success: false, error: 'Lead not found' }
    }

    const existingFeedback = (currentLead.quoteFeedback as QuoteFeedbackItem[]) || []
    const newFeedback: QuoteFeedbackItem[] = [...existingFeedback, {
      id: crypto.randomUUID(),
      authorId: feedback.authorId,
      authorName: feedback.authorName,
      message: feedback.message.trim(),
      createdAt: new Date().toISOString(),
      type: 'rejection'
    }]

    const lead = await prisma.lead.update({
      where: { id: validId },
      data: {
        quoteApproval: 'rejected' as QuoteApprovalStatus,
        quoteFeedback: newFeedback
      }
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'quote_rejected',
        content: `Offerte afgekeurd: ${feedback.message.trim()}`,
        author: feedback.authorName
      }
    })
    
    return { success: true, data: lead }
  } catch (error) {
    console.error('[DB] Error rejecting quote:', error)
    return { success: false, error: 'Failed to reject quote' }
  }
}

// ============================================================
// Notes Operations
// ============================================================

export async function addNote(
  leadId: string, 
  content: string, 
  author: string
): Promise<ActionResult> {
  const validId = validateId(leadId)
  const validContent = validateString(content, 10000)
  const validAuthor = validateString(author, 200)
  
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  if (!validContent) return { success: false, error: 'Note content is required' }
  if (!validAuthor) return { success: false, error: 'Author is required' }

  try {
    const note = await prisma.note.create({
      data: {
        leadId: validId,
        content: validContent,
        author: validAuthor
      }
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'note_added',
        content: `Notitie toegevoegd`,
        author: validAuthor
      }
    })
    
    return { success: true, data: note }
  } catch (error) {
    console.error('[DB] Error adding note:', error)
    return { success: false, error: 'Failed to add note' }
  }
}

export async function getNotes(leadId: string): Promise<ActionResult> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const notes = await prisma.note.findMany({
      where: { leadId: validId },
      orderBy: { createdAt: 'desc' }
    })
    
    return { success: true, data: notes }
  } catch (error) {
    console.error('[DB] Error fetching notes:', error)
    return { success: false, error: 'Failed to load notes' }
  }
}

export async function getActivities(leadId: string): Promise<ActionResult> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const activities = await prisma.activity.findMany({
      where: { leadId: validId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    return { success: true, data: activities }
  } catch (error) {
    console.error('[DB] Error fetching activities:', error)
    return { success: false, error: 'Failed to load activities' }
  }
}

// ============================================================
// Cost Rates Operations
// ============================================================

export async function getCostRates(): Promise<ActionResult> {
  try {
    const rates = await prisma.costRate.findMany({
      orderBy: { createdAt: 'asc' }
    })
    return { success: true, data: rates }
  } catch (error) {
    console.error('[DB] Error fetching cost rates:', error)
    return { success: false, error: 'Failed to load cost rates' }
  }
}

export async function createCostRate(data: {
  name: string
  basePrice: number
  category?: string
  isPercentage?: boolean
}): Promise<ActionResult> {
  const name = validateString(data.name, 200)
  const basePrice = validateNumber(data.basePrice, 0)
  
  if (!name) return { success: false, error: 'Name is required' }
  if (basePrice === null) return { success: false, error: 'Base price must be a valid number' }

  try {
    const rate = await prisma.costRate.create({
      data: {
        name,
        basePrice,
        category: data.category?.trim() || 'base',
        isPercentage: data.isPercentage || false
      }
    })
    return { success: true, data: rate }
  } catch (error) {
    console.error('[DB] Error creating cost rate:', error)
    return { success: false, error: 'Failed to create cost rate' }
  }
}

export async function updateCostRate(id: string, basePrice: number): Promise<ActionResult> {
  const validId = validateId(id)
  const validPrice = validateNumber(basePrice, 0)
  
  if (!validId) return { success: false, error: 'Invalid rate ID' }
  if (validPrice === null) return { success: false, error: 'Base price must be a valid number' }

  try {
    const rate = await prisma.costRate.update({
      where: { id: validId },
      data: { basePrice: validPrice }
    })
    return { success: true, data: rate }
  } catch (error) {
    console.error('[DB] Error updating cost rate:', error)
    return { success: false, error: 'Failed to update cost rate' }
  }
}

export async function deleteCostRate(id: string): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid rate ID' }

  try {
    await prisma.costRate.delete({
      where: { id: validId }
    })
    return { success: true }
  } catch (error) {
    console.error('[DB] Error deleting cost rate:', error)
    return { success: false, error: 'Failed to delete cost rate' }
  }
}
