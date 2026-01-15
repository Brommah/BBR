"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
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
    Hash, Users, UserCheck
} from "lucide-react"
import Link from "next/link"
import { useLeadStore, Lead } from "@/lib/store"
import { useAuthStore, useAllUsers } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { IsoInbox, IsoEmpty } from "@/components/ui/illustrations"
import { toast } from "sonner"
import { PageLoader, PageErrorBoundary } from "@/components/error-boundary"

/** Configuration data when accepting a lead */
interface AcceptConfig {
    werknummer: string
    assignedProjectleider: string | null
    assignedRekenaar: string | null
    assignedTekenaar: string | null
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
    if (diffMins < 60) return `${diffMins} minuten geleden`
    if (diffHours < 24) return `${diffHours} uur geleden`
    if (diffDays === 1) return "Gisteren"
    return `${diffDays} dagen geleden`
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
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
    
    // Accept dialog state
    const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [acceptConfig, setAcceptConfig] = useState<AcceptConfig>({
        werknummer: "",
        assignedProjectleider: null,
        assignedRekenaar: null,
        assignedTekenaar: null,
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Filter users by role
    const projectleiders = users.filter(u => u.role === 'projectleider')
    const rekenaars = users.filter(u => u.role === 'engineer' && u.engineerType === 'rekenaar')
    const tekenaars = users.filter(u => u.role === 'engineer' && u.engineerType === 'tekenaar')
    
    // Get leads with status "Nieuw" - these are new incoming applications
    const newApplications = leads
        .filter(lead => lead.status === "Nieuw")
        .sort((a, b) => {
            // Sort by creation date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

    // Generate suggested werknummer
    const generateWerknummer = () => {
        const year = new Date().getFullYear()
        const existingNumbers = leads
            .filter(l => l.werknummer?.startsWith(`${year}-`))
            .map(l => {
                const match = l.werknummer?.match(/\d{4}-(\d+)/)
                return match ? parseInt(match[1], 10) : 0
            })
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
        return `${year}-${String(nextNumber).padStart(3, '0')}`
    }

    // Open accept dialog
    const openAcceptDialog = (lead: Lead) => {
        setSelectedLead(lead)
        setAcceptConfig({
            werknummer: generateWerknummer(),
            assignedProjectleider: null,
            assignedRekenaar: null,
            assignedTekenaar: null,
        })
        setAcceptDialogOpen(true)
    }

    // Handle accept with configuration
    const handleAcceptWithConfig = async () => {
        if (!currentUser || !selectedLead) {
            toast.error("Niet ingelogd", {
                description: "Log in om leads te accepteren."
            })
            return
        }

        // Validation
        if (!acceptConfig.werknummer.trim()) {
            toast.error("Werknummer vereist", {
                description: "Vul een werknummer in voor dit project."
            })
            return
        }

        if (!acceptConfig.assignedProjectleider) {
            toast.error("Projectleider vereist", {
                description: "Wijs een projectleider toe aan dit project."
            })
            return
        }

        setIsSubmitting(true)
        const leadId = selectedLead.id
        const clientName = selectedLead.clientName
        
        try {
            // 1. Update werknummer
            const werknummerSuccess = await updateLead(leadId, { 
                werknummer: acceptConfig.werknummer.trim()
            })
            
            if (!werknummerSuccess) {
                toast.error("Kon werknummer niet instellen")
                setIsSubmitting(false)
                return
            }

            // 2. Update team assignments
            const teamSuccess = await updateTeamAssignments(leadId, {
                assignedProjectleider: acceptConfig.assignedProjectleider,
                assignedRekenaar: acceptConfig.assignedRekenaar,
                assignedTekenaar: acceptConfig.assignedTekenaar,
            })
            
            if (!teamSuccess) {
                toast.error("Kon team niet toewijzen")
                setIsSubmitting(false)
                return
            }

            // 3. Update status to Calculatie
            const statusSuccess = await updateLeadStatus(leadId, "Calculatie")
            if (!statusSuccess) {
                toast.error("Kon status niet bijwerken")
                setIsSubmitting(false)
                return
            }

            // Close dialog and show success
            setAcceptDialogOpen(false)
            setSelectedLead(null)
            
            toast.success("Lead geaccepteerd!", {
                description: `${clientName} is nu actief met werknummer ${acceptConfig.werknummer}.`,
                action: {
                    label: "Bekijken",
                    onClick: () => router.push(`/leads/${leadId}`)
                }
            })
        } catch (error) {
            console.error('Accept error:', error)
            toast.error("Er ging iets mis")
        } finally {
            setIsSubmitting(false)
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
                        <p className="page-description">Nieuwe aanvragen die wachten op beoordeling.</p>
                    </div>
                </div>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 text-sm">
                    {newApplications.length} nieuwe aanvragen
                </Badge>
            </div>

            <div className="space-y-4 max-w-5xl mx-auto">
                {newApplications.map((lead) => {
                    const isProcessing = processingIds.has(lead.id)
                    
                    return (
                        <Card 
                            key={lead.id} 
                            className={`card-hover-effect transition-all ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-lg">{lead.clientName}</CardTitle>
                                        </div>
                                        <CardDescription className="flex items-center gap-4 text-sm pt-1">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                {getRelativeTime(lead.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                {lead.city}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                {getPropertyType(lead.projectType) === "Appartement" ? (
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                ) : (
                                                    <HomeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                )}
                                                {getPropertyType(lead.projectType)}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="shrink-0 bg-background/50 backdrop-blur-sm">
                                        {lead.projectType}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Address if available */}
                                {lead.address && (
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        📍 {lead.address}, {lead.city}
                                    </p>
                                )}

                                {/* Specifications if available */}
                                {lead.specifications && lead.specifications.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {lead.specifications.slice(0, 4).map((spec, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {spec.key}: {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                                            </Badge>
                                        ))}
                                        {lead.specifications.length > 4 && (
                                            <Badge variant="secondary" className="text-xs">
                                                +{lead.specifications.length - 4} meer
                                            </Badge>
                                        )}
                                    </div>
                                )}
                                
                                {/* Contact info */}
                                <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2">
                                    {lead.clientEmail && (
                                        <span className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                                            <Mail className="w-3.5 h-3.5" />
                                            {lead.clientEmail}
                                        </span>
                                    )}
                                    {lead.clientPhone && (
                                        <span className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                                            <Phone className="w-3.5 h-3.5" />
                                            {lead.clientPhone}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-4 mt-2 border-t border-border/50">
                                                <Button 
                                                        size="sm" 
                                                        className="gap-2 shadow-sm"
                                                        onClick={() => openAcceptDialog(lead)}
                                                        disabled={isProcessing}
                                                    >
                                                        {isProcessing ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        )}
                                                        Accepteren
                                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20"
                                        onClick={() => handleReject(lead.id, lead.clientName)}
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
                                        size="sm" 
                                        variant="ghost" 
                                        className="ml-auto gap-2 hover:bg-muted/50"
                                        asChild
                                    >
                                        <Link href={`/leads/${lead.id}`}>
                                            Details bekijken
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {newApplications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-muted/20 rounded-xl border-2 border-dashed border-border">
                        <div className="w-48 h-48 mb-2">
                            <IsoEmpty />
                        </div>
                        <h3 className="font-semibold text-xl mb-2">Geen nieuwe aanvragen</h3>
                        <p className="text-muted-foreground max-w-md">
                            Goed gedaan! Je bent helemaal bij. Nieuwe intakeformulieren verschijnen hier automatisch zodra ze binnenkomen.
                        </p>
                        <Button variant="outline" className="mt-6" asChild>
                            <Link href="/pipeline">
                                Bekijk Pipeline
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Accept Configuration Dialog */}
            <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-primary" />
                            Project Configureren
                        </DialogTitle>
                        <DialogDescription>
                            Configureer de projectdetails voor <strong>{selectedLead?.clientName}</strong> voordat deze naar de pipeline gaat.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Werknummer */}
                        <div className="space-y-2">
                            <Label htmlFor="werknummer" className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-muted-foreground" />
                                Werknummer <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="werknummer"
                                value={acceptConfig.werknummer}
                                onChange={(e) => setAcceptConfig({ ...acceptConfig, werknummer: e.target.value })}
                                placeholder="bijv. 2026-001"
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Uniek projectnummer voor interne administratie.
                            </p>
                        </div>

                        {/* Projectleider */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                Projectleider <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={acceptConfig.assignedProjectleider || "_none"}
                                onValueChange={(v) => setAcceptConfig({ ...acceptConfig, assignedProjectleider: v === "_none" ? null : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecteer projectleider..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none" disabled>Selecteer...</SelectItem>
                                    {projectleiders.map(user => (
                                        <SelectItem key={user.id} value={user.name}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                    {projectleiders.length === 0 && (
                                        <SelectItem value="_no_users" disabled>
                                            Geen projectleiders beschikbaar
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Rekenaar */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                Rekenaar <span className="text-muted-foreground text-xs">(optioneel)</span>
                            </Label>
                            <Select
                                value={acceptConfig.assignedRekenaar || "_none"}
                                onValueChange={(v) => setAcceptConfig({ ...acceptConfig, assignedRekenaar: v === "_none" ? null : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecteer rekenaar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Nog niet toewijzen</SelectItem>
                                    {rekenaars.map(user => (
                                        <SelectItem key={user.id} value={user.name}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                    {rekenaars.length === 0 && (
                                        <SelectItem value="_no_users" disabled>
                                            Geen rekenaars beschikbaar
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tekenaar */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                Tekenaar <span className="text-muted-foreground text-xs">(optioneel)</span>
                            </Label>
                            <Select
                                value={acceptConfig.assignedTekenaar || "_none"}
                                onValueChange={(v) => setAcceptConfig({ ...acceptConfig, assignedTekenaar: v === "_none" ? null : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecteer tekenaar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Nog niet toewijzen</SelectItem>
                                    {tekenaars.map(user => (
                                        <SelectItem key={user.id} value={user.name}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                    {tekenaars.length === 0 && (
                                        <SelectItem value="_no_users" disabled>
                                            Geen tekenaars beschikbaar
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAcceptDialogOpen(false)} disabled={isSubmitting}>
                            Annuleren
                        </Button>
                        <Button onClick={handleAcceptWithConfig} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            Accepteren & Starten
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </PageErrorBoundary>
    )
}
