"use client"

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface QuoteLineItem {
  description: string
  amount: number
}

interface QuotePDFData {
  // Client info
  clientName: string
  clientEmail?: string
  clientPhone?: string
  address?: string
  city: string
  
  // Project info
  projectType: string
  leadId: string
  
  // Quote info
  quoteValue: number
  quoteDescription?: string
  lineItems: QuoteLineItem[]
  estimatedHours?: number
  
  // Meta
  quoteDate: Date
  validUntil: Date
  quoteNumber: string
}

// Generate unique quote number
export function generateQuoteNumber(leadId: string): string {
  const year = new Date().getFullYear()
  const shortId = leadId.slice(-6).toUpperCase()
  const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `BB-${year}-${shortId}-${sequence}`
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

// Format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(date)
}

export async function generateQuotePDF(data: QuotePDFData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  
  // Colors
  const primaryColor: [number, number, number] = [30, 58, 95] // #1e3a5f
  const goldColor: [number, number, number] = [212, 175, 55] // #d4af37
  const textColor: [number, number, number] = [26, 26, 26]
  
  // ============================================================
  // HEADER
  // ============================================================
  
  // Header background
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 45, 'F')
  
  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Broersma Bouwadvies', margin, 20)
  
  // Tagline
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...goldColor)
  doc.text('Constructieve berekeningen voor aanbouw, uitbouw, dakkapel, kozijn & VvE', margin, 28)
  
  // Quote label
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text('OFFERTE', pageWidth - margin, 20, { align: 'right' })
  doc.setFontSize(10)
  doc.text(data.quoteNumber, pageWidth - margin, 28, { align: 'right' })
  
  // ============================================================
  // CLIENT & QUOTE INFO
  // ============================================================
  
  let yPos = 60
  
  // Left column - Client info
  doc.setTextColor(...textColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Aan:', margin, yPos)
  
  doc.setFont('helvetica', 'normal')
  yPos += 6
  doc.text(data.clientName, margin, yPos)
  
  if (data.address) {
    yPos += 5
    doc.text(data.address, margin, yPos)
  }
  
  yPos += 5
  doc.text(data.city, margin, yPos)
  
  if (data.clientEmail) {
    yPos += 5
    doc.text(data.clientEmail, margin, yPos)
  }
  
  if (data.clientPhone) {
    yPos += 5
    doc.text(data.clientPhone, margin, yPos)
  }
  
  // Right column - Quote info
  const rightCol = pageWidth - margin - 60
  let rightY = 60
  
  doc.setFont('helvetica', 'bold')
  doc.text('Offertedatum:', rightCol, rightY)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(data.quoteDate), rightCol + 35, rightY)
  
  rightY += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Geldig tot:', rightCol, rightY)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(data.validUntil), rightCol + 35, rightY)
  
  rightY += 6
  doc.setFont('helvetica', 'bold')
  doc.text('Project:', rightCol, rightY)
  doc.setFont('helvetica', 'normal')
  doc.text(data.projectType, rightCol + 35, rightY)
  
  // ============================================================
  // PROJECT DESCRIPTION
  // ============================================================
  
  yPos = Math.max(yPos, rightY) + 20
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Offerte: Constructieve berekening ${data.projectType}`, margin, yPos)
  
  if (data.quoteDescription) {
    yPos += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Word wrap description
    const splitDescription = doc.splitTextToSize(data.quoteDescription, pageWidth - (margin * 2))
    doc.text(splitDescription, margin, yPos)
    yPos += splitDescription.length * 5
  }
  
  // ============================================================
  // LINE ITEMS TABLE
  // ============================================================
  
  yPos += 10
  
  const tableData = data.lineItems.map(item => [
    item.description,
    formatCurrency(item.amount)
  ])
  
  // Calculate subtotal
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const btw = subtotal * 0.21
  const total = subtotal + btw
  
  autoTable(doc, {
    startY: yPos,
    head: [['Omschrijving', 'Bedrag']],
    body: tableData,
    foot: [
      ['Subtotaal (excl. BTW)', formatCurrency(subtotal)],
      ['BTW (21%)', formatCurrency(btw)],
      ['Totaal (incl. BTW)', formatCurrency(total)]
    ],
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: textColor,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 40, halign: 'right' }
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    }
  })
  
  // @ts-expect-error autoTable adds this property
  yPos = doc.lastAutoTable.finalY + 15
  
  // ============================================================
  // WHAT'S INCLUDED
  // ============================================================
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Wat is inbegrepen:', margin, yPos)
  
  const includes = [
    'Volledige constructieve berekening volgens Eurocode',
    'Constructietekeningen geschikt voor vergunningaanvraag',
    'Revisie indien nodig na beoordeling gemeente',
    'Telefonische ondersteuning gedurende het project'
  ]
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  includes.forEach((item) => {
    yPos += 6
    doc.text(`• ${item}`, margin + 2, yPos)
  })
  
  // ============================================================
  // ESTIMATED HOURS
  // ============================================================
  
  if (data.estimatedHours) {
    yPos += 12
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text(`Geschatte doorlooptijd: ${data.estimatedHours} uur`, margin, yPos)
    doc.setTextColor(...textColor)
  }
  
  // ============================================================
  // TERMS
  // ============================================================
  
  yPos += 15
  doc.setFillColor(250, 250, 250)
  doc.rect(margin, yPos - 4, pageWidth - (margin * 2), 25, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Voorwaarden:', margin + 3, yPos + 2)
  
  doc.setFont('helvetica', 'normal')
  const terms = [
    'Betaling binnen 14 dagen na factuurdatum',
    'Deze offerte is 30 dagen geldig',
    'Op al onze diensten zijn onze algemene voorwaarden van toepassing'
  ]
  
  terms.forEach((term, i) => {
    doc.text(`• ${term}`, margin + 3, yPos + 8 + (i * 5))
  })
  
  // ============================================================
  // FOOTER
  // ============================================================
  
  const footerY = pageHeight - 20
  
  // Line above footer
  doc.setDrawColor(...goldColor)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
  
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Broersma Bouwadvies B.V.', margin, footerY)
  doc.text('KvK: 12345678 | BTW: NL123456789B01', margin, footerY + 4)
  
  doc.text('www.broersma-bouwadvies.nl', pageWidth / 2, footerY, { align: 'center' })
  doc.text('info@broersma-bouwadvies.nl', pageWidth / 2, footerY + 4, { align: 'center' })
  
  doc.text('IBAN: NL12 BANK 0123 4567 89', pageWidth - margin, footerY, { align: 'right' })
  
  // Return as blob
  return doc.output('blob')
}

// Download PDF
export async function downloadQuotePDF(data: QuotePDFData, filename?: string): Promise<void> {
  const blob = await generateQuotePDF(data)
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `Offerte_${data.quoteNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Open PDF in new tab
export async function openQuotePDF(data: QuotePDFData): Promise<void> {
  const blob = await generateQuotePDF(data)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
