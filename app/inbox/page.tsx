"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    Clock, MapPin, Home as HomeIcon, Building2, 
    CheckCircle2, XCircle, ArrowRight, Phone, Mail, Loader2
} from "lucide-react"
import Link from "next/link"
import { useLeadStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { IsoInbox, IsoEmpty } from "@/components/ui/illustrations"
import { toast } from "sonner"
import { PageLoader } from "@/components/error-boundary"

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
    const { leads, updateLeadStatus, assignLead, isLoading } = useLeadStore()
    const { currentUser } = useAuthStore()
    const router = useRouter()
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
    
    // Get leads with status "Nieuw" - these are new incoming applications
    const newApplications = leads
        .filter(lead => lead.status === "Nieuw")
        .sort((a, b) => {
            // Urgent first, then by creation date (newest first)
            if (a.isUrgent && !b.isUrgent) return -1
            if (!a.isUrgent && b.isUrgent) return 1
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

    const handleAccept = async (leadId: string, clientName: string) => {
        if (!currentUser) {
            toast.error("Niet ingelogd", {
                description: "Log in om leads te accepteren."
            })
            return
        }

        setProcessingIds(prev => new Set(prev).add(leadId))
        
        try {
            const statusSuccess = await updateLeadStatus(leadId, "Calculatie")
            if (!statusSuccess) {
                setProcessingIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(leadId)
                    return newSet
                })
                return
            }

            const assignSuccess = await assignLead(leadId, currentUser.name)
            if (!assignSuccess) {
                // Rollback status change already handled by store
                setProcessingIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(leadId)
                    return newSet
                })
                return
            }

            toast.success("Lead geaccepteerd!", {
                description: `${clientName} is toegevoegd aan je werklijst.`,
                action: {
                    label: "Bekijken",
                    onClick: () => router.push(`/leads/${leadId}`)
                }
            })
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(leadId)
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
                            className={`card-hover-effect transition-all ${
                                lead.isUrgent 
                                    ? 'border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10' 
                                    : ''
                            } ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-lg">{lead.clientName}</CardTitle>
                                            {lead.isUrgent && (
                                                <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-none">Spoed</Badge>
                                            )}
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
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant="outline" className="shrink-0 bg-background/50 backdrop-blur-sm">
                                            {lead.projectType}
                                        </Badge>
                                        <span className="text-lg font-semibold text-emerald-600 font-mono">
                                            € {lead.value.toLocaleString('nl-NL')}
                                        </span>
                                    </div>
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
                                        onClick={() => handleAccept(lead.id, lead.clientName)}
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
        </div>
    )
}
