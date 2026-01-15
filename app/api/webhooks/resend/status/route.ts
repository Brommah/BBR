import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

/**
 * Webhook Status Endpoint
 * 
 * Returns the current webhook configuration status and recent event statistics.
 * Used by the admin panel to show whether webhooks are properly configured.
 */

export async function GET() {
  try {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Check if webhook secret is configured
    const webhookSecretConfigured = !!process.env.RESEND_WEBHOOK_SECRET

    // Get recent email events from webhooks
    const [recentEvents, weeklyEvents, totalEvents] = await Promise.all([
      prisma.emailEvent.count({
        where: { createdAt: { gte: oneDayAgo } }
      }),
      prisma.emailEvent.count({
        where: { createdAt: { gte: oneWeekAgo } }
      }),
      prisma.emailEvent.count()
    ])

    // Get event breakdown by type
    const eventBreakdown = await prisma.emailEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
      where: { createdAt: { gte: oneWeekAgo } }
    })

    // Get the last event timestamp
    const lastEvent = await prisma.emailEvent.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, eventType: true }
    })

    // Determine webhook status
    let status: 'active' | 'inactive' | 'unknown' = 'unknown'
    let statusMessage = ''

    if (totalEvents > 0) {
      // We have received events, so webhook is working
      status = 'active'
      statusMessage = 'Webhooks zijn actief en ontvangen events'
    } else if (!webhookSecretConfigured) {
      status = 'inactive'
      statusMessage = 'RESEND_WEBHOOK_SECRET is niet geconfigureerd'
    } else {
      status = 'unknown'
      statusMessage = 'Webhook geconfigureerd, maar nog geen events ontvangen'
    }

    return NextResponse.json({
      success: true,
      data: {
        status,
        statusMessage,
        configuration: {
          webhookSecretConfigured,
          webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/webhooks/resend`,
          supportedEvents: ['email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained']
        },
        statistics: {
          totalEvents,
          last24Hours: recentEvents,
          last7Days: weeklyEvents,
          lastEventAt: lastEvent?.createdAt?.toISOString() || null,
          lastEventType: lastEvent?.eventType || null,
          breakdown: eventBreakdown.reduce((acc, item) => {
            acc[item.eventType] = item._count.id
            return acc
          }, {} as Record<string, number>)
        }
      }
    })
  } catch (error) {
    console.error('[Webhook Status] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhook status'
    }, { status: 500 })
  }
}
