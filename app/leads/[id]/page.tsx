"use client"

import { useParams } from "next/navigation"
import { useLeadStore, Lead } from "@/lib/store"
import { CommunicationPanel } from "@/components/lead-detail/communication-panel"
import { QuotePanelSmart } from "@/components/lead-detail/quote-panel-smart"
import { DocumentsPanel } from "@/components/lead-detail/documents-panel"
import { HourRegistrationPanel } from "@/components/lead-detail/hour-registration-panel"
import { GroundInvestigationPanel } from "@/components/lead-detail/ground-investigation-panel"
// NotesPanel merged into CommunicationPanel
import { LocationCard } from "@/components/lead-detail/location-card"
import { KadasterPanel } from "@/components/lead-detail/kadaster-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    ArrowLeft, 
    MessageSquare, 
    FolderOpen, 
    Clock, 
    Loader2, 
    Layers,
    Phone,
    Mail,
    ChevronRight,
    ChevronLeft,
    MoreHorizontal,
    Pencil,
    Building2,
    Calculator,
    Settings,
    ExternalLink,
    Archive,
    Trash2,
    Share2,
    History,
    CircleDot
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useTransition } from "react"
import { getLead } from "@/lib/db-actions"
import { requiresGroundInvestigation } from "@/lib/project-utils"
import { TeamAssignmentPanel } from "@/components/lead-detail/team-assignment-panel"
import { useAuthStore } from "@/lib/auth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    "Nieuw": { label: "Nieuw", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/50" },
    "Calculatie": { label: "Calculatie", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/50" },
    "Offerte Verzonden": { label: "Offerte", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/50" },
    "Opdracht": { label: "Opdracht", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/50" },
    "Archief": { label: "Archief", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
}

export default function LeadDetailPage() {
    const params = useParams()
    const { leads, isLoading: storeLoading, updateLeadStatus, loadLeads } = useLeadStore()
    const { isAdmin } = useAuthStore()
    const [directLead, setDirectLead] = useState<Lead | null>(null)
    const [isPending, startTransition] = useTransition()
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
    const [quotePanelOpen, setQuotePanelOpen] = useState(true)
    const [specsExpanded, setSpecsExpanded] = useState(false)
    
    // Only Projectleider (admin) can change status
    const canChangeStatus = isAdmin()
    
    const storeLead = leads.find(l => l.id === params.id)
    
    // Fetch lead directly if not in store (handles HMR/store resets)
    useEffect(() => {
        // If we have the lead from store, we're good
        if (storeLead) {
            return
        }
        
        // If store is loading, wait for it
        if (storeLoading) {
            return
        }
        
        // If we already have a direct lead, keep it
        if (directLead) {
            return
        }
        
        // If no params, nothing to fetch
        if (!params.id) {
            return
        }
        
        // Fetch the lead directly
        setHasAttemptedFetch(true)
        startTransition(async () => {
            const result = await getLead(params.id as string)
            if (result.success && result.data) {
                setDirectLead(result.data as Lead)
            }
            
            // Also trigger store reload if it's empty (helps with HMR)
            if (leads.length === 0) {
                loadLeads()
            }
        })
    }, [storeLead, storeLoading, params.id, directLead, leads.length, loadLeads])
    
    const lead = storeLead || directLead
    // Show loading if store is loading OR we're fetching OR we haven't tried fetching yet
    const isLoading = storeLoading || isPending || (!lead && !hasAttemptedFetch)
    const showGroundTab = lead ? requiresGroundInvestigation(lead.projectType) : false
    
    // Auto-hide quote panel when order is accepted (status = Opdracht)
    const isOrderAccepted = lead?.status === 'Opdracht'
    
    // Extract coordinates from specifications
    const getCoordinate = (key: string) => {
        const spec = lead?.specifications?.find(s => 
            s.key.toLowerCase().includes(key.toLowerCase())
        )
        return spec ? parseFloat(spec.value) : undefined
    }
    const lat = getCoordinate('latitude') || getCoordinate('lat')
    const lon = getCoordinate('longitude') || getCoordinate('lon')

    // Filter specs for display (exclude coordinates)
    const displaySpecs = lead?.specifications?.filter(s => 
        !s.key.toLowerCase().includes('lat') && 
        !s.key.toLowerCase().includes('lon')
    ) || []

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Dossier laden...</p>
            </div>
        )
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold">Dossier niet gevonden</h2>
                <Button asChild variant="outline">
                    <Link href="/pipeline">Terug naar Pipeline</Link>
                </Button>
            </div>
        )
    }

    const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG["Nieuw"]

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
            {/* Compact Header */}
            <header className="h-14 border-b border-border/50 flex items-center px-4 gap-4 bg-white dark:bg-slate-900 shrink-0 shadow-sm">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <Link href="/pipeline">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm min-w-0">
                    <span className="text-muted-foreground hidden md:inline">Dossiers</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden md:block" />
                    <span className="font-semibold truncate text-base">{lead.clientName}</span>
                    {lead.werknummer && (
                        <span className="text-muted-foreground font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {lead.werknummer}
                        </span>
                    )}
                </div>
                
                {/* Status Badge */}
                <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 font-medium`}>
                    {statusConfig.label}
                </Badge>
                
                <div className="flex-1" />
                
                {/* Quote Panel Toggle - Only show when not in Opdracht status */}
                {!isOrderAccepted && (
                    <Button 
                        variant={quotePanelOpen ? "secondary" : "outline"}
                        size="sm" 
                        className="gap-2"
                        onClick={() => setQuotePanelOpen(!quotePanelOpen)}
                    >
                        <Calculator className="w-4 h-4" />
                        <span className="hidden sm:inline">Offerte</span>
                        {quotePanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                )}
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Acties</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            toast.success("Link gekopieerd!")
                        }}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Link kopiëren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Geschiedenis bekijken - coming soon")}>
                            <History className="w-4 h-4 mr-2" />
                            Geschiedenis
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={async () => {
                                const success = await updateLeadStatus(lead.id, "Archief")
                                if (success) {
                                    toast.success("Dossier gearchiveerd")
                                }
                            }}
                            className="text-amber-600"
                        >
                            <Archive className="w-4 h-4 mr-2" />
                            Archiveren
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => toast.error("Verwijderen is uitgeschakeld")}
                            className="text-red-600"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Streamlined Project Info */}
                <aside className="w-72 border-r border-border/50 bg-white dark:bg-slate-900 flex flex-col overflow-hidden shrink-0">
                    <div className="flex-1 overflow-y-auto">
                        {/* Compact Location Card */}
                        <div className="p-3">
                            <LocationCard 
                                address={lead.address}
                                city={lead.city}
                                lat={lat}
                                lon={lon}
                                isValidated={lead.addressValid}
                            />
                        </div>
                        
                        {/* Quick Info Grid */}
                        <div className="px-3 pb-3 space-y-2">
                            {/* Project Type Card */}
                            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                                        <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                            Projecttype
                                        </span>
                                        <p className="text-sm font-semibold truncate mt-0.5">{lead.projectType}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Team Assignment Panel */}
                            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                                <TeamAssignmentPanel 
                                    leadId={lead.id}
                                    assignedRekenaar={lead.assignedRekenaar}
                                    assignedTekenaar={lead.assignedTekenaar}
                                    aanZet={lead.aanZet}
                                />
                            </div>

                            {/* Pipeline Status */}
                            <div className={cn(
                                "p-3 rounded-xl border",
                                lead.status === 'Nieuw' && "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50",
                                lead.status === 'Calculatie' && "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/50",
                                lead.status === 'Offerte Verzonden' && "bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/50",
                                lead.status === 'Opdracht' && "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50",
                                lead.status === 'Archief' && "bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800 border-slate-200/50 dark:border-slate-700/50"
                            )}>
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                        lead.status === 'Nieuw' && "bg-blue-200 dark:bg-blue-800",
                                        lead.status === 'Calculatie' && "bg-amber-200 dark:bg-amber-800",
                                        lead.status === 'Offerte Verzonden' && "bg-purple-200 dark:bg-purple-800",
                                        lead.status === 'Opdracht' && "bg-emerald-200 dark:bg-emerald-800",
                                        lead.status === 'Archief' && "bg-slate-200 dark:bg-slate-700"
                                    )}>
                                        <CircleDot className={cn(
                                            "w-4 h-4",
                                            lead.status === 'Nieuw' && "text-blue-700 dark:text-blue-300",
                                            lead.status === 'Calculatie' && "text-amber-700 dark:text-amber-300",
                                            lead.status === 'Offerte Verzonden' && "text-purple-700 dark:text-purple-300",
                                            lead.status === 'Opdracht' && "text-emerald-700 dark:text-emerald-300",
                                            lead.status === 'Archief' && "text-slate-600 dark:text-slate-400"
                                        )} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                            Pipeline Status
                                        </span>
                                        <div className="mt-1">
                                            <Select
                                                value={lead.status}
                                                onValueChange={async (value) => {
                                                    if (!canChangeStatus) {
                                                        toast.error("Geen toegang", {
                                                            description: "Alleen de Projectleider kan de status wijzigen"
                                                        })
                                                        return
                                                    }
                                                    const success = await updateLeadStatus(lead.id, value as typeof lead.status)
                                                    if (success) {
                                                        toast.success(`Status gewijzigd naar ${value}`)
                                                    }
                                                }}
                                                disabled={!canChangeStatus}
                                            >
                                                <SelectTrigger className="h-8 text-sm border-0 bg-white/50 dark:bg-slate-800/50 shadow-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Nieuw">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                            Nieuw
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="Calculatie">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                            Calculatie
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="Offerte Verzonden">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                                                            Offerte Verzonden
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="Opdracht">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            Opdracht
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="Archief">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                                                            Archief
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                </div>
            </div>

                            {/* Quote Value - Only when approved */}
                            {lead.quoteApproval === 'approved' && lead.quoteValue != null && (
                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center shrink-0">
                                            <Calculator className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-medium">
                                                Offertewaarde
                                            </span>
                                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                                € {lead.quoteValue.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Contact Section */}
                        <div className="px-3 pb-3">
                            <div className="rounded-xl border border-border/50 overflow-hidden">
                                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-border/50">
                                    <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                                        Contact
                                    </h4>
                                </div>
                                <div className="divide-y divide-border/50">
                                    <a 
                                        href={`mailto:${lead.clientEmail}`}
                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="text-sm truncate flex-1">{lead.clientEmail || 'Geen e-mail'}</span>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                    <a 
                                        href={`tel:${lead.clientPhone}`}
                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="text-sm flex-1">{lead.clientPhone || 'Geen telefoon'}</span>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </div>
                            </div>
                </div>

                        {/* Specifications - Collapsible */}
                        {displaySpecs.length > 0 && (
                            <div className="px-3 pb-3">
                                <Collapsible open={specsExpanded} onOpenChange={setSpecsExpanded}>
                                    <div className="rounded-xl border border-border/50 overflow-hidden">
                                        <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                Specificaties ({displaySpecs.length})
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span 
                                                    role="button"
                                                    tabIndex={0}
                                                    className="inline-flex items-center justify-center h-6 px-2 text-[10px] rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation() }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation() }}
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </span>
                                                <ChevronRight className={cn(
                                                    "w-4 h-4 text-muted-foreground transition-transform",
                                                    specsExpanded && "rotate-90"
                                                )} />
                                            </div>
                                        </CollapsibleTrigger>
                                        
                                        {/* Preview when collapsed */}
                                        {!specsExpanded && (
                                            <div className="px-3 py-2 flex flex-wrap gap-1.5">
                                                {displaySpecs.slice(0, 4).map((spec, i) => (
                                                    <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                                                        {spec.key}: {spec.value}{spec.unit || ''}
                                                    </Badge>
                                                ))}
                                                {displaySpecs.length > 4 && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        +{displaySpecs.length - 4} meer
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        
                                        <CollapsibleContent>
                                            <div className="p-2 grid grid-cols-2 gap-1.5">
                                                {displaySpecs.map((spec, i) => (
                                                    <div 
                                                        key={i}
                                                        className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-border/30"
                                                    >
                                                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider font-medium">
                                                            {spec.key}
                                                        </span>
                                                        <span className="text-sm font-semibold">
                                                            {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Center - Work Area with Tabs */}
                <main className={cn(
                    "flex-1 flex flex-col overflow-hidden transition-all duration-300",
                    quotePanelOpen ? "mr-0" : "mr-0"
                )}>
                    <Tabs defaultValue="communication" className="flex-1 flex flex-col overflow-hidden">
                        {/* Tab Navigation - Clean horizontal layout */}
                        <div className="px-4 pt-4 pb-0 shrink-0">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-border/50 p-1">
                                <TabsList className="h-10 bg-transparent p-0 w-full justify-start gap-0.5">
                                    <TabsTrigger 
                                        value="communication" 
                                        className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 rounded-lg px-4 gap-2 transition-all"
                                    >
                                    <MessageSquare className="w-4 h-4" />
                                        <span className="hidden lg:inline">Communicatie</span>
                                </TabsTrigger>
                                    <TabsTrigger 
                                        value="documents" 
                                        className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 rounded-lg px-4 gap-2 transition-all"
                                    >
                                    <FolderOpen className="w-4 h-4" />
                                        <span className="hidden lg:inline">Documenten</span>
                                </TabsTrigger>
                                    
                                    <div className="w-px h-6 bg-border/50 mx-2" />
                                    
                                    {showGroundTab && (
                                        <TabsTrigger 
                                            value="ground" 
                                            className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 rounded-lg px-4 gap-2 transition-all"
                                        >
                                        <Layers className="w-4 h-4" />
                                            <span className="hidden lg:inline">Grond</span>
                                            <Badge variant="secondary" className="h-5 px-1.5 text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                BRO
                                            </Badge>
                                        </TabsTrigger>
                                    )}
                                    <TabsTrigger 
                                        value="kadaster" 
                                        className="data-[state=active]:bg-teal-50 dark:data-[state=active]:bg-teal-950/50 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 rounded-lg px-4 gap-2 transition-all"
                                    >
                                        <Building2 className="w-4 h-4" />
                                        <span className="hidden lg:inline">Kadaster</span>
                                    </TabsTrigger>
                                    
                                    <div className="w-px h-6 bg-border/50 mx-2" />
                                    
                                    <TabsTrigger 
                                        value="hours" 
                                        className="data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 rounded-lg px-4 gap-2 transition-all"
                                    >
                                        <Clock className="w-4 h-4" />
                                        <span className="hidden lg:inline">Uren</span>
                                    </TabsTrigger>
                            </TabsList>
                            </div>
                        </div>
                        
                        {/* Tab Contents - Better contained */}
                        <div className="flex-1 overflow-hidden p-4">
                            <div className="h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-border/50 overflow-hidden flex flex-col">
                                <TabsContent value="communication" className="flex-1 min-h-0 m-0 p-4 flex flex-col overflow-hidden">
                            <CommunicationPanel 
                                leadId={lead.id}
                                leadName={lead.clientName}
                                clientPhone={lead.clientPhone} 
                                clientEmail={lead.clientEmail} 
                            />
                        </TabsContent>
                                <TabsContent value="documents" className="h-full m-0 p-4 overflow-auto">
                                    <DocumentsPanel leadId={lead.id} lead={lead} />
                                </TabsContent>
                                {showGroundTab && (
                                    <TabsContent value="ground" className="h-full m-0 p-4 overflow-auto">
                                <GroundInvestigationPanel 
                                    projectType={lead.projectType}
                                    address={lead.address}
                                    city={lead.city}
                                            lat={lat}
                                            lon={lon}
                                            specifications={lead.specifications}
                                            autoSearch={true}
                                />
                            </TabsContent>
                        )}
                                <TabsContent value="kadaster" className="h-full m-0 p-4 overflow-auto">
                                    <KadasterPanel 
                                        address={lead.address}
                                        city={lead.city}
                                    />
                                </TabsContent>
                                <TabsContent value="hours" className="h-full m-0 p-4 overflow-auto">
                                    <HourRegistrationPanel leadId={lead.id} />
                                </TabsContent>
                            </div>
                        </div>
                    </Tabs>
                </main>

                {/* Right Sidebar - Collapsible Quote Panel (Hidden when order accepted) */}
                {!isOrderAccepted && (
                    <aside className={cn(
                        "border-l border-border/50 bg-white dark:bg-slate-900 overflow-hidden shrink-0 transition-all duration-300",
                        quotePanelOpen ? "w-[420px]" : "w-0 border-l-0"
                    )}>
                        <div className={cn(
                            "w-[420px] h-full overflow-y-auto transition-opacity duration-200",
                            quotePanelOpen ? "opacity-100" : "opacity-0"
                        )}>
                            <div className="p-4">
                                <QuotePanelSmart lead={lead} />
                </div>
                </div>
                    </aside>
                )}
            </div>
        </div>
    )
}
