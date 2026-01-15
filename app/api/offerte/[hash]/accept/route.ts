/**
 * @fileoverview API route for accepting a quote
 * 
 * Public endpoint - no authentication required
 * Creates legally binding acceptance with full audit trail
 * 
 * Evidence captured:
 * - Email address (from quote)
 * - IP address
 * - User agent
 * - Timestamp
 * - Terms acceptance checkbox
 * - Optional note
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const AcceptanceSchema = z.object({
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "U moet akkoord gaan met de algemene voorwaarden"
  }),
  note: z.string().max(1000).optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params

  if (!hash || hash.length < 10) {
    return NextResponse.json(
      { error: "Ongeldige offerte-link" },
      { status: 400 }
    )
  }

  // Parse request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Ongeldige request" },
      { status: 400 }
    )
  }

  // Validate input
  const validation = AcceptanceSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || "Ongeldige invoer" },
      { status: 400 }
    )
  }

  const { termsAccepted, note } = validation.data

  // Get client IP and User Agent for legal evidence
  const forwardedFor = request.headers.get("x-forwarded-for")
  const clientIp = forwardedFor?.split(",")[0]?.trim() || 
                   request.headers.get("x-real-ip") || 
                   "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  try {
    // Find quote by acceptance hash
    const quote = await prisma.quoteVersion.findUnique({
      where: { acceptanceHash: hash },
      include: {
        lead: {
          select: {
            id: true,
            clientName: true,
            clientEmail: true,
            projectType: true,
            city: true,
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: "Offerte niet gevonden" },
        { status: 404 }
      )
    }

    // Check if already accepted
    if (quote.acceptedAt) {
      return NextResponse.json(
        { error: "Deze offerte is al geaccepteerd" },
        { status: 409 }
      )
    }

    // Check if link has expired
    if (quote.hashExpiresAt && new Date() > quote.hashExpiresAt) {
      return NextResponse.json(
        { error: "Deze offerte-link is verlopen" },
        { status: 410 }
      )
    }

    const now = new Date()
    const clientEmail = quote.lead.clientEmail || "onbekend"

    // Perform all updates in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update QuoteVersion with acceptance data
      await tx.quoteVersion.update({
        where: { id: quote.id },
        data: {
          status: "accepted",
          acceptedAt: now,
          acceptedByEmail: clientEmail,
          acceptedFromIp: clientIp,
          acceptedUserAgent: userAgent,
          acceptanceNote: note || null,
          termsAccepted: true
        }
      })

      // 2. Update Lead status to "Opdracht"
      await tx.lead.update({
        where: { id: quote.leadId },
        data: {
          status: "Opdracht",
          quoteApproval: "approved",
          updatedAt: now
        }
      })

      // 3. Create Activity record
      await tx.activity.create({
        data: {
          leadId: quote.leadId,
          type: "quote_accepted",
          content: `Offerte v${quote.version} geaccepteerd door klant (${clientEmail})`,
          author: clientEmail,
          metadata: {
            quoteId: quote.id,
            quoteVersion: quote.version,
            quoteValue: quote.value,
            acceptedAt: now.toISOString(),
            ip: clientIp,
            userAgent: userAgent.substring(0, 200), // Truncate for storage
            termsAccepted: true,
            note: note || null
          }
        }
      })

      // 4. Create AuditLog entry (legally binding evidence)
      await tx.auditLog.create({
        data: {
          entityType: "quote",
          entityId: quote.id,
          action: "accept",
          changes: [
            { field: "status", oldValue: quote.status, newValue: "accepted" },
            { field: "acceptedAt", oldValue: null, newValue: now.toISOString() },
            { field: "acceptedByEmail", oldValue: null, newValue: clientEmail },
            { field: "termsAccepted", oldValue: false, newValue: true }
          ],
          userId: "client",
          userName: clientEmail,
          ipAddress: clientIp,
          userAgent: userAgent.substring(0, 500)
        }
      })

      // 5. Also log lead status change
      await tx.auditLog.create({
        data: {
          entityType: "lead",
          entityId: quote.leadId,
          action: "update",
          changes: [
            { field: "status", oldValue: "OfferteVerzonden", newValue: "Opdracht" }
          ],
          userId: "client",
          userName: clientEmail,
          ipAddress: clientIp,
          userAgent: userAgent.substring(0, 500)
        }
      })
    })

    // TODO: Trigger confirmation email via Resend
    // This should be done outside the transaction for better reliability
    // await sendOrderConfirmationEmail(quote.lead.clientEmail, quote)

    console.log(`[API] Quote ${quote.id} accepted by ${clientEmail} from IP ${clientIp}`)

    return NextResponse.json({
      success: true,
      message: "Offerte succesvol geaccepteerd",
      data: {
        quoteId: quote.id,
        leadId: quote.leadId,
        acceptedAt: now.toISOString()
      }
    })
  } catch (error) {
    console.error("[API] Error accepting quote:", error)
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwerken van uw acceptatie" },
      { status: 500 }
    )
  }
}
