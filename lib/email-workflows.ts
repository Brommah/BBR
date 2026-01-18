/**
 * @fileoverview Unified Email Workflow Engine
 *
 * This module provides a centralized system for managing email automations.
 * It consolidates all email flows, templates, and triggers into a single
 * source of truth.
 *
 * Features:
 * - Centralized flow definitions (15 flows)
 * - Event-based trigger registry
 * - Template-based email generation
 * - Type-safe variable substitution
 * - Flow status management (active/paused/draft)
 *
 * Usage:
 *   import { WorkflowEngine, triggerEmail } from '@/lib/email-workflows'
 *
 *   // Trigger an email based on an event
 *   await triggerEmail('status_change', { lead, oldStatus, newStatus, triggeredBy })
 *
 *   // Get all active flows
 *   const flows = WorkflowEngine.getActiveFlows()
 *
 * @module lib/email-workflows
 */

"use server"

import { sendEmail, replaceVariables } from './email'
import prisma from './db'
import type { LeadStatus } from './types'

// ============================================================
// TYPES
// ============================================================

/** Flow identifier (01-15) */
export type FlowId =
  | '01' | '02' | '03' | '04' | '05'
  | '06' | '07' | '08' | '09' | '10'
  | '11' | '12' | '13' | '14' | '15'

/** Flow status */
export type FlowStatus = 'active' | 'paused' | 'draft'

/** Flow category */
export type FlowCategory = 'klant' | 'conversie' | 'feedback' | 'intern' | 'campagne'

/** Trigger event types */
export type TriggerEvent =
  | 'lead_created'
  | 'status_change'
  | 'engineer_assigned'
  | 'quote_submitted'
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_accepted'
  | 'scheduled_reminder'
  | 'scheduled_feedback'
  | 'scheduled_nps'
  | 'scheduled_referral'
  | 'scheduled_reactivation'

/** Lead data passed to workflows */
export interface WorkflowLead {
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
  assignedRekenaar?: string | null
  assignedTekenaar?: string | null
  quoteValue?: number | null
  quoteDescription?: string | null
  werknummer?: string | null
}

/** Flow definition */
export interface FlowDefinition {
  id: FlowId
  name: string
  description: string
  category: FlowCategory
  trigger: TriggerEvent
  triggerCondition?: (context: TriggerContext) => boolean
  defaultStatus: FlowStatus
  template: EmailTemplate
  delayDays?: number // For scheduled flows
}

/** Email template definition */
export interface EmailTemplate {
  subject: string
  bodyTemplate: string
  variables: string[]
}

/** Context passed to triggers */
export interface TriggerContext {
  lead: WorkflowLead
  triggeredBy: string
  oldStatus?: LeadStatus
  newStatus?: LeadStatus
  engineerName?: string
  engineerEmail?: string
  quoteValue?: number
  feedback?: string
  daysSince?: number
}

/** Result of sending an email */
export interface WorkflowResult {
  success: boolean
  flowId?: FlowId
  messageId?: string
  error?: string
  skipped?: boolean
  skipReason?: string
}

// ============================================================
// FLOW DEFINITIONS
// ============================================================

/**
 * All email automation flow definitions
 * This is the single source of truth for email workflows
 */
export const FLOW_DEFINITIONS: FlowDefinition[] = [
  // ============ CUSTOMER JOURNEY (01-05) ============
  {
    id: '01',
    name: 'Intake Bevestiging',
    description: 'Bevestiging naar klant direct na aanvraag',
    category: 'klant',
    trigger: 'lead_created',
    defaultStatus: 'active',
    template: {
      subject: 'Aanvraag ontvangen - {{projectType}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Bedankt voor uw aanvraag voor een constructieve berekening voor uw <strong>{{projectTypeLower}}</strong>.</p>

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
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower']
    }
  },
  {
    id: '02',
    name: 'Engineer Toegewezen',
    description: 'Notificatie naar klant wanneer engineer is toegewezen',
    category: 'klant',
    trigger: 'engineer_assigned',
    defaultStatus: 'active',
    template: {
      subject: 'Engineer toegewezen aan uw project - {{projectType}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Goed nieuws! Er is een engineer toegewezen aan uw <strong>{{projectTypeLower}}</strong> project.</p>

        <div class="highlight">
          <strong>Uw engineer: {{engineerName}}</strong>
          <p style="margin-top: 8px; margin-bottom: 0;">
            {{engineerName}} neemt binnenkort contact met u op om de details van uw project te bespreken.
          </p>
        </div>

        <p><strong>Wat kunt u verwachten?</strong></p>
        <ul>
          <li>Binnen 2 werkdagen ontvangt u een offerte</li>
          <li>Uw engineer bekijkt alle ingezonden documentatie</li>
          <li>Bij vragen neemt de engineer direct contact op</li>
        </ul>

        <p>Heeft u ondertussen nog vragen? Antwoord gerust op deze e-mail.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower', 'engineerName']
    }
  },
  {
    id: '03',
    name: 'Offerte Verzonden',
    description: 'Offerte email naar klant na admin goedkeuring',
    category: 'klant',
    trigger: 'status_change',
    triggerCondition: (ctx) => ctx.newStatus === 'OfferteVerzonden' && ctx.oldStatus !== 'OfferteVerzonden',
    defaultStatus: 'active',
    template: {
      subject: 'Offerte constructieve berekening - {{projectType}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Hierbij ontvangt u onze offerte voor de constructieve berekening van uw <strong>{{projectTypeLower}}</strong>.</p>

        <div class="highlight">
          <strong>Offertebedrag: {{quoteValueFormatted}}</strong> (excl. BTW)
          {{#quoteDescription}}<p style="margin-top: 12px; margin-bottom: 0;">{{quoteDescription}}</p>{{/quoteDescription}}
        </div>

        <p><strong>Dit is inbegrepen:</strong></p>
        <ul>
          <li>Volledige constructieve berekening</li>
          <li>Tekeningen geschikt voor vergunningaanvraag</li>
          <li>Revisie indien nodig na beoordeling gemeente</li>
          <li>Ondersteuning gedurende het gehele proces</li>
        </ul>

        {{#acceptanceUrl}}
        <p>U kunt deze offerte direct online accepteren:</p>
        <a href="{{acceptanceUrl}}" class="button" style="background-color: #10b981;">
          ✓ Offerte bekijken & accepteren
        </a>
        {{/acceptanceUrl}}

        <p>De offerte is 30 dagen geldig. Heeft u vragen? Neem gerust contact op.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower', 'quoteValueFormatted', 'quoteDescription', 'acceptanceUrl']
    }
  },
  {
    id: '04',
    name: 'Offerte Herinnering 1',
    description: 'Eerste herinnering na 4 dagen zonder reactie',
    category: 'conversie',
    trigger: 'scheduled_reminder',
    defaultStatus: 'active',
    delayDays: 4,
    template: {
      subject: 'Herinnering: Offerte {{projectType}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Graag herinneren wij u aan onze offerte van {{daysSince}} dagen geleden voor de constructieve berekening van uw <strong>{{projectTypeLower}}</strong>.</p>

        <div class="highlight">
          <strong>Offertebedrag: {{quoteValueFormatted}}</strong> (excl. BTW)
        </div>

        <p>Heeft u nog vragen over de offerte? Of zijn er wijzigingen in uw project? Laat het ons weten, we denken graag met u mee.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower', 'quoteValueFormatted', 'daysSince']
    }
  },
  {
    id: '05',
    name: 'Offerte Herinnering 2',
    description: 'Tweede herinnering na 10 dagen (urgentie)',
    category: 'conversie',
    trigger: 'scheduled_reminder',
    defaultStatus: 'active',
    delayDays: 10,
    template: {
      subject: 'Laatste herinnering: Offerte {{projectType}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Dit is een vriendelijke herinnering dat onze offerte voor uw <strong>{{projectTypeLower}}</strong> over enkele dagen verloopt.</p>

        <div class="highlight">
          <strong>Offertebedrag: {{quoteValueFormatted}}</strong> (excl. BTW)
          <p style="margin-top: 8px; margin-bottom: 0;">Geldig tot: {{expiryDate}}</p>
        </div>

        <p>Wilt u doorgaan met uw project? Antwoord op deze e-mail of bel ons direct.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower', 'quoteValueFormatted', 'expiryDate']
    }
  },

  // ============ CONVERSION (06-08) ============
  {
    id: '06',
    name: 'Opdracht Bevestiging',
    description: 'Bevestiging wanneer klant offerte accepteert',
    category: 'conversie',
    trigger: 'quote_accepted',
    defaultStatus: 'active',
    template: {
      subject: 'Opdracht bevestigd - {{projectType}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Hartelijk dank voor uw opdracht! Wij gaan direct aan de slag met de constructieve berekening voor uw <strong>{{projectTypeLower}}</strong>.</p>

        <div class="highlight">
          <strong>Wat kunt u verwachten?</strong>
          <ul>
            <li>Onze engineer neemt binnen 2 werkdagen contact op</li>
            <li>Gemiddelde doorlooptijd: 5-7 werkdagen</li>
            <li>U ontvangt de berekening per e-mail</li>
          </ul>
        </div>

        <p>Mocht u nog documenten of tekeningen hebben die relevant zijn, stuur deze dan gerust.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower']
    }
  },
  {
    id: '07',
    name: 'Factuur Verzonden',
    description: 'Factuur email na opdracht (placeholder)',
    category: 'conversie',
    trigger: 'quote_accepted',
    defaultStatus: 'draft',
    delayDays: 1,
    template: {
      subject: 'Factuur - {{projectType}} - {{werknummer}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Bijgaand ontvangt u de factuur voor de constructieve berekening van uw <strong>{{projectTypeLower}}</strong>.</p>

        <div class="highlight">
          <strong>Factuurbedrag: {{quoteValueFormatted}}</strong> (excl. BTW)
        </div>

        <p>Betaling graag binnen 14 dagen na factuurdatum.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower', 'quoteValueFormatted', 'werknummer']
    }
  },
  {
    id: '08',
    name: 'Betalingsherinnering',
    description: 'Herinnering bij openstaande factuur (placeholder)',
    category: 'conversie',
    trigger: 'scheduled_reminder',
    defaultStatus: 'draft',
    delayDays: 17,
    template: {
      subject: 'Betalingsherinnering - {{werknummer}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Graag herinneren wij u aan de openstaande factuur voor uw project.</p>

        <p>Heeft u de betaling inmiddels voldaan? Dan kunt u deze herinnering als niet verzonden beschouwen.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'werknummer']
    }
  },

  // ============ DELIVERY & FEEDBACK (09-12) ============
  {
    id: '09',
    name: 'Oplevering Berekening',
    description: 'Notificatie wanneer berekening gereed is',
    category: 'feedback',
    trigger: 'status_change',
    triggerCondition: (ctx) => ctx.newStatus === 'Archief' && ctx.oldStatus !== 'Archief',
    defaultStatus: 'active',
    template: {
      subject: 'Berekening gereed - {{projectType}}',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Goed nieuws! De constructieve berekening voor uw <strong>{{projectTypeLower}}</strong> is gereed.</p>

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

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower']
    }
  },
  {
    id: '10',
    name: 'Feedback Verzoek',
    description: 'Vraag om feedback 3 dagen na oplevering',
    category: 'feedback',
    trigger: 'scheduled_feedback',
    defaultStatus: 'active',
    delayDays: 3,
    template: {
      subject: 'Hoe was uw ervaring? - Broersma Bouwadvies',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Enige tijd geleden hebben wij de constructieve berekening voor uw <strong>{{projectTypeLower}}</strong> opgeleverd.</p>

        <p>Wij zijn benieuwd naar uw ervaring. Uw feedback helpt ons om onze service te verbeteren.</p>

        <div class="highlight">
          <strong>Zou u 2 minuten willen nemen om uw ervaring te delen?</strong>
        </div>

        <p>U kunt eenvoudig antwoorden door te reageren op deze e-mail.</p>

        <p>Alvast bedankt!</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower']
    }
  },
  {
    id: '11',
    name: 'NPS Survey',
    description: 'Net Promoter Score enquete 14 dagen na oplevering',
    category: 'feedback',
    trigger: 'scheduled_nps',
    defaultStatus: 'active',
    delayDays: 14,
    template: {
      subject: 'Hoe waardeert u Broersma Bouwadvies? (1 minuut)',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Enige tijd geleden hebben wij de constructieve berekening voor uw <strong>{{projectTypeLower}}</strong> opgeleverd.</p>

        <p>Wij zouden het zeer op prijs stellen als u even de tijd neemt om onze service te beoordelen.</p>

        <div class="highlight" style="text-align: center;">
          <strong>Hoe waarschijnlijk is het dat u Broersma Bouwadvies zou aanbevelen?</strong>
          <p style="margin-top: 12px;">0 = Niet waarschijnlijk | 10 = Zeer waarschijnlijk</p>
        </div>

        <p>Klik op een cijfer om uw score te versturen. Uw feedback helpt ons te groeien!</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower']
    }
  },
  {
    id: '12',
    name: 'Referral Uitnodiging',
    description: 'Uitnodiging tot aanbeveling voor promoters (NPS 9-10)',
    category: 'campagne',
    trigger: 'scheduled_referral',
    defaultStatus: 'active',
    template: {
      subject: 'Bedankt voor uw aanbeveling! Deel uw ervaring',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Hartelijk dank voor uw positieve beoordeling! Het doet ons goed te horen dat u tevreden bent.</p>

        <div class="highlight">
          <strong>Kent u iemand die ook bouwplannen heeft?</strong>
          <p style="margin-top: 8px;">Help ons door uw ervaring te delen met bekenden die een uitbouw, dakkapel of verbouwing plannen.</p>
        </div>

        <p>U kunt deze mail eenvoudig doorsturen naar geïnteresseerden.</p>

        <p>Nogmaals bedankt voor uw vertrouwen!</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName']
    }
  },

  // ============ CAMPAIGNS & INTERNAL (13-15) ============
  {
    id: '13',
    name: 'Reactivatie',
    description: 'Reactivatie voor inactieve leads (90 dagen)',
    category: 'campagne',
    trigger: 'scheduled_reactivation',
    defaultStatus: 'active',
    delayDays: 90,
    template: {
      subject: 'Nog steeds interesse in uw {{projectTypeLower}}?',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Enige tijd geleden heeft u contact met ons gehad over een <strong>{{projectTypeLower}}</strong>.</p>

        <p>Wij zijn benieuwd of uw bouwplannen nog actueel zijn. Mocht u nog steeds interesse hebben, dan helpen wij u graag verder.</p>

        <div class="highlight">
          <strong>Wat kunnen wij voor u betekenen?</strong>
          <ul>
            <li>Constructieve berekeningen voor vergunningsaanvraag</li>
            <li>Advies over haalbaarheid en kosten</li>
            <li>Ondersteuning gedurende het hele traject</li>
          </ul>
        </div>

        <p>Neem gerust contact op als u vragen heeft.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName', 'projectType', 'projectTypeLower']
    }
  },
  {
    id: '14',
    name: 'Seizoenscampagne',
    description: 'Seizoensgebonden marketingcampagne',
    category: 'campagne',
    trigger: 'scheduled_reminder',
    defaultStatus: 'draft',
    template: {
      subject: 'Bouwplannen voor dit seizoen?',
      bodyTemplate: `
        <p>Beste {{clientName}},</p>

        <p>Het bouwseizoen is in volle gang. De perfecte tijd om uw plannen te realiseren!</p>

        <p>Wij helpen u graag met de constructieve berekeningen voor uw project.</p>

        <p>Met vriendelijke groet,<br>
        <strong>Team Broersma Bouwadvies</strong></p>
      `,
      variables: ['clientName']
    }
  },
  {
    id: '15',
    name: 'Interne Notificatie',
    description: 'Systeemnotificaties voor team (nieuwe leads, etc.)',
    category: 'intern',
    trigger: 'lead_created',
    defaultStatus: 'active',
    template: {
      subject: 'Nieuwe aanvraag: {{projectType}} - {{city}}',
      bodyTemplate: `
        <p>Er is een nieuwe aanvraag binnengekomen.</p>

        <div class="highlight">
          <strong>Aanvraagdetails:</strong>
          <ul>
            <li><strong>Klant:</strong> {{clientName}}</li>
            <li><strong>Type:</strong> {{projectType}}</li>
            <li><strong>Locatie:</strong> {{address}}, {{city}}</li>
          </ul>
        </div>

        <a href="{{leadUrl}}" class="button">
          Bekijk aanvraag
        </a>
      `,
      variables: ['clientName', 'projectType', 'city', 'address', 'leadUrl']
    }
  }
]

// ============================================================
// WORKFLOW ENGINE
// ============================================================

/**
 * WorkflowEngine - Central manager for email automations
 */
export const WorkflowEngine = {
  /**
   * Get all flow definitions
   */
  getAllFlows(): FlowDefinition[] {
    return FLOW_DEFINITIONS
  },

  /**
   * Get flow by ID
   */
  getFlow(flowId: FlowId): FlowDefinition | undefined {
    return FLOW_DEFINITIONS.find(f => f.id === flowId)
  },

  /**
   * Get all flows for a trigger event
   */
  getFlowsForTrigger(trigger: TriggerEvent): FlowDefinition[] {
    return FLOW_DEFINITIONS.filter(f => f.trigger === trigger)
  },

  /**
   * Get flows by category
   */
  getFlowsByCategory(category: FlowCategory): FlowDefinition[] {
    return FLOW_DEFINITIONS.filter(f => f.category === category)
  },

  /**
   * Get active flows (checks database config, falls back to defaults)
   */
  async getActiveFlows(): Promise<FlowDefinition[]> {
    try {
      const configs = await prisma.emailAutomationConfig.findMany({
        where: { status: 'active' }
      })
      const activeIds = new Set(configs.map(c => c.flowId))

      // If no configs exist, use default statuses
      if (configs.length === 0) {
        return FLOW_DEFINITIONS.filter(f => f.defaultStatus === 'active')
      }

      return FLOW_DEFINITIONS.filter(f => activeIds.has(f.id))
    } catch {
      // Fallback to defaults if DB query fails
      return FLOW_DEFINITIONS.filter(f => f.defaultStatus === 'active')
    }
  },

  /**
   * Check if a flow is active
   */
  async isFlowActive(flowId: FlowId): Promise<boolean> {
    try {
      const config = await prisma.emailAutomationConfig.findUnique({
        where: { flowId }
      })
      if (config) {
        return config.status === 'active'
      }
      // Fall back to default status
      const flow = FLOW_DEFINITIONS.find(f => f.id === flowId)
      return flow?.defaultStatus === 'active'
    } catch {
      const flow = FLOW_DEFINITIONS.find(f => f.id === flowId)
      return flow?.defaultStatus === 'active'
    }
  },

  /**
   * Build email variables from context
   */
  buildVariables(flow: FlowDefinition, context: TriggerContext): Record<string, string> {
    const { lead } = context
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backoffice.broersma-bouwadvies.nl'

    const quoteValueFormatted = lead.quoteValue
      ? new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(lead.quoteValue)
      : ''

    return {
      clientName: lead.clientName,
      projectType: lead.projectType,
      projectTypeLower: lead.projectType.toLowerCase(),
      city: lead.city,
      address: lead.address || '',
      quoteValueFormatted,
      quoteDescription: lead.quoteDescription || '',
      engineerName: context.engineerName || lead.assignedRekenaar || lead.assignedTekenaar || '',
      werknummer: lead.werknummer || '',
      leadUrl: `${appUrl}/leads/${lead.id}`,
      daysSince: context.daysSince?.toString() || '',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL'),
      acceptanceUrl: '', // Set by caller if needed
    }
  }
}

// ============================================================
// TRIGGER FUNCTIONS
// ============================================================

/**
 * Main trigger function - processes an event and sends appropriate emails
 */
export async function triggerEmail(
  event: TriggerEvent,
  context: TriggerContext
): Promise<WorkflowResult[]> {
  const results: WorkflowResult[] = []
  const flows = WorkflowEngine.getFlowsForTrigger(event)

  for (const flow of flows) {
    // Check if flow is active
    const isActive = await WorkflowEngine.isFlowActive(flow.id)
    if (!isActive) {
      results.push({
        success: false,
        flowId: flow.id,
        skipped: true,
        skipReason: 'Flow is not active'
      })
      continue
    }

    // Check trigger condition if defined
    if (flow.triggerCondition && !flow.triggerCondition(context)) {
      results.push({
        success: false,
        flowId: flow.id,
        skipped: true,
        skipReason: 'Trigger condition not met'
      })
      continue
    }

    // Check if client email exists
    if (!context.lead.clientEmail) {
      results.push({
        success: false,
        flowId: flow.id,
        skipped: true,
        skipReason: 'No client email address'
      })
      continue
    }

    // Build variables and render template
    const variables = WorkflowEngine.buildVariables(flow, context)
    const subject = await replaceVariables(flow.template.subject, variables)
    const body = await replaceVariables(flow.template.bodyTemplate, variables)

    // Send email
    const result = await sendEmail({
      to: context.lead.clientEmail,
      subject,
      body,
      leadId: context.lead.id,
      sentBy: context.triggeredBy
    })

    // Log to automation flow
    if (result.success) {
      try {
        await prisma.emailLog.update({
          where: { id: result.messageId },
          data: { automationFlowId: flow.id }
        })
      } catch {
        // Ignore update errors
      }
    }

    results.push({
      success: result.success,
      flowId: flow.id,
      messageId: result.messageId,
      error: result.error
    })
  }

  return results
}

/**
 * Trigger status change emails
 */
export async function triggerStatusChangeEmail(
  lead: WorkflowLead,
  oldStatus: LeadStatus,
  newStatus: LeadStatus,
  triggeredBy: string
): Promise<WorkflowResult[]> {
  return triggerEmail('status_change', {
    lead,
    oldStatus,
    newStatus,
    triggeredBy
  })
}

/**
 * Trigger lead created emails (intake confirmation + admin notification)
 */
export async function triggerLeadCreatedEmail(
  lead: WorkflowLead,
  triggeredBy: string
): Promise<WorkflowResult[]> {
  return triggerEmail('lead_created', {
    lead,
    triggeredBy
  })
}

/**
 * Trigger engineer assignment emails
 */
export async function triggerEngineerAssignedEmail(
  lead: WorkflowLead,
  engineerName: string,
  triggeredBy: string
): Promise<WorkflowResult[]> {
  return triggerEmail('engineer_assigned', {
    lead,
    engineerName,
    triggeredBy
  })
}

/**
 * Trigger quote accepted emails (order confirmation)
 */
export async function triggerQuoteAcceptedEmail(
  lead: WorkflowLead,
  triggeredBy: string
): Promise<WorkflowResult[]> {
  return triggerEmail('quote_accepted', {
    lead,
    triggeredBy
  })
}

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

/**
 * Send email to admin team
 */
export async function sendAdminNotification(
  adminEmails: string[],
  subject: string,
  body: string,
  leadId?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const email of adminEmails) {
    const result = await sendEmail({
      to: email,
      subject,
      body,
      leadId,
      sentBy: 'System'
    })
    if (result.success) sent++
    else failed++
  }

  return { sent, failed }
}

/**
 * Get admin emails for notifications
 */
export async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: 'admin', deletedAt: null },
    select: { email: true }
  })
  return admins.map(a => a.email)
}

/**
 * Send new lead notification to admins
 */
export async function notifyAdminsOfNewLead(lead: WorkflowLead): Promise<{ sent: number; failed: number }> {
  const adminEmails = await getAdminEmails()
  const flow = WorkflowEngine.getFlow('15')
  if (!flow) return { sent: 0, failed: adminEmails.length }

  const variables = WorkflowEngine.buildVariables(flow, { lead, triggeredBy: 'System' })
  const subject = await replaceVariables(flow.template.subject, variables)
  const body = await replaceVariables(flow.template.bodyTemplate, variables)

  return sendAdminNotification(adminEmails, subject, body, lead.id)
}
