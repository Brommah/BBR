"use client"

import { useState } from "react"
import { UserPermissionsTable } from "@/components/admin/user-permissions-table"
import { QuoteApprovalQueue } from "@/components/admin/quote-approval-queue"
import { NotionSyncPanel } from "@/components/admin/notion-sync-panel"
import { CostDeterminationPanel } from "@/components/admin/cost-determination-panel"
import { EmailAutomationPanel } from "@/components/admin/email-automation-panel"
import { EmailTemplatesPanel } from "@/components/admin/email-templates-panel"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { useAuthStore } from "@/lib/auth"
import { Euro, Users, Database, Mail, ClipboardCheck, FileText, Shield, Link2, Copy, Check, Settings, LayoutDashboard, ExternalLink, FileEdit } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
// Tabs not used currently but available for future tabbed interfaces
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AdminSection = 
    | "goedkeuringen" 
    | "tarieven" 
    | "team-rechten" 
    | "email-automations"
    | "email-templates"
    | "integraties"
    | "intake-formulier"

const adminSections: Array<{
    id: AdminSection
    label: string
    shortLabel: string
    icon: React.ComponentType<{ className?: string }>
    description: string
    category: "dashboard" | "instellingen"
}> = [
    { id: "goedkeuringen", label: "Goedkeuringen", shortLabel: "Goedkeuringen", icon: ClipboardCheck, description: "Offerte approvals", category: "dashboard" },
    { id: "tarieven", label: "Tarieven", shortLabel: "Tarieven", icon: Euro, description: "Pricing & costs", category: "instellingen" },
    { id: "team-rechten", label: "Team & Rechten", shortLabel: "Team", icon: Users, description: "User permissions", category: "instellingen" },
    { id: "email-automations", label: "Email Automations", shortLabel: "Automations", icon: Mail, description: "Automated workflows", category: "instellingen" },
    { id: "email-templates", label: "Email Templates", shortLabel: "Templates", icon: FileEdit, description: "Bewerkbare templates", category: "instellingen" },
    { id: "integraties", label: "Integraties", shortLabel: "Integraties", icon: Database, description: "Notion & APIs", category: "instellingen" },
    { id: "intake-formulier", label: "Intake Formulier", shortLabel: "Intake", icon: Link2, description: "Publiek aanvraagformulier", category: "instellingen" },
]

const dashboardSections = adminSections.filter(s => s.category === "dashboard")
const settingsSections = adminSections.filter(s => s.category === "instellingen")

/**
 * Admin Dashboard - Full admin console with approvals, team overview, and settings.
 * This is the home page for admin users.
 */
export function AdminDashboard() {
    const [activeSection, setActiveSection] = useState<AdminSection>("goedkeuringen")
    const { currentUser } = useAuthStore()

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

    const renderContent = () => {
        switch (activeSection) {
            case "goedkeuringen":
                return <ComponentErrorBoundary><QuoteApprovalQueue /></ComponentErrorBoundary>
            case "tarieven":
                return <ComponentErrorBoundary><CostDeterminationPanel /></ComponentErrorBoundary>
            case "team-rechten":
                return <ComponentErrorBoundary><UserPermissionsTable /></ComponentErrorBoundary>
            case "email-automations":
                return <ComponentErrorBoundary><EmailAutomationPanel /></ComponentErrorBoundary>
            case "email-templates":
                return <ComponentErrorBoundary><EmailTemplatesPanel /></ComponentErrorBoundary>
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

    const activeConfig = adminSections.find(s => s.id === activeSection)!
    const isDashboardSection = activeConfig.category === "dashboard"

    // Handler for section changes
    const handleSectionClick = (sectionId: AdminSection) => {
        setActiveSection(sectionId)
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
                                <h1 className="text-xl font-semibold text-foreground">Admin Console</h1>
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

                    {/* Category Tabs */}
                    <div className="flex items-center gap-6 border-b">
                        <button
                            type="button"
                            onClick={() => handleSectionClick("goedkeuringen")}
                            className={cn(
                                "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                                isDashboardSection
                                    ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSectionClick("tarieven")}
                            className={cn(
                                "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                                !isDashboardSection
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

            {/* Section Tabs - Separate from header */}
            <div className="px-6 py-3 bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                    {(isDashboardSection ? dashboardSections : settingsSections).map((section) => {
                        const Icon = section.icon
                        const isActive = activeSection === section.id
                        return (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => handleSectionClick(section.id)}
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

            {/* Main Content Area */}
            <div className="p-6">
                {/* Page Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <activeConfig.icon className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-foreground">
                                {activeConfig.label}
                            </h2>
                            <p className="text-sm text-muted-foreground">{activeConfig.description}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {renderContent()}
            </div>
        </div>
    )
}
