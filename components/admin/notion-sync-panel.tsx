"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { syncRoadmapToNotion, syncLeadsToNotion, syncSystemOverviewToNotion } from "@/app/actions"
import { useLeadStore } from "@/lib/store"
import { toast } from "sonner"
import { useState } from "react"
import { RefreshCw, UploadCloud, FileCheck, Book } from "lucide-react"

export function NotionSyncPanel() {
    const { leads } = useLeadStore()
    const [isSyncingRoadmap, setIsSyncingRoadmap] = useState(false)
    const [isSyncingLeads, setIsSyncingLeads] = useState(false)
    const [isSyncingOverview, setIsSyncingOverview] = useState(false)

    const handleSyncRoadmap = async () => {
        setIsSyncingRoadmap(true)
        try {
            const result = await syncRoadmapToNotion()
            if (result.success) {
                toast.success(`Synced ${result.count} roadmap items to Notion!`)
            }
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
            toast.error("Failed to sync system overview")
        } finally {
            setIsSyncingOverview(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notion CRM Sync</CardTitle>
                <CardDescription>Synchroniseer projectdata met de Broersma Projecten Hub.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
        </Card>
    )
}
