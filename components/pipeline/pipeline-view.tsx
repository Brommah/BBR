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
import { useLeadStore, LeadStatus } from "@/lib/store"
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
import { Search, X, SlidersHorizontal } from "lucide-react"
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

export function PipelineView() {
    const { leads, updateLeadStatus, isLoading } = useLeadStore()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<Filters>({
        search: "",
        projectType: "all",
        assignee: "all",
        hideArchived: false
    })
    const isMounted = useIsMounted()

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    )

    // Get unique project types and assignees from leads
    const projectTypes = useMemo(() => {
        const types = new Set(leads.map(l => l.projectType))
        return Array.from(types).sort()
    }, [leads])

    const assignees = useMemo(() => {
        const names = new Set(leads.filter(l => l.assignee).map(l => l.assignee!))
        return Array.from(names).sort()
    }, [leads])

    // Apply filters
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
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

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const newStatus = over.id as LeadStatus
        const lead = leads.find(l => l.id === active.id)
        
        if (lead && lead.status !== newStatus && COLUMNS.some(c => c.id === newStatus)) {
            const success = await updateLeadStatus(active.id as string, newStatus)
            
            if (success) {
                toast.success(`${lead.clientName} verplaatst`, {
                    description: `Status gewijzigd naar "${newStatus}"`
                })
            }
        }
    }

    const activeLead = activeId ? leads.find(l => l.id === activeId) : null

    // Loading state with skeleton
    if (isLoading) {
        return (
            <div className="h-[calc(100vh-4rem)] p-6">
                <PipelineSkeleton />
            </div>
        )
    }

    if (!isMounted) return null

    // Determine which columns to show
    const visibleColumns = filters.hideArchived 
        ? COLUMNS.filter(c => c.id !== "Archief")
        : COLUMNS

    return (
        <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div 
                className="h-[calc(100vh-4rem)] p-6 flex flex-col"
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
                        <div className="text-sm text-muted-foreground ml-auto">
                            {filteredLeads.length} van {leads.length} leads
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
                    className="flex gap-4 flex-1 min-w-max overflow-x-auto overflow-y-hidden"
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
