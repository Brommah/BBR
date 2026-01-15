"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { UserPermissionsTable } from "@/components/admin/user-permissions-table"
import { RoleManagementPanel } from "@/components/admin/role-management-panel"
import { QuoteApprovalQueue } from "@/components/admin/quote-approval-queue"
import { NotionSyncPanel } from "@/components/admin/notion-sync-panel"
import { EmailAutomationPanel } from "@/components/admin/email-automation-panel"
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard"
import { UrenDashboard } from "@/components/dashboard/uren-dashboard"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { useAuthStore } from "@/lib/auth"
import { useLeadStore } from "@/lib/store"
import { Users, Database, Mail, ClipboardCheck, Link2, Copy, Check, Settings, LayoutDashboard, ExternalLink, FileText, Shield, BarChart3, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
// Tabs not used currently but available for future tabbed interfaces
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type TopTab = "dashboard" | "goedkeuringen" | "uren" | "instellingen"

type SettingsSection = 
    | "team-rechten" 
    | "email-automations"
    | "integraties"
    | "intake-formulier"

const settingsSections: Array<{
    id: SettingsSection
    label: string
    shortLabel: string
    icon: React.ComponentType<{ className?: string }>
    description: string
}> = [
    { id: "team-rechten", label: "Team & Rechten", shortLabel: "Team", icon: Users, description: "Gebruikers en rechten beheren" },
    { id: "email-automations", label: "E-mail Automatisering", shortLabel: "E-mails", icon: Mail, description: "Automatische e-mail flows" },
    { id: "integraties", label: "Integraties", shortLabel: "Koppelingen", icon: Database, description: "Externe koppelingen" },
    { id: "intake-formulier", label: "Intake Formulier", shortLabel: "Intake", icon: Link2, description: "Publiek aanvraagformulier" },
]

/**
 * Admin Dashboard - Full admin console with approvals, team overview, and settings.
 * This is the home page for admin users.
 */
export function AdminDashboard() {
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState<TopTab>("dashboard")
    const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>("team-rechten")
    
    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab') as TopTab
        if (tab && ["dashboard", "goedkeuringen", "uren", "instellingen"].includes(tab)) {
            setActiveTab(tab)
        } else if (!tab) {
            setActiveTab("dashboard")
        }
    }, [searchParams])

    const { currentUser } = useAuthStore()
    const { leads } = useLeadStore()
    
    // Count pending quote approvals
    const pendingApprovalsCount = leads.filter(l => l.quoteApproval === "pending").length

    const [copied, setCopied] = useState(false)
    
    const intakeUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/intake` 
        : '/intake'
    
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(intakeUrl)
            setCopied(true)
            toast.success("Link gekopieerd!")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error("Kon link niet kopiëren")
        }
    }

    const renderSettingsContent = () => {
        switch (activeSettingsSection) {
            case "team-rechten":
                return (
                    <div className="space-y-6">
                        <ComponentErrorBoundary><RoleManagementPanel /></ComponentErrorBoundary>
                        <ComponentErrorBoundary><UserPermissionsTable /></ComponentErrorBoundary>
                    </div>
                )
            case "email-automations":
                return <ComponentErrorBoundary><EmailAutomationPanel /></ComponentErrorBoundary>
            case "integraties":
                return <ComponentErrorBoundary><NotionSyncPanel /></ComponentErrorBoundary>
            case "intake-formulier":
                return (
                    <div className="space-y-6 max-w-3xl">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Link2 className="w-5 h-5" />
                                    Publiek Intake Formulier
                                </CardTitle>
                                <CardDescription>
                                    Deel deze link met potentiële klanten. Aanvragen komen automatisch in de inbox terecht.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input 
                                        value={intakeUrl} 
                                        readOnly 
                                        className="font-mono text-sm"
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button asChild>
                                        <a href="/intake" target="_blank" className="gap-2">
                                            <ExternalLink className="w-4 h-4" />
                                            Openen
                                        </a>
                                    </Button>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
                                    <h4 className="font-medium text-sm">Hoe te gebruiken:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li className="flex items-start gap-2">
                                            <Badge variant="outline" className="mt-0.5">1</Badge>
                                            <span>Kopieer de link hierboven</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Badge variant="outline" className="mt-0.5">2</Badge>
                                            <span>Plaats op uw website of deel via email/WhatsApp</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Badge variant="outline" className="mt-0.5">3</Badge>
                                            <span>Klanten vullen het formulier in</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Badge variant="outline" className="mt-0.5">4</Badge>
                                            <span>Aanvragen verschijnen automatisch in de Inbox</span>
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Automatische Acties</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Lead aanmaken</p>
                                            <p className="text-xs text-muted-foreground">Automatisch nieuwe lead in database</p>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0">Actief</Badge>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <Mail className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Bevestigingsmail</p>
                                            <p className="text-xs text-muted-foreground">Email naar klant na aanvraag</p>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0">Actief</Badge>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Activiteit loggen</p>
                                            <p className="text-xs text-muted-foreground">Projectbeschrijving als notitie</p>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0">Actief</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <ComponentErrorBoundary><AnalyticsDashboard /></ComponentErrorBoundary>
            case "goedkeuringen":
                return <ComponentErrorBoundary><QuoteApprovalQueue /></ComponentErrorBoundary>
            case "uren":
                return <ComponentErrorBoundary><UrenDashboard /></ComponentErrorBoundary>
            case "instellingen":
                return renderSettingsContent()
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-background border-b">
                <div className="px-6 py-4">
                    {/* Title Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
                                <p className="text-xs text-muted-foreground">
                                    Welkom, {currentUser?.name || 'Beheerder'}
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Beheerder
                        </Badge>
                    </div>

                    {/* Top Tabs: Dashboard | Instellingen */}
                    <div className="flex items-center gap-6 border-b">
                        <button
                            type="button"
                            onClick={() => setActiveTab("dashboard")}
                            className={cn(
                                "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                                activeTab === "dashboard"
                                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Dashboard
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("instellingen")}
                            className={cn(
                                "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                                activeTab === "instellingen"
                                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            Instellingen
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Sub-tabs - Only show when on Instellingen tab */}
            {activeTab === "instellingen" && (
                <div className="px-6 py-3 bg-muted/30 border-b">
                    <div className="flex items-center gap-2">
                        {settingsSections.map((section) => {
                            const Icon = section.icon
                            const isActive = activeSettingsSection === section.id
                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setActiveSettingsSection(section.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer",
                                        isActive
                                            ? "bg-amber-500 text-white shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {section.shortLabel}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="p-4">
                {renderContent()}
            </div>
        </div>
    )
}
