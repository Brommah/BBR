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
import {
  triggerStatusChangeEmail,
  triggerAssignmentEmails,
  sendQuotePendingApprovalNotification,
  sendQuoteRejectedNotification,
  sendNewLeadNotification
} from './email-triggers'

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

type FrontendStatus = "Nieuw" | "Calculatie" | "Offerte Verzonden" | "Opdracht" | "Archief"

const statusDbToFrontend: Record<LeadStatus, FrontendStatus> = {
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
// Quote Acceptance Hash Generation
// ============================================================

/**
 * Generate a cryptographically secure hash for quote acceptance links
 * Uses Web Crypto API for secure random generation
 */
function generateSecureHash(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create or update a quote version with a secure acceptance link
 * Called when admin approves a quote to generate the client-facing acceptance URL
 */
export async function createQuoteAcceptanceLink(
  leadId: string,
  options?: {
    expiresInDays?: number // Default: 30 days
  }
): Promise<ActionResult<{ hash: string; expiresAt: Date; quoteVersionId: string }>> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  
  try {
    // Get the lead and its current quote data
    const lead = await prisma.lead.findUnique({
      where: { id: validId },
      select: {
        id: true,
        quoteValue: true,
        quoteDescription: true,
        quoteLineItems: true,
        quoteApproval: true,
        clientName: true,
        quoteVersions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })
    
    if (!lead) {
      return { success: false, error: 'Lead not found' }
    }
    
    if (!lead.quoteValue) {
      return { success: false, error: 'No quote value set' }
    }
    
    // Calculate expiration date
    const expiresInDays = options?.expiresInDays ?? 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    
    // Generate secure hash
    const hash = generateSecureHash()
    
    // Get next version number
    const currentVersion = lead.quoteVersions[0]?.version ?? 0
    const nextVersion = currentVersion + 1
    
    // Create new quote version with acceptance hash
    const quoteVersion = await prisma.quoteVersion.create({
      data: {
        leadId: validId,
        version: nextVersion,
        value: lead.quoteValue,
        lineItems: lead.quoteLineItems || [],
        description: lead.quoteDescription,
        status: 'sent',
        createdBy: 'system',
        acceptanceHash: hash,
        hashExpiresAt: expiresAt
      }
    })
    
    return {
      success: true,
      data: {
        hash,
        expiresAt,
        quoteVersionId: quoteVersion.id
      }
    }
  } catch (error) {
    console.error('[DB] Error creating quote acceptance link:', error)
    return { success: false, error: 'Failed to create acceptance link' }
  }
}

// ============================================================
// User Operations
// ============================================================

export async function getUsers(role?: string): Promise<ActionResult> {
  try {
    const users = await prisma.user.findMany({
      where: role ? { role, deletedAt: null } : { deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        engineerType: true,
        avatar: true
      }
    })
    return { success: true, data: users }
  } catch (error) {
    console.error('[DB] Error fetching users:', error)
    return { success: false, error: 'Failed to load users' }
  }
}

/**
 * Get users by engineer type (rekenaar or tekenaar)
 */
export async function getUsersByEngineerType(engineerType: 'rekenaar' | 'tekenaar'): Promise<ActionResult> {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'engineer',
        engineerType,
        deletedAt: null
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        engineerType: true,
        avatar: true
      }
    })
    return { success: true, data: users }
  } catch (error) {
    console.error('[DB] Error fetching users by engineer type:', error)
    return { success: false, error: 'Failed to load users' }
  }
}

export async function getEngineers(): Promise<ActionResult> {
  return getUsers('engineer')
}

export async function getUserByEmail(email: string): Promise<ActionResult> {
  console.log('[DB] getUserByEmail called with:', email)
  const validEmail = validateString(email, 255)
  if (!validEmail) {
    console.log('[DB] getUserByEmail: Invalid email')
    return { success: false, error: 'Invalid email' }
  }

  try {
    console.log('[DB] getUserByEmail: Querying DB for:', validEmail.toLowerCase())
    const user = await prisma.user.findUnique({
      where: { email: validEmail.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        engineerType: true,
        avatar: true
      }
    })
    
    console.log('[DB] getUserByEmail: Query result:', user ? `Found ${user.name} with role ${user.role}` : 'NOT FOUND')
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    return { success: true, data: user }
  } catch (error) {
    console.error('[DB] getUserByEmail: Error:', error)
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

export async function updateLeadStatus(id: string, status: string, triggeredBy?: string): Promise<ActionResult> {
  const validId = validateId(id)
  const dbStatus = validateStatus(status)
  
  if (!validId) return { success: false, error: 'Invalid lead ID' }
  if (!dbStatus) return { success: false, error: 'Invalid status' }

  try {
    // Get current lead to track status change
    const currentLead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { 
        status: true, 
        clientName: true, 
        clientEmail: true, 
        projectType: true, 
        city: true,
        address: true,
        assignee: true,
        quoteValue: true,
        quoteDescription: true
      }
    })
    
    if (!currentLead) {
      return { success: false, error: 'Lead not found' }
    }
    
    const oldStatus = statusDbToFrontend[currentLead.status]
    const newStatus = status
    
    // Build update data with email tracking timestamps
    const updateData: Record<string, unknown> = { status: dbStatus }
    
    // Track when specific emails would be sent
    if (newStatus === 'Opdracht' && oldStatus !== 'Opdracht') {
      updateData.orderConfirmSentAt = new Date()
    }
    if (newStatus === 'Archief' && oldStatus !== 'Archief') {
      updateData.deliveryNotifSentAt = new Date()
    }
    
    const lead = await prisma.lead.update({
      where: { id: validId },
      data: updateData
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'status_change',
        content: `Status gewijzigd naar ${status}`
      }
    })
    
    // Trigger status change emails (async, don't block response)
    // Note: Email triggers expect LeadStatus from types.ts which uses the DB format (keyof LEAD_STATUSES)
    if (currentLead.clientEmail && triggeredBy) {
      triggerStatusChangeEmail(
        {
          id: validId,
          clientName: currentLead.clientName,
          clientEmail: currentLead.clientEmail,
          projectType: currentLead.projectType,
          city: currentLead.city,
          address: currentLead.address,
          status: newStatus as LeadStatus,
          assignee: currentLead.assignee,
          quoteValue: currentLead.quoteValue,
          quoteDescription: currentLead.quoteDescription
        },
        oldStatus as LeadStatus,
        newStatus as LeadStatus,
        triggeredBy
      ).then(result => {
        if (result.sent) {
          console.log(`[Email] Status change email (${result.emailType}) sent for lead ${validId}`)
        }
      }).catch(err => {
        console.error('[Email] Failed to send status change email:', err)
      })
    }
    
    return {
      success: true,
      data: { ...lead, status: statusDbToFrontend[lead.status] }
    }
  } catch (error) {
    console.error('[DB] Error updating lead status:', error)
    return { success: false, error: 'Failed to update status' }
  }
}

export async function updateLeadAssignee(id: string, assignee: string, triggeredBy?: string): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  const assigneeName = assignee?.trim() || null

  try {
    // Get current lead and previous assignee
    const currentLead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { 
        assignee: true, 
        clientName: true, 
        clientEmail: true, 
        projectType: true, 
        city: true,
        address: true,
        assigneeNotifiedAt: true
      }
    })
    
    if (!currentLead) {
      return { success: false, error: 'Lead not found' }
    }
    
    const previousAssignee = currentLead.assignee
    const isNewAssignment = !previousAssignee && assigneeName
    
    // Update lead with assignee and notification timestamp if new assignment
    const updateData: Record<string, unknown> = { assignee: assigneeName }
    if (isNewAssignment) {
      updateData.assigneeNotifiedAt = new Date()
    }
    
    const lead = await prisma.lead.update({
      where: { id: validId },
      data: updateData
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
    
    // Send assignment notification emails if this is a new assignment
    if (isNewAssignment && assigneeName && triggeredBy) {
      // Get engineer's email
      const engineer = await prisma.user.findFirst({
        where: { name: assigneeName, deletedAt: null },
        select: { email: true }
      })
      
      triggerAssignmentEmails(
        {
          id: validId,
          clientName: currentLead.clientName,
          clientEmail: currentLead.clientEmail,
          projectType: currentLead.projectType,
          city: currentLead.city,
          address: currentLead.address,
          status: 'Calculatie', // Typically assigned when moving to Calculatie
          assignee: assigneeName
        },
        assigneeName,
        engineer?.email || null,
        triggeredBy
      ).then(result => {
        console.log(`[Email] Assignment notification: client=${result.clientNotified}, engineer=${result.engineerNotified}`)
      }).catch(err => {
        console.error('[Email] Failed to send assignment emails:', err)
      })
    }
    
    return { success: true, data: lead }
  } catch (error) {
    console.error('[DB] Error updating assignee:', error)
    return { success: false, error: 'Failed to update assignee' }
  }
}

/**
 * Update team assignments for a lead (Rekenaar and/or Tekenaar)
 * Only Projectleider (admin) can do this
 */
export async function updateLeadTeamAssignments(
  id: string,
  data: {
    assignedRekenaar?: string | null
    assignedTekenaar?: string | null
  },
  triggeredBy?: string
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const currentLead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { 
        assignedRekenaar: true,
        assignedTekenaar: true,
        clientName: true
      }
    })
    
    if (!currentLead) {
      return { success: false, error: 'Lead not found' }
    }

    const updateData: Record<string, unknown> = {}
    const changes: string[] = []
    
    if (data.assignedRekenaar !== undefined) {
      updateData.assignedRekenaar = data.assignedRekenaar?.trim() || null
      if (currentLead.assignedRekenaar !== data.assignedRekenaar) {
        changes.push(data.assignedRekenaar 
          ? `Rekenaar toegewezen: ${data.assignedRekenaar}`
          : 'Rekenaar verwijderd')
      }
    }
    
    if (data.assignedTekenaar !== undefined) {
      updateData.assignedTekenaar = data.assignedTekenaar?.trim() || null
      if (currentLead.assignedTekenaar !== data.assignedTekenaar) {
        changes.push(data.assignedTekenaar 
          ? `Tekenaar toegewezen: ${data.assignedTekenaar}`
          : 'Tekenaar verwijderd')
      }
    }

    const lead = await prisma.lead.update({
      where: { id: validId },
      data: updateData
    })
    
    // Log activity for each change
    for (const change of changes) {
      await prisma.activity.create({
        data: {
          leadId: validId,
          type: 'assignment',
          content: change,
          author: triggeredBy
        }
      })
    }
    
    return { success: true, data: lead }
  } catch (error) {
    console.error('[DB] Error updating team assignments:', error)
    return { success: false, error: 'Failed to update team assignments' }
  }
}

/**
 * Update "aan zet" status for a lead
 * Determines which team member is currently working on the project
 * Only Projectleider (admin) can change this
 */
export async function updateLeadAanZet(
  id: string,
  aanZet: 'rekenaar' | 'tekenaar' | 'projectleider' | null,
  triggeredBy?: string
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  const aanZetLabels: Record<string, string> = {
    rekenaar: 'Rekenaar',
    tekenaar: 'Tekenaar',
    projectleider: 'Projectleider'
  }

  try {
    const currentLead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { aanZet: true, clientName: true }
    })
    
    if (!currentLead) {
      return { success: false, error: 'Lead not found' }
    }

    const lead = await prisma.lead.update({
      where: { id: validId },
      data: { aanZet }
    })
    
    // Log activity
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'aan_zet_change',
        content: aanZet 
          ? `Aan zet: ${aanZetLabels[aanZet]}`
          : 'Aan zet status verwijderd',
        author: triggeredBy
      }
    })
    
    return { success: true, data: lead }
  } catch (error) {
    console.error('[DB] Error updating aan zet:', error)
    return { success: false, error: 'Failed to update aan zet status' }
  }
}

/**
 * Get leads visible to a specific engineer based on their type and "aan zet" status
 * Engineers only see leads where:
 * 1. They are assigned (as rekenaar or tekenaar)
 * 2. Status is "Opdracht" (quote accepted)
 * 3. They are "aan zet" (their turn to work)
 */
export async function getLeadsForEngineer(
  engineerName: string,
  engineerType: 'rekenaar' | 'tekenaar'
): Promise<ActionResult> {
  const name = validateString(engineerName, 100)
  if (!name) return { success: false, error: 'Invalid engineer name' }

  try {
    const leads = await prisma.lead.findMany({
      where: {
        deletedAt: null,
        status: 'Opdracht', // Only show leads where quote is accepted
        aanZet: engineerType, // Only show when it's their turn
        OR: [
          { assignedRekenaar: engineerType === 'rekenaar' ? name : undefined },
          { assignedTekenaar: engineerType === 'tekenaar' ? name : undefined }
        ].filter(Boolean)
      },
      include: {
        specifications: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    
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

    return { success: true, data: formattedLeads }
  } catch (error) {
    console.error('[DB] Error fetching leads for engineer:', error)
    return { success: false, error: 'Failed to load leads' }
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
  submission: QuoteSubmission,
  submittedBy?: string
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
    // Get lead details for notification
    const currentLead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { clientName: true, projectType: true, assignee: true }
    })
    
    if (!currentLead) {
      return { success: false, error: 'Lead not found' }
    }
    
    const lead = await prisma.lead.update({
      where: { id: validId },
      data: {
        quoteApproval: 'pending' as QuoteApprovalStatus,
        quoteValue,
        quoteDescription: submission.quoteDescription?.trim() || null,
        quoteLineItems: submission.quoteLineItems ? JSON.parse(JSON.stringify(submission.quoteLineItems)) : undefined,
        quoteEstimatedHours: submission.quoteEstimatedHours || null,
        // Update pipeline status when quote is submitted for approval
        status: 'Calculatie' as LeadStatus
      }
    })
    
    await prisma.activity.create({
      data: {
        leadId: validId,
        type: 'quote_submitted',
        content: `Offerte van €${quoteValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })} ingediend ter goedkeuring`,
        author: submittedBy
      }
    })
    
    // Notify admins about pending approval
    const admins = await prisma.user.findMany({
      where: { role: 'admin', deletedAt: null },
      select: { email: true }
    })
    
    if (admins.length > 0) {
      sendQuotePendingApprovalNotification({
        adminEmails: admins.map(a => a.email),
        engineerName: currentLead.assignee || submittedBy || 'Onbekend',
        clientName: currentLead.clientName,
        projectType: currentLead.projectType,
        quoteValue,
        leadId: validId
      }).then(result => {
        console.log(`[Email] Quote pending approval notification: ${result.sent} sent, ${result.failed} failed`)
      }).catch(err => {
        console.error('[Email] Failed to send pending approval notification:', err)
      })
    }
    
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
    // Get current lead to preserve existing feedback AND send email
    const currentLead = await prisma.lead.findUnique({
      where: { id: validId },
      select: { 
        quoteFeedback: true, 
        quoteValue: true,
        quoteDescription: true,
        clientName: true,
        clientEmail: true,
        projectType: true,
        city: true,
        address: true,
        assignee: true
      }
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
        quoteFeedback: JSON.parse(JSON.stringify(newFeedback)),
        quoteSentAt: new Date() // Track when quote was sent
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
    
    // Generate acceptance link and send quote email to client
    if (currentLead.clientEmail && finalValue) {
      // Create secure acceptance link
      const acceptanceLinkResult = await createQuoteAcceptanceLink(validId)
      
      if (acceptanceLinkResult.success && acceptanceLinkResult.data) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.broersmabouwadvies.nl'
        const acceptanceUrl = `${baseUrl}/offerte/${acceptanceLinkResult.data.hash}`
        
        const { sendQuoteEmail } = await import('./email')
        sendQuoteEmail({
          to: currentLead.clientEmail,
          clientName: currentLead.clientName,
          projectType: currentLead.projectType,
          quoteValue: finalValue,
          quoteDescription: currentLead.quoteDescription || undefined,
          leadId: validId,
          sentBy: feedback?.authorName || 'System',
          acceptanceUrl // Include the secure acceptance link
        }).then(result => {
          if (result.success) {
            console.log(`[Email] Quote email sent to ${currentLead.clientEmail} for lead ${validId} with acceptance link`)
          } else {
            console.error(`[Email] Failed to send quote email: ${result.error}`)
          }
        }).catch(err => {
          console.error('[Email] Quote email error:', err)
        })
      } else {
        console.error('[Email] Failed to create acceptance link:', acceptanceLinkResult.error)
      }
    }
    
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
      select: { 
        quoteFeedback: true,
        assignee: true,
        clientName: true,
        projectType: true,
        quoteValue: true
      }
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
    
    // Notify engineer about rejection
    if (currentLead.assignee) {
      const engineer = await prisma.user.findFirst({
        where: { name: currentLead.assignee, deletedAt: null },
        select: { email: true }
      })
      
      if (engineer?.email) {
        sendQuoteRejectedNotification({
          engineerEmail: engineer.email,
          engineerName: currentLead.assignee,
          clientName: currentLead.clientName,
          projectType: currentLead.projectType,
          quoteValue: currentLead.quoteValue || 0,
          rejectionFeedback: feedback.message.trim(),
          rejectedBy: feedback.authorName,
          leadId: validId
        }).then(result => {
          if (result.success) {
            console.log(`[Email] Rejection notification sent to ${engineer.email}`)
          }
        }).catch(err => {
          console.error('[Email] Failed to send rejection notification:', err)
        })
      }
    }
    
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

/**
 * Toggle an emoji reaction on a note (add if not present, remove if already reacted)
 * @param noteId - The ID of the note to react to
 * @param emoji - The emoji to add/remove
 * @param userName - Name of the user reacting
 */
export async function toggleNoteReaction(
  noteId: string,
  emoji: string,
  userName: string
): Promise<ActionResult> {
  const validId = validateId(noteId)
  const validEmoji = validateString(emoji, 10)
  const validUserName = validateString(userName, 200)
  
  if (!validId) return { success: false, error: 'Invalid note ID' }
  if (!validEmoji) return { success: false, error: 'Emoji is required' }
  if (!validUserName) return { success: false, error: 'User name is required' }

  try {
    // Get current note with reactions
    const note = await prisma.note.findUnique({
      where: { id: validId },
      select: { reactions: true }
    })
    
    if (!note) {
      return { success: false, error: 'Note not found' }
    }
    
    // Parse current reactions or start with empty object
    const reactions = (note.reactions as Record<string, string[]>) || {}
    
    // Check if user already reacted with this emoji
    const currentReactors = reactions[validEmoji] || []
    const hasReacted = currentReactors.includes(validUserName)
    
    if (hasReacted) {
      // Remove the reaction
      reactions[validEmoji] = currentReactors.filter(name => name !== validUserName)
      // Clean up empty emoji arrays
      if (reactions[validEmoji].length === 0) {
        delete reactions[validEmoji]
      }
    } else {
      // Add the reaction
      reactions[validEmoji] = [...currentReactors, validUserName]
    }
    
    // Update the note
    const updatedNote = await prisma.note.update({
      where: { id: validId },
      data: { 
        reactions: Object.keys(reactions).length > 0 ? reactions : null 
      }
    })
    
    return { 
      success: true, 
      data: { 
        reactions: updatedNote.reactions,
        action: hasReacted ? 'removed' : 'added'
      } 
    }
  } catch (error) {
    console.error('[DB] Error toggling note reaction:', error)
    return { success: false, error: 'Failed to update reaction' }
  }
}

/**
 * Delete a note (admin only)
 * @param noteId - The ID of the note to delete
 * @param adminName - Name of the admin performing the deletion (for audit log)
 */
export async function deleteNote(
  noteId: string,
  adminName: string
): Promise<ActionResult> {
  const validId = validateId(noteId)
  const validAdmin = validateString(adminName, 200)
  
  if (!validId) return { success: false, error: 'Invalid note ID' }
  if (!validAdmin) return { success: false, error: 'Admin name is required' }

  try {
    // Get the note first to log what was deleted
    const note = await prisma.note.findUnique({
      where: { id: validId },
      include: { lead: { select: { id: true, clientName: true } } }
    })

    if (!note) {
      return { success: false, error: 'Note not found' }
    }

    // Delete the note
    await prisma.note.delete({
      where: { id: validId }
    })

    // Log the deletion as an activity
    await prisma.activity.create({
      data: {
        leadId: note.leadId,
        type: 'note_deleted',
        content: `Notitie verwijderd door ${validAdmin}`,
        author: validAdmin
      }
    })

    console.log(`[DB] Note ${validId} deleted by ${validAdmin} from lead ${note.leadId}`)
    return { success: true, data: { deletedNoteId: validId } }
  } catch (error) {
    console.error('[DB] Error deleting note:', error)
    return { success: false, error: 'Failed to delete note' }
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

/**
 * Update an existing email template
 * @param id - Template ID
 * @param data - Updated template data
 */
export async function updateEmailTemplate(
  id: string,
  data: {
    name?: string
    subject?: string
    body?: string
    variables?: string[]
    isActive?: boolean
  }
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid template ID' }

  try {
    const template = await prisma.emailTemplate.update({
      where: { id: validId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.subject && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.variables && { variables: data.variables }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    })
    return { success: true, data: template }
  } catch (error) {
    console.error('[DB] Error updating email template:', error)
    return { success: false, error: 'Failed to update email template' }
  }
}

/**
 * Delete an email template (soft delete by setting isActive to false)
 * @param id - Template ID
 */
export async function deleteEmailTemplate(id: string): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid template ID' }

  try {
    await prisma.emailTemplate.update({
      where: { id: validId },
      data: { isActive: false }
    })
    return { success: true, data: { deletedId: validId } }
  } catch (error) {
    console.error('[DB] Error deleting email template:', error)
    return { success: false, error: 'Failed to delete email template' }
  }
}

/**
 * Get all email templates including inactive ones (for admin)
 */
export async function getAllEmailTemplates(): Promise<ActionResult> {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' }
    })
    return { success: true, data: templates }
  } catch (error) {
    console.error('[DB] Error fetching all email templates:', error)
    return { success: false, error: 'Failed to load email templates' }
  }
}

/**
 * Seed default email templates if none exist
 */
export async function seedDefaultEmailTemplates(): Promise<ActionResult> {
  try {
    const existingCount = await prisma.emailTemplate.count()
    if (existingCount > 0) {
      return { success: true, data: { message: 'Templates already exist', seeded: 0 } }
    }

    const defaultTemplates = [
      {
        name: "intake-bevestiging",
        subject: "Ontvangstbevestiging: Uw aanvraag voor {{project_type}} | Bureau Broersma",
        body: `Beste {{client_name}},

Hartelijk dank voor uw vertrouwen in Bureau Broersma!

Wij hebben uw aanvraag voor een **{{project_type}}** aan de **{{address}}** te **{{city}}** in goede orde ontvangen.

### Wat kunt u verwachten?

📋 **Stap 1 – Beoordeling** (vandaag)
Wij bekijken uw aanvraag en de projectgegevens.

📞 **Stap 2 – Persoonlijk contact** (binnen 1-2 werkdagen)
Een van onze ingenieurs neemt contact met u op.

📄 **Stap 3 – Offerte op maat**
U ontvangt een heldere offerte zonder verrassingen.

Met vriendelijke groet,

Team Bureau Broersma`,
        variables: ["client_name", "project_type", "address", "city"]
      },
      {
        name: "offerte-verzonden",
        subject: "Uw offerte voor {{project_type}} aan {{address}} | €{{quote_value}}",
        body: `Beste {{client_name}},

Goed nieuws! De offerte voor uw **{{project_type}}** is gereed.

## 📋 Offerte Samenvatting

| | |
|---|---|
| Offertebedrag | **€{{quote_value}}** (excl. BTW) |
| Geldig tot | {{quote_valid_until}} |

## 📄 Wat is inbegrepen?

✅ Volledige constructieberekening volgens Eurocode
✅ Constructietekeningen met maatvoering  
✅ Certificering door erkend constructeur
✅ Ondersteuning bij vergunningsaanvraag

Heeft u vragen? Neem gerust contact met ons op.

Met vriendelijke groet,

{{engineer_name}}
Bureau Broersma`,
        variables: ["client_name", "project_type", "address", "quote_value", "quote_valid_until", "engineer_name"]
      },
      {
        name: "opdracht-bevestiging",
        subject: "🎉 Opdracht bevestigd: {{project_type}} {{address}} | Bureau Broersma",
        body: `Beste {{client_name}},

Geweldig nieuws! Wij hebben uw akkoord ontvangen en gaan direct aan de slag.

## ✅ Opdrachtbevestiging

| | |
|---|---|
| Opdrachtnummer | {{order_number}} |
| Opdrachtbedrag | €{{quote_total}} (incl. BTW) |

## 📅 Planning & Doorlooptijd

**Verwachte oplevering:** {{expected_delivery_date}}

1. ✅ **Opdracht ontvangen** – vandaag
2. ⏳ **Constructieberekening** – {{engineer_name}} start direct
3. ⏳ **Interne controle** – kwaliteitscheck
4. ⏳ **Oplevering** – digitale levering

Bedankt voor uw vertrouwen!

Met vriendelijke groet,

Team Bureau Broersma`,
        variables: ["client_name", "project_type", "address", "order_number", "quote_total", "expected_delivery_date", "engineer_name"]
      },
      {
        name: "factuur",
        subject: "Factuur {{invoice_number}} – {{project_type}} | €{{invoice_total}}",
        body: `Beste {{client_name}},

Hierbij ontvangt u de factuur voor uw opdracht.

## 📄 Factuurgegevens

| | |
|---|---|
| Factuurnummer | {{invoice_number}} |
| Totaal te betalen | **€{{invoice_total}}** |
| Betalingstermijn | {{payment_due_date}} (14 dagen) |

## 🏦 Betalingsinstructies

| | |
|---|---|
| IBAN | NL91 ABNA 0417 1643 00 |
| T.n.v. | Bureau Broersma B.V. |
| Omschrijving | {{invoice_number}} |

Met vriendelijke groet,

Administratie Bureau Broersma`,
        variables: ["client_name", "project_type", "invoice_number", "invoice_total", "payment_due_date"]
      },
      {
        name: "oplevering",
        subject: "🎉 Uw constructieberekening is gereed! | {{project_type}} {{address}}",
        body: `Beste {{client_name}},

Fantastisch nieuws! De constructieberekening voor uw **{{project_type}}** is gereed.

## 📦 Uw documenten

De volgende documenten zijn bijgevoegd:
- 📄 Constructieberekening (PDF)
- 📄 Constructietekening (PDF)

## 🏛️ Vergunningaanvraag

U kunt deze documenten direct gebruiken voor uw omgevingsvergunning bij de gemeente.

## ✅ Onze garantie

- Berekening voldoet aan alle geldende normen
- Kosteloos kleine aanpassingen bij gemeentelijke opmerkingen
- 1 jaar ondersteuning bij vragen

Succes met uw bouwproject!

Met vriendelijke groet,

{{engineer_name}}
Bureau Broersma`,
        variables: ["client_name", "project_type", "address", "engineer_name", "order_number"]
      }
    ]

    const created = await prisma.emailTemplate.createMany({
      data: defaultTemplates.map(t => ({
        name: t.name,
        subject: t.subject,
        body: t.body,
        variables: t.variables,
        isActive: true
      }))
    })

    return { success: true, data: { message: 'Default templates seeded', seeded: created.count } }
  } catch (error) {
    console.error('[DB] Error seeding email templates:', error)
    return { success: false, error: 'Failed to seed email templates' }
  }
}

// ============================================================
// Email Logging
// ============================================================

export async function logEmail(data: {
  leadId?: string
  templateId?: string
  automationFlowId?: string
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
        automationFlowId: data.automationFlowId,
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

// ============================================================
// Time Entry Operations
// ============================================================

export type TimeCategory = 'calculatie' | 'overleg' | 'administratie' | 'site-bezoek' | 'overig'

export interface TimeEntryInput {
  leadId: string
  userId: string
  userName: string
  date: string // ISO date string
  startTime: string // HH:mm
  endTime: string // HH:mm
  duration: number // in minutes
  description: string
  category: TimeCategory
}

/**
 * Create a new time entry for a lead
 */
export async function createTimeEntry(data: TimeEntryInput): Promise<ActionResult> {
  const validLeadId = validateId(data.leadId)
  const validUserId = validateId(data.userId)
  const description = validateString(data.description, 1000)
  
  if (!validLeadId) return { success: false, error: 'Invalid lead ID' }
  if (!validUserId) return { success: false, error: 'Invalid user ID' }
  if (!description) return { success: false, error: 'Description is required' }
  if (data.duration <= 0) return { success: false, error: 'Duration must be positive' }

  try {
    const entry = await prisma.timeEntry.create({
      data: {
        leadId: validLeadId,
        userId: validUserId,
        userName: data.userName,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        description,
        category: data.category,
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: validLeadId,
        type: 'time_logged',
        content: `${data.userName} registreerde ${data.duration} min (${data.category})`,
        author: data.userName,
      }
    })

    return { 
      success: true, 
      data: {
        ...entry,
        date: entry.date.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      }
    }
  } catch (error) {
    console.error('[DB] Error creating time entry:', error)
    return { success: false, error: 'Failed to create time entry' }
  }
}

/**
 * Get all time entries for a lead
 */
export async function getTimeEntries(leadId: string): Promise<ActionResult> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const entries = await prisma.timeEntry.findMany({
      where: { leadId: validId },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    })

    return { 
      success: true, 
      data: entries.map(e => ({
        ...e,
        date: e.date.toISOString().split('T')[0],
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }))
    }
  } catch (error) {
    console.error('[DB] Error fetching time entries:', error)
    return { success: false, error: 'Failed to load time entries' }
  }
}

/**
 * Get all time entries for a user (across all leads)
 */
export async function getTimeEntriesByUser(userId: string, dateFrom?: string, dateTo?: string): Promise<ActionResult> {
  const validId = validateId(userId)
  if (!validId) return { success: false, error: 'Invalid user ID' }

  try {
    const where: Record<string, unknown> = { userId: validId }
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo)
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            projectType: true,
            werknummer: true,
          }
        }
      }
    })

    return { 
      success: true, 
      data: entries.map(e => ({
        ...e,
        date: e.date.toISOString().split('T')[0],
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }))
    }
  } catch (error) {
    console.error('[DB] Error fetching time entries by user:', error)
    return { success: false, error: 'Failed to load time entries' }
  }
}

/**
 * Update a time entry
 */
export async function updateTimeEntry(
  id: string,
  data: {
    date?: string
    startTime?: string
    endTime?: string
    duration?: number
    description?: string
    category?: TimeCategory
  }
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid time entry ID' }

  try {
    const updateData: Record<string, unknown> = {}
    
    if (data.date) updateData.date = new Date(data.date)
    if (data.startTime) updateData.startTime = data.startTime
    if (data.endTime) updateData.endTime = data.endTime
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.description) updateData.description = validateString(data.description, 1000)
    if (data.category) updateData.category = data.category

    const entry = await prisma.timeEntry.update({
      where: { id: validId },
      data: updateData,
    })

    return { 
      success: true, 
      data: {
        ...entry,
        date: entry.date.toISOString().split('T')[0],
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      }
    }
  } catch (error) {
    console.error('[DB] Error updating time entry:', error)
    return { success: false, error: 'Failed to update time entry' }
  }
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntry(id: string): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid time entry ID' }

  try {
    await prisma.timeEntry.delete({
      where: { id: validId }
    })
    return { success: true }
  } catch (error) {
    console.error('[DB] Error deleting time entry:', error)
    return { success: false, error: 'Failed to delete time entry' }
  }
}

/**
 * Get total hours per lead (for reporting)
 */
export async function getLeadTotalHours(leadId: string): Promise<ActionResult> {
  const validId = validateId(leadId)
  if (!validId) return { success: false, error: 'Invalid lead ID' }

  try {
    const result = await prisma.timeEntry.aggregate({
      where: { leadId: validId },
      _sum: { duration: true },
    })

    return { 
      success: true, 
      data: {
        totalMinutes: result._sum.duration || 0,
        totalHours: ((result._sum.duration || 0) / 60).toFixed(1),
      }
    }
  } catch (error) {
    console.error('[DB] Error getting lead total hours:', error)
    return { success: false, error: 'Failed to calculate total hours' }
  }
}

// ============================================================
// Engineer Performance & Leaderboard
// ============================================================

export interface EngineerStats {
  name: string
  avatar: string
  quotesGenerated: number
  quotesWon: number
  revenue: number
  hoursLogged: number
}

/**
 * Get leaderboard data for engineers based on real leads data
 */
export async function getEngineerLeaderboard(): Promise<ActionResult> {
  try {
    // Get all engineers
    const engineers = await prisma.user.findMany({
      where: { 
        role: 'engineer',
        deletedAt: null
      }
    })

    // Get leads with quotes won (status = Opdracht) per assignee
    const leadsGrouped = await prisma.lead.groupBy({
      by: ['assignee'],
      where: {
        deletedAt: null,
        assignee: { not: null }
      },
      _count: { id: true },
      _sum: { quoteValue: true }
    })

    // Get won leads (Opdracht status) per assignee
    const wonLeadsGrouped = await prisma.lead.groupBy({
      by: ['assignee'],
      where: {
        deletedAt: null,
        assignee: { not: null },
        status: 'Opdracht'
      },
      _count: { id: true },
      _sum: { quoteValue: true }
    })

    // Get total hours per user
    const hoursGrouped = await prisma.timeEntry.groupBy({
      by: ['userName'],
      _sum: { duration: true }
    })

    // Build stats for each engineer
    const stats: EngineerStats[] = engineers.map(eng => {
      const leadData = leadsGrouped.find(l => l.assignee === eng.name)
      const wonData = wonLeadsGrouped.find(l => l.assignee === eng.name)
      const hoursData = hoursGrouped.find(h => h.userName === eng.name)

      return {
        name: eng.name,
        avatar: eng.avatar || eng.name[0],
        quotesGenerated: leadData?._count.id || 0,
        quotesWon: wonData?._count.id || 0,
        revenue: wonData?._sum.quoteValue || 0,
        hoursLogged: Math.round((hoursData?._sum.duration || 0) / 60) // Convert minutes to hours
      }
    })

    // Sort by revenue descending
    stats.sort((a, b) => b.revenue - a.revenue)

    return { success: true, data: stats }
  } catch (error) {
    console.error('[DB] Error fetching engineer leaderboard:', error)
    return { success: false, error: 'Failed to load leaderboard' }
  }
}

/**
 * Get performance stats for a specific engineer
 */
export async function getEngineerStats(engineerName: string): Promise<ActionResult> {
  const name = validateString(engineerName, 100)
  if (!name) return { success: false, error: 'Invalid engineer name' }

  try {
    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get all leads for this engineer
    const leads = await prisma.lead.findMany({
      where: {
        assignee: name,
        deletedAt: null,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Count by status
    const quotesGenerated = leads.length
    const quotesWon = leads.filter(l => l.status === 'Opdracht').length
    const revenue = leads
      .filter(l => l.status === 'Opdracht')
      .reduce((sum, l) => sum + (l.quoteValue || 0), 0)

    // Get average response time from activities (time between lead creation and first quote)
    const avgResponseHours = 2.0 // Placeholder - would need activity tracking for real value

    // Get time entries for this month
    const timeEntries = await prisma.timeEntry.aggregate({
      where: {
        userName: name,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: { duration: true }
    })

    return {
      success: true,
      data: {
        name,
        quotesGenerated,
        quotesWon,
        revenue,
        avgResponseTimeHours: avgResponseHours,
        hoursLogged: Math.round((timeEntries._sum.duration || 0) / 60),
        conversionRate: quotesGenerated > 0 ? Math.round((quotesWon / quotesGenerated) * 100) : 0
      }
    }
  } catch (error) {
    console.error('[DB] Error fetching engineer stats:', error)
    return { success: false, error: 'Failed to load engineer stats' }
  }
}

// ============================================================
// Notification Operations
// ============================================================

export type NotificationType = 'mention' | 'status_change' | 'quote_feedback' | 'document' | 'assignment'

/**
 * Create a notification for a user
 */
export async function createNotification(data: {
  userId: string
  userName: string
  type: NotificationType
  title: string
  message: string
  leadId?: string
  leadName?: string
  fromUserId?: string
  fromUserName?: string
}): Promise<ActionResult> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        type: data.type,
        title: data.title,
        message: data.message,
        leadId: data.leadId,
        leadName: data.leadName,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
      }
    })

    return { success: true, data: notification }
  } catch (error) {
    console.error('[DB] Error creating notification:', error)
    return { success: false, error: 'Failed to create notification' }
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userName: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<ActionResult> {
  const name = validateString(userName, 100)
  if (!name) return { success: false, error: 'Invalid user name' }

  try {
    console.log('[Notifications] Fetching notifications for user:', name)
    const notifications = await prisma.notification.findMany({
      where: {
        userName: name,
        ...(options?.unreadOnly ? { read: false } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50
    })
    console.log('[Notifications] Found', notifications.length, 'notifications for', name)

    return { success: true, data: notifications }
  } catch (error) {
    console.error('[DB] Error fetching notifications:', error)
    return { success: false, error: 'Failed to load notifications' }
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userName: string): Promise<ActionResult<number>> {
  const name = validateString(userName, 100)
  if (!name) return { success: false, error: 'Invalid user name' }

  try {
    const count = await prisma.notification.count({
      where: {
        userName: name,
        read: false
      }
    })

    return { success: true, data: count }
  } catch (error) {
    console.error('[DB] Error fetching notification count:', error)
    return { success: false, error: 'Failed to load notification count' }
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const id = validateString(notificationId, 50)
  if (!id) return { success: false, error: 'Invalid notification ID' }

  try {
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    })

    return { success: true }
  } catch (error) {
    console.error('[DB] Error marking notification read:', error)
    return { success: false, error: 'Failed to update notification' }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userName: string): Promise<ActionResult> {
  const name = validateString(userName, 100)
  if (!name) return { success: false, error: 'Invalid user name' }

  try {
    await prisma.notification.updateMany({
      where: { userName: name, read: false },
      data: { read: true }
    })

    return { success: true }
  } catch (error) {
    console.error('[DB] Error marking all notifications read:', error)
    return { success: false, error: 'Failed to update notifications' }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<ActionResult> {
  const id = validateString(notificationId, 50)
  if (!id) return { success: false, error: 'Invalid notification ID' }

  try {
    await prisma.notification.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error('[DB] Error deleting notification:', error)
    return { success: false, error: 'Failed to delete notification' }
  }
}

/**
 * Create notifications for @mentions in a note
 * Parses the note content and creates notifications for each mentioned user
 */
export async function createMentionNotifications(
  noteContent: string,
  leadId: string,
  leadName: string,
  fromUserName: string,
  allUsers: Array<{ id: string; name: string }>
): Promise<ActionResult> {
  try {
    // Extract mentions from note (format: @Name, @First Last, or @First van der Last)
    // Supports Unicode letters and up to 4 words to handle Dutch names like "Jan de Vries"
    const mentionRegex = /@([\p{L}\p{N}]+(?:\s[\p{L}\p{N}]+){0,3})/gu
    const mentions: string[] = []
    let match
    
    while ((match = mentionRegex.exec(noteContent)) !== null) {
      mentions.push(match[1].trim())
    }

    console.log('[Notifications] Extracted mentions:', mentions, 'from:', noteContent.substring(0, 100))

    if (mentions.length === 0) {
      return { success: true, data: { notificationsCreated: 0 } }
    }

    // Find users that match the mentions
    const notificationsToCreate = []
    for (const mentionName of mentions) {
      // Try exact match first, then starts-with, then contains
      const user = allUsers.find(u => 
        u.name.toLowerCase() === mentionName.toLowerCase()
      ) || allUsers.find(u =>
        u.name.toLowerCase().startsWith(mentionName.toLowerCase())
      ) || allUsers.find(u =>
        mentionName.toLowerCase().startsWith(u.name.toLowerCase().split(' ')[0])
      )
      
      console.log('[Notifications] Matching mention:', mentionName, '-> found user:', user?.name || 'none')
      
      if (user && user.name !== fromUserName) {
        notificationsToCreate.push({
          userId: user.id,
          userName: user.name,
          type: 'mention' as const,
          title: 'Je bent genoemd',
          message: noteContent.length > 100 ? noteContent.substring(0, 100) + '...' : noteContent,
          leadId,
          leadName,
          fromUserName,
        })
      }
    }

    // Create all notifications
    if (notificationsToCreate.length > 0) {
      console.log('[Notifications] Creating notifications for users:', notificationsToCreate.map(n => n.userName))
      await prisma.notification.createMany({
        data: notificationsToCreate
      })
      console.log('[Notifications] Successfully created', notificationsToCreate.length, 'notifications')
    } else {
      console.log('[Notifications] No notifications to create. Users list:', allUsers.map(u => u.name))
    }

    return { success: true, data: { notificationsCreated: notificationsToCreate.length } }
  } catch (error) {
    console.error('[DB] Error creating mention notifications:', error)
    return { success: false, error: 'Failed to create mention notifications' }
  }
}
