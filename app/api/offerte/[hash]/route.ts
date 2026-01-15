/**
 * @fileoverview API route for loading quote data by acceptance hash
 * 
 * Public endpoint - no authentication required
 * Used by the client-facing quote acceptance page
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
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
            address: true,
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
        { 
          error: "Deze offerte is al geaccepteerd",
          quote: {
            clientName: quote.lead.clientName,
            acceptedAt: quote.acceptedAt.toISOString()
          }
        },
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

    // Check if quote was rejected or is in wrong status
    if (quote.status === 'rejected' || quote.status === 'draft') {
      return NextResponse.json(
        { error: "Deze offerte is niet meer beschikbaar" },
        { status: 410 }
      )
    }

    // Return quote data for display
    const lineItems = (quote.lineItems as Array<{ description: string; amount: number }>) || []
    
    return NextResponse.json({
      id: quote.id,
      version: quote.version,
      leadId: quote.leadId,
      clientName: quote.lead.clientName,
      clientEmail: quote.lead.clientEmail || "",
      projectType: quote.lead.projectType,
      city: quote.lead.city,
      address: quote.lead.address,
      value: quote.value,
      lineItems,
      description: quote.description,
      createdAt: quote.createdAt.toISOString(),
      expiresAt: quote.hashExpiresAt?.toISOString(),
      status: quote.status
    })
  } catch (error) {
    console.error("[API] Error loading quote:", error)
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    )
  }
}
