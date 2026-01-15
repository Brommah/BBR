import { NextRequest, NextResponse } from 'next/server'
import { recordEmailEvent } from '@/lib/email-automation-actions'
import crypto from 'crypto'

/**
 * Resend Webhook Handler
 * 
 * Receives email events from Resend (opens, clicks, bounces, etc.)
 * and stores them in the database for analytics.
 * 
 * Webhook URL to configure in Resend:
 * https://your-domain.com/api/webhooks/resend
 * 
 * @see https://resend.com/docs/dashboard/webhooks/introduction
 */

// Resend webhook event types
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained'
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    click?: {
      link: string
    }
    bounce?: {
      type: string
      message: string
    }
  }
}

// Map Resend event types to our internal types
const eventTypeMap: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
}

/**
 * Verify Resend webhook signature
 * @see https://resend.com/docs/dashboard/webhooks/verify-signature
 */
function verifySignature(payload: string, signature: string, timestamp: string): boolean {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.warn('[Webhook] RESEND_WEBHOOK_SECRET not configured, skipping signature verification')
    return true // Allow in development without secret
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('svix-signature') || ''
    const timestamp = request.headers.get('svix-timestamp') || ''
    
    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && process.env.RESEND_WEBHOOK_SECRET) {
      if (!verifySignature(body, signature, timestamp)) {
        console.error('[Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }
    
    // Parse the event
    const event: ResendWebhookEvent = JSON.parse(body)
    
    console.log(`[Webhook] Received ${event.type} event for email ${event.data.email_id}`)
    
    // Skip 'email.sent' as we already track that when sending
    if (event.type === 'email.sent') {
      return NextResponse.json({ received: true })
    }
    
    // Map to our internal event type
    const eventType = eventTypeMap[event.type]
    if (!eventType) {
      console.log(`[Webhook] Unknown event type: ${event.type}`)
      return NextResponse.json({ received: true })
    }
    
    // Record the event
    const result = await recordEmailEvent({
      messageId: event.data.email_id,
      eventType: eventType as 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained',
      metadata: {
        subject: event.data.subject,
        to: event.data.to,
        from: event.data.from,
        clickedLink: event.data.click?.link,
        bounceType: event.data.bounce?.type,
        bounceMessage: event.data.bounce?.message,
        createdAt: event.created_at,
      },
    })
    
    if (!result.success) {
      console.error('[Webhook] Failed to record event:', result.error)
      // Still return 200 to prevent Resend from retrying
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error)
    // Return 200 to prevent retries for malformed requests
    return NextResponse.json({ error: 'Internal error' }, { status: 200 })
  }
}

// Handle GET for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Resend webhook endpoint is active',
    events: ['email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained'],
  })
}
