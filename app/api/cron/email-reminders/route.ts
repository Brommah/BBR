import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { 
  sendScheduledQuoteReminder,
  sendScheduledFeedbackRequest,
  sendNpsSurvey,
  sendReferralInvitation,
  sendReactivationEmail
} from '@/lib/email-triggers'

/**
 * Cron Job: Email Reminders
 * 
 * This endpoint should be called by a cron scheduler (e.g., Vercel Cron, GitHub Actions)
 * to send scheduled reminder emails.
 * 
 * Schedule: Daily at 9:00 AM CET
 * 
 * Emails sent:
 * - Quote Reminder #1: 4 days after quote sent
 * - Quote Reminder #2: 10 days after quote sent
 * - Feedback Request: 3 days after project completed (Archief)
 * - NPS Survey: 14 days after project completed
 * - Reactivation: 90 days of inactivity in certain statuses
 * 
 * @security Protected by CRON_SECRET environment variable
 */

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn('[CRON] CRON_SECRET not configured, allowing access')
    return true // Allow in development
  }
  
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    quoteReminder1: { checked: 0, sent: 0, failed: 0 },
    quoteReminder2: { checked: 0, sent: 0, failed: 0 },
    feedbackRequest: { checked: 0, sent: 0, failed: 0 },
    npsSurvey: { checked: 0, sent: 0, failed: 0 },
    reactivation: { checked: 0, sent: 0, failed: 0 },
    errors: [] as string[]
  }

  try {
    const now = new Date()
    
    // ============================================================
    // 1. Quote Reminder #1 (4 days after quote sent)
    // ============================================================
    const reminder1Cutoff = new Date(now)
    reminder1Cutoff.setDate(reminder1Cutoff.getDate() - 4)
    
    const reminder1Leads = await prisma.lead.findMany({
      where: {
        status: 'OfferteVerzonden',
        deletedAt: null,
        clientEmail: { not: null },
        quoteSentAt: { 
          lte: reminder1Cutoff,
          not: null 
        },
        quoteReminder1SentAt: null, // Not already reminded
        quoteValue: { not: null }
      },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        projectType: true,
        quoteValue: true,
        quoteSentAt: true
      }
    })
    
    results.quoteReminder1.checked = reminder1Leads.length
    
    for (const lead of reminder1Leads) {
      if (!lead.clientEmail || !lead.quoteSentAt) continue
      
      const daysSinceQuote = Math.floor(
        (now.getTime() - lead.quoteSentAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      try {
        const emailResult = await sendScheduledQuoteReminder({
          to: lead.clientEmail,
          clientName: lead.clientName,
          projectType: lead.projectType,
          quoteValue: lead.quoteValue || 0,
          daysSinceQuote,
          leadId: lead.id,
          isSecondReminder: false
        })
        
        if (emailResult.success) {
          // Mark reminder as sent
          await prisma.lead.update({
            where: { id: lead.id },
            data: { quoteReminder1SentAt: now }
          })
          results.quoteReminder1.sent++
        } else {
          results.quoteReminder1.failed++
          results.errors.push(`Reminder1 failed for ${lead.id}: ${emailResult.error}`)
        }
      } catch (err) {
        results.quoteReminder1.failed++
        results.errors.push(`Reminder1 error for ${lead.id}: ${err}`)
      }
    }
    
    // ============================================================
    // 2. Quote Reminder #2 (10 days after quote sent)
    // ============================================================
    const reminder2Cutoff = new Date(now)
    reminder2Cutoff.setDate(reminder2Cutoff.getDate() - 10)
    
    const reminder2Leads = await prisma.lead.findMany({
      where: {
        status: 'OfferteVerzonden',
        deletedAt: null,
        clientEmail: { not: null },
        quoteSentAt: { 
          lte: reminder2Cutoff,
          not: null 
        },
        quoteReminder1SentAt: { not: null }, // First reminder already sent
        quoteReminder2SentAt: null, // Second not yet sent
        quoteValue: { not: null }
      },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        projectType: true,
        quoteValue: true,
        quoteSentAt: true
      }
    })
    
    results.quoteReminder2.checked = reminder2Leads.length
    
    for (const lead of reminder2Leads) {
      if (!lead.clientEmail || !lead.quoteSentAt) continue
      
      const daysSinceQuote = Math.floor(
        (now.getTime() - lead.quoteSentAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      try {
        const emailResult = await sendScheduledQuoteReminder({
          to: lead.clientEmail,
          clientName: lead.clientName,
          projectType: lead.projectType,
          quoteValue: lead.quoteValue || 0,
          daysSinceQuote,
          leadId: lead.id,
          isSecondReminder: true
        })
        
        if (emailResult.success) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { quoteReminder2SentAt: now }
          })
          results.quoteReminder2.sent++
        } else {
          results.quoteReminder2.failed++
        }
      } catch (err) {
        results.quoteReminder2.failed++
        results.errors.push(`Reminder2 error for ${lead.id}: ${err}`)
      }
    }
    
    // ============================================================
    // 3. Feedback Request (3 days after Archief)
    // ============================================================
    const feedbackCutoff = new Date(now)
    feedbackCutoff.setDate(feedbackCutoff.getDate() - 3)
    
    const feedbackLeads = await prisma.lead.findMany({
      where: {
        status: 'Archief',
        deletedAt: null,
        clientEmail: { not: null },
        deliveryNotifSentAt: {
          lte: feedbackCutoff,
          not: null
        },
        feedbackRequestSentAt: null
      },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        projectType: true
      }
    })
    
    results.feedbackRequest.checked = feedbackLeads.length
    
    for (const lead of feedbackLeads) {
      if (!lead.clientEmail) continue
      
      try {
        const emailResult = await sendScheduledFeedbackRequest({
          to: lead.clientEmail,
          clientName: lead.clientName,
          projectType: lead.projectType,
          leadId: lead.id
        })
        
        if (emailResult.success) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { feedbackRequestSentAt: now }
          })
          results.feedbackRequest.sent++
        } else {
          results.feedbackRequest.failed++
        }
      } catch (err) {
        results.feedbackRequest.failed++
        results.errors.push(`Feedback error for ${lead.id}: ${err}`)
      }
    }
    
    // ============================================================
    // 4. NPS Survey (14 days after Archief)
    // ============================================================
    const npsCutoff = new Date(now)
    npsCutoff.setDate(npsCutoff.getDate() - 14)
    
    const npsLeads = await prisma.lead.findMany({
      where: {
        status: 'Archief',
        deletedAt: null,
        clientEmail: { not: null },
        deliveryNotifSentAt: {
          lte: npsCutoff,
          not: null
        },
        feedbackRequestSentAt: { not: null }, // Feedback already requested
        npsSurveySentAt: null
      },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        projectType: true
      }
    })
    
    results.npsSurvey.checked = npsLeads.length
    
    for (const lead of npsLeads) {
      if (!lead.clientEmail) continue
      
      try {
        const emailResult = await sendNpsSurvey({
          to: lead.clientEmail,
          clientName: lead.clientName,
          projectType: lead.projectType,
          leadId: lead.id
        })
        
        if (emailResult.success) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { npsSurveySentAt: now }
          })
          results.npsSurvey.sent++
        } else {
          results.npsSurvey.failed++
        }
      } catch (err) {
        results.npsSurvey.failed++
        results.errors.push(`NPS error for ${lead.id}: ${err}`)
      }
    }
    
    // ============================================================
    // 5. Reactivation (90 days inactive in Nieuw/Calculatie)
    // ============================================================
    const reactivationCutoff = new Date(now)
    reactivationCutoff.setDate(reactivationCutoff.getDate() - 90)
    
    const reactivationLeads = await prisma.lead.findMany({
      where: {
        status: { in: ['Nieuw', 'Calculatie'] },
        deletedAt: null,
        clientEmail: { not: null },
        updatedAt: { lte: reactivationCutoff },
        reactivationSentAt: null
      },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        projectType: true,
        updatedAt: true
      }
    })
    
    results.reactivation.checked = reactivationLeads.length
    
    for (const lead of reactivationLeads) {
      if (!lead.clientEmail) continue
      
      const daysSinceActivity = Math.floor(
        (now.getTime() - lead.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      try {
        const emailResult = await sendReactivationEmail({
          to: lead.clientEmail,
          clientName: lead.clientName,
          projectType: lead.projectType,
          leadId: lead.id,
          daysSinceLastActivity: daysSinceActivity
        })
        
        if (emailResult.success) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { reactivationSentAt: now }
          })
          results.reactivation.sent++
        } else {
          results.reactivation.failed++
        }
      } catch (err) {
        results.reactivation.failed++
        results.errors.push(`Reactivation error for ${lead.id}: ${err}`)
      }
    }
    
    // Summary
    const totalSent = 
      results.quoteReminder1.sent + 
      results.quoteReminder2.sent + 
      results.feedbackRequest.sent + 
      results.npsSurvey.sent + 
      results.reactivation.sent
    
    console.log(`[CRON] Email reminders completed: ${totalSent} emails sent`)
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
      summary: {
        totalChecked: 
          results.quoteReminder1.checked + 
          results.quoteReminder2.checked + 
          results.feedbackRequest.checked + 
          results.npsSurvey.checked + 
          results.reactivation.checked,
        totalSent,
        totalFailed: 
          results.quoteReminder1.failed + 
          results.quoteReminder2.failed + 
          results.feedbackRequest.failed + 
          results.npsSurvey.failed + 
          results.reactivation.failed
      }
    })
  } catch (error) {
    console.error('[CRON] Email reminders error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        results 
      },
      { status: 500 }
    )
  }
}

// Vercel Cron configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max execution time
