"use server"

import {
  sendIntakeConfirmation,
  sendQuoteEmail,
  sendQuoteReminder,
  sendOrderConfirmation,
  sendDeliveryNotification,
  sendFeedbackRequest,
  sendEmail
} from './email'
import type { LeadStatus } from './types'
import prisma from './db'

/**
 * Email Trigger Service
 * Centralized service for triggering emails based on system events
 */

interface Lead {
  id: string
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  projectType: string
  city: string
  address?: string | null
  status: LeadStatus
  assignee?: string | null
  assignedProjectleider?: string | null
  quoteValue?: number | null
  quoteDescription?: string | null
}

// ============================================================
// Status Change Email Triggers
// ============================================================

/**
 * Trigger appropriate email when lead status changes
 */
export async function triggerStatusChangeEmail(
  lead: Lead,
  oldStatus: LeadStatus,
  newStatus: LeadStatus,
  triggeredBy: string
): Promise<{ sent: boolean; emailType?: string; error?: string }> {
  // Skip if no client email
  if (!lead.clientEmail) {
    return { sent: false, error: 'No client email address' }
  }

  try {
    // → OfferteVerzonden: Quote was approved and sent
    if (newStatus === 'OfferteVerzonden' && oldStatus !== 'OfferteVerzonden') {
      if (lead.quoteValue) {
        // Get projectleider contact info if assigned
        let contactPerson: { name: string; email: string } | undefined
        if (lead.assignedProjectleider) {
          const plUser = await prisma.user.findFirst({
            where: { name: lead.assignedProjectleider, deletedAt: null },
            select: { name: true, email: true }
          })
          if (plUser) {
            contactPerson = { name: plUser.name, email: plUser.email }
          }
        }
        
        const result = await sendQuoteEmail({
          to: lead.clientEmail,
          clientName: lead.clientName,
          projectType: lead.projectType,
          quoteValue: lead.quoteValue,
          quoteDescription: lead.quoteDescription || undefined,
          leadId: lead.id,
          sentBy: triggeredBy,
          contactPerson
        })
        return { sent: result.success, emailType: 'quote', error: result.error }
      }
      return { sent: false, error: 'No quote value set' }
    }

    // → Opdracht: Client accepted the quote
    if (newStatus === 'Opdracht' && oldStatus !== 'Opdracht') {
      const result = await sendOrderConfirmation({
        to: lead.clientEmail,
        clientName: lead.clientName,
        projectType: lead.projectType,
        leadId: lead.id,
        sentBy: triggeredBy
      })
      return { sent: result.success, emailType: 'order_confirmation', error: result.error }
    }

    // → Archief: Project completed
    if (newStatus === 'Archief' && oldStatus !== 'Archief') {
      const result = await sendDeliveryNotification({
        to: lead.clientEmail,
        clientName: lead.clientName,
        projectType: lead.projectType,
        leadId: lead.id,
        sentBy: triggeredBy
      })
      return { sent: result.success, emailType: 'delivery', error: result.error }
    }

    return { sent: false }
  } catch (error) {
    console.error('[EmailTrigger] Status change email error:', error)
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================
// Assignment Email Triggers
// ============================================================

/**
 * Notify client when engineer is assigned to their project
 */
export async function sendEngineerAssignedToClient(data: {
  to: string
  clientName: string
  projectType: string
  engineerName: string
  leadId: string
  sentBy: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Engineer toegewezen aan uw project - ${data.projectType}`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Goed nieuws! Er is een engineer toegewezen aan uw <strong>${data.projectType.toLowerCase()}</strong> project.</p>
    
    <div class="highlight">
      <strong>Uw engineer: ${data.engineerName}</strong>
      <p style="margin-top: 8px; margin-bottom: 0;">
        ${data.engineerName} neemt binnenkort contact met u op om de details van uw project te bespreken.
      </p>
    </div>
    
    <p><strong>Wat kunt u verwachten?</strong></p>
    <ul>
      <li>Binnen 2 werkdagen ontvangt u een offerte</li>
      <li>Uw engineer bekijkt alle ingezonden documentatie</li>
      <li>Bij vragen neemt de engineer direct contact op</li>
    </ul>
    
    <p>Heeft u ondertussen nog vragen of aanvullende informatie? Antwoord gerust op deze e-mail.</p>
    
    <p>Met vriendelijke groet,<br>
    <strong>Team Broersma Bouwadvies</strong></p>
  `

  return sendEmail({
    to: data.to,
    subject,
    body,
    leadId: data.leadId,
    sentBy: data.sentBy
  })
}

/**
 * Notify engineer when assigned to a new project
 */
export async function sendEngineerAssignmentNotification(data: {
  engineerEmail: string
  engineerName: string
  clientName: string
  projectType: string
  city: string
  address?: string
  leadId: string
  sentBy: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Nieuwe opdracht toegewezen: ${data.projectType} - ${data.city}`
  const body = `
    <p>Hallo ${data.engineerName},</p>
    
    <p>Er is een nieuw project aan jou toegewezen.</p>
    
    <div class="highlight">
      <strong>Projectdetails:</strong>
      <ul style="margin-top: 8px; margin-bottom: 0;">
        <li><strong>Klant:</strong> ${data.clientName}</li>
        <li><strong>Type:</strong> ${data.projectType}</li>
        <li><strong>Locatie:</strong> ${data.address ? `${data.address}, ` : ''}${data.city}</li>
      </ul>
    </div>
    
    <p>Bekijk het project in de backoffice en maak een offerte aan.</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://backoffice.broersma-bouwadvies.nl'}/leads/${data.leadId}" class="button">
      📋 Bekijk project
    </a>
    
    <p>Succes!</p>
    
    <p>Met vriendelijke groet,<br>
    <strong>Broersma Bouwadvies Systeem</strong></p>
  `

  return sendEmail({
    to: data.engineerEmail,
    subject,
    body,
    leadId: data.leadId,
    sentBy: data.sentBy
  })
}

/**
 * Trigger emails when engineer is assigned
 */
export async function triggerAssignmentEmails(
  lead: Lead,
  engineerName: string,
  engineerEmail: string | null,
  triggeredBy: string
): Promise<{ clientNotified: boolean; engineerNotified: boolean }> {
  const results = { clientNotified: false, engineerNotified: false }

  // Notify client
  if (lead.clientEmail) {
    const clientResult = await sendEngineerAssignedToClient({
      to: lead.clientEmail,
      clientName: lead.clientName,
      projectType: lead.projectType,
      engineerName,
      leadId: lead.id,
      sentBy: triggeredBy
    })
    results.clientNotified = clientResult.success
  }

  // Notify engineer
  if (engineerEmail) {
    const engineerResult = await sendEngineerAssignmentNotification({
      engineerEmail,
      engineerName,
      clientName: lead.clientName,
      projectType: lead.projectType,
      city: lead.city,
      address: lead.address || undefined,
      leadId: lead.id,
      sentBy: triggeredBy
    })
    results.engineerNotified = engineerResult.success
  }

  return results
}

// ============================================================
// Internal Notification Triggers
// ============================================================

/**
 * Notify admins about new lead
 */
export async function sendNewLeadNotification(data: {
  adminEmails: string[]
  clientName: string
  projectType: string
  city: string
  address?: string
  leadId: string
}): Promise<{ sent: number; failed: number }> {
  const subject = `🆕 Nieuwe aanvraag: ${data.projectType} - ${data.city}`
  const body = `
    <p>Er is een nieuwe aanvraag binnengekomen.</p>
    
    <div class="highlight">
      <strong>Aanvraagdetails:</strong>
      <ul style="margin-top: 8px; margin-bottom: 0;">
        <li><strong>Klant:</strong> ${data.clientName}</li>
        <li><strong>Type:</strong> ${data.projectType}</li>
        <li><strong>Locatie:</strong> ${data.address ? `${data.address}, ` : ''}${data.city}</li>
      </ul>
    </div>
    
    <p>Bekijk de aanvraag en wijs een engineer toe.</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://backoffice.broersma-bouwadvies.nl'}/leads/${data.leadId}" class="button">
      📋 Bekijk aanvraag
    </a>
    
    <p style="color: #666; font-size: 12px; margin-top: 24px;">
      Dit is een automatisch bericht van het Broersma Backoffice systeem.
    </p>
  `

  let sent = 0
  let failed = 0

  for (const email of data.adminEmails) {
    const result = await sendEmail({
      to: email,
      subject,
      body,
      leadId: data.leadId,
      sentBy: 'System'
    })
    if (result.success) sent++
    else failed++
  }

  return { sent, failed }
}

/**
 * Notify admins about quote pending approval
 */
export async function sendQuotePendingApprovalNotification(data: {
  adminEmails: string[]
  engineerName: string
  clientName: string
  projectType: string
  quoteValue: number
  leadId: string
}): Promise<{ sent: number; failed: number }> {
  const formattedValue = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(data.quoteValue)

  const subject = `⏳ Offerte ter goedkeuring: ${data.clientName} - ${formattedValue}`
  const body = `
    <p>Er staat een offerte klaar voor goedkeuring.</p>
    
    <div class="highlight">
      <strong>Offertedetails:</strong>
      <ul style="margin-top: 8px; margin-bottom: 0;">
        <li><strong>Klant:</strong> ${data.clientName}</li>
        <li><strong>Project:</strong> ${data.projectType}</li>
        <li><strong>Bedrag:</strong> ${formattedValue} (excl. BTW)</li>
        <li><strong>Engineer:</strong> ${data.engineerName}</li>
      </ul>
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://backoffice.broersma-bouwadvies.nl'}/admin" class="button">
      ✅ Bekijk & Goedkeuren
    </a>
    
    <p style="color: #666; font-size: 12px; margin-top: 24px;">
      Dit is een automatisch bericht van het Broersma Backoffice systeem.
    </p>
  `

  let sent = 0
  let failed = 0

  for (const email of data.adminEmails) {
    const result = await sendEmail({
      to: email,
      subject,
      body,
      leadId: data.leadId,
      sentBy: 'System'
    })
    if (result.success) sent++
    else failed++
  }

  return { sent, failed }
}

/**
 * Notify engineer when quote is rejected
 */
export async function sendQuoteRejectedNotification(data: {
  engineerEmail: string
  engineerName: string
  clientName: string
  projectType: string
  quoteValue: number
  rejectionFeedback: string
  rejectedBy: string
  leadId: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedValue = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(data.quoteValue)

  const subject = `❌ Offerte afgekeurd: ${data.clientName} - ${data.projectType}`
  const body = `
    <p>Hallo ${data.engineerName},</p>
    
    <p>Je offerte voor <strong>${data.clientName}</strong> is afgekeurd door ${data.rejectedBy}.</p>
    
    <div class="highlight">
      <strong>Feedback:</strong>
      <p style="margin-top: 8px; margin-bottom: 0; font-style: italic;">
        "${data.rejectionFeedback}"
      </p>
    </div>
    
    <p><strong>Offertedetails:</strong></p>
    <ul>
      <li>Klant: ${data.clientName}</li>
      <li>Project: ${data.projectType}</li>
      <li>Bedrag: ${formattedValue}</li>
    </ul>
    
    <p>Pas de offerte aan en dien opnieuw in.</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://backoffice.broersma-bouwadvies.nl'}/leads/${data.leadId}" class="button">
      📝 Offerte aanpassen
    </a>
    
    <p>Met vriendelijke groet,<br>
    <strong>Broersma Bouwadvies Systeem</strong></p>
  `

  return sendEmail({
    to: data.engineerEmail,
    subject,
    body,
    leadId: data.leadId,
    sentBy: 'System'
  })
}

// ============================================================
// Scheduled Email Functions (for cron jobs)
// ============================================================

/**
 * Send quote reminder (called by cron job)
 */
export async function sendScheduledQuoteReminder(data: {
  to: string
  clientName: string
  projectType: string
  quoteValue: number
  daysSinceQuote: number
  leadId: string
  isSecondReminder: boolean
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendQuoteReminder({
    to: data.to,
    clientName: data.clientName,
    projectType: data.projectType,
    quoteValue: data.quoteValue,
    daysSinceQuote: data.daysSinceQuote,
    leadId: data.leadId,
    sentBy: 'System (Automatisch)'
  })
}

/**
 * Send scheduled feedback request (called by cron job)
 */
export async function sendScheduledFeedbackRequest(data: {
  to: string
  clientName: string
  projectType: string
  leadId: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendFeedbackRequest({
    to: data.to,
    clientName: data.clientName,
    projectType: data.projectType,
    leadId: data.leadId,
    sentBy: 'System (Automatisch)'
  })
}

/**
 * Send NPS survey email
 */
export async function sendNpsSurvey(data: {
  to: string
  clientName: string
  projectType: string
  leadId: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Hoe waardeert u Broersma Bouwadvies? (1 minuut)`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Enige tijd geleden hebben wij de constructieve berekening voor uw <strong>${data.projectType.toLowerCase()}</strong> opgeleverd.</p>
    
    <p>Wij zouden het zeer op prijs stellen als u even de tijd neemt om onze service te beoordelen.</p>
    
    <div class="highlight" style="text-align: center;">
      <strong>Hoe waarschijnlijk is het dat u Broersma Bouwadvies zou aanbevelen?</strong>
      <p style="margin-top: 12px; margin-bottom: 0;">
        <span style="font-size: 11px; color: #666;">Niet waarschijnlijk</span>
        &nbsp;&nbsp;
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => 
          `<a href="mailto:feedback@broersma-bouwadvies.nl?subject=NPS%20Score:%20${n}&body=Mijn%20score:%20${n}%0A%0AOptionele%20toelichting:%20" style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; margin: 2px; background: ${n <= 6 ? '#fee2e2' : n <= 8 ? '#fef3c7' : '#dcfce7'}; border-radius: 4px; text-decoration: none; color: #333; font-weight: bold;">${n}</a>`
        ).join('')}
        &nbsp;&nbsp;
        <span style="font-size: 11px; color: #666;">Zeer waarschijnlijk</span>
      </p>
    </div>
    
    <p>Klik op een cijfer om uw score te versturen. Uw feedback helpt ons om te groeien!</p>
    
    <p>Alvast hartelijk dank.</p>
    
    <p>Met vriendelijke groet,<br>
    <strong>Team Broersma Bouwadvies</strong></p>
  `

  return sendEmail({
    to: data.to,
    subject,
    body,
    leadId: data.leadId,
    sentBy: 'System (Automatisch)'
  })
}

/**
 * Send referral invitation (for promoters with NPS 9-10)
 */
export async function sendReferralInvitation(data: {
  to: string
  clientName: string
  leadId: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Bedankt voor uw aanbeveling! Deel uw ervaring`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Hartelijk dank voor uw positieve beoordeling! Het doet ons goed te horen dat u tevreden bent.</p>
    
    <div class="highlight">
      <strong>Kent u iemand die ook bouwplannen heeft?</strong>
      <p style="margin-top: 8px; margin-bottom: 0;">
        Als u iemand kent die een uitbouw, dakkapel of andere verbouwing plant, 
        help ons dan door uw ervaring te delen.
      </p>
    </div>
    
    <p><strong>Waarom aanbevelen?</strong></p>
    <ul>
      <li>Uw bekende krijgt dezelfde professionele service</li>
      <li>U helpt een Nederlands familiebedrijf</li>
      <li>Samen bouwen we aan kwaliteit</li>
    </ul>
    
    <p>U kunt deze mail eenvoudig doorsturen naar geïnteresseerden.</p>
    
    <a href="mailto:?subject=Aanbeveling%20Broersma%20Bouwadvies&body=Hallo,%0A%0AIk%20heb%20zelf%20goede%20ervaringen%20met%20Broersma%20Bouwadvies%20voor%20constructieve%20berekeningen.%0A%0ABekijk%20hun%20website:%20https://broersma-bouwadvies.nl%0A%0AGroeten" class="button">
      📤 Stuur aanbeveling
    </a>
    
    <p>Nogmaals bedankt voor uw vertrouwen!</p>
    
    <p>Met vriendelijke groet,<br>
    <strong>Team Broersma Bouwadvies</strong></p>
  `

  return sendEmail({
    to: data.to,
    subject,
    body,
    leadId: data.leadId,
    sentBy: 'System (Automatisch)'
  })
}

/**
 * Send reactivation email to inactive leads
 */
export async function sendReactivationEmail(data: {
  to: string
  clientName: string
  projectType: string
  leadId: string
  daysSinceLastActivity: number
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Nog steeds interesse in uw ${data.projectType.toLowerCase()}?`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Enige tijd geleden heeft u contact met ons gehad over een <strong>${data.projectType.toLowerCase()}</strong>.</p>
    
    <p>Wij zijn benieuwd of uw bouwplannen nog actueel zijn. Mocht u nog steeds interesse hebben, dan helpen wij u graag verder.</p>
    
    <div class="highlight">
      <strong>Wat kunnen wij voor u betekenen?</strong>
      <ul style="margin-top: 8px; margin-bottom: 0;">
        <li>Constructieve berekeningen voor vergunningsaanvraag</li>
        <li>Advies over haalbaarheid en kosten</li>
        <li>Ondersteuning gedurende het hele traject</li>
      </ul>
    </div>
    
    <p>Neem gerust contact op als u vragen heeft of als uw situatie is veranderd.</p>
    
    <a href="mailto:info@broersma-bouwadvies.nl?subject=Reactie%20op%20${encodeURIComponent(data.projectType)}%20aanvraag" class="button">
      💬 Neem contact op
    </a>
    
    <p>Wij horen graag van u!</p>
    
    <p>Met vriendelijke groet,<br>
    <strong>Team Broersma Bouwadvies</strong></p>
    
    <p style="color: #666; font-size: 12px; margin-top: 24px;">
      Wilt u geen e-mails meer ontvangen? 
      <a href="mailto:info@broersma-bouwadvies.nl?subject=Uitschrijven">Meld u hier af</a>.
    </p>
  `

  return sendEmail({
    to: data.to,
    subject,
    body,
    leadId: data.leadId,
    sentBy: 'System (Automatisch)'
  })
}
