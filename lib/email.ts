"use server"

import { logEmail } from './db-actions'

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev' // Use Resend test domain for now
const COMPANY_NAME = 'Broersma Bouwadvies'

interface EmailData {
  to: string
  subject: string
  body: string
  leadId?: string
  templateId?: string
  sentBy: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Variable replacement in templates (async to comply with server actions)
export async function replaceVariables(template: string, variables: Record<string, string>): Promise<string> {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}

// Send email via Resend
export async function sendEmail(data: EmailData): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.error('[EMAIL] Resend API key not configured')
    
    // Log the failed attempt
    await logEmail({
      ...data,
      status: 'failed',
      error: 'Email service not configured'
    })
    
    return { 
      success: false, 
      error: 'Email service niet geconfigureerd. Voeg RESEND_API_KEY toe aan .env' 
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
        to: data.to,
        subject: data.subject,
        html: wrapEmailHtml(data.body)
      })
    })

    const result = await response.json()

    if (!response.ok) {
      await logEmail({
        ...data,
        status: 'failed',
        error: result.message || 'Failed to send email'
      })
      return { success: false, error: result.message || 'Failed to send email' }
    }

    // Log successful send
    await logEmail({
      ...data,
      status: 'sent',
      messageId: result.id
    })

    return { success: true, messageId: result.id }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[EMAIL] Send error:', errorMessage)
    
    await logEmail({
      ...data,
      status: 'failed',
      error: errorMessage
    })
    
    return { success: false, error: errorMessage }
  }
}

// Email HTML wrapper with Broersma branding
function wrapEmailHtml(body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
          padding: 24px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          color: #d4af37;
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          background: #ffffff;
          padding: 32px;
          border: 1px solid #e5e5e5;
          border-top: none;
        }
        .footer {
          background: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e5e5;
          border-top: none;
        }
        .button {
          display: inline-block;
          background: #1e3a5f;
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 16px 0;
        }
        .highlight {
          background: #fef3c7;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #d4af37;
          margin: 16px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Broersma Bouwadvies</h1>
      </div>
      <div class="content">
        ${body}
      </div>
      <div class="footer">
        <p>Broersma Bouwadvies B.V.</p>
        <p>Constructieve berekeningen voor aanbouw, uitbouw, dakkapel, kozijn & VvE</p>
        <p>
          <a href="https://broersma-bouwadvies.nl">www.broersma-bouwadvies.nl</a> | 
          <a href="mailto:info@broersma-bouwadvies.nl">info@broersma-bouwadvies.nl</a>
        </p>
      </div>
    </body>
    </html>
  `
}

// ============================================================
// Pre-defined Email Templates
// ============================================================

export async function sendIntakeConfirmation(data: {
  to: string
  clientName: string
  projectType: string
  leadId: string
  sentBy: string
}): Promise<EmailResult> {
  const subject = `Aanvraag ontvangen - ${data.projectType}`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Bedankt voor uw aanvraag voor een constructieve berekening voor uw <strong>${data.projectType.toLowerCase()}</strong>.</p>
    
    <div class="highlight">
      <strong>Wat gebeurt er nu?</strong>
      <ul>
        <li>Wij bekijken uw aanvraag binnen 1 werkdag</li>
        <li>U ontvangt een persoonlijke offerte op maat</li>
        <li>Na akkoord starten we direct met de berekening</li>
      </ul>
    </div>
    
    <p>Heeft u vragen of aanvullende informatie? Antwoord gerust op deze e-mail.</p>
    
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

export async function sendQuoteEmail(data: {
  to: string
  clientName: string
  projectType: string
  quoteValue: number
  quoteDescription?: string
  leadId: string
  sentBy: string
  acceptanceUrl?: string // Secure link for digital acceptance
}): Promise<EmailResult> {
  const formattedValue = new Intl.NumberFormat('nl-NL', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(data.quoteValue)
  
  const subject = `Offerte constructieve berekening - ${data.projectType}`
  
  // Use secure acceptance link if provided, otherwise fallback to mailto
  const acceptanceSection = data.acceptanceUrl 
    ? `
      <p>U kunt deze offerte direct online accepteren via onderstaande beveiligde link:</p>
      
      <a href="${data.acceptanceUrl}" class="button" style="background-color: #10b981;">
        ✓ Offerte bekijken & accepteren
      </a>
      
      <p style="font-size: 12px; color: #6b7280;">
        Deze link is 30 dagen geldig en uniek voor u. Door te accepteren gaat u akkoord met onze algemene voorwaarden.
      </p>
    `
    : `
      <p>U kunt akkoord geven door te antwoorden op deze e-mail of te bellen.</p>
      
      <a href="mailto:info@broersma-bouwadvies.nl?subject=Akkoord%20offerte%20${encodeURIComponent(data.projectType)}" class="button">
        ✓ Akkoord geven
      </a>
    `
  
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Hierbij ontvangt u onze offerte voor de constructieve berekening van uw <strong>${data.projectType.toLowerCase()}</strong>.</p>
    
    <div class="highlight">
      <strong>Offertebedrag: ${formattedValue}</strong> (excl. BTW)
      ${data.quoteDescription ? `<p style="margin-top: 12px; margin-bottom: 0;">${data.quoteDescription}</p>` : ''}
    </div>
    
    <p><strong>Dit is inbegrepen:</strong></p>
    <ul>
      <li>Volledige constructieve berekening</li>
      <li>Tekeningen geschikt voor vergunningaanvraag</li>
      <li>Revisie indien nodig na beoordeling gemeente</li>
      <li>Ondersteuning gedurende het gehele proces</li>
    </ul>
    
    ${acceptanceSection}
    
    <p>De offerte is 30 dagen geldig. Heeft u vragen? Neem gerust contact op.</p>
    
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

export async function sendQuoteReminder(data: {
  to: string
  clientName: string
  projectType: string
  quoteValue: number
  daysSinceQuote: number
  leadId: string
  sentBy: string
}): Promise<EmailResult> {
  const formattedValue = new Intl.NumberFormat('nl-NL', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(data.quoteValue)
  
  const subject = `Herinnering: Offerte ${data.projectType}`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Graag herinneren wij u aan onze offerte van ${data.daysSinceQuote} dagen geleden voor de constructieve berekening van uw <strong>${data.projectType.toLowerCase()}</strong>.</p>
    
    <div class="highlight">
      <strong>Offertebedrag: ${formattedValue}</strong> (excl. BTW)
    </div>
    
    <p>Heeft u nog vragen over de offerte? Of zijn er wijzigingen in uw project? Laat het ons weten, we denken graag met u mee.</p>
    
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

export async function sendOrderConfirmation(data: {
  to: string
  clientName: string
  projectType: string
  leadId: string
  sentBy: string
}): Promise<EmailResult> {
  const subject = `Opdracht bevestigd - ${data.projectType}`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Hartelijk dank voor uw opdracht! Wij gaan direct aan de slag met de constructieve berekening voor uw <strong>${data.projectType.toLowerCase()}</strong>.</p>
    
    <div class="highlight">
      <strong>Wat kunt u verwachten?</strong>
      <ul>
        <li>Onze engineer neemt binnen 2 werkdagen contact op</li>
        <li>Gemiddelde doorlooptijd: 5-7 werkdagen</li>
        <li>U ontvangt de berekening per e-mail</li>
      </ul>
    </div>
    
    <p>Mocht u nog documenten of tekeningen hebben die relevant zijn voor de berekening, stuur deze dan gerust.</p>
    
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

export async function sendDeliveryNotification(data: {
  to: string
  clientName: string
  projectType: string
  leadId: string
  sentBy: string
}): Promise<EmailResult> {
  const subject = `Berekening gereed - ${data.projectType}`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Goed nieuws! De constructieve berekening voor uw <strong>${data.projectType.toLowerCase()}</strong> is gereed.</p>
    
    <p>In de bijlage vindt u:</p>
    <ul>
      <li>De constructieve berekening (PDF)</li>
      <li>Technische tekeningen</li>
      <li>Toelichting voor de aannemer</li>
    </ul>
    
    <div class="highlight">
      <strong>Tip:</strong> Deze documenten kunt u gebruiken voor uw vergunningaanvraag bij de gemeente.
    </div>
    
    <p>Heeft u vragen over de berekening? Aarzel niet om contact op te nemen.</p>
    
    <p>Wij wensen u veel succes met uw project!</p>
    
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

export async function sendFeedbackRequest(data: {
  to: string
  clientName: string
  projectType: string
  leadId: string
  sentBy: string
}): Promise<EmailResult> {
  const subject = `Hoe was uw ervaring? - Broersma Bouwadvies`
  const body = `
    <p>Beste ${data.clientName},</p>
    
    <p>Enige tijd geleden hebben wij de constructieve berekening voor uw <strong>${data.projectType.toLowerCase()}</strong> opgeleverd.</p>
    
    <p>Wij zijn benieuwd naar uw ervaring. Uw feedback helpt ons om onze service te verbeteren.</p>
    
    <div class="highlight">
      <strong>Zou u 2 minuten willen nemen om uw ervaring te delen?</strong>
    </div>
    
    <p>Enkele vragen:</p>
    <ul>
      <li>Was u tevreden over de snelheid van levering?</li>
      <li>Was de berekening duidelijk en compleet?</li>
      <li>Zou u ons aanbevelen bij anderen?</li>
    </ul>
    
    <p>U kunt eenvoudig antwoorden door te reageren op deze e-mail.</p>
    
    <p>Alvast bedankt!</p>
    
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
