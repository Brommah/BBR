"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLeadStore, QuoteLineItem } from "@/lib/store"
import { useAuthStore, useAllUsers } from "@/lib/auth"
import { getDocuments } from "@/lib/db-actions"
import { 
    CheckCircle2, 
    XCircle, 
    Eye, 
    Clock, 
    Euro, 
    FileText, 
    MessageSquare,
    AlertTriangle,
    User,
    Calculator,
    ChevronDown,
    ChevronUp,
    Loader2,
    FileCheck,
    ExternalLink,
    Mail,
    Phone,
    MapPin,
    Building2,
    Hash,
    Calendar,
    File,
    Image as ImageIcon,
    FileSpreadsheet,
    Ruler,
    Users
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"

interface ReviewDialogState {
    isOpen: boolean
    leadId: string | null
    action: 'approve' | 'reject' | null
    adjustedValue?: number
    feedback: string
    isSubmitting: boolean
}

interface DocumentInfo {
    id: string
    name: string
    url: string
    category: string
    createdAt: string
}

export function QuoteApprovalQueue() {
    const { leads, approveQuote, rejectQuote, isLoading } = useLeadStore()
    const { currentUser } = useAuthStore()
    const { users } = useAllUsers()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [documents, setDocuments] = useState<DocumentInfo[]>([])
    const [loadingDocs, setLoadingDocs] = useState(false)
    
    const getUserAvatar = (userName: string | undefined) => {
        if (!userName) return undefined
        return users.find(u => u.name === userName)?.avatar
    }
    const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>({
        isOpen: false,
        leadId: null,
        action: null,
        feedback: "",
        isSubmitting: false
    })
    
    const pendingQuotes = leads.filter(l => l.quoteApproval === "pending")
    const selectedLead = selectedId ? leads.find(l => l.id === selectedId) : pendingQuotes[0]

    // Fetch documents when selected lead changes
    useEffect(() => {
        if (selectedLead?.id) {
            setLoadingDocs(true)
            getDocuments(selectedLead.id).then(result => {
                if (result.success && result.data) {
                    setDocuments(result.data as DocumentInfo[])
                } else {
                    setDocuments([])
                }
                setLoadingDocs(false)
            })
        }
    }, [selectedLead?.id])

    const getDocumentIcon = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon
        if (['pdf'].includes(ext || '')) return FileText
        if (['xlsx', 'xls', 'csv'].includes(ext || '')) return FileSpreadsheet
        return File
    }

    const formatTimeAgo = (dateStr: string) => {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: nl })
    }

    const openReviewDialog = (id: string, action: 'approve' | 'reject') => {
        const lead = leads.find(l => l.id === id)
        setReviewDialog({
            isOpen: true,
            leadId: id,
            action,
            adjustedValue: lead?.quoteValue,
            feedback: "",
            isSubmitting: false
        })
    }

    const handleConfirmReview = async () => {
        if (!reviewDialog.leadId || !reviewDialog.action) return

        setReviewDialog(prev => ({ ...prev, isSubmitting: true }))

        try {
            if (reviewDialog.action === 'approve') {
                const success = await approveQuote(
                    reviewDialog.leadId, 
                    reviewDialog.feedback ? {
                        authorId: currentUser?.id || "admin",
                        authorName: currentUser?.name || "Admin",
                        message: reviewDialog.feedback
                    } : undefined,
                    reviewDialog.adjustedValue
                )
                
                if (success) {
                    const originalValue = leads.find(l => l.id === reviewDialog.leadId)?.quoteValue
                    toast.success("Offerte goedgekeurd!", {
                        description: reviewDialog.adjustedValue !== originalValue
                            ? `Bedrag aangepast naar €${reviewDialog.adjustedValue?.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
                            : "De engineer kan nu de offerte verzenden."
                    })
                }
            } else {
                if (!reviewDialog.feedback.trim()) {
                    toast.error("Feedback vereist", {
                        description: "Geef feedback zodat de engineer de offerte kan aanpassen."
                    })
                    setReviewDialog(prev => ({ ...prev, isSubmitting: false }))
                    return
                }
                
                const success = await rejectQuote(reviewDialog.leadId, {
                    authorId: currentUser?.id || "admin",
                    authorName: currentUser?.name || "Admin",
                    message: reviewDialog.feedback
                })
                
                if (success) {
                    toast.error("Offerte afgekeurd", {
                        description: "De engineer ontvangt je feedback."
                    })
                }
            }

            setReviewDialog({
                isOpen: false,
                leadId: null,
                action: null,
                feedback: "",
                isSubmitting: false
            })
        } catch (error) {
            console.error('Review error:', error)
            setReviewDialog(prev => ({ ...prev, isSubmitting: false }))
        }
    }

    const currentLead = reviewDialog.leadId ? leads.find(l => l.id === reviewDialog.leadId) : null

    // Loading state
    if (isLoading) {
        return (
            <div className="card-tactile rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Offerte Goedkeuringen</h3>
                        <p className="text-sm text-muted-foreground">Laden...</p>
                    </div>
                </div>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Offerte Goedkeuringen</h3>
                            <p className="text-sm text-muted-foreground">Beoordeel en verifieer ingediende offertes</p>
                        </div>
                    </div>
                    <span className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5",
                        pendingQuotes.length > 0 ? "pill-glass-amber" : "pill-glass-emerald"
                    )}>
                        <Clock className="w-3.5 h-3.5" />
                        {pendingQuotes.length} Wachtend
                    </span>
                </div>

                {pendingQuotes.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-tactile rounded-xl text-center py-16"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-muted-foreground">Geen openstaande offertes ter goedkeuring.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left: Compact Queue List */}
                        <div className="space-y-2">
                            {pendingQuotes.map((lead, index) => (
                                <motion.div
                                    key={lead.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "card-tactile rounded-xl p-3 cursor-pointer transition-all hover:bg-muted/50",
                                        selectedLead?.id === lead.id && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background bg-amber-50/50 dark:bg-amber-950/20"
                                    )}
                                    onClick={() => setSelectedId(lead.id)}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="font-semibold text-sm truncate block">{lead.clientName}</span>
                                            <span className="text-xs text-muted-foreground">{formatTimeAgo(lead.updatedAt || lead.createdAt)}</span>
                                        </div>
                                        <span className="text-base font-bold font-mono text-foreground shrink-0">
                                            €{(lead.quoteValue || 0).toLocaleString('nl-NL')}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Right: Comprehensive Detail Panel */}
                        <AnimatePresence mode="wait">
                            {selectedLead && (
                                <motion.div
                                    key={selectedLead.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="lg:col-span-2 card-tactile rounded-xl overflow-hidden"
                                >
                                    {/* Header with Actions & Quick Info */}
                                    <div className="p-4 border-b border-border/50 bg-muted/30">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center shrink-0">
                                                    <Euro className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-lg truncate">{selectedLead.clientName}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                            {selectedLead.projectType}
                                                        </Badge>
                                                        {selectedLead.city && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {selectedLead.city}
                                                            </span>
                                                        )}
                                                        {selectedLead.werknummer && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Hash className="w-3 h-3" />
                                                                {selectedLead.werknummer}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5 bg-background shadow-sm" asChild>
                                                    <Link href={`/leads/${selectedLead.id}`}>
                                                        <ExternalLink className="w-4 h-4" />
                                                        <span className="hidden sm:inline">Dossier</span>
                                                    </Link>
                                                </Button>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm"
                                                        className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                        onClick={() => openReviewDialog(selectedLead.id, 'approve')}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                                        Goedkeuren
                                                    </Button>
                                                    <Button 
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-9 px-4 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 shadow-sm"
                                                        onClick={() => openReviewDialog(selectedLead.id, 'reject')}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1.5" />
                                                        Afkeuren
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Facts Row */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-background/50 rounded-lg p-2 border border-border/50">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Bedrag</p>
                                                <p className="text-sm font-bold font-mono">€{(selectedLead.quoteValue || 0).toLocaleString('nl-NL')}</p>
                                            </div>
                                            <div className="bg-background/50 rounded-lg p-2 border border-border/50">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Gemaakt door</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Avatar className="w-4 h-4">
                                                        <AvatarFallback className="text-[8px] bg-slate-100">{selectedLead.assignee?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs truncate">{selectedLead.assignee || 'Onbekend'}</span>
                                                </div>
                                            </div>
                                            <div className="bg-background/50 rounded-lg p-2 border border-border/50">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tijd sinds indienen</p>
                                                <p className="text-xs font-medium">{formatTimeAgo(selectedLead.updatedAt || selectedLead.createdAt)}</p>
                                            </div>
                                            <div className="bg-background/50 rounded-lg p-2 border border-border/50">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Documenten</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <FileText className="w-3 h-3 text-amber-500" />
                                                    <span className="text-xs font-medium">{documents.length} bestanden</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Content Grid */}
                                    <div className="p-4 max-h-[600px] overflow-y-auto scrollbar-thin">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Left Column: Quote & Details */}
                                            <div className="space-y-4">
                                                {/* Line Items Table-like View */}
                                                {selectedLead.quoteLineItems && selectedLead.quoteLineItems.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                            <Calculator className="w-3.5 h-3.5" />
                                                            Specificatie Offerte
                                                        </h5>
                                                        <div className="bg-card rounded-xl border overflow-hidden">
                                                            <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-[10px] font-bold uppercase text-muted-foreground border-b">
                                                                <div className="col-span-8 px-2">Beschrijving</div>
                                                                <div className="col-span-4 text-right px-2">Bedrag</div>
                                                            </div>
                                                            <div className="divide-y divide-border/50">
                                                                {selectedLead.quoteLineItems.map((item: QuoteLineItem, index: number) => (
                                                                    <div key={index} className="grid grid-cols-12 gap-2 p-2.5 text-sm items-center hover:bg-muted/30 transition-colors">
                                                                        <div className="col-span-8 px-2 text-muted-foreground leading-snug">{item.description}</div>
                                                                        <div className="col-span-4 text-right px-2 font-mono font-semibold">
                                                                            €{item.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-t flex justify-between items-center">
                                                                <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">Totaal (excl. BTW)</span>
                                                                <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                                                                    €{(selectedLead.quoteValue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quote Description */}
                                                {selectedLead.quoteDescription && (
                                                    <div className="space-y-2">
                                                        <h5 className="text-sm font-medium flex items-center gap-2">
                                                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                                            Onderbouwing
                                                        </h5>
                                                        <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                                                            {selectedLead.quoteDescription}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Client Contact Info */}
                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        Klantgegevens
                                                    </h5>
                                                    <div className="bg-card rounded-lg border border-border/50 p-3 space-y-2">
                                                        {selectedLead.clientEmail && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                                <a href={`mailto:${selectedLead.clientEmail}`} className="text-primary hover:underline">
                                                                    {selectedLead.clientEmail}
                                                                </a>
                                                            </div>
                                                        )}
                                                        {selectedLead.clientPhone && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Phone className="w-4 h-4 text-muted-foreground" />
                                                                <a href={`tel:${selectedLead.clientPhone}`} className="hover:underline">
                                                                    {selectedLead.clientPhone}
                                                                </a>
                                                            </div>
                                                        )}
                                                        <div className="flex items-start gap-2 text-sm">
                                                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                            <span>
                                                                {selectedLead.address && <span className="block">{selectedLead.address}</span>}
                                                                <span>{selectedLead.city}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Documents, Specs & Team */}
                                            <div className="space-y-4">
                                                {/* Documents with Quick Preview */}
                                                <div className="space-y-2">
                                                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <File className="w-3.5 h-3.5 text-blue-500" />
                                                        Documenten & Bestanden
                                                        {loadingDocs && <Loader2 className="w-3 h-3 animate-spin" />}
                                                    </h5>
                                                    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                                                        {documents.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center py-8 opacity-40">
                                                                <File className="w-8 h-8 mb-2" />
                                                                <p className="text-xs">Geen bestanden beschikbaar</p>
                                                            </div>
                                                        ) : (
                                                            <div className="divide-y divide-border/50">
                                                                {documents.map((doc) => {
                                                                    const DocIcon = getDocumentIcon(doc.name)
                                                                    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(doc.name.split('.').pop()?.toLowerCase() || '')
                                                                    
                                                                    return (
                                                                        <div key={doc.id} className="group p-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                                                            <div className="w-10 h-10 rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                                                                                {isImage ? (
                                                                                    <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                                                                                ) : (
                                                                                    <DocIcon className="w-5 h-5 text-muted-foreground" />
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-medium truncate leading-tight group-hover:text-primary transition-colors">{doc.name}</p>
                                                                                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tighter">{doc.category}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" asChild title="Bekijken">
                                                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                                        <Eye className="w-3.5 h-3.5" />
                                                                                    </a>
                                                                                </Button>
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" asChild title="Open in nieuw venster">
                                                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                                    </a>
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quote Description / Foundation */}
                                                {selectedLead.quoteDescription && (
                                                    <div className="space-y-2">
                                                        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                            <MessageSquare className="w-3.5 h-3.5 text-violet-500" />
                                                            Onderbouwing / Toelichting
                                                        </h5>
                                                        <div className="bg-violet-50/30 dark:bg-violet-950/10 rounded-xl p-3 border border-violet-100 dark:border-violet-900/30 text-sm text-muted-foreground italic leading-relaxed">
                                                            &ldquo;{selectedLead.quoteDescription}&rdquo;
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Project Specifications */}
                                                {selectedLead.specifications && selectedLead.specifications.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                            <Ruler className="w-3.5 h-3.5 text-amber-500" />
                                                            Specificaties
                                                        </h5>
                                                        <div className="bg-card rounded-xl border border-border/50 p-3">
                                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                                {selectedLead.specifications.map((spec, i) => (
                                                                    <div key={i} className="text-xs flex justify-between">
                                                                        <span className="text-muted-foreground">{spec.key}:</span>
                                                                        <span className="font-medium text-foreground">{spec.value}{spec.unit && ` ${spec.unit}`}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Team Assignment */}
                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-muted-foreground" />
                                                        Team
                                                    </h5>
                                                    <div className="bg-card rounded-lg border border-border/50 p-3 space-y-2">
                                                        {selectedLead.assignedProjectleider && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Avatar className="w-6 h-6">
                                                                    {getUserAvatar(selectedLead.assignedProjectleider) && (
                                                                        <AvatarImage src={getUserAvatar(selectedLead.assignedProjectleider)} alt={selectedLead.assignedProjectleider} />
                                                                    )}
                                                                    <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                                                        {selectedLead.assignedProjectleider[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-muted-foreground">Projectleider:</span>
                                                                <span className="font-medium">{selectedLead.assignedProjectleider}</span>
                                                            </div>
                                                        )}
                                                        {selectedLead.assignedRekenaar && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Avatar className="w-6 h-6">
                                                                    {getUserAvatar(selectedLead.assignedRekenaar) && (
                                                                        <AvatarImage src={getUserAvatar(selectedLead.assignedRekenaar)} alt={selectedLead.assignedRekenaar} />
                                                                    )}
                                                                    <AvatarFallback className="text-[10px] bg-amber-100 text-amber-700">
                                                                        {selectedLead.assignedRekenaar[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-muted-foreground">Rekenaar:</span>
                                                                <span className="font-medium">{selectedLead.assignedRekenaar}</span>
                                                            </div>
                                                        )}
                                                        {selectedLead.assignedTekenaar && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Avatar className="w-6 h-6">
                                                                    {getUserAvatar(selectedLead.assignedTekenaar) && (
                                                                        <AvatarImage src={getUserAvatar(selectedLead.assignedTekenaar)} alt={selectedLead.assignedTekenaar} />
                                                                    )}
                                                                    <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700">
                                                                        {selectedLead.assignedTekenaar[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-muted-foreground">Tekenaar:</span>
                                                                <span className="font-medium">{selectedLead.assignedTekenaar}</span>
                                                            </div>
                                                        )}
                                                        {!selectedLead.assignedProjectleider && !selectedLead.assignedRekenaar && !selectedLead.assignedTekenaar && selectedLead.assignee && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Avatar className="w-6 h-6">
                                                                    {getUserAvatar(selectedLead.assignee) && (
                                                                        <AvatarImage src={getUserAvatar(selectedLead.assignee)} alt={selectedLead.assignee} />
                                                                    )}
                                                                    <AvatarFallback className="text-[10px] bg-slate-100 text-slate-700">
                                                                        {selectedLead.assignee[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-muted-foreground">Toegewezen:</span>
                                                                <span className="font-medium">{selectedLead.assignee}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Submission Info */}
                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                                        Tijdlijn
                                                    </h5>
                                                    <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Aangemaakt:</span>
                                                            <span>{formatTimeAgo(selectedLead.createdAt)}</span>
                                                        </div>
                                                        {selectedLead.updatedAt && (
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Offerte ingediend:</span>
                                                                <span>{formatTimeAgo(selectedLead.updatedAt)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Review Dialog */}
            <Dialog open={reviewDialog.isOpen} onOpenChange={(open) => {
                if (!open && !reviewDialog.isSubmitting) {
                    setReviewDialog({
                        isOpen: false,
                        leadId: null,
                        action: null,
                        feedback: "",
                        isSubmitting: false
                    })
                }
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {reviewDialog.action === 'approve' 
                                ? <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Offerte Goedkeuren</>
                                : <><AlertTriangle className="w-5 h-5 text-rose-600" /> Offerte Afkeuren</>
                            }
                        </DialogTitle>
                        <DialogDescription>
                            {reviewDialog.action === 'approve'
                                ? "Controleer het bedrag en voeg optioneel feedback toe."
                                : "Geef feedback zodat de engineer de offerte kan aanpassen."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Current Quote Info */}
                        {currentLead && (
                            <div className="card-tactile rounded-xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Klant</span>
                                    <span className="font-medium">{currentLead.clientName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Project</span>
                                    <span>{currentLead.projectType}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-muted-foreground">Engineer</span>
                                    {currentLead.assignee ? (
                                        <span className="flex items-center gap-2">
                                            <Avatar className="w-5 h-5">
                                                {getUserAvatar(currentLead.assignee) && (
                                                    <AvatarImage src={getUserAvatar(currentLead.assignee)} alt={currentLead.assignee} />
                                                )}
                                                <AvatarFallback className="text-[8px] bg-slate-200 dark:bg-slate-700">
                                                    {currentLead.assignee[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            {currentLead.assignee}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Niet toegewezen</span>
                                    )}
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Ingediend bedrag</span>
                                    <span className="font-mono font-bold text-lg">
                                        €{(currentLead.quoteValue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Adjusted Value (only for approval) */}
                        {reviewDialog.action === 'approve' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Euro className="w-4 h-4" />
                                    Definitief Bedrag
                                </label>
                                <div className="relative">
                                    <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={reviewDialog.adjustedValue || ''}
                                        onChange={(e) => setReviewDialog({
                                            ...reviewDialog,
                                            adjustedValue: parseFloat(e.target.value) || 0
                                        })}
                                        disabled={reviewDialog.isSubmitting}
                                        className="pl-10 font-mono text-lg h-12 rounded-xl"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                {reviewDialog.adjustedValue !== currentLead?.quoteValue && (
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Bedrag wijkt af van ingediend bedrag
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Feedback */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Feedback {reviewDialog.action === 'reject' && <span className="text-rose-500">*</span>}
                            </label>
                            <Textarea
                                placeholder={reviewDialog.action === 'approve'
                                    ? "Optioneel: voeg feedback toe voor de engineer..."
                                    : "Verplicht: leg uit waarom de offerte wordt afgekeurd..."
                                }
                                value={reviewDialog.feedback}
                                onChange={(e) => setReviewDialog({
                                    ...reviewDialog,
                                    feedback: e.target.value
                                })}
                                disabled={reviewDialog.isSubmitting}
                                className="min-h-[100px] rounded-xl"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setReviewDialog({
                                isOpen: false,
                                leadId: null,
                                action: null,
                                feedback: "",
                                isSubmitting: false
                            })}
                            disabled={reviewDialog.isSubmitting}
                            className="rounded-xl"
                        >
                            Annuleren
                        </Button>
                        <Button
                            onClick={handleConfirmReview}
                            disabled={reviewDialog.isSubmitting}
                            className={cn(
                                "rounded-xl",
                                reviewDialog.action === 'approve' 
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25" 
                                    : "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/25"
                            )}
                        >
                            {reviewDialog.isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                            ) : reviewDialog.action === 'approve' ? (
                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            ) : (
                                <XCircle className="w-4 h-4 mr-1.5" />
                            )}
                            {reviewDialog.isSubmitting 
                                ? 'Verwerken...' 
                                : reviewDialog.action === 'approve' 
                                    ? 'Goedkeuren' 
                                    : 'Afkeuren'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
