"use server"

/**
 * @fileoverview Server Actions for Email Automation
 * 
 * Provides data fetching and configuration for email automation flows.
 * Tracks sent counts, open rates, click rates from the EmailLog and EmailEvent tables.
 */

import prisma from './db'

// ============================================================
// Type Definitions
// ============================================================

export interface EmailAutomationStats {
  flowId: string
  sent: number
  opened: number
  clicked: number
  delivered: number
  bounced: number
}

export interface EmailAutomationConfig {
  flowId: string
  name: string
  status: 'active' | 'paused' | 'draft'
  category: string
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Flow ID mapping to subject patterns for categorization
const FLOW_SUBJECT_PATTERNS: Record<string, RegExp[]> = {
  '01': [/ontvangstbevestiging|aanvraag.*ontvangen/i],
  '02': [/engineer.*toegewezen|engineer.*assigned/i],
  '03': [/offerte.*constructi|quote.*calculation/i],
  '04': [/herinnering.*offerte.*ontvangen|reminder.*quote/i],
  '05': [/offerte.*verloopt|laatste.*herinnering/i],
  '06': [/opdracht.*bevestigd|order.*confirm/i],
  '07': [/factuur/i],
  '08': [/herinnering.*factuur|payment.*reminder/i],
  '09': [/berekening.*gereed|calculation.*ready|delivery/i],
  '10': [/ervaring|feedback|review/i],
  '11': [/waardeert|nps|aanbevelen/i],
  '12': [/referral|aanbeveling/i],
  '13': [/bouwplannen.*actueel|reactivat/i],
  '14': [/bouwseizoen|seizoen|voorjaar|winter|zomer|najaar/i],
  '15': [/nieuwe.*lead|offerte.*goedkeuring|intern/i],
}

/**
 * Determine which automation flow an email belongs to based on subject
 */
function determineFlowFromSubject(subject: string): string | null {
  for (const [flowId, patterns] of Object.entries(FLOW_SUBJECT_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(subject))) {
      return flowId
    }
  }
  return null
}

// ============================================================
// Stats Retrieval
// ============================================================

/**
 * Get email automation statistics for all flows
 */
export async function getEmailAutomationStats(): Promise<ActionResult<EmailAutomationStats[]>> {
  try {
    // Get all email logs
    const emailLogs = await prisma.emailLog.findMany({
      select: {
        id: true,
        automationFlowId: true,
        subject: true,
        status: true,
        openedAt: true,
        clickedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get email events for additional tracking
    const emailEvents = await prisma.emailEvent.findMany({
      select: {
        automationFlowId: true,
        eventType: true,
      },
    })

    // Initialize stats for all 15 flows
    const statsMap: Map<string, EmailAutomationStats> = new Map()
    for (let i = 1; i <= 15; i++) {
      const flowId = i.toString().padStart(2, '0')
      statsMap.set(flowId, {
        flowId,
        sent: 0,
        opened: 0,
        clicked: 0,
        delivered: 0,
        bounced: 0,
      })
    }

    // Process email logs
    for (const log of emailLogs) {
      // Determine flow ID - either from explicit field or from subject pattern matching
      let flowId = log.automationFlowId
      if (!flowId) {
        flowId = determineFlowFromSubject(log.subject)
      }
      
      if (!flowId) continue
      
      const stats = statsMap.get(flowId)
      if (!stats) continue

      // Count based on status
      if (log.status === 'sent' || log.status === 'delivered') {
        stats.sent++
      }
      if (log.status === 'delivered') {
        stats.delivered++
      }
      if (log.status === 'bounced') {
        stats.bounced++
      }
      
      // Track opens and clicks from the log
      if (log.openedAt) {
        stats.opened++
      }
      if (log.clickedAt) {
        stats.clicked++
      }
    }

    // Process email events for additional open/click data
    for (const event of emailEvents) {
      if (!event.automationFlowId) continue
      
      const stats = statsMap.get(event.automationFlowId)
      if (!stats) continue

      switch (event.eventType) {
        case 'opened':
          stats.opened++
          break
        case 'clicked':
          stats.clicked++
          break
        case 'bounced':
          stats.bounced++
          break
      }
    }

    return {
      success: true,
      data: Array.from(statsMap.values()),
    }
  } catch (error) {
    console.error('[EmailAutomation] Error fetching stats:', error)
    return { success: false, error: 'Failed to load email automation stats' }
  }
}

/**
 * Get total stats across all automations
 */
export async function getEmailAutomationTotals(): Promise<ActionResult<{
  totalSent: number
  totalOpened: number
  totalClicked: number
  avgOpenRate: number
  avgClickRate: number
  activeFlows: number
  totalFlows: number
}>> {
  try {
    // Count emails
    const emailCounts = await prisma.emailLog.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const sentCount = emailCounts
      .filter(c => c.status === 'sent' || c.status === 'delivered')
      .reduce((sum, c) => sum + c._count.id, 0)

    // Count opens and clicks
    const openedCount = await prisma.emailLog.count({
      where: { openedAt: { not: null } },
    })
    
    const clickedCount = await prisma.emailLog.count({
      where: { clickedAt: { not: null } },
    })

    // Count from events table as well
    const eventCounts = await prisma.emailEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
    })

    const eventOpened = eventCounts.find(c => c.eventType === 'opened')?._count.id || 0
    const eventClicked = eventCounts.find(c => c.eventType === 'clicked')?._count.id || 0

    const totalOpened = openedCount + eventOpened
    const totalClicked = clickedCount + eventClicked

    // Get automation configs to count active flows
    const configs = await prisma.emailAutomationConfig.findMany({
      select: { status: true },
    })

    const activeFlows = configs.filter(c => c.status === 'active').length
    const totalFlows = 15 // We have 15 automation flows

    return {
      success: true,
      data: {
        totalSent: sentCount,
        totalOpened,
        totalClicked,
        avgOpenRate: sentCount > 0 ? Math.round((totalOpened / sentCount) * 100) : 0,
        avgClickRate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0,
        activeFlows: activeFlows || 13, // Default to 13 if no config exists
        totalFlows,
      },
    }
  } catch (error) {
    console.error('[EmailAutomation] Error fetching totals:', error)
    return { success: false, error: 'Failed to load email automation totals' }
  }
}

// ============================================================
// Configuration Management
// ============================================================

/**
 * Get all automation configs
 */
export async function getEmailAutomationConfigs(): Promise<ActionResult<EmailAutomationConfig[]>> {
  try {
    const configs = await prisma.emailAutomationConfig.findMany({
      orderBy: { flowId: 'asc' },
    })

    // Map to the expected format
    const result: EmailAutomationConfig[] = configs.map(c => ({
      flowId: c.flowId,
      name: c.name,
      status: c.status as 'active' | 'paused' | 'draft',
      category: c.category,
    }))

    return { success: true, data: result }
  } catch (error) {
    console.error('[EmailAutomation] Error fetching configs:', error)
    return { success: false, error: 'Failed to load automation configs' }
  }
}

/**
 * Update automation status (toggle active/paused)
 */
export async function updateAutomationStatus(
  flowId: string,
  status: 'active' | 'paused' | 'draft'
): Promise<ActionResult<EmailAutomationConfig>> {
  try {
    // Upsert the config
    const config = await prisma.emailAutomationConfig.upsert({
      where: { flowId },
      update: { status },
      create: {
        flowId,
        name: getDefaultFlowName(flowId),
        status,
        category: getDefaultFlowCategory(flowId),
      },
    })

    return {
      success: true,
      data: {
        flowId: config.flowId,
        name: config.name,
        status: config.status as 'active' | 'paused' | 'draft',
        category: config.category,
      },
    }
  } catch (error) {
    console.error('[EmailAutomation] Error updating status:', error)
    return { success: false, error: 'Failed to update automation status' }
  }
}

/**
 * Initialize default automation configs if they don't exist
 */
export async function initializeAutomationConfigs(): Promise<ActionResult> {
  try {
    const defaultConfigs = [
      { flowId: '01', name: 'Intake Bevestiging', status: 'active', category: 'klant' },
      { flowId: '02', name: 'Engineer Toegewezen', status: 'active', category: 'klant' },
      { flowId: '03', name: 'Offerte Verzonden', status: 'active', category: 'conversie' },
      { flowId: '04', name: 'Offerte Herinnering #1', status: 'active', category: 'conversie' },
      { flowId: '05', name: 'Offerte Herinnering #2', status: 'active', category: 'conversie' },
      { flowId: '06', name: 'Opdracht Bevestiging', status: 'active', category: 'klant' },
      { flowId: '07', name: 'Factuur Verzending', status: 'active', category: 'klant' },
      { flowId: '08', name: 'Betaling Herinnering', status: 'active', category: 'klant' },
      { flowId: '09', name: 'Oplevering Berekening', status: 'active', category: 'klant' },
      { flowId: '10', name: 'Feedback Verzoek', status: 'active', category: 'feedback' },
      { flowId: '11', name: 'NPS Survey', status: 'active', category: 'feedback' },
      { flowId: '12', name: 'Referral Uitnodiging', status: 'active', category: 'feedback' },
      { flowId: '13', name: 'Reactivatie Leads', status: 'draft', category: 'campagne' },
      { flowId: '14', name: 'Seizoens Campagne', status: 'draft', category: 'campagne' },
      { flowId: '15', name: 'Interne Notificaties', status: 'active', category: 'intern' },
    ]

    for (const config of defaultConfigs) {
      await prisma.emailAutomationConfig.upsert({
        where: { flowId: config.flowId },
        update: {},
        create: config,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[EmailAutomation] Error initializing configs:', error)
    return { success: false, error: 'Failed to initialize automation configs' }
  }
}

// ============================================================
// Webhook Event Handling
// ============================================================

/**
 * Record an email event from Resend webhook
 */
export async function recordEmailEvent(data: {
  messageId: string
  eventType: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'
  metadata?: Record<string, unknown>
}): Promise<ActionResult> {
  try {
    // Try to find the email log with this messageId
    const emailLog = await prisma.emailLog.findFirst({
      where: { messageId: data.messageId },
      select: { id: true, automationFlowId: true, subject: true },
    })

    // Determine automation flow ID
    let automationFlowId = emailLog?.automationFlowId
    if (!automationFlowId && emailLog?.subject) {
      automationFlowId = determineFlowFromSubject(emailLog.subject)
    }

    // Create the event record
    await prisma.emailEvent.create({
      data: {
        emailLogId: emailLog?.id,
        messageId: data.messageId,
        eventType: data.eventType,
        automationFlowId,
        metadata: data.metadata as Parameters<typeof prisma.emailEvent.create>[0]['data']['metadata'],
      },
    })

    // Update the email log if found
    if (emailLog) {
      const updateData: Record<string, Date> = {}
      if (data.eventType === 'opened') {
        updateData.openedAt = new Date()
      } else if (data.eventType === 'clicked') {
        updateData.clickedAt = new Date()
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: updateData,
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[EmailAutomation] Error recording event:', error)
    return { success: false, error: 'Failed to record email event' }
  }
}

// ============================================================
// Helper Functions
// ============================================================

function getDefaultFlowName(flowId: string): string {
  const names: Record<string, string> = {
    '01': 'Intake Bevestiging',
    '02': 'Engineer Toegewezen',
    '03': 'Offerte Verzonden',
    '04': 'Offerte Herinnering #1',
    '05': 'Offerte Herinnering #2',
    '06': 'Opdracht Bevestiging',
    '07': 'Factuur Verzending',
    '08': 'Betaling Herinnering',
    '09': 'Oplevering Berekening',
    '10': 'Feedback Verzoek',
    '11': 'NPS Survey',
    '12': 'Referral Uitnodiging',
    '13': 'Reactivatie Leads',
    '14': 'Seizoens Campagne',
    '15': 'Interne Notificaties',
  }
  return names[flowId] || `Flow ${flowId}`
}

function getDefaultFlowCategory(flowId: string): string {
  const categories: Record<string, string> = {
    '01': 'klant', '02': 'klant', '03': 'conversie', '04': 'conversie',
    '05': 'conversie', '06': 'klant', '07': 'klant', '08': 'klant',
    '09': 'klant', '10': 'feedback', '11': 'feedback', '12': 'feedback',
    '13': 'campagne', '14': 'campagne', '15': 'intern',
  }
  return categories[flowId] || 'klant'
}
