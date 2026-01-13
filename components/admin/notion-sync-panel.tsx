"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { syncRoadmapToNotion, syncLeadsToNotion, syncSystemOverviewToNotion, syncAllDocumentationToNotion } from "@/app/actions"
import { useLeadStore } from "@/lib/store"
import { toast } from "sonner"
import { useState } from "react"
import { RefreshCw, UploadCloud, FileCheck, Book, Sparkles, CheckCircle2, XCircle } from "lucide-react"

export function NotionSyncPanel() {
    const { leads } = useLeadStore()
    const [isSyncingRoadmap, setIsSyncingRoadmap] = useState(false)
    const [isSyncingLeads, setIsSyncingLeads] = useState(false)
    const [isSyncingOverview, setIsSyncingOverview] = useState(false)
    const [isSyncingAll, setIsSyncingAll] = useState(false)
    const [syncResults, setSyncResults] = useState<Record<string, boolean> | null>(null)

    const handleSyncRoadmap = async () => {
        setIsSyncingRoadmap(true)
        try {
            const result = await syncRoadmapToNotion()
            if (result.success) {
                toast.success(`Synced ${result.count} roadmap items to Notion!`)
            }
        } catch {
            toast.error("Failed to sync roadmap")
        } finally {
            setIsSyncingRoadmap(false)
        }
    }

    const handleSyncLeads = async () => {
        setIsSyncingLeads(true)
        try {
            const leadsToSync = leads.map(l => ({
                id: l.id,
                clientName: l.clientName,
                projectType: l.projectType,
                city: l.city,
                status: l.status,
                value: l.value,
                assignee: l.assignee
            }))
            const result = await syncLeadsToNotion(leadsToSync)
            if (result.success) {
                toast.success(`Synced ${result.count} leads to Notion CRM!`)
            }
        } catch {
            toast.error("Failed to sync leads")
        } finally {
            setIsSyncingLeads(false)
        }
    }

    const handleSyncOverview = async () => {
        setIsSyncingOverview(true)
        try {
            const result = await syncSystemOverviewToNotion()
            if (result.success) {
                toast.success("System overview synced to Notion Hub!")
            }
        } catch {
            toast.error("Failed to sync system overview")
        } finally {
            setIsSyncingOverview(false)
        }
    }

    const handleSyncAllDocumentation = async () => {
        setIsSyncingAll(true)
        setSyncResults(null)
        try {
            const result = await syncAllDocumentationToNotion()
            if (result.success) {
                setSyncResults(result.results)
                toast.success(`${result.message}`, {
                    description: "Check the Notion Projects Hub for all documentation pages."
                })
            } else {
                toast.error("Failed to sync some documentation", {
                    description: result.error
                })
                if (result.results) {
                    setSyncResults(result.results)
                }
            }
        } catch (error) {
            toast.error("Failed to sync documentation", {
                description: String(error)
            })
        } finally {
            setIsSyncingAll(false)
        }
    }

    const pageLabels: Record<string, string> = {
        systemOverview: "System Overview",
        techStack: "Technical Architecture",
        emailAutomations: "Email Automations",
        growthStrategy: "Growth Strategy",
        apiDocs: "API Documentation",
        databaseSchema: "Database Schema",
        pipelineWorkflow: "Pipeline Workflow",
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notion CRM Sync</CardTitle>
                <CardDescription>Synchroniseer projectdata met de Broersma Projecten Hub.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Full Documentation Sync - Primary Action */}
                <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Complete Documentatie Sync
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Maak/update 7 pagina&apos;s met alle systeemdocumentatie in Notion.
                            </p>
                        </div>
                        <Button 
                            onClick={handleSyncAllDocumentation} 
                            disabled={isSyncingAll}
                            size="lg"
                            className="gap-2"
                        >
                            {isSyncingAll ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <UploadCloud className="w-5 h-5" />
                            )}
                            {isSyncingAll ? "Synchroniseren..." : "Sync Alle Documentatie"}
                        </Button>
                    </div>
                    
                    {/* Sync Results */}
                    {syncResults && (
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Sync Resultaten:</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(syncResults).map(([key, success]) => (
                                    <Badge 
                                        key={key} 
                                        variant={success ? "default" : "destructive"}
                                        className="gap-1"
                                    >
                                        {success ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                            <XCircle className="w-3 h-3" />
                                        )}
                                        {pageLabels[key] || key}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Individual Syncs */}
                <div>
                    <p className="text-sm text-muted-foreground mb-3">Of sync individuele onderdelen:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                            onClick={handleSyncRoadmap} 
                            disabled={isSyncingRoadmap}
                            variant="outline"
                            className="h-auto py-4 flex flex-col gap-2"
                        >
                            {isSyncingRoadmap ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                            <span className="text-sm">Sync Roadmap Items</span>
                        </Button>
                        
                        <Button 
                            onClick={handleSyncLeads} 
                            disabled={isSyncingLeads}
                            variant="outline"
                            className="h-auto py-4 flex flex-col gap-2"
                        >
                            {isSyncingLeads ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                            <span className="text-sm">Sync {leads.length} Leads</span>
                        </Button>

                        <Button 
                            onClick={handleSyncOverview} 
                            disabled={isSyncingOverview}
                            variant="outline"
                            className="h-auto py-4 flex flex-col gap-2"
                        >
                            {isSyncingOverview ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Book className="w-5 h-5" />}
                            <span className="text-sm">Sync System Overview</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
