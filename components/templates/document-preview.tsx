"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Download, Printer, Send } from "lucide-react"
import { Lead } from "@/lib/store"
import { toast } from "sonner"

interface QuoteItem {
    description: string
    amount: number
}

interface DocumentPreviewProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    lead: Lead
    items: QuoteItem[]
    total: number
    onSend: () => void
}

export function DocumentPreview({ open, onOpenChange, lead, items, total, onSend }: DocumentPreviewProps) {
    const date = new Date()
    const reference = `OFF-${format(date, "yyyyMMdd")}-${lead.id.padStart(3, '0')}`
    
    const handlePrint = () => {
        window.print()
    }

    const downloadPdfBlob = (pdfBlob: Blob, filename: string) => {
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const handleDownloadPDF = async () => {
        try {
            // Dynamic import to avoid SSR issues
            const jsPDFModule = await import('jspdf')
            const jsPDF = jsPDFModule.default
            
            // Create A4 PDF (210mm x 297mm)
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const pageWidth = doc.internal.pageSize.getWidth()
            const margin = 20
            let yPos = 25

            // Colors
            const primaryColor: [number, number, number] = [30, 41, 59] // slate-800
            const goldColor: [number, number, number] = [161, 128, 71] // gold accent
            const grayColor: [number, number, number] = [100, 116, 139] // slate-500
            const emeraldColor: [number, number, number] = [5, 150, 105] // emerald-600

            // Header - Company Info (right aligned)
            doc.setFontSize(10)
            doc.setTextColor(...primaryColor)
            doc.setFont('helvetica', 'bold')
            doc.text('Bureau Broersma', pageWidth - margin, yPos, { align: 'right' })
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...grayColor)
            yPos += 5
            doc.text('Keizersgracht 123', pageWidth - margin, yPos, { align: 'right' })
            yPos += 5
            doc.text('1015 CJ Amsterdam', pageWidth - margin, yPos, { align: 'right' })
            yPos += 7
            doc.text('+31 20 123 4567', pageWidth - margin, yPos, { align: 'right' })
            yPos += 5
            doc.text('info@bureaubroersma.nl', pageWidth - margin, yPos, { align: 'right' })

            // Logo placeholder (left side) - Gold square with BB
            doc.setFillColor(...goldColor)
            doc.roundedRect(margin, 20, 40, 25, 3, 3, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(18)
            doc.setFont('helvetica', 'bold')
            doc.text('BB', margin + 20, 36, { align: 'center' })

            yPos = 60

            // Document Title
            doc.setFillColor(...primaryColor)
            doc.rect(margin, yPos, 35, 10, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('OFFERTE', margin + 17.5, yPos + 7, { align: 'center' })

            yPos += 25

            // Client Info (left) and Reference Info (right)
            doc.setTextColor(...grayColor)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.text('AAN', margin, yPos)
            
            yPos += 6
            doc.setTextColor(...primaryColor)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text(lead.clientName, margin, yPos)
            
            yPos += 6
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...grayColor)
            doc.text(lead.city, margin, yPos)

            // Reference info (right column)
            const refYStart = yPos - 12
            doc.setFontSize(9)
            doc.setTextColor(...grayColor)
            doc.text('Referentie:', pageWidth - margin - 40, refYStart)
            doc.setTextColor(...primaryColor)
            doc.setFont('helvetica', 'bold')
            doc.text(reference, pageWidth - margin, refYStart, { align: 'right' })
            
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...grayColor)
            doc.text('Datum:', pageWidth - margin - 40, refYStart + 6)
            doc.setTextColor(...primaryColor)
            doc.text(format(date, "d MMMM yyyy", { locale: nl }), pageWidth - margin, refYStart + 6, { align: 'right' })
            
            doc.setTextColor(...grayColor)
            doc.text('Project:', pageWidth - margin - 40, refYStart + 12)
            doc.setTextColor(...primaryColor)
            doc.text(lead.projectType, pageWidth - margin, refYStart + 12, { align: 'right' })

            yPos += 15

            // Introduction text
            doc.setFontSize(10)
            doc.setTextColor(...primaryColor)
            doc.setFont('helvetica', 'normal')
            
            const introText = `Geachte heer/mevrouw ${lead.clientName.split(' ').pop()},\n\nHartelijk dank voor uw aanvraag. Hierbij ontvangt u onze offerte voor de constructieve werkzaamheden met betrekking tot uw ${lead.projectType.toLowerCase()} project in ${lead.city}. Bureau Broersma staat garant voor kwaliteit en constructieve veiligheid.`
            
            const splitIntro = doc.splitTextToSize(introText, pageWidth - 2 * margin)
            doc.text(splitIntro, margin, yPos)
            yPos += splitIntro.length * 5 + 10

            // Table Header
            doc.setFillColor(...primaryColor)
            doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.text('OMSCHRIJVING', margin + 3, yPos + 5.5)
            doc.text('BEDRAG', pageWidth - margin - 3, yPos + 5.5, { align: 'right' })
            yPos += 8

            // Table Rows
            doc.setTextColor(...primaryColor)
            doc.setFontSize(10)
            items.forEach((item, index) => {
                // Alternate row background
                if (index % 2 === 0) {
                    doc.setFillColor(248, 250, 252) // slate-50
                    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F')
                }
                
                doc.setFont('helvetica', 'normal')
                doc.text(item.description, margin + 3, yPos + 7)
                doc.setFont('helvetica', 'bold')
                doc.text(`€ ${item.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos + 7, { align: 'right' })
                yPos += 10
            })

            yPos += 5

            // Totals section
            doc.setDrawColor(...primaryColor)
            doc.setLineWidth(0.5)
            doc.line(margin, yPos, pageWidth - margin, yPos)
            yPos += 8

            // Subtotal
            doc.setFontSize(10)
            doc.setTextColor(...grayColor)
            doc.setFont('helvetica', 'normal')
            doc.text('Subtotaal (excl. BTW)', margin, yPos)
            doc.setTextColor(...primaryColor)
            doc.setFont('helvetica', 'bold')
            doc.text(`€ ${total.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' })
            
            yPos += 6
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...grayColor)
            doc.text('BTW (21%)', margin, yPos)
            doc.text(`€ ${(total * 0.21).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' })
            
            yPos += 8
            doc.setDrawColor(226, 232, 240)
            doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3)
            
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...primaryColor)
            doc.text('Totaal (incl. BTW)', margin, yPos + 3)
            doc.setTextColor(...emeraldColor)
            doc.text(`€ ${(total * 1.21).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, pageWidth - margin, yPos + 3, { align: 'right' })

            // Footer
            yPos = 260

            doc.setDrawColor(226, 232, 240)
            doc.setLineWidth(0.3)
            doc.line(margin, yPos, pageWidth - margin, yPos)
            yPos += 8

            doc.setFontSize(8)
            doc.setTextColor(...grayColor)
            doc.setFont('helvetica', 'bold')
            doc.text('Betalingsvoorwaarden', margin, yPos)
            doc.text('Geldigheid', pageWidth / 2 + 10, yPos)
            
            yPos += 5
            doc.setFont('helvetica', 'normal')
            doc.text('Betaling binnen 14 dagen na factuurdatum.', margin, yPos)
            doc.text('Deze offerte is 30 dagen geldig.', pageWidth / 2 + 10, yPos)
            
            yPos += 4
            doc.text('IBAN: NL91 ABNA 0417 1643 00', margin, yPos)
            doc.text('KvK: 12345678 | BTW: NL001234567B01', pageWidth / 2 + 10, yPos)

            yPos += 10
            doc.setFontSize(7)
            doc.setTextColor(156, 163, 175)
            doc.text('Op al onze diensten zijn de algemene voorwaarden van toepassing (DNR 2011).', pageWidth / 2, yPos, { align: 'center' })

            // Download the PDF (more reliable than doc.save() in some browsers)
            const filename = `${reference}.pdf`
            const pdfBlob = doc.output("blob")
            downloadPdfBlob(pdfBlob, filename)
            
            toast.success("PDF gedownload", {
                description: `Offerte ${reference} is opgeslagen.`
            })
        } catch (error) {
            console.error('PDF generation error:', error)
            toast.error("Fout bij PDF genereren", {
                description: "Probeer het opnieuw."
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[900px] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-card flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <DialogTitle className="text-lg font-semibold">Document Voorbeeld</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Referentie: {reference}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                <Printer className="w-4 h-4" />
                                Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2">
                                <Download className="w-4 h-4" />
                                Download PDF
                            </Button>
                            <Button size="sm" onClick={onSend} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Send className="w-4 h-4" />
                                Verzenden
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                {/* Document Preview - Scrollable A4 Document */}
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-800 p-4 md:p-6">
                    <div 
                        id="quote-document"
                        className="mx-auto bg-white shadow-xl print:shadow-none rounded-sm max-w-[700px]"
                    >
                        <div className="p-6 md:p-8 flex flex-col text-slate-900 min-h-[800px]">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        BB
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Bureau Broersma</p>
                                        <p className="text-xs text-slate-500">Constructieve Engineering</p>
                                    </div>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                    <p>Keizersgracht 123</p>
                                    <p>1015 CJ Amsterdam</p>
                                    <p className="mt-1">+31 20 123 4567</p>
                                    <p>info@bureaubroersma.nl</p>
                                </div>
                            </div>

                            {/* Document Title */}
                            <div className="mb-6">
                                <div className="inline-block bg-slate-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                                    Offerte
                                </div>
                            </div>

                            {/* Client Info Grid */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Aan</p>
                                    <p className="font-bold text-base">{lead.clientName}</p>
                                    <p className="text-sm text-slate-600">{lead.city}</p>
                                </div>
                                <div className="text-right">
                                    <div className="space-y-0.5 text-xs">
                                        <p><span className="text-slate-500">Referentie:</span> <span className="font-mono font-semibold">{reference}</span></p>
                                        <p><span className="text-slate-500">Datum:</span> {format(date, "d MMMM yyyy", { locale: nl })}</p>
                                        <p><span className="text-slate-500">Project:</span> {lead.projectType}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Introduction */}
                            <div className="mb-6 text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p>
                                    Hartelijk dank voor uw aanvraag. Hierbij ontvangt u onze offerte voor de constructieve werkzaamheden 
                                    met betrekking tot uw {lead.projectType.toLowerCase()} project in {lead.city}. 
                                    Bureau Broersma staat garant voor kwaliteit en constructieve veiligheid.
                                </p>
                            </div>

                            {/* Items Table */}
                            <div className="mb-6 flex-1">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900">
                                            <th className="text-left py-2 font-bold uppercase tracking-wider text-[10px]">Omschrijving</th>
                                            <th className="text-right py-2 font-bold uppercase tracking-wider text-[10px] w-28">Bedrag</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-3 text-slate-800 text-sm">{item.description}</td>
                                                <td className="py-3 text-right font-mono font-medium text-sm">
                                                    € {item.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals */}
                                <div className="border-t-2 border-slate-900 mt-3 pt-3 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Subtotaal (excl. BTW)</span>
                                        <span className="font-mono font-medium">€ {total.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>BTW (21%)</span>
                                        <span className="font-mono">€ {(total * 0.21).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-300">
                                        <span>Totaal (incl. BTW)</span>
                                        <span className="font-mono text-emerald-700">€ {(total * 1.21).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-auto pt-6 border-t border-slate-200">
                                <div className="grid grid-cols-2 gap-6 text-[11px] text-slate-500">
                                    <div>
                                        <p className="font-semibold text-slate-700 mb-0.5">Betalingsvoorwaarden</p>
                                        <p>Betaling binnen 14 dagen na factuurdatum.</p>
                                        <p>IBAN: NL91 ABNA 0417 1643 00</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-700 mb-0.5">Geldigheid</p>
                                        <p>Deze offerte is 30 dagen geldig.</p>
                                        <p>KvK: 12345678 | BTW: NL001234567B01</p>
                                    </div>
                                </div>
                                <p className="text-center text-[10px] text-slate-400 mt-4">
                                    Op al onze diensten zijn de algemene voorwaarden van toepassing (DNR 2011).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
