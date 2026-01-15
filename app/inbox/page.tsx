"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { 
    Clock, MapPin, Home as HomeIcon, Building2, 
    CheckCircle2, XCircle, ArrowRight, Phone, Mail, Loader2,
    Hash, Users, FileText, Download, Eye, Euro, Send, 
    ChevronDown, ChevronUp, User, AlertCircle, Paperclip,
    Calculator, Ruler, ExternalLink
} from "lucide-react"
import Link from "next/link"
import { useLeadStore, Lead } from "@/lib/store"
import { useAuthStore, useAllUsers } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { IsoInbox, IsoEmpty } from "@/components/ui/illustrations"
import { toast } from "sonner"
import { PageLoader, PageErrorBoundary } from "@/components/error-boundary"
import { getDocuments, getNotes } from "@/lib/db-actions"
import { sendQuoteEmail } from "@/lib/email"
import { cn } from "@/lib/utils"

/** Document type from database */
interface Document {
    id: string
    name: string
    type: string
    category: string
    size: number
    url: string
    uploadedBy: string
    createdAt: string
}

/** Note type from database */
interface Note {
    id: string
    content: string
    author: string
    createdAt: string
}

/** Configuration data for each lead in the inbox */
interface LeadConfig {
    werknummer: string
    value: string
    quoteDescription: string
    assignedProjectleider: string | null
    assignedRekenaar: string | null
    assignedTekenaar: string | null
    isExpanded: boolean
}

// Helper to format relative time
function getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Zojuist"
    if (diffMins < 60) return `${diffMins} min geleden`
    if (diffHours < 24) return `${diffHours} uur geleden`
    if (diffDays === 1) return "Gisteren"
    return `${diffDays} dagen geleden`
}

// Helper to format file size
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Helper to get file icon based on type
function getFileIcon(type: string) {
    switch (type) {
        case 'pdf': return <FileText className="w-4 h-4 text-red-500" />
        case 'image': return <Eye className="w-4 h-4 text-purple-500" />
        case 'dwg': return <Ruler className="w-4 h-4 text-blue-500" />
        case 'spreadsheet': return <Calculator className="w-4 h-4 text-green-500" />
        default: return <FileText className="w-4 h-4 text-slate-500" />
    }
}

// Helper to determine property type icon
function getPropertyType(projectType: string): string {
    const apartmentTypes = ["Appartement", "Flat", "Portiek", "Bovenwoning"]
    if (apartmentTypes.some(t => projectType.toLowerCase().includes(t.toLowerCase()))) {
        return "Appartement"
    }
    return "Woning"
}

export default function InboxPage() {
    const { leads, updateLeadStatus, updateTeamAssignments, updateLead, isLoading } = useLeadStore()
    const { currentUser } = useAuthStore()
    const { users } = useAllUsers()
    const router = useRouter()
    
    // Config state for each lead
    const [leadConfigs, setLeadConfigs] = useState<Record<string, LeadConfig>>({})
    const [leadDocuments, setLeadDocuments] = useState<Record<string, Document[]>>({})
    const [leadNotes, setLeadNotes] = useState<Record<string, Note[]>>({})
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
    const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set())
    
    // Filter users by role
    const projectleiders = users.filter(u => u.role === 'projectleider')
    const rekenaars = users.filter(u => u.role === 'engineer' && u.engineerType === 'rekenaar')
    const tekenaars = users.filter(u => u.role === 'engineer' && u.engineerType === 'tekenaar')
    
    // Get leads with status "Nieuw"
    const newApplications = leads
        .filter(lead => lead.status === "Nieuw")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Generate suggested werknummer
    const generateWerknummer = useCallback(() => {
        const year = new Date().getFullYear()
        const existingNumbers = leads
            .filter(l => l.werknummer?.startsWith(`${year}-`))
            .map(l => {
                const match = l.werknummer?.match(/\d{4}-(\d+)/)
                return match ? parseInt(match[1], 10) : 0
            })
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
        return `${year}-${String(nextNumber).padStart(3, '0')}`
    }, [leads])

    // Initialize config for a lead
    const getOrCreateConfig = useCallback((leadId: string): LeadConfig => {
        if (leadConfigs[leadId]) return leadConfigs[leadId]
        return {
            werknummer: generateWerknummer(),
            value: '',
            quoteDescription: '',
            assignedProjectleider: null,
            assignedRekenaar: null,
            assignedTekenaar: null,
            isExpanded: false
        }
    }, [leadConfigs, generateWerknummer])

    // Update config for a lead
    const updateConfig = (leadId: string, updates: Partial<LeadConfig>) => {
        setLeadConfigs(prev => ({
            ...prev,
            [leadId]: { ...getOrCreateConfig(leadId), ...updates }
        }))
    }

    // Toggle expanded state
    const toggleExpanded = async (leadId: string) => {
        const config = getOrCreateConfig(leadId)
        const newExpanded = !config.isExpanded
        
        updateConfig(leadId, { isExpanded: newExpanded })
        
        // Load documents and notes when expanding
        if (newExpanded && !leadDocuments[leadId] && !loadingDocs.has(leadId)) {
            setLoadingDocs(prev => new Set(prev).add(leadId))
            
            try {
                const [docsResult, notesResult] = await Promise.all([
                    getDocuments(leadId),
                    getNotes(leadId)
                ])
                
                if (docsResult.success && docsResult.data) {
                    setLeadDocuments(prev => ({ ...prev, [leadId]: docsResult.data as Document[] }))
                }
                if (notesResult.success && notesResult.data) {
                    setLeadNotes(prev => ({ ...prev, [leadId]: notesResult.data as Note[] }))
                }
            } catch (error) {
                console.error('Error loading lead details:', error)
            } finally {
                setLoadingDocs(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(leadId)
                    return newSet
                })
            }
        }
    }

    // Expand first lead by default (only on initial load)
    useEffect(() => {
        if (newApplications.length > 0 && Object.keys(leadConfigs).length === 0) {
            const firstLeadId = newApplications[0].id
            // Inline the expand logic to avoid dependency issues
            setLeadConfigs(prev => ({
                ...prev,
                [firstLeadId]: {
                    werknummer: generateWerknummer(),
                    value: '',
                    quoteDescription: '',
                    assignedProjectleider: null,
                    assignedRekenaar: null,
                    assignedTekenaar: null,
                    isExpanded: true
                }
            }))
            
            // Load documents and notes
            Promise.all([
                getDocuments(firstLeadId),
                getNotes(firstLeadId)
            ]).then(([docsResult, notesResult]) => {
                if (docsResult.success && docsResult.data) {
                    setLeadDocuments(prev => ({ ...prev, [firstLeadId]: docsResult.data as Document[] }))
                }
                if (notesResult.success && notesResult.data) {
                    setLeadNotes(prev => ({ ...prev, [firstLeadId]: notesResult.data as Note[] }))
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newApplications.length])

    // Handle accept with quote
    const handleAccept = async (lead: Lead) => {
        if (!currentUser) {
            toast.error("Niet ingelogd")
            return
        }

        const config = getOrCreateConfig(lead.id)

        // Validation
        if (!config.werknummer.trim()) {
            toast.error("Werknummer vereist", {
                description: "Vul een werknummer in voor dit project."
            })
            return
        }

        if (!config.assignedProjectleider) {
            toast.error("Projectleider vereist", {
                description: "Wijs een projectleider toe aan dit project."
            })
            return
        }

        const quoteValue = parseFloat(config.value.replace(/[^0-9.,]/g, '').replace(',', '.'))
        if (isNaN(quoteValue) || quoteValue <= 0) {
            toast.error("Offertebedrag vereist", {
                description: "Vul een geldig offertebedrag in."
            })
            return
        }

        setProcessingIds(prev => new Set(prev).add(lead.id))
        
        try {
            // 1. Update werknummer and value
            const updateSuccess = await updateLead(lead.id, { 
                werknummer: config.werknummer.trim(),
                value: quoteValue
            })
            
            if (!updateSuccess) {
                toast.error("Kon projectgegevens niet opslaan")
                return
            }

            // 2. Update team assignments
            const teamSuccess = await updateTeamAssignments(lead.id, {
                assignedProjectleider: config.assignedProjectleider,
                assignedRekenaar: config.assignedRekenaar,
                assignedTekenaar: config.assignedTekenaar,
            })
            
            if (!teamSuccess) {
                toast.error("Kon team niet toewijzen")
                return
            }

            // 3. Update status to Offerte Verzonden
            const statusSuccess = await updateLeadStatus(lead.id, "Offerte Verzonden")
            if (!statusSuccess) {
                toast.error("Kon status niet bijwerken")
                return
            }

            // 4. Send quote email to client
            if (lead.clientEmail) {
                const projectleider = users.find(u => u.name === config.assignedProjectleider)
                
                const emailResult = await sendQuoteEmail({
                    to: lead.clientEmail,
                    clientName: lead.clientName,
                    projectType: lead.projectType,
                    quoteValue: quoteValue,
                    quoteDescription: config.quoteDescription || undefined,
                    leadId: lead.id,
                    sentBy: currentUser.name,
                    contactPerson: projectleider ? {
                        name: projectleider.name,
                        email: projectleider.email,
                        phone: '020-123 4567' // TODO: Add phone to user model
                    } : undefined
                })

                if (emailResult.success) {
                    toast.success("Offerte verzonden!", {
                        description: `Offerte naar ${lead.clientEmail} verstuurd.`,
                        action: {
                            label: "Bekijken",
                            onClick: () => router.push(`/leads/${lead.id}`)
                        }
                    })
                } else {
                    toast.warning("Lead geaccepteerd, maar e-mail niet verzonden", {
                        description: emailResult.error || "Controleer de e-mailconfiguratie."
                    })
                }
            } else {
                toast.success("Lead geaccepteerd!", {
                    description: `${lead.clientName} is nu actief. Geen e-mail: geen e-mailadres bekend.`,
                    action: {
                        label: "Bekijken",
                        onClick: () => router.push(`/leads/${lead.id}`)
                    }
                })
            }
        } catch (error) {
            console.error('Accept error:', error)
            toast.error("Er ging iets mis")
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(lead.id)
                return newSet
            })
        }
    }

    const handleReject = async (leadId: string, clientName: string) => {
        setProcessingIds(prev => new Set(prev).add(leadId))
        
        try {
            const success = await updateLeadStatus(leadId, "Archief")
            
            if (success) {
                toast("Lead afgewezen", {
                    description: `${clientName} is verplaatst naar archief.`
                })
            }
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(leadId)
                return newSet
            })
        }
    }

    // Loading state
    if (isLoading) {
        return <PageLoader message="Leads laden..." />
    }

    return (
        <PageErrorBoundary>
        <div className="page-container">
            <div className="page-header flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 -my-2 mr-2">
                        <IsoInbox />
                    </div>
                    <div>
                        <h1 className="page-title">Inbox</h1>
                        <p className="page-description">Nieuwe aanvragen beoordelen, configureren en offerte verzenden.</p>
                    </div>
                </div>
                <Badge variant="secondary" className={cn(
                    "px-3 py-1 text-sm font-semibold",
                    newApplications.length > 0 
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200"
                )}>
                    {newApplications.length} {newApplications.length === 1 ? 'nieuwe aanvraag' : 'nieuwe aanvragen'}
                </Badge>
            </div>

            <div className="space-y-4 max-w-5xl mx-auto">
                {newApplications.map((lead) => {
                    const isProcessing = processingIds.has(lead.id)
                    const config = getOrCreateConfig(lead.id)
                    const documents = leadDocuments[lead.id] || []
                    const notes = leadNotes[lead.id] || []
                    const isLoadingDocs = loadingDocs.has(lead.id)
                    const clientNote = notes.find(n => n.author === lead.clientName)
                    
                    return (
                        <Card 
                            key={lead.id} 
                            className={cn(
                                "transition-all border-2",
                                isProcessing ? 'opacity-60 pointer-events-none' : '',
                                config.isExpanded 
                                    ? 'border-primary/30 shadow-lg shadow-primary/5' 
                                    : 'border-transparent hover:border-slate-200'
                            )}
                        >
                            {/* Header - Always Visible */}
                            <CardHeader 
                                className="pb-3 cursor-pointer select-none"
                                onClick={() => toggleExpanded(lead.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold truncate">{lead.clientName}</h3>
                                            <Badge variant="outline" className="shrink-0 bg-slate-50">
                                                {lead.projectType}
                                            </Badge>
                                            {documents.length > 0 && (
                                                <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                                                    <Paperclip className="w-3 h-3" />
                                                    {documents.length}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {getRelativeTime(lead.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {lead.address ? `${lead.address}, ${lead.city}` : lead.city}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                {getPropertyType(lead.projectType) === "Appartement" ? (
                                                    <Building2 className="w-3.5 h-3.5" />
                                                ) : (
                                                    <HomeIcon className="w-3.5 h-3.5" />
                                                )}
                                                {getPropertyType(lead.projectType)}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        {config.isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </CardHeader>

                            {/* Expanded Content */}
                            {config.isExpanded && (
                                <CardContent className="pt-0 space-y-6">
                                    <Separator />
                                    
                                    <div className="grid lg:grid-cols-2 gap-6">
                                        {/* Left Column - Client Info & Documents */}
                                        <div className="space-y-4">
                                            {/* Contact Info */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    Klantgegevens
                                                </h4>
                                                <div className="space-y-2">
                                                    {lead.clientEmail && (
                                                        <a 
                                                            href={`mailto:${lead.clientEmail}`}
                                                            className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
                                                        >
                                                            <Mail className="w-4 h-4 text-blue-500" />
                                                            {lead.clientEmail}
                                                            <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                                                        </a>
                                                    )}
                                                    {lead.clientPhone && (
                                                        <a 
                                                            href={`tel:${lead.clientPhone}`}
                                                            className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
                                                        >
                                                            <Phone className="w-4 h-4 text-green-500" />
                                                            {lead.clientPhone}
                                                            <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                                                        </a>
                                                    )}
                                                    {!lead.clientEmail && !lead.clientPhone && (
                                                        <p className="text-sm text-muted-foreground italic">Geen contactgegevens</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Client Notes (from intake form description) */}
                                            {clientNote && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        Projectomschrijving
                                                    </h4>
                                                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
                                                        {clientNote.content}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Documents */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <Paperclip className="w-4 h-4" />
                                                    Documenten
                                                    {documents.length > 0 && (
                                                        <Badge variant="secondary" className="text-xs">{documents.length}</Badge>
                                                    )}
                                                </h4>
                                                
                                                {isLoadingDocs ? (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Documenten laden...
                                                    </div>
                                                ) : documents.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {documents.map(doc => (
                                                            <div 
                                                                key={doc.id}
                                                                className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100"
                                                            >
                                                                {getFileIcon(doc.type)}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatFileSize(doc.size)} • {doc.uploadedBy}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {doc.type === 'image' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                window.open(doc.url, '_blank')
                                                                            }}
                                                                        >
                                                                            <Eye className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            window.open(doc.url, '_blank')
                                                                        }}
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground italic py-2">
                                                        Geen documenten geüpload
                                                    </p>
                                                )}
                                            </div>

                                            {/* Project Specifications */}
                                            {lead.specifications && lead.specifications.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-muted-foreground">Specificaties</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {lead.specifications.map((spec, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                {spec.key}: {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column - Configuration */}
                                        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Project Configureren
                                            </h4>

                                            {/* Werknummer */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`wn-${lead.id}`} className="text-xs flex items-center gap-1.5">
                                                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Werknummer <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id={`wn-${lead.id}`}
                                                    value={config.werknummer}
                                                    onChange={(e) => updateConfig(lead.id, { werknummer: e.target.value })}
                                                    placeholder="bijv. 2026-001"
                                                    className="font-mono bg-white h-9"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            {/* Quote Value */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`val-${lead.id}`} className="text-xs flex items-center gap-1.5">
                                                    <Euro className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Offertebedrag (excl. BTW) <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                                                    <Input
                                                        id={`val-${lead.id}`}
                                                        type="text"
                                                        value={config.value}
                                                        onChange={(e) => updateConfig(lead.id, { value: e.target.value })}
                                                        placeholder="0,00"
                                                        className="pl-8 bg-white h-9"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>

                                            {/* Quote Description */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`desc-${lead.id}`} className="text-xs flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Offerte toelichting <span className="text-muted-foreground">(optioneel)</span>
                                                </Label>
                                                <Textarea
                                                    id={`desc-${lead.id}`}
                                                    value={config.quoteDescription}
                                                    onChange={(e) => updateConfig(lead.id, { quoteDescription: e.target.value })}
                                                    placeholder="Extra informatie voor de klant..."
                                                    className="bg-white min-h-[60px] resize-none text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            <Separator className="my-3" />

                                            {/* Team Assignments */}
                                            <div className="space-y-3">
                                                {/* Projectleider */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                        Projectleider <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Select
                                                        value={config.assignedProjectleider || "_none"}
                                                        onValueChange={(v) => updateConfig(lead.id, { assignedProjectleider: v === "_none" ? null : v })}
                                                    >
                                                        <SelectTrigger className="bg-white h-9" onClick={(e) => e.stopPropagation()}>
                                                            <SelectValue placeholder="Selecteer..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="_none" disabled>Selecteer...</SelectItem>
                                                            {projectleiders.map(user => (
                                                                <SelectItem key={user.id} value={user.name}>
                                                                    {user.name}
                                                                </SelectItem>
                                                            ))}
                                                            {projectleiders.length === 0 && (
                                                                <SelectItem value="_no" disabled>Geen projectleiders</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Rekenaar */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs flex items-center gap-1.5">
                                                        <Calculator className="w-3.5 h-3.5 text-muted-foreground" />
                                                        Rekenaar
                                                    </Label>
                                                    <Select
                                                        value={config.assignedRekenaar || "_none"}
                                                        onValueChange={(v) => updateConfig(lead.id, { assignedRekenaar: v === "_none" ? null : v })}
                                                    >
                                                        <SelectTrigger className="bg-white h-9" onClick={(e) => e.stopPropagation()}>
                                                            <SelectValue placeholder="Nog niet toewijzen" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="_none">Nog niet toewijzen</SelectItem>
                                                            {rekenaars.map(user => (
                                                                <SelectItem key={user.id} value={user.name}>
                                                                    {user.name}
                                                                </SelectItem>
                                                            ))}
                                                            {rekenaars.length === 0 && (
                                                                <SelectItem value="_no" disabled>Geen rekenaars</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Tekenaar */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs flex items-center gap-1.5">
                                                        <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                                                        Tekenaar
                                                    </Label>
                                                    <Select
                                                        value={config.assignedTekenaar || "_none"}
                                                        onValueChange={(v) => updateConfig(lead.id, { assignedTekenaar: v === "_none" ? null : v })}
                                                    >
                                                        <SelectTrigger className="bg-white h-9" onClick={(e) => e.stopPropagation()}>
                                                            <SelectValue placeholder="Nog niet toewijzen" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="_none">Nog niet toewijzen</SelectItem>
                                                            {tekenaars.map(user => (
                                                                <SelectItem key={user.id} value={user.name}>
                                                                    {user.name}
                                                                </SelectItem>
                                                            ))}
                                                            {tekenaars.length === 0 && (
                                                                <SelectItem value="_no" disabled>Geen tekenaars</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Validation Warning */}
                                    {(!config.werknummer || !config.assignedProjectleider || !config.value) && (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>
                                                Vul alle verplichte velden in om de offerte te kunnen verzenden
                                                {!config.werknummer && ' (werknummer)'}
                                                {!config.value && ' (offertebedrag)'}
                                                {!config.assignedProjectleider && ' (projectleider)'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-2">
                                        <Button 
                                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAccept(lead)
                                            }}
                                            disabled={isProcessing || !config.werknummer || !config.assignedProjectleider || !config.value}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                            Offerte Verzenden
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleReject(lead.id, lead.clientName)
                                            }}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                            Afwijzen
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className="ml-auto gap-2"
                                            asChild
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Link href={`/leads/${lead.id}`}>
                                                Volledige Details
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            )}

                            {/* Collapsed Actions */}
                            {!config.isExpanded && (
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            size="sm"
                                            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleExpanded(lead.id)
                                            }}
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Beoordelen
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleReject(lead.id, lead.clientName)
                                            }}
                                            disabled={isProcessing}
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Afwijzen
                                        </Button>
                                        <div className="flex items-center gap-4 ml-auto text-xs text-muted-foreground">
                                            {lead.clientEmail && (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    {lead.clientEmail}
                                                </span>
                                            )}
                                            {lead.clientPhone && (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {lead.clientPhone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )
                })}

                {newApplications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-emerald-50/50 rounded-xl border-2 border-dashed border-emerald-200">
                        <div className="w-48 h-48 mb-2">
                            <IsoEmpty />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-xl mb-2 text-emerald-800">Geen nieuwe aanvragen</h3>
                        <p className="text-muted-foreground max-w-md">
                            Goed gedaan! Je bent helemaal bij. Nieuwe intakeformulieren verschijnen hier automatisch zodra ze binnenkomen.
                        </p>
                        <Button variant="outline" className="mt-6 border-emerald-200 text-emerald-700 hover:bg-emerald-50" asChild>
                            <Link href="/pipeline">
                                Bekijk Pipeline
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
        </PageErrorBoundary>
    )
}
