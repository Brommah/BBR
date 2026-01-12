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
import { PipelineLegend } from "./pipeline-legend"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const COLUMNS: { id: LeadStatus, label: string }[] = [
    { id: "Nieuw", label: "Nieuw" },
    { id: "Calculatie", label: "Calculatie" },
    { id: "Offerte Verzonden", label: "Offerte Verzonden" },
    { id: "Opdracht", label: "Opdracht" },
    { id: "Archief", label: "Archief" },
]

export function PipelineView() {
    const { leads, updateLeadStatus, isLoading } = useLeadStore()
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    )

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string)
        setIsDragging(true)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)
        setIsDragging(false)

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

    // Loading state
    if (isLoading) {
        return (
            <div className="h-[calc(100vh-4rem)] p-6 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Leads laden...</p>
                </div>
            </div>
        )
    }

    if (!isMounted) return null

    return (
        <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div className="h-[calc(100vh-4rem)] p-6 flex flex-col">
                {/* Legend */}
                <div className="flex-shrink-0">
                    <PipelineLegend />
                </div>
                
                <div className="flex gap-4 flex-1 min-w-max overflow-x-auto overflow-y-hidden">
                    {COLUMNS.map(col => {
                        const colLeads = leads.filter(l => l.status === col.id)
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
