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
  
  // Extended fields (new)
  aandachtspunten?: string
  includeArchiefonderzoek?: boolean
  includeWerkbezoek?: boolean
  workSpecification?: string
}

// Generate unique quote number
export function generateQuoteNumber(leadId: string): string {
  const year = new Date().getFullYear()
  const shortId = leadId.slice(-6).toUpperCase()
  const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `BB-${year}-${shortId}-${sequence}`
}

// Format currency (excl BTW)
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

// Convert image URL to base64
async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => resolve(reader.result as string), false)
    reader.onerror = () => reject(new Error("Failed to convert image to base64"))
    reader.readAsDataURL(blob)
  })
}

// Calculate height needed for the table
function calculateTableHeight(doc: jsPDF, lineItems: QuoteLineItem[], margin: number, pageWidth: number): number {
  // Header + items + 3 footer rows + padding
  const headerHeight = 12
  const rowHeight = 10
  const footerRows = 3
  const padding = 10
  return headerHeight + (lineItems.length * rowHeight) + (footerRows * rowHeight) + padding
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
  const contentWidth = pageWidth - (margin * 2)
  
  // Colors
  const primaryColor: [number, number, number] = [30, 58, 95] // #1e3a5f
  const goldColor: [number, number, number] = [212, 175, 55] // #d4af37
  const textColor: [number, number, number] = [26, 26, 26]
  
  // Helper function to add footer
  const addFooter = () => {
    const footerY = pageHeight - 20
    
    // Line above footer
    doc.setDrawColor(...goldColor)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
    
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Broersma Bouwadvies B.V.', margin, footerY)
    doc.text('KvK: 64955133 | BTW: NL855919851B01', margin, footerY + 4)
    
    doc.text('www.broersma-bouwadvies.nl', pageWidth / 2, footerY, { align: 'center' })
    doc.text('info@broersma-bouwadvies.nl', pageWidth / 2, footerY + 4, { align: 'center' })
    
    doc.text('IBAN: NL12 BANK 0123 4567 89', pageWidth - margin, footerY, { align: 'right' })
  }
  
  // Helper function to add header
  const addHeader = async () => {
    // Header background
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 45, 'F')
    
    // Add Logo
    try {
      const logoBase64 = await getBase64ImageFromUrl('/branding/logo-white-gold.png')
      const logoSize = 25
      const logoX = margin
      const logoY = (45 - logoSize) / 2
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize)
      
      // Company name - "Broersma Bouwadvies"
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Broersma Bouwadvies', logoX + logoSize + 5, 22)
      
      // Tagline
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...goldColor)
      doc.text('Constructieve berekeningen voor aanbouw, uitbouw, dakkapel, kozijn & VvE', logoX + logoSize + 5, 30)
    } catch {
      // Fallback if logo fails
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Broersma Bouwadvies', margin, 22)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...goldColor)
      doc.text('Constructieve berekeningen voor aanbouw, uitbouw, dakkapel, kozijn & VvE', margin, 30)
    }
    
    // Quote label
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text('OFFERTE', pageWidth - margin, 22, { align: 'right' })
    doc.setFontSize(10)
    doc.text(data.quoteNumber, pageWidth - margin, 30, { align: 'right' })
  }
  
  // ============================================================
  // PAGE 1: Header, Client Info, Introduction, Table
  // ============================================================
  
  await addHeader()
  
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
  // INTRODUCTION TEXT
  // ============================================================
  
  yPos = Math.max(yPos, rightY) + 20
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  // New introduction text
  const introText = `Geachte ${data.clientName},

Hierbij ontvangt u onze offerte ten behoeve van de adviezen, berekeningen en tekeningen voor de constructieve werkzaamheden met betrekking tot uw ${data.projectType} project aan ${data.address || ''} te ${data.city}.`
  
  const splitIntro = doc.splitTextToSize(introText, contentWidth)
  doc.text(splitIntro, margin, yPos)
  yPos += splitIntro.length * 5 + 10
  
  // ============================================================
  // LINE ITEMS TABLE
  // ============================================================
  
  // Build table data with automatic project type line item
  const tableData: string[][] = []
  
  // Add automatic line for project type with reference to work specification
  if (data.workSpecification) {
    tableData.push([
      `${data.projectType}; zie overzicht werkzaamheden verderop in het document`,
      formatCurrency(data.lineItems.find(i => i.description.toLowerCase().includes(data.projectType.toLowerCase()))?.amount || data.lineItems[0]?.amount || 0)
    ])
  }
  
  // Add remaining line items
  data.lineItems.forEach(item => {
    // Skip if it's the base project type (already added above)
    if (data.workSpecification && item.description.toLowerCase().includes(data.projectType.toLowerCase())) {
      return
    }
    tableData.push([item.description, formatCurrency(item.amount)])
  })
  
  // Add Archiefonderzoek if included
  if (data.includeArchiefonderzoek) {
    tableData.push([
      'Onderzoek bij het archief van de gemeente naar de oorspronkelijke bouwtekeningen',
      'Inbegrepen'
    ])
  }
  
  // Add Werkbezoek if included
  if (data.includeWerkbezoek) {
    tableData.push([
      'Werkbezoek 1 uur, binnen omgeving Den Haag',
      'Inbegrepen'
    ])
  }
  
  // Calculate subtotal (excl BTW)
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0)
  
  // Check if table fits on current page
  const tableHeight = calculateTableHeight(doc, data.lineItems, margin, pageWidth)
  const remainingSpace = pageHeight - yPos - 40 // 40 for footer
  
  if (tableHeight > remainingSpace) {
    // Move table to next page
    doc.addPage()
    await addHeader()
    yPos = 60
    // Reset text color after header
    doc.setTextColor(...textColor)
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Overzicht van de werkzaamheden', 'Bedrag']],
    body: tableData,
    foot: [
      ['Totaal (excl. BTW)', formatCurrency(subtotal)]
    ],
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      cellPadding: 4
    },
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: textColor,
      fontStyle: 'bold',
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 45, halign: 'right' }
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1
    }
  })
  
  // @ts-expect-error autoTable adds this property
  yPos = doc.lastAutoTable.finalY + 5
  
  // Add note about BTW
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text('Alle prijzen zijn exclusief 21% BTW', margin, yPos)
  doc.setTextColor(...textColor)
  
  addFooter()
  
  // ============================================================
  // PAGE 2: Work Specification, Aandachtspunten, Niet Inbegrepen, Algemeen
  // ============================================================
  
  doc.addPage()
  await addHeader()
  yPos = 60
  
  // IMPORTANT: Reset text color after header (header leaves color as white/gold)
  doc.setTextColor(...textColor)
  
  // OVERZICHT VAN DE WERKZAAMHEDEN
  if (data.workSpecification) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Overzicht van de werkzaamheden', margin, yPos)
    yPos += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const splitSpec = doc.splitTextToSize(data.workSpecification, contentWidth)
    doc.text(splitSpec, margin, yPos)
    yPos += splitSpec.length * 5 + 15
  }
  
  // AANDACHTSPUNTEN
  if (data.aandachtspunten && data.aandachtspunten.trim()) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Aandachtspunten', margin, yPos)
    yPos += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const splitAandacht = doc.splitTextToSize(data.aandachtspunten, contentWidth)
    doc.text(splitAandacht, margin, yPos)
    yPos += splitAandacht.length * 5 + 15
  }
  
  // NIET INBEGREPEN
  const nietInbegrepen: string[] = []
  if (!data.includeArchiefonderzoek) {
    nietInbegrepen.push('Onderzoek bij het archief van de gemeente naar de oorspronkelijke bouwtekeningen')
  }
  if (!data.includeWerkbezoek) {
    nietInbegrepen.push('Werkbezoek 1 uur, binnen omgeving Den Haag')
  }
  
  if (nietInbegrepen.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Niet inbegrepen', margin, yPos)
    yPos += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    nietInbegrepen.forEach(item => {
      doc.text(`• ${item}`, margin + 2, yPos)
      yPos += 6
    })
    yPos += 10
  }
  
  // ALGEMEEN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Algemeen', margin, yPos)
  yPos += 8
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const algemeenPunten = [
    'Onze stukken zijn geschikt voor indiening bij Bouw en Woning Toezicht.',
    'Voor het aanvragen van een vergunning heeft u naast onze stukken ook bouwkundige tekeningen nodig.',
    'Deze bouwkundige tekeningen dienen door een architect of een bouwkundig bureau te worden aangeleverd.',
    'Onze berekeningen worden digitaal aangeleverd in PDF formaat.',
    'Onze tekeningen worden digitaal aangeleverd in PDF - of DWG formaat.',
    'Indiening bij Bouw en Woning Toezicht wordt door opdrachtgever of architect gedaan.'
  ]
  
  algemeenPunten.forEach(punt => {
    const splitPunt = doc.splitTextToSize(`• ${punt}`, contentWidth - 5)
    doc.text(splitPunt, margin + 2, yPos)
    yPos += splitPunt.length * 5 + 2
  })
  
  addFooter()
  
  // ============================================================
  // PAGE 3: ALGEMENE VOORWAARDEN
  // ============================================================
  
  doc.addPage()
  await addHeader()
  yPos = 60
  
  // IMPORTANT: Reset text color after header (header leaves color as white/gold)
  doc.setTextColor(...textColor)
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Algemene Voorwaarden', margin, yPos)
  yPos += 10
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  const voorwaarden = `
1. TOEPASSELIJKHEID
Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, offertes, werkzaamheden, opdrachten en overeenkomsten van Broersma Bouwadvies B.V.

2. OFFERTES
Alle offertes zijn geldig voor een periode van 6 maanden, tenzij anders vermeld. Offertes zijn gebaseerd op de ten tijde van de offerte door opdrachtgever verstrekte informatie.

3. UITVOERING VAN DE OVEREENKOMST
Broersma Bouwadvies B.V. zal de overeenkomst naar beste inzicht en vermogen uitvoeren, overeenkomstig de eisen van goed vakmanschap. De opdrachtnemer heeft het recht werkzaamheden te laten verrichten door derden.

4. BETALING
Betaling dient te geschieden binnen 14 dagen na factuurdatum, tenzij anders schriftelijk overeengekomen. Bij niet-tijdige betaling is opdrachtgever van rechtswege in verzuim en is een rente van 1% per maand verschuldigd.

5. AANSPRAKELIJKHEID
De aansprakelijkheid van Broersma Bouwadvies B.V. is beperkt tot het bedrag dat door de beroepsaansprakelijkheidsverzekering wordt gedekt, met een maximum van het factuurbedrag van de betreffende opdracht.

6. INTELLECTUEEL EIGENDOM
Alle door Broersma Bouwadvies B.V. vervaardigde berekeningen, tekeningen en andere documenten blijven intellectueel eigendom van Broersma Bouwadvies B.V. en mogen niet zonder schriftelijke toestemming worden verveelvoudigd of aan derden ter beschikking worden gesteld.

7. DNR 2025
Op deze overeenkomst zijn de DNR 2025 (De Nieuwe Regeling 2025) van toepassing, voor zover hiervan in deze voorwaarden niet wordt afgeweken.

8. TOEPASSELIJK RECHT EN GESCHILLEN
Op alle overeenkomsten is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement Den Haag.
`.trim()

  const splitVoorwaarden = doc.splitTextToSize(voorwaarden, contentWidth)
  
  // Check if we need multiple pages for terms
  const linesPerPage = 55
  let lineIndex = 0
  
  while (lineIndex < splitVoorwaarden.length) {
    const pageLines = splitVoorwaarden.slice(lineIndex, lineIndex + linesPerPage)
    doc.text(pageLines, margin, yPos)
    lineIndex += linesPerPage
    
    if (lineIndex < splitVoorwaarden.length) {
      addFooter()
      doc.addPage()
      await addHeader()
      yPos = 60
      // Reset text color after header
      doc.setTextColor(...textColor)
    }
  }
  
  addFooter()
  
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
