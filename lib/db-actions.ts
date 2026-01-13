"use server"

/**
 * @fileoverview Server Actions for database operations
 * 
 * This module contains all server-side database operations using Prisma.
 * All functions are marked with "use server" for Next.js Server Actions.
 * 
 * @module lib/db-actions
 */

import prisma from './db'
import { LeadStatus, QuoteApprovalStatus } from '@prisma/client'
import { PAGINATION } from './config'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Represents a single line item in a quote
 */
export interface QuoteLineItem {
  /** Description of the work/service */
  description: string
  /** Amount in EUR */
  amount: number
}

/**
 * Represents feedback on a quote from admin
 */
export interface QuoteFeedbackItem {
  /** Unique identifier for the feedback */
  id: string
  /** ID of the user who gave feedback */
  authorId: string
  /** Display name of the author */
  authorName: string
  /** The feedback message */
  message: string
  /** ISO timestamp when feedback was given */
  createdAt: string
  /** Type of feedback */
  type: 'approval' | 'rejection' | 'comment'
}

/**
 * Data required to submit a quote for approval
 */
export interface QuoteSubmission {
  /** Total quote value in EUR */
  quoteValue: number
  /** Optional description/justification */
  quoteDescription?: string
  /** Breakdown of costs */
  quoteLineItems?: QuoteLineItem[]
  /** Estimated hours for the work */
  quoteEstimatedHours?: number
}

/**
 * Standard result type for all server actions
 * @template T - Type of the data payload on success
 */
export interface ActionResult<T = unknown> {
  /** Whether the action succeeded */
  success: boolean
  /** Data payload on success */
  data?: T
  /** Error message on failure */
  error?: string
}

/**
 * Paginated result wrapper for list queries
 * @template T - Type of items in the list
 */
export interface PaginatedResult<T> {
  /** Array of items for current page */
  data: T[]
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number
    /** Items per page */
    pageSize: number
    /** Total items across all pages */
    totalCount: number
    /** Total number of pages */
    totalPages: number
    /** Whether more pages exist */
    hasMore: boolean
  }
}

/**
 * Parameters for paginated queries
 */
export interface PaginationParams {
  /** Page number (1-indexed, default: 1) */
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LeadFilters {
  status?: string[]
  assignee?: string
  projectType?: string
  city?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  includeDeleted?: boolean
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

export async function getLeads(
  filters?: LeadFilters,
  pagination?: PaginationParams
): Promise<ActionResult<PaginatedResult<unknown>>> {
  try {
    const page = pagination?.page || 1
    const pageSize = Math.min(
      pagination?.pageSize || PAGINATION.defaultPageSize,
      PAGINATION.maxPageSize
    )
    const skip = (page - 1) * pageSize
    const sortBy = pagination?.sortBy || 'createdAt'
    const sortOrder = pagination?.sortOrder || 'desc'

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: filters?.includeDeleted ? undefined : null,
    }

    if (filters?.status?.length) {
      where.status = { in: filters.status.map(s => statusFrontendToDb[s] || s) }
    }
    if (filters?.assignee) {
      where.assignee = filters.assignee
    }
    if (filters?.projectType) {
      where.projectType = filters.projectType
    }
    if (filters?.city) {
      where.city = { contains: filters.city, mode: 'insensitive' }
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, unknown>).lte = new Date(filters.dateTo)
      }
    }
    if (filters?.search) {
      where.OR = [
        { clientName: { contains: filters.search, mode: 'insensitive' } },
        { clientEmail: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { projectType: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Execute queries in parallel
    const [leads, totalCount] = await Promise.all([
      prisma.lead.findMany({
        where,
      include: {
        specifications: true
      },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ])
    
    const formattedLeads = leads.map(lead => ({
      ...lead,
      status: statusDbToFrontend[lead.status] || lead.status,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      deletedAt: lead.deletedAt?.toISOString() || null,
      quoteLineItems: lead.quoteLineItems as QuoteLineItem[] | null,
      quoteFeedback: lead.quoteFeedback as QuoteFeedbackItem[] | null,
      specifications: lead.specifications.map(spec => ({
        key: spec.key,
        value: spec.value,
        unit: spec.unit || undefined
      }))
    }))

    const totalPages = Math.ceil(totalCount / pageSize)
    
    return {
      success: true,
      data: {
        data: formattedLeads,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    }
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
  werknummer?: string
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
        werknummer: data.werknummer?.trim() || null,
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

export async function updateLeadDetails(
  id: string,
  data: {
    clientName?: string
    clientEmail?: string | null
    clientPhone?: string | null
    address?: string | null
    city?: string
    projectType?: string
    value?: number
    werknummer?: string | null
  }
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const updateData: Record<string, unknown> = {}
    
    if (data.clientName !== undefined) updateData.clientName = data.clientName.trim()
    if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail?.trim() || null
    if (data.clientPhone !== undefined) updateData.clientPhone = data.clientPhone?.trim() || null
    if (data.address !== undefined) updateData.address = data.address?.trim() || null
    if (data.city !== undefined) updateData.city = data.city.trim()
    if (data.projectType !== undefined) updateData.projectType = data.projectType.trim()
    if (data.value !== undefined) updateData.value = data.value
    if (data.werknummer !== undefined) updateData.werknummer = data.werknummer?.trim() || null

    const lead = await prisma.lead.update({
      where: { id: validId },
      data: updateData
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'specs_updated',
        content: 'Projectgegevens bijgewerkt'
      }
    })
    
    return { success: true, data: lead }
  } catch (error) {
    console.error('[DB] Error updating lead details:', error)
    return { success: false, error: 'Failed to update lead details' }
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
        quoteLineItems: submission.quoteLineItems ? JSON.parse(JSON.stringify(submission.quoteLineItems)) : undefined,
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

    const existingFeedback = (currentLead.quoteFeedback as unknown as QuoteFeedbackItem[]) || []
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
        quoteFeedback: JSON.parse(JSON.stringify(newFeedback))
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

    const existingFeedback = (currentLead.quoteFeedback as unknown as QuoteFeedbackItem[]) || []
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
        quoteFeedback: JSON.parse(JSON.stringify(newFeedback))
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

// ============================================================
// Activity Operations (Real activities from database)
// ============================================================

export async function createActivity(data: {
  leadId: string
  type: string
  content: string
  author?: string
}): Promise<ActionResult> {
  const validId = validateId(data.leadId)
  const content = validateString(data.content, 5000)
  
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  if (!content) return { success: false, error: 'Content is required' }

  try {
    const activity = await prisma.activity.create({
      data: {
        leadId: validId,
        type: data.type,
        content,
        author: data.author
      }
    })
    return { success: true, data: activity }
  } catch (error) {
    console.error('[DB] Error creating activity:', error)
    return { success: false, error: 'Failed to create activity' }
  }
}

// ============================================================
// Document Operations
// ============================================================

export async function getDocuments(leadId: string): Promise<ActionResult> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const documents = await prisma.document.findMany({
      where: { leadId: validId },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: documents }
  } catch (error) {
    console.error('[DB] Error fetching documents:', error)
    return { success: false, error: 'Failed to load documents' }
  }
}

export async function createDocument(data: {
  leadId: string
  name: string
  type: string
  category: string
  size: number
  url: string
  uploadedBy: string
}): Promise<ActionResult> {
  const validId = validateId(data.leadId)
  const name = validateString(data.name, 500)
  
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  if (!name) return { success: false, error: 'Name is required' }
  if (!data.url) return { success: false, error: 'URL is required' }

  try {
    const document = await prisma.document.create({
      data: {
        leadId: validId,
        name,
        type: data.type,
        category: data.category,
        size: data.size,
        url: data.url,
        uploadedBy: data.uploadedBy
      }
    })
    
    // Log activity
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'document_uploaded',
        content: `Document "${name}" geüpload`,
        author: data.uploadedBy
      }
    })
    
    return { success: true, data: document }
  } catch (error) {
    console.error('[DB] Error creating document:', error)
    return { success: false, error: 'Failed to create document' }
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid document ID' }

  try {
    await prisma.document.delete({
      where: { id: validId }
    })
    return { success: true }
  } catch (error) {
    console.error('[DB] Error deleting document:', error)
    return { success: false, error: 'Failed to delete document' }
  }
}

// ============================================================
// Communication Operations (calls, emails log)
// ============================================================

export async function getCommunications(leadId: string): Promise<ActionResult> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const communications = await prisma.communication.findMany({
      where: { leadId: validId },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: communications }
  } catch (error) {
    console.error('[DB] Error fetching communications:', error)
    return { success: false, error: 'Failed to load communications' }
  }
}

export async function createCommunication(data: {
  leadId: string
  type: 'email' | 'call' | 'whatsapp'
  direction: 'inbound' | 'outbound'
  subject?: string
  content: string
  duration?: number
  author: string
}): Promise<ActionResult> {
  const validId = validateId(data.leadId)
  const content = validateString(data.content, 10000)
  
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  if (!content) return { success: false, error: 'Content is required' }

  try {
    const communication = await prisma.communication.create({
      data: {
        leadId: validId,
        type: data.type,
        direction: data.direction,
        subject: data.subject,
        content,
        duration: data.duration,
        author: data.author
      }
    })
    
    // Log activity
    const typeLabel = data.type === 'email' ? 'E-mail' : data.type === 'call' ? 'Telefoongesprek' : 'WhatsApp'
    const dirLabel = data.direction === 'inbound' ? 'ontvangen' : 'verzonden'
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: data.type,
        content: `${typeLabel} ${dirLabel}${data.subject ? `: ${data.subject}` : ''}`,
        author: data.author
      }
    })
    
    return { success: true, data: communication }
  } catch (error) {
    console.error('[DB] Error creating communication:', error)
    return { success: false, error: 'Failed to create communication' }
  }
}

// ============================================================
// Quote Version History
// ============================================================

export async function getQuoteVersions(leadId: string): Promise<ActionResult> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const versions = await prisma.quoteVersion.findMany({
      where: { leadId: validId },
      orderBy: { version: 'desc' }
    })
    return { success: true, data: versions }
  } catch (error) {
    console.error('[DB] Error fetching quote versions:', error)
    return { success: false, error: 'Failed to load quote versions' }
  }
}

export async function createQuoteVersion(data: {
  leadId: string
  value: number
  lineItems: QuoteLineItem[]
  description?: string
  status: string
  createdBy: string
}): Promise<ActionResult> {
  const validId = validateId(data.leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    // Get current max version
    const maxVersion = await prisma.quoteVersion.findFirst({
      where: { leadId: validId },
      orderBy: { version: 'desc' },
      select: { version: true }
    })
    
    const newVersion = (maxVersion?.version || 0) + 1
    
    const quoteVersion = await prisma.quoteVersion.create({
      data: {
        leadId: validId,
        version: newVersion,
        value: data.value,
        lineItems: data.lineItems as unknown as Parameters<typeof prisma.quoteVersion.create>[0]['data']['lineItems'],
        description: data.description,
        status: data.status,
        createdBy: data.createdBy
      }
    })
    
    return { success: true, data: quoteVersion }
  } catch (error) {
    console.error('[DB] Error creating quote version:', error)
    return { success: false, error: 'Failed to create quote version' }
  }
}

// ============================================================
// Combined Activity Feed (notes + communications + system events)
// ============================================================

export async function getActivityFeed(leadId: string): Promise<ActionResult> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    // Fetch all types of activities
    const [activities, notes, communications] = await Promise.all([
      prisma.activity.findMany({
        where: { leadId: validId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.note.findMany({
        where: { leadId: validId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.communication.findMany({
        where: { leadId: validId },
        orderBy: { createdAt: 'desc' }
      })
    ])
    
    // Transform and combine into unified feed
    const feed = [
      ...activities.map(a => ({
        id: a.id,
        type: 'system' as const,
        content: a.content,
        timestamp: a.createdAt.toISOString(),
        user: a.author || 'System'
      })),
      ...notes.map(n => ({
        id: n.id,
        type: 'note' as const,
        content: n.content,
        timestamp: n.createdAt.toISOString(),
        user: n.author
      })),
      ...communications.map(c => ({
        id: c.id,
        type: c.type as 'email' | 'call',
        direction: c.direction as 'inbound' | 'outbound',
        subject: c.subject,
        content: c.content,
        timestamp: c.createdAt.toISOString(),
        user: c.author,
        duration: c.duration
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return { success: true, data: feed }
  } catch (error) {
    console.error('[DB] Error fetching activity feed:', error)
    return { success: false, error: 'Failed to load activity feed' }
  }
}

// ============================================================
// Email Templates
// ============================================================

export async function getEmailTemplates(): Promise<ActionResult> {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    return { success: true, data: templates }
  } catch (error) {
    console.error('[DB] Error fetching email templates:', error)
    return { success: false, error: 'Failed to load email templates' }
  }
}

export async function createEmailTemplate(data: {
  name: string
  subject: string
  body: string
  variables: string[]
}): Promise<ActionResult> {
  try {
    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        variables: data.variables
      }
    })
    return { success: true, data: template }
  } catch (error) {
    console.error('[DB] Error creating email template:', error)
    return { success: false, error: 'Failed to create email template' }
  }
}

// ============================================================
// Email Logging
// ============================================================

export async function logEmail(data: {
  leadId?: string
  templateId?: string
  to: string
  subject: string
  body: string
  status: 'sent' | 'delivered' | 'failed' | 'bounced'
  messageId?: string
  error?: string
  sentBy: string
}): Promise<ActionResult> {
  try {
    const log = await prisma.emailLog.create({
      data: {
        leadId: data.leadId,
        templateId: data.templateId,
        to: data.to,
        subject: data.subject,
        body: data.body,
        status: data.status,
        messageId: data.messageId,
        error: data.error,
        sentBy: data.sentBy
      }
    })
    return { success: true, data: log }
  } catch (error) {
    console.error('[DB] Error logging email:', error)
    return { success: false, error: 'Failed to log email' }
  }
}

export async function getEmailLogs(leadId?: string): Promise<ActionResult> {
  try {
    const logs = await prisma.emailLog.findMany({
      where: leadId ? { leadId } : {},
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return { success: true, data: logs }
  } catch (error) {
    console.error('[DB] Error fetching email logs:', error)
    return { success: false, error: 'Failed to load email logs' }
  }
}

// ============================================================
// Soft Delete Operations
// ============================================================

export async function softDeleteLead(
  id: string,
  userId?: string,
  userName?: string
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { clientName: true, projectType: true, status: true }
    })

    if (!lead) {
      return { success: false, error: 'Lead not found' }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: validId },
      data: { deletedAt: new Date() }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'lead_deleted',
        content: `Lead "${lead.clientName}" verwijderd`,
        author: userName,
        metadata: { previousStatus: lead.status }
      }
    })

    // Create audit log
    if (userId && userName) {
      await createAuditLog({
        entityType: 'lead',
        entityId: validId,
        action: 'delete',
        changes: [{ field: 'deletedAt', oldValue: null, newValue: new Date().toISOString() }],
        userId,
        userName,
      })
    }

    return { success: true, data: updatedLead }
  } catch (error) {
    console.error('[DB] Error soft deleting lead:', error)
    return { success: false, error: 'Failed to delete lead' }
  }
}

export async function restoreLead(
  id: string,
  userId?: string,
  userName?: string
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { clientName: true, deletedAt: true }
    })

    if (!lead) {
      return { success: false, error: 'Lead not found' }
    }

    if (!lead.deletedAt) {
      return { success: false, error: 'Lead is not deleted' }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: validId },
      data: { deletedAt: null }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'lead_restored',
        content: `Lead "${lead.clientName}" hersteld`,
        author: userName,
      }
    })

    // Create audit log
    if (userId && userName) {
      await createAuditLog({
        entityType: 'lead',
        entityId: validId,
        action: 'restore',
        changes: [{ field: 'deletedAt', oldValue: lead.deletedAt.toISOString(), newValue: null }],
        userId,
        userName,
      })
    }

    return { success: true, data: updatedLead }
  } catch (error) {
    console.error('[DB] Error restoring lead:', error)
    return { success: false, error: 'Failed to restore lead' }
  }
}

// ============================================================
// Rate Limiting (Database-backed)
// ============================================================

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + windowMs)

  try {
    // Clean up expired entries
    await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: now } }
    })

    // Try to find existing rate limit record
    const existing = await prisma.rateLimit.findUnique({
      where: { id: key }
    })

    if (existing) {
      // Check if expired
      if (existing.expiresAt < now) {
        // Reset
        await prisma.rateLimit.update({
          where: { id: key },
          data: { count: 1, expiresAt }
        })
        return { allowed: true, remaining: maxRequests - 1, resetAt: expiresAt }
      }

      // Check if over limit
      if (existing.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: existing.expiresAt }
      }

      // Increment
      const updated = await prisma.rateLimit.update({
        where: { id: key },
        data: { count: { increment: 1 } }
      })

      return {
        allowed: true,
        remaining: maxRequests - updated.count,
        resetAt: existing.expiresAt
      }
    }

    // Create new record
    await prisma.rateLimit.create({
      data: { id: key, count: 1, expiresAt }
    })

    return { allowed: true, remaining: maxRequests - 1, resetAt: expiresAt }
  } catch (error) {
    console.error('[DB] Rate limit check error:', error)
    // Fail open - allow request if rate limiting fails
    return { allowed: true, remaining: maxRequests, resetAt: expiresAt }
  }
}

// ============================================================
// Audit Logging
// ============================================================

export async function createAuditLog(data: {
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete' | 'restore'
  changes: { field: string; oldValue: unknown; newValue: unknown }[]
  userId: string
  userName: string
  ipAddress?: string
  userAgent?: string
}): Promise<ActionResult> {
  try {
    const log = await prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        changes: JSON.parse(JSON.stringify(data.changes)),
        userId: data.userId,
        userName: data.userName,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }
    })
    return { success: true, data: log }
  } catch (error) {
    console.error('[DB] Error creating audit log:', error)
    return { success: false, error: 'Failed to create audit log' }
  }
}

export async function getAuditLogs(params: {
  entityType?: string
  entityId?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}): Promise<ActionResult> {
  try {
    const page = params.page || 1
    const pageSize = Math.min(params.pageSize || 50, 100)
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (params.entityType) where.entityType = params.entityType
    if (params.entityId) where.entityId = params.entityId
    if (params.userId) where.userId = params.userId
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(params.dateFrom)
      }
      if (params.dateTo) {
        (where.createdAt as Record<string, unknown>).lte = new Date(params.dateTo)
      }
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      success: true,
      data: {
        data: logs,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasMore: page * pageSize < totalCount,
        },
      },
    }
  } catch (error) {
    console.error('[DB] Error fetching audit logs:', error)
    return { success: false, error: 'Failed to load audit logs' }
  }
}
