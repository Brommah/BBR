/**
 * Application configuration
 * Centralized config with environment variable support
 */

// Company Information
export const COMPANY = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Broersma Bouwadvies',
  legalName: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME || 'Broersma Bouwadvies B.V.',
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'info@broersma-bouwadvies.nl',
  website: process.env.NEXT_PUBLIC_COMPANY_WEBSITE || 'https://broersma-bouwadvies.nl',
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '',
  kvk: process.env.NEXT_PUBLIC_COMPANY_KVK || '',
  btw: process.env.NEXT_PUBLIC_COMPANY_BTW || '',
  tagline: 'Constructieve berekeningen voor aanbouw, uitbouw, dakkapel, kozijn & VvE',
} as const

// Project Types
export const PROJECT_TYPES = [
  'Dakkapel',
  'Uitbouw',
  'Aanbouw',
  'Draagmuur verwijderen',
  'Kozijn vergroten',
  'Fundering herstel',
  'VvE constructie',
  'Overig',
] as const

export type ProjectType = typeof PROJECT_TYPES[number]

// Lead Statuses (single source of truth)
export const LEAD_STATUSES = {
  Nieuw: { label: 'Nieuw', color: 'blue', dbValue: 'Nieuw' },
  Calculatie: { label: 'Calculatie', color: 'amber', dbValue: 'Calculatie' },
  OfferteVerzonden: { label: 'Offerte Verzonden', color: 'purple', dbValue: 'OfferteVerzonden' },
  Opdracht: { label: 'Opdracht', color: 'emerald', dbValue: 'Opdracht' },
  Archief: { label: 'Archief', color: 'slate', dbValue: 'Archief' },
} as const

export type LeadStatusKey = keyof typeof LEAD_STATUSES
export type LeadStatusLabel = typeof LEAD_STATUSES[LeadStatusKey]['label']

// Quote Approval Statuses
export const QUOTE_APPROVAL_STATUSES = {
  none: { label: 'Geen', color: 'slate' },
  pending: { label: 'In afwachting', color: 'amber' },
  approved: { label: 'Goedgekeurd', color: 'emerald' },
  rejected: { label: 'Afgekeurd', color: 'red' },
} as const

export type QuoteApprovalStatus = keyof typeof QUOTE_APPROVAL_STATUSES

// Document Categories
export const DOCUMENT_CATEGORIES = [
  { value: 'tekening', label: 'Tekening' },
  { value: 'offerte', label: 'Offerte' },
  { value: 'foto', label: 'Foto' },
  { value: 'vergunning', label: 'Vergunning' },
  { value: 'correspondentie', label: 'Correspondentie' },
  { value: 'overig', label: 'Overig' },
] as const

// Communication Types
export const COMMUNICATION_TYPES = [
  { value: 'email', label: 'E-mail', icon: 'Mail' },
  { value: 'call', label: 'Telefoongesprek', icon: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageSquare' },
] as const

// Pagination Defaults
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100],
} as const

// Rate Limiting
export const RATE_LIMITS = {
  intake: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
} as const

// Email Settings
export const EMAIL = {
  from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
  replyTo: process.env.REPLY_TO_EMAIL || 'info@broersma-bouwadvies.nl',
  quoteValidityDays: 30,
  reminderDays: [7, 14], // Days after quote sent to send reminder
} as const

// Feature Flags
export const FEATURES = {
  enableNotionSync: process.env.NEXT_PUBLIC_ENABLE_NOTION_SYNC === 'true',
  enableWhatsApp: process.env.NEXT_PUBLIC_ENABLE_WHATSAPP === 'true',
  enableFileUpload: true,
  enableQuoteVersioning: true,
  enableActivityFeed: true,
  enableKeyboardShortcuts: true,
} as const

// API Endpoints (for external services)
export const API_ENDPOINTS = {
  resend: 'https://api.resend.com',
  notion: 'https://api.notion.com/v1',
} as const

// Status conversion helpers
export function dbStatusToLabel(dbStatus: string): string {
  const status = LEAD_STATUSES[dbStatus as LeadStatusKey]
  return status?.label || dbStatus
}

export function labelToDbStatus(label: string): string {
  const entry = Object.entries(LEAD_STATUSES).find(
    ([, value]) => value.label === label
  )
  return entry ? entry[0] : label
}

// Validation helpers
export function isValidProjectType(type: string): type is ProjectType {
  return PROJECT_TYPES.includes(type as ProjectType)
}

export function isValidLeadStatus(status: string): status is LeadStatusKey {
  return status in LEAD_STATUSES
}
