"use client"

import { useParams } from "next/navigation"
import { useLeadStore } from "@/lib/store"
import { ContextPanel } from "@/components/lead-detail/context-panel"
import { ActivityPanel } from "@/components/lead-detail/activity-panel"
import { QuotePanel } from "@/components/lead-detail/quote-panel"
import { DocumentsPanel } from "@/components/lead-detail/documents-panel"
import { TimeTracker } from "@/components/lead-detail/time-tracker"
import { SmartChecklist } from "@/components/lead-detail/smart-checklist"
import { CalculationHistory } from "@/components/lead-detail/calculation-history"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, MessageSquare, FolderOpen, History } from "lucide-react"
import Link from "next/link"

export default function LeadDetailPage() {
    const params = useParams()
    const { leads } = useLeadStore()
    const lead = leads.find(l => l.id === params.id)

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-xl font-bold">Lead niet gevonden</h2>
                <Button asChild variant="outline">
                    <Link href="/pipeline">Terug naar Pipeline</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
             {/* Header */}
            <div className="h-14 border-b border-border flex items-center px-6 gap-4 bg-background z-10">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link href="/pipeline">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        {lead.id} / {lead.clientName}
                    </h1>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                    Druk <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-[10px] font-mono">⌘K</kbd> voor sneltoetsen
                </div>
            </div>

            {/* Workstation Grid */}
            <div className="flex-1 grid grid-cols-12 gap-0 divide-x divide-border overflow-hidden">
                {/* Context Panel - Left Column */}
                <div className="col-span-3 h-full overflow-y-auto p-6 bg-background/50 space-y-4">
                    <ContextPanel lead={lead} />
                    
                    {/* Smart Checklist */}
                    <SmartChecklist projectType={lead.projectType} leadId={lead.id} />
                    
                    {/* Time Tracker */}
                    <TimeTracker leadId={lead.id} />
                </div>

                {/* Center Panel - Tabbed Activity, Documents, History */}
                <div className="col-span-5 h-full overflow-hidden flex flex-col bg-background">
                    <Tabs defaultValue="activity" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 pt-4 pb-2 border-b bg-background">
                            <TabsList className="bg-muted p-1">
                                <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-card">
                                    <MessageSquare className="w-4 h-4" />
                                    Activiteit
                                </TabsTrigger>
                                <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-card">
                                    <FolderOpen className="w-4 h-4" />
                                    Documenten
                                </TabsTrigger>
                                <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-card">
                                    <History className="w-4 h-4" />
                                    Geschiedenis
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="activity" className="flex-1 overflow-hidden p-6 pt-4 m-0">
                            <ActivityPanel 
                                leadId={lead.id} 
                                clientPhone={lead.clientPhone} 
                                clientEmail={lead.clientEmail} 
                            />
                        </TabsContent>
                        <TabsContent value="documents" className="flex-1 overflow-hidden p-6 pt-4 m-0">
                            <DocumentsPanel leadId={lead.id} />
                        </TabsContent>
                        <TabsContent value="history" className="flex-1 overflow-auto p-6 pt-4 m-0">
                            <CalculationHistory leadId={lead.id} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Quote Panel - Right Column */}
                <div className="col-span-4 h-full overflow-y-auto p-6 bg-muted/30">
                    <QuotePanel />
                </div>
            </div>
        </div>
    )
}
