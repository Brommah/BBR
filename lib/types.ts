/**
 * Unified Type Definitions
 * Single source of truth for all application types
 */

import { LEAD_STATUSES, QUOTE_APPROVAL_STATUSES } from './config'

// ============================================================
// Database Types (mirrors Prisma schema)
// ============================================================

export type LeadStatus = keyof typeof LEAD_STATUSES
export type QuoteApprovalStatus = keyof typeof QUOTE_APPROVAL_STATUSES
export type Priority = 'normal' | 'high' | 'urgent'

export interface Lead {
  id: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  projectType: string
  city: string
  address: string | null
  status: LeadStatus
  value: number
  createdAt: string
  updatedAt: string
  assignee: string | null
  addressValid: boolean
  deletedAt: string | null // Soft delete
  priority: Priority // Admin-set urgency level
  deadline: string | null // Optional deadline
  
  // Quote data
  quoteApproval: QuoteApprovalStatus
  quoteValue: number | null
  quoteDescription: string | null
  quoteLineItems: QuoteLineItem[] | null
  quoteEstimatedHours: number | null
  quoteFeedback: QuoteFeedback[] | null
  
  // Relations (when included)
  specifications?: ProjectSpec[]
  notes?: Note[]
  activities?: Activity[]
  documents?: Document[]
  communications?: Communication[]
}

export interface ProjectSpec {
  id: string
  leadId: string
  key: string
  value: string
  unit: string | null
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  leadId: string
  content: string
  author: string
  createdAt: string
}

export interface Activity {
  id: string
  leadId: string
  type: ActivityType
  content: string
  author: string | null
  metadata: Record<string, unknown> | null // For storing before/after states
  createdAt: string
}

export type ActivityType = 
  | 'lead_created'
  | 'status_change'
  | 'assignment'
  | 'note_added'
  | 'document_uploaded'
  | 'quote_submitted'
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_sent'
  | 'email_sent'
  | 'call_logged'
  | 'specs_updated'

export interface Document {
  id: string
  leadId: string
  name: string
  type: string
  category: DocumentCategory
  size: number
  url: string
  status: DocumentStatus
  uploadedBy: string
  createdAt: string
}

export type DocumentCategory = 
  | 'tekening'
  | 'offerte'
  | 'foto'
  | 'vergunning'
  | 'correspondentie'
  | 'overig'

export type DocumentStatus = 'pending' | 'approved' | 'final'

export interface Communication {
  id: string
  leadId: string
  type: CommunicationType
  direction: 'inbound' | 'outbound'
  subject: string | null
  content: string
  duration: number | null // For calls, in seconds
  author: string
  createdAt: string
}

export type CommunicationType = 'email' | 'call' | 'whatsapp'

// ============================================================
// Quote Types
// ============================================================

export interface QuoteLineItem {
  description: string
  amount: number
}

export interface QuoteFeedback {
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

export interface QuoteVersion {
  id: string
  leadId: string
  version: number
  value: number
  lineItems: QuoteLineItem[]
  description: string | null
  status: QuoteVersionStatus
  createdBy: string
  createdAt: string
}

export type QuoteVersionStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'sent'

// ============================================================
// User Types
// ============================================================

export type UserRole = 'admin' | 'engineer' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string | null
  createdAt: string
}

export type Permission = 
  | 'quotes:approve'
  | 'quotes:reject'
  | 'quotes:submit'
  | 'quotes:view'
  | 'quotes:feedback'
  | 'leads:create'
  | 'leads:assign'
  | 'leads:view-all'
  | 'leads:view-own'
  | 'leads:edit'
  | 'leads:delete'
  | 'admin:access'
  | 'admin:manage-users'
  | 'admin:manage-pricing'
  | 'settings:view'
  | 'settings:edit'

// ============================================================
// Email Types
// ============================================================

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmailLog {
  id: string
  leadId: string | null
  templateId: string | null
  to: string
  subject: string
  body: string
  status: EmailStatus
  messageId: string | null
  error: string | null
  sentBy: string
  createdAt: string
}

export type EmailStatus = 'sent' | 'delivered' | 'failed' | 'bounced'

// ============================================================
// API Types
// ============================================================

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LeadFilters {
  status?: LeadStatus[]
  assignee?: string
  projectType?: string
  city?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

// ============================================================
// UI Types
// ============================================================

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
}

export interface ModalState {
  isOpen: boolean
  data?: unknown
}

export interface TabConfig {
  id: string
  label: string
  icon?: string
  badge?: number | string
}

// ============================================================
// Audit Types
// ============================================================

export interface AuditEntry {
  id: string
  entityType: 'lead' | 'user' | 'quote' | 'document'
  entityId: string
  action: 'create' | 'update' | 'delete' | 'restore'
  changes: {
    field: string
    oldValue: unknown
    newValue: unknown
  }[]
  userId: string
  userName: string
  timestamp: string
  ipAddress?: string
}

// ============================================================
// Time Entry Types
// ============================================================

export type TimeCategory = 'calculatie' | 'overleg' | 'administratie' | 'site-bezoek' | 'overig'

export interface TimeEntry {
  id: string
  leadId: string
  userId: string
  userName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  description: string
  category: TimeCategory
  createdAt: string
  updatedAt: string
}
