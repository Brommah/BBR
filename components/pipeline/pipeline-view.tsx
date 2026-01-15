"use client"

import { 
    DndContext, 
    DragEndEvent, 
    DragOverlay, 
    useSensor, 
    useSensors, 
    PointerSensor, 
    KeyboardSensor,
    DragStartEvent
} from "@dnd-kit/core"
import { useLeadStore, LeadStatus, Lead } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { KanbanColumn } from "./kanban-column"
import { LeadCard } from "./lead-card"
import { PipelineLegend, PROJECT_TYPE_COLORS, ASSIGNEE_COLORS } from "./pipeline-legend"
import { PipelineSkeleton } from "@/components/ui/skeleton-loaders"
import { useState, useSyncExternalStore, useMemo } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Search, X, SlidersHorizontal, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const COLUMNS: { id: LeadStatus, label: string }[] = [
    { id: "Nieuw", label: "Nieuw" },
    { id: "Calculatie", label: "Calculatie" },
    { id: "Offerte Verzonden", label: "Offerte Verzonden" },
    { id: "Opdracht", label: "Opdracht" },
    { id: "Archief", label: "Archief" },
]

// Hydration detection using useSyncExternalStore (no cascading renders)
const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

function useIsMounted() {
    return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
}

interface Filters {
    search: string
    projectType: string
    assignee: string
    hideArchived: boolean
}

/**
 * Filter leads based on user role and engineer type
 * - Admin (Fred/Pim): sees all leads in all statuses
 * - Projectleider (Femke/Rohina): sees leads assigned to them
 * - Rekenaar/Tekenaar: only sees leads where:
 *   1. Status is "Opdracht" (quote accepted)
 *   2. Assigned to them
 *   3. They are "aan zet" (their turn to work)
 */
function filterLeadsByRole(leads: Lead[], user: { role: string; name: string; engineerType?: string } | null): Lead[] {
    if (!user) return []
    
    // Admin sees everything
    if (user.role === 'admin') {
        return leads
    }
    
    // Projectleider sees leads assigned to them (all statuses)
    if (user.role === 'projectleider') {
        return leads.filter(lead => lead.assignedProjectleider === user.name)
    }
    
    // Engineers only see specific leads
    if (user.role === 'engineer') {
        return leads.filter(lead => {
            // Must be in "Opdracht" status (quote accepted)
            if (lead.status !== 'Opdracht') {
                return false
            }
            
            // Must be assigned to them based on their engineer type
            if (user.engineerType === 'rekenaar') {
                if (lead.assignedRekenaar !== user.name) return false
            } else if (user.engineerType === 'tekenaar') {
                if (lead.assignedTekenaar !== user.name) return false
            } else {
                // Fallback to old assignee field if engineerType not set
                if (lead.assignee !== user.name) return false
            }
            
            // Must be "aan zet" for their role
            if (lead.aanZet !== user.engineerType) {
                return false
            }
            
            return true
        })
    }
    
    // Viewers see all but read-only
    return leads
}

export function PipelineView() {
    const { leads, updateLeadStatus, isLoading } = useLeadStore()
    const { currentUser, isAdmin } = useAuthStore()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<Filters>({
        search: "",
        projectType: "all",
        assignee: "all",
        hideArchived: false
    })
    const isMounted = useIsMounted()
    
    // Filter leads by role first
    const roleFilteredLeads = useMemo(() => {
        return filterLeadsByRole(leads, currentUser)
    }, [leads, currentUser])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    )

    // Get unique project types and assignees from role-filtered leads
    const projectTypes = useMemo(() => {
        const types = new Set(roleFilteredLeads.map(l => l.projectType))
        return Array.from(types).sort()
    }, [roleFilteredLeads])

    const assignees = useMemo(() => {
        const names = new Set(roleFilteredLeads.filter(l => l.assignee).map(l => l.assignee!))
        return Array.from(names).sort()
    }, [roleFilteredLeads])

    // Apply user filters on top of role-based filtering
    const filteredLeads = useMemo(() => {
        return roleFilteredLeads.filter(lead => {
            // Search filter (client name, city, project type)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                const matchesSearch = 
                    lead.clientName.toLowerCase().includes(searchLower) ||
                    lead.city.toLowerCase().includes(searchLower) ||
                    lead.projectType.toLowerCase().includes(searchLower) ||
                    (lead.address && lead.address.toLowerCase().includes(searchLower))
                if (!matchesSearch) return false
            }

            // Project type filter
            if (filters.projectType !== "all" && lead.projectType !== filters.projectType) {
                return false
            }

            // Assignee filter
            if (filters.assignee !== "all") {
                if (filters.assignee === "unassigned" && lead.assignee) return false
                if (filters.assignee !== "unassigned" && lead.assignee !== filters.assignee) return false
            }

            // Hide archived filter
            if (filters.hideArchived && lead.status === "Archief") {
                return false
            }

            return true
        })
    }, [leads, filters])

    const hasActiveFilters = filters.search || filters.projectType !== "all" || filters.assignee !== "all" || filters.hideArchived
    const activeFilterCount = [
        filters.search, 
        filters.projectType !== "all", 
        filters.assignee !== "all", 
        filters.hideArchived
    ].filter(Boolean).length

    const clearFilters = () => {
        setFilters({
            search: "",
            projectType: "all",
            assignee: "all",
            hideArchived: false
        })
    }
    
    // Check if user can drag (only admins can change status)
    const canDrag = isAdmin()

    function handleDragStart(event: DragStartEvent) {
        if (!canDrag) {
            toast.error("Geen toegang", {
                description: "Alleen de Projectleider kan de status wijzigen"
            })
            return
        }
        setActiveId(event.active.id as string)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)

        if (!over || !canDrag) return

        const newStatus = over.id as LeadStatus
        const lead = roleFilteredLeads.find(l => l.id === active.id)
        
        if (lead && lead.status !== newStatus && COLUMNS.some(c => c.id === newStatus)) {
            const success = await updateLeadStatus(active.id as string, newStatus)
            
            if (success) {
                toast.success(`${lead.clientName} verplaatst`, {
                    description: `Status gewijzigd naar "${newStatus}"`
                })
            }
        }
    }

    const activeLead = activeId ? roleFilteredLeads.find(l => l.id === activeId) : null
    
    // Check if user is an engineer (not admin)
    const isEngineer = currentUser?.role === 'engineer'

    // Loading state with skeleton
    if (isLoading) {
        return (
            <div className="h-full p-6">
                <PipelineSkeleton />
            </div>
        )
    }

    if (!isMounted) return null

    // Determine which columns to show based on role
    // Engineers only see "Opdracht" column
    // Admins see all columns (optionally hide Archief)
    let visibleColumns = COLUMNS
    if (isEngineer) {
        visibleColumns = COLUMNS.filter(c => c.id === "Opdracht")
    } else if (filters.hideArchived) {
        visibleColumns = COLUMNS.filter(c => c.id !== "Archief")
    }
    
    // Show message when engineer has no leads "aan zet"
    if (isEngineer && filteredLeads.length === 0) {
        return (
            <div className="h-full p-6 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Geen projecten aan zet</h2>
                    <p className="text-muted-foreground">
                        Op dit moment heb je geen projecten waarbij jij aan zet bent. 
                        De Projectleider wijst projecten toe en bepaalt wie aan de beurt is.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div 
                className="h-full p-6 flex flex-col overflow-hidden"
                role="application"
                aria-label="Lead pipeline - Sleep kaarten om status te wijzigen"
            >
                {/* Filter Bar */}
                <div className="flex-shrink-0 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Zoek op naam, stad of project..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="pl-9 pr-9"
                            />
                            {filters.search && (
                                <button
                                    onClick={() => setFilters({ ...filters, search: "" })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Toggle Filters Button */}
                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="gap-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                                Reset
                            </Button>
                        )}

                        {/* Result count */}
                        <div className="text-sm text-muted-foreground ml-auto flex items-center gap-2">
                            {isEngineer && (
                                <Badge variant="outline" className="font-normal text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                                    Jouw werken
                                </Badge>
                            )}
                            {filteredLeads.length} van {roleFilteredLeads.length} leads
                        </div>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="mt-3 p-4 bg-card border border-border rounded-lg flex flex-wrap gap-4 items-end animate-fade-in">
                            {/* Project Type Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Project Type</label>
                                <Select
                                    value={filters.projectType}
                                    onValueChange={(value) => setFilters({ ...filters, projectType: value })}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Alle types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Alle types</SelectItem>
                                        {projectTypes.map(type => (
                                            <SelectItem key={type} value={type}>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        PROJECT_TYPE_COLORS[type]?.bg || "bg-slate-400"
                                                    )} />
                                                    {type}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Assignee Filter */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Toegewezen aan</label>
                                <Select
                                    value={filters.assignee}
                                    onValueChange={(value) => setFilters({ ...filters, assignee: value })}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Alle engineers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Alle engineers</SelectItem>
                                        <SelectItem value="unassigned">Niet toegewezen</SelectItem>
                                        {assignees.map(name => (
                                            <SelectItem key={name} value={name}>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                                                        ASSIGNEE_COLORS[name]?.bg || "bg-slate-500",
                                                        ASSIGNEE_COLORS[name]?.text || "text-white"
                                                    )}>
                                                        {name[0]}
                                                    </div>
                                                    {name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Hide Archived Toggle */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Weergave</label>
                                <Button
                                    variant={filters.hideArchived ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setFilters({ ...filters, hideArchived: !filters.hideArchived })}
                                    className="h-10"
                                >
                                    {filters.hideArchived ? "Archief verborgen" : "Toon alles"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="flex-shrink-0">
                    <PipelineLegend />
                </div>
                
                <div 
                    className="flex gap-4 flex-1 overflow-x-auto overflow-y-hidden pb-4"
                    role="region"
                    aria-label={`Pipeline met ${filteredLeads.length} leads in ${visibleColumns.length} kolommen`}
                >
                    {visibleColumns.map(col => {
                        const colLeads = filteredLeads.filter(l => l.status === col.id)
                        return (
                            <KanbanColumn 
                                key={col.id} 
                                status={col.id} 
                                title={col.label} 
                                count={colLeads.length}
                            >
                                {colLeads.map(lead => (
                                    <LeadCard key={lead.id} lead={lead} />
                                ))}
                            </KanbanColumn>
                        )
                    })}
                </div>
            </div>

            {typeof window !== "undefined" && createPortal(
                <DragOverlay>
                    {activeLead ? (
                         <div className="transform rotate-2 opacity-90 cursor-grabbing">
                            <LeadCard lead={activeLead} />
                         </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    )
}
