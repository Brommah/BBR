"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useParams } from "next/navigation"
import { useLeadStore, QuoteLineItem, Lead } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { toast } from "sonner"
import { 
    FileText, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Send, 
    Eye, 
    Plus, 
    Trash2, 
    MessageSquare, 
    Loader2, 
    Calculator, 
    Download,
    FileCheck,
    PartyPopper,
    AlertCircle,
    AlertTriangle
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { getCostRates } from "@/lib/db-actions"
import { DocumentPreview } from "@/components/templates/document-preview"
import { downloadQuotePDF, generateQuoteNumber, generateQuotePDF } from "@/lib/pdf"
import { sendQuoteEmail } from "@/lib/email"
import { createQuoteVersion, getUsers } from "@/lib/db-actions"
import { uploadFile } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface QuotePanelSmartProps {
    lead: Lead
    onQuoteAccepted?: () => void
}

type QuoteWorkflowState = 
    | 'building'      // Engineer is creating/editing
    | 'pending'       // Waiting for admin approval
    | 'approved'      // Admin approved, ready to send
    | 'sent'          // Sent to client, waiting for response
    | 'accepted'      // Client accepted - should archive
    | 'rejected'      // Admin rejected, needs revision

export function QuotePanelSmart({ lead, onQuoteAccepted }: QuotePanelSmartProps) {
    const { submitQuoteForApproval, updateLeadStatus, approveQuote, rejectQuote } = useLeadStore()
    const { currentUser, isAdmin } = useAuthStore()
    const leadId = lead.id

    // Determine workflow state
    const workflowState: QuoteWorkflowState = useMemo(() => {
        if (lead.status === 'Opdracht') return 'accepted'
        if (lead.status === 'Offerte Verzonden') return 'sent'
        
        const approval = lead.quoteApproval
        if (approval === 'pending') return 'pending'
        if (approval === 'approved') return 'approved'
        if (approval === 'rejected') return 'rejected'
        return 'building'
    }, [lead.status, lead.quoteApproval])

    // Quote editing state
    const [lineItems, setLineItems] = useState<QuoteLineItem[]>([{ description: "", amount: 0 }])
    const [description, setDescription] = useState("")
    const [aandachtspunten, setAandachtspunten] = useState("")
    const [includeArchiefonderzoek, setIncludeArchiefonderzoek] = useState(false)
    const [includeWerkbezoek, setIncludeWerkbezoek] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [baseRate, setBaseRate] = useState<{ price: number; workSpecification: string | null } | null>(null)
    
    // Admin approval state
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [isApproving, setIsApproving] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)

    // Load existing quote data
    useEffect(() => {
        if (lead?.quoteLineItems && lead.quoteLineItems.length > 0) {
            setLineItems(lead.quoteLineItems)
        }
        if (lead?.quoteDescription) {
            setDescription(lead.quoteDescription)
        }
    }, [lead?.id, lead?.quoteLineItems, lead?.quoteDescription])

    // Load base rate for this project type
    useEffect(() => {
        async function loadBaseRate() {
            try {
                const result = await getCostRates()
                if (result.success && result.data) {
                    const rates = result.data as Array<{
                        id: string
                        basePrice: number
                        projectType: string | null
                        workSpecification: string | null
                    }>
                    const rate = rates.find(r => r.projectType === lead.projectType)
                    if (rate) {
                        setBaseRate({
                            price: rate.basePrice,
                            workSpecification: rate.workSpecification
                        })
                    }
                }
            } catch (error) {
                console.error('Failed to load base rate:', error)
            }
        }
        loadBaseRate()
    }, [lead.projectType])

    const addLineItem = () => setLineItems([...lineItems, { description: "", amount: 0 }])
    
    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== index))
    }

    const updateLineItem = (index: number, field: keyof QuoteLineItem, value: string | number) => {
        const updated = [...lineItems]
        if (field === 'amount') {
            updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value
        } else {
            updated[index][field] = value as string
        }
        setLineItems(updated)
    }

    const total = useMemo(() => lineItems.reduce((sum, item) => sum + (item.amount || 0), 0), [lineItems])
    const validLineItems = useMemo(() => lineItems.filter(item => item.description.trim() && item.amount > 0), [lineItems])

    const isEditable = isAdmin() || workflowState === 'building' || workflowState === 'rejected'

    // === ACTION HANDLERS ===
    
    const handleSubmitForApproval = async () => {
        if (validLineItems.length === 0) {
            toast.error("Voeg minimaal één regel toe")
            return
        }
        if (total <= 0) {
            toast.error("Offertebedrag moet groter zijn dan €0")
            return
        }

        setIsSubmitting(true)
        try {
            // Build extended description with metadata
            const extendedDescription = JSON.stringify({
                description,
                aandachtspunten,
                includeArchiefonderzoek,
                includeWerkbezoek,
                workSpecification: baseRate?.workSpecification || ''
            })
            
            const success = await submitQuoteForApproval(leadId, {
                quoteValue: total,
                quoteDescription: extendedDescription,
                quoteLineItems: validLineItems
            })
            
            if (success) {
                await createQuoteVersion({
                    leadId,
                    value: total,
                    lineItems: validLineItems,
                    description: extendedDescription,
                    status: 'submitted',
                    createdBy: currentUser?.name || 'Unknown'
                })
                toast.info("Offerte ingediend ter goedkeuring")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleApprove = async () => {
        setIsApproving(true)
        try {
            const success = await approveQuote(leadId)
            if (success) {
                toast.success("Offerte goedgekeurd!", {
                    description: "De engineer kan nu de offerte versturen."
                })
            }
        } finally {
            setIsApproving(false)
        }
    }

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error("Geef een reden voor afkeuring")
            return
        }
        
        setIsRejecting(true)
        try {
            const feedbackObj = {
                authorId: currentUser?.id || '',
                authorName: currentUser?.name || 'Admin',
                message: rejectReason,
            }
            const success = await rejectQuote(leadId, feedbackObj)
            if (success) {
                toast.info("Offerte afgekeurd", {
                    description: "De engineer ontvangt je feedback."
                })
                setShowRejectForm(false)
                setRejectReason("")
            }
        } finally {
            setIsRejecting(false)
        }
    }

    const handleSendQuote = async () => {
        if (!lead.clientEmail) {
            toast.error("Geen e-mailadres beschikbaar")
            return
        }
        
        setIsSending(true)
        try {
            // Get projectleider contact info if assigned
            let contactPerson: { name: string; email: string } | undefined
            if (lead.assignedProjectleider) {
                const usersResult = await getUsers('projectleider')
                if (usersResult.success && usersResult.data) {
                    const users = usersResult.data as Array<{ name: string; email: string }>
                    const pl = users.find(u => u.name === lead.assignedProjectleider)
                    if (pl) {
                        contactPerson = { name: pl.name, email: pl.email }
                    }
                }
            }
            
            const emailResult = await sendQuoteEmail({
                to: lead.clientEmail,
                clientName: lead.clientName,
                projectType: lead.projectType,
                quoteValue: lead.quoteValue || total,
                quoteDescription: description || undefined,
                leadId,
                sentBy: currentUser?.name || 'System',
                contactPerson
            })
            
            if (!emailResult.success) {
                toast.error("Kon e-mail niet verzenden", { description: emailResult.error })
                return
            }
            
            await createQuoteVersion({
                leadId,
                value: lead.quoteValue || total,
                lineItems: validLineItems,
                description: description || undefined,
                status: 'sent',
                createdBy: currentUser?.name || 'Unknown'
            })
            
            await updateLeadStatus(leadId, "Offerte Verzonden")
            setPreviewOpen(false)
            toast.success("Offerte verzonden naar klant!")
        } finally {
            setIsSending(false)
        }
    }
    
    const handleDownloadPDF = async () => {
        // Generate filename: offerte_${projectType}${streetname}${date}
        const streetName = lead.address?.split(/\s+\d/)[0]?.replace(/\s+/g, '') || 'Onbekend'
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
        const filename = `offerte_${lead.projectType.replace(/\s+/g, '')}${streetName}${dateStr}.pdf`
        
        const validUntil = new Date()
        validUntil.setMonth(validUntil.getMonth() + 6) // 6 months validity
        
        await downloadQuotePDF({
            clientName: lead.clientName,
            clientEmail: lead.clientEmail,
            clientPhone: lead.clientPhone,
            address: lead.address,
            city: lead.city,
            projectType: lead.projectType,
            leadId,
            quoteValue: lead.quoteValue || total,
            quoteDescription: description,
            lineItems: validLineItems.length > 0 ? validLineItems : (lead.quoteLineItems || []),
            quoteDate: new Date(),
            validUntil,
            quoteNumber: generateQuoteNumber(leadId),
            // Extended fields for PDF
            aandachtspunten,
            includeArchiefonderzoek,
            includeWerkbezoek,
            workSpecification: baseRate?.workSpecification || undefined
        }, filename)
        toast.success("PDF gedownload")
    }
    
    /**
     * Save quote PDF to documents when quote is accepted
     */
    const saveQuotePDFToDocuments = async () => {
        try {
            // Parse extended description if available
            let parsedDescription = { description: '', aandachtspunten: '', includeArchiefonderzoek: false, includeWerkbezoek: false, workSpecification: '' }
            try {
                if (lead.quoteDescription) {
                    parsedDescription = JSON.parse(lead.quoteDescription)
                }
            } catch {
                parsedDescription.description = lead.quoteDescription || ''
            }
            
            // Generate filename: offerte_${projectType}${streetname}${date}
            const streetName = lead.address?.split(/\s+\d/)[0]?.replace(/\s+/g, '') || 'Onbekend'
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
            const filename = `offerte_${lead.projectType.replace(/\s+/g, '')}${streetName}${dateStr}.pdf`
            
            const validUntil = new Date()
            validUntil.setMonth(validUntil.getMonth() + 6) // 6 months validity
            
            const pdfData = {
                clientName: lead.clientName,
                clientEmail: lead.clientEmail,
                clientPhone: lead.clientPhone,
                address: lead.address,
                city: lead.city,
                projectType: lead.projectType,
                leadId,
                quoteValue: lead.quoteValue || total,
                quoteDescription: parsedDescription.description || description,
                lineItems: lead.quoteLineItems || validLineItems,
                quoteDate: new Date(),
                validUntil,
                quoteNumber: generateQuoteNumber(leadId),
                aandachtspunten: parsedDescription.aandachtspunten || aandachtspunten,
                includeArchiefonderzoek: parsedDescription.includeArchiefonderzoek || includeArchiefonderzoek,
                includeWerkbezoek: parsedDescription.includeWerkbezoek || includeWerkbezoek,
                workSpecification: parsedDescription.workSpecification || baseRate?.workSpecification || undefined
            }
            
            const pdfBlob = await generateQuotePDF(pdfData)
            const file = new File([pdfBlob], filename, { type: 'application/pdf' })
            
            const formData = new FormData()
            formData.append('file', file)
            formData.append('leadId', leadId)
            formData.append('category', 'offerte')
            formData.append('uploadedBy', currentUser?.name || 'System')
            
            const result = await uploadFile(formData)
            if (result.success) {
                console.log('[Quote] PDF saved to documents:', result.url)
            } else {
                console.error('[Quote] Failed to save PDF:', result.error)
            }
        } catch (err) {
            console.error('[Quote] Error saving PDF to documents:', err)
        }
    }

    // === RENDER STATES ===

    // STATE: Accepted - Show compact success, hide editor
    if (workflowState === 'accepted') {
        return (
            <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900">
                <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                            <PartyPopper className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
                                Opdracht!
                            </p>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                                Definitief opgeslagen
                            </p>
                        </div>
                    </div>
                    
                    {/* Amount */}
                    {lead.quoteValue && (
                        <div className="text-center py-2 bg-white dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800">
                            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                                € {lead.quoteValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full h-8 text-xs gap-1"
                        onClick={() => toast.info("Bekijk offerte in het Documenten tabblad")}
                    >
                        <FileCheck className="w-3 h-3" />
                        Documenten
                    </Button>
                </CardContent>
            </Card>
        )
    }

    // STATE: Sent - Waiting for client response
    if (workflowState === 'sent') {
        const handleAdminConfirmQuote = async () => {
            setIsConfirming(true)
            try {
                // Save quote PDF to documents
                await saveQuotePDFToDocuments()
                
                // Update status
                await updateLeadStatus(leadId, "Opdracht")
                toast.success("Offerte bevestigd als opdracht!", {
                    description: "PDF opgeslagen in documenten."
                })
                onQuoteAccepted?.()
            } catch {
                toast.error("Kon status niet bijwerken")
            } finally {
                setIsConfirming(false)
            }
        }
        
        return (
            <>
                <Card className="border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4 text-purple-600 shrink-0" />
                                <span className="font-semibold text-sm">Verzonden</span>
                            </div>
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-[10px] shrink-0">
                                Wacht
                            </Badge>
                        </div>
                        
                        {/* Amount */}
                        {lead.quoteValue && (
                            <div className="text-center py-2">
                                <span className="text-2xl font-bold font-mono">
                                    € {lead.quoteValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                        
                        {/* Status */}
                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded text-xs">
                            <Clock className="w-3 h-3 text-purple-600 shrink-0" />
                            <span className="text-purple-700 dark:text-purple-300 truncate">
                                → {lead.clientEmail}
                            </span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs px-2" onClick={() => setPreviewOpen(true)}>
                                <Eye className="w-3 h-3 mr-1" />
                                Bekijk
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-3" onClick={handleDownloadPDF}>
                                <Download className="w-3 h-3" />
                            </Button>
                        </div>
                        
                        {/* Admin: Manual quote confirmation */}
                        {isAdmin() && (
                            <Button 
                                className="w-full gap-2 h-9 text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleAdminConfirmQuote}
                                disabled={isConfirming}
                            >
                                {isConfirming ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                )}
                                {isConfirming ? 'Bevestigen...' : 'Bevestig Opdracht'}
                            </Button>
                        )}
                    </CardContent>
                </Card>
                
                <DocumentPreview
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    lead={lead}
                    items={(lead.quoteLineItems || []).map(item => ({ description: item.description, amount: item.amount }))}
                    total={lead.quoteValue || 0}
                    onSend={() => setPreviewOpen(false)}
                />
            </>
        )
    }

    // STATE: Pending Admin Approval
    if (workflowState === 'pending') {
        return (
            <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-semibold text-sm">In Review</span>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px] shrink-0">
                            Wacht
                        </Badge>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-center py-2">
                        <span className="text-2xl font-bold font-mono">
                            € {(lead.quoteValue || total).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin() ? (
                        <>
                            {!showRejectForm ? (
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm"
                                        className="flex-1 gap-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700"
                                        onClick={handleApprove}
                                        disabled={isApproving}
                                    >
                                        {isApproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                        Goedkeuren
                                    </Button>
                                    <Button 
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1 gap-1 h-9 text-xs"
                                        onClick={() => setShowRejectForm(true)}
                                    >
                                        <XCircle className="w-3 h-3" />
                                        Afkeuren
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="Reden voor afkeuring..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="min-h-[60px] text-xs"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 text-xs"
                                            onClick={() => {
                                                setShowRejectForm(false)
                                                setRejectReason("")
                                            }}
                                        >
                                            Annuleer
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1 h-8 text-xs"
                                            onClick={handleReject}
                                            disabled={isRejecting || !rejectReason.trim()}
                                        >
                                            {isRejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Bevestig"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-xs">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-600 shrink-0" />
                            <span className="text-amber-700 dark:text-amber-300">
                                Wacht op admin...
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // STATE: Approved - Ready to send
    if (workflowState === 'approved') {
        return (
            <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-sm">Goedgekeurd</span>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] shrink-0">
                            Klaar
                        </Badge>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-center py-2">
                        <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                            € {(lead.quoteValue || total).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs px-2" onClick={() => setPreviewOpen(true)}>
                            <Eye className="w-3 h-3 mr-1" />
                            Bekijk
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 px-3" onClick={handleDownloadPDF}>
                            <Download className="w-3 h-3" />
                        </Button>
                    </div>

                    <Button 
                        className="w-full gap-2 h-9 text-sm bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSendQuote}
                        disabled={isSending}
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isSending ? 'Verzenden...' : 'Verzenden'}
                    </Button>
                    
                    <p className="text-[10px] text-center text-muted-foreground truncate">
                        → {lead.clientEmail}
                    </p>
                </CardContent>
            </Card>
        )
    }

    // STATE: Building (default) or Rejected - Full Editor
    return (
        <>
            <Card className={cn(
                "h-full flex flex-col",
                workflowState === 'rejected' && "border-red-200 dark:border-red-800"
            )}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                Offerte Opstellen
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                                Stel een offerte samen voor goedkeuring
                            </CardDescription>
                        </div>
                        {workflowState === 'rejected' && (
                            <Badge variant="destructive" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                Afgekeurd
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-4 flex-1 overflow-auto">
                    {/* Rejection Feedback */}
                    {workflowState === 'rejected' && lead.quoteFeedback && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Feedback van Admin:</p>
                                    {lead.quoteFeedback.filter(f => f.type === 'rejection').slice(-1).map(f => (
                                        <p key={f.id} className="text-sm text-red-700 dark:text-red-300 mt-1 italic">
                                            &ldquo;{f.message}&rdquo;
                                            <span className="not-italic text-xs ml-2">— {f.authorName}</span>
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Base Rate Info */}
                    {baseRate && baseRate.price > 0 && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <p className="text-sm text-emerald-800 dark:text-emerald-200">
                                <span className="font-medium">Basistarief {lead.projectType}:</span>{' '}
                                <span className="font-mono">€{baseRate.price.toLocaleString('nl-NL')}</span>
                            </p>
                        </div>
                    )}

                    {/* Checkboxes for standard inclusions */}
                    <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Standaard werkzaamheden
                        </label>
                        
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="archiefonderzoek"
                                checked={includeArchiefonderzoek}
                                onCheckedChange={(checked) => setIncludeArchiefonderzoek(checked === true)}
                                disabled={!isEditable || isSubmitting}
                            />
                            <div className="grid gap-1">
                                <label htmlFor="archiefonderzoek" className="text-sm font-medium cursor-pointer">
                                    Archiefonderzoek
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    Onderzoek bij het archief van de gemeente naar de oorspronkelijke bouwtekeningen
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="werkbezoek"
                                checked={includeWerkbezoek}
                                onCheckedChange={(checked) => setIncludeWerkbezoek(checked === true)}
                                disabled={!isEditable || isSubmitting}
                            />
                            <div className="grid gap-1">
                                <label htmlFor="werkbezoek" className="text-sm font-medium cursor-pointer">
                                    Werkbezoek
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    Werkbezoek 1 uur, binnen omgeving Den Haag
                                </p>
                            </div>
                        </div>
                        
                        {(!includeArchiefonderzoek || !includeWerkbezoek) && (
                            <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                <span className="text-amber-700 dark:text-amber-300">
                                    Niet-aangevinkte items komen in sectie &apos;Niet inbegrepen&apos; op de offerte
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Line Items */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            Offerteregels
                        </label>
                        
                        <div className="space-y-2">
                            {lineItems.map((item, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Omschrijving"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                        disabled={!isEditable || isSubmitting}
                                        className="flex-1 h-9 text-sm"
                                    />
                                    <div className="relative w-28">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={item.amount || ''}
                                            onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                                            disabled={!isEditable || isSubmitting}
                                            className="pl-5 h-9 text-sm font-mono"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    {lineItems.length > 1 && isEditable && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLineItem(index)}
                                            disabled={isSubmitting}
                                            className="h-9 w-9 text-muted-foreground hover:text-red-600"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isEditable && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={addLineItem}
                                disabled={isSubmitting}
                                className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Regel Toevoegen
                            </Button>
                        )}
                    </div>

                    {/* Onderbouwing (internal) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Onderbouwing (intern)
                        </label>
                        <Textarea
                            placeholder="Leg uit waarom dit bedrag passend is (niet zichtbaar op offerte)..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={!isEditable || isSubmitting}
                            className="min-h-[60px] text-sm resize-none"
                        />
                    </div>

                    {/* Aandachtspunten */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Aandachtspunten
                        </label>
                        <Textarea
                            placeholder="Specifieke aandachtspunten voor dit project (wordt getoond op offerte)..."
                            value={aandachtspunten}
                            onChange={(e) => setAandachtspunten(e.target.value)}
                            disabled={!isEditable || isSubmitting}
                            className="min-h-[60px] text-sm resize-none"
                        />
                    </div>

                    <Separator />

                    {/* Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Samenvatting
                        </div>
                        {validLineItems.length > 0 ? (
                            <div className="space-y-1 text-sm">
                                {validLineItems.map((item, i) => (
                                    <div key={i} className="flex justify-between text-muted-foreground">
                                        <span className="truncate">{item.description}</span>
                                        <span className="font-mono">€{item.amount.toLocaleString('nl-NL')}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Voeg offerteregels toe...</p>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-xs font-medium text-muted-foreground">Totaal (excl. BTW)</span>
                            <span className="text-xl font-bold font-mono">
                                € {total.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>incl. BTW (21%)</span>
                            <span className="font-mono">€ {(total * 1.21).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex-col gap-2 pt-0 pb-4">
                    <div className="flex gap-2 w-full">
                        <Button 
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2 h-9" 
                            onClick={() => setPreviewOpen(true)}
                            disabled={validLineItems.length === 0 || isSubmitting}
                        >
                            <Eye className="w-4 h-4" />
                            Voorbeeld
                        </Button>
                        <Button 
                            variant="outline"
                            size="sm"
                            className="gap-2 h-9" 
                            onClick={handleDownloadPDF}
                            disabled={validLineItems.length === 0 || isSubmitting}
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button 
                        className="w-full gap-2 h-11 shadow-lg" 
                        onClick={handleSubmitForApproval}
                        disabled={validLineItems.length === 0 || total <= 0 || isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4" />
                        )}
                        {isSubmitting ? 'Indienen...' : 'Indienen ter Goedkeuring'}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                        Offertes vereisen goedkeuring door een admin
                    </p>
                </CardFooter>
            </Card>

            <DocumentPreview
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                lead={lead}
                items={validLineItems.map(item => ({ description: item.description, amount: item.amount }))}
                total={lead?.quoteValue || total}
                onSend={handleSendQuote}
            />
        </>
    )
}
