"use client"

import { useState } from "react"
import { UserPermissionsTable } from "@/components/admin/user-permissions-table"
import { QuoteApprovalQueue } from "@/components/admin/quote-approval-queue"
import { NotionSyncPanel } from "@/components/admin/notion-sync-panel"
import { CostDeterminationPanel } from "@/components/admin/cost-determination-panel"
import { EmailAutomationPanel } from "@/components/admin/email-automation-panel"
import { KPIcards } from "@/components/dashboard/kpi-cards"
import { WorkloadChart } from "@/components/dashboard/workload-chart"
import { NeedsAttentionList } from "@/components/dashboard/needs-attention"
import { FinancialRoadmapView } from "@/components/roadmap/financial-roadmap"
import { AccessGuard } from "@/components/auth/access-guard"
import { useAuthStore } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Euro, Users, Database, Mail, ClipboardCheck, TrendingUp, FileText, ChevronRight, Shield } from "lucide-react"
import { IsoTrophy } from "@/components/ui/illustrations"

type AdminSection = 
    | "goedkeuringen" 
    | "financieel" 
    | "team-overview" 
    | "tarieven" 
    | "team-rechten" 
    | "email-automations" 
    | "integraties"

const adminSections: Array<{
    id: AdminSection
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
    category: "dashboard" | "instellingen"
}> = [
    { id: "goedkeuringen", label: "Goedkeuringen", icon: ClipboardCheck, description: "Offerte approvals", category: "dashboard" },
    { id: "financieel", label: "Financieel", icon: TrendingUp, description: "Revenue & pipeline", category: "dashboard" },
    { id: "team-overview", label: "Team Overview", icon: FileText, description: "KPIs & workload", category: "dashboard" },
    { id: "tarieven", label: "Tarieven", icon: Euro, description: "Pricing & costs", category: "instellingen" },
    { id: "team-rechten", label: "Team & Rechten", icon: Users, description: "User permissions", category: "instellingen" },
    { id: "email-automations", label: "Email Automations", icon: Mail, description: "Automated workflows", category: "instellingen" },
    { id: "integraties", label: "Integraties", icon: Database, description: "Notion & APIs", category: "instellingen" },
]

export default function AdminPage() {
    const [activeSection, setActiveSection] = useState<AdminSection>("goedkeuringen")
    const { currentUser } = useAuthStore()

    const renderContent = () => {
        switch (activeSection) {
            case "goedkeuringen":
                return <QuoteApprovalQueue />
            case "financieel":
                return <FinancialRoadmapView />
            case "team-overview":
                return (
                    <div className="space-y-6">
                        <KPIcards />
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            <WorkloadChart />
                            <NeedsAttentionList />
                        </div>
                    </div>
                )
            case "tarieven":
                return <CostDeterminationPanel />
            case "team-rechten":
                return <UserPermissionsTable />
            case "email-automations":
                return <EmailAutomationPanel />
            case "integraties":
                return <NotionSyncPanel />
        }
    }

    const activeConfig = adminSections.find(s => s.id === activeSection)!

    return (
        <AccessGuard permission="admin:access" redirectTo="/login">
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Admin Sidebar Navigation */}
                <div className="w-72 border-r border-border bg-card flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-foreground">Admin Console</h2>
                                <p className="text-xs text-muted-foreground">
                                    {currentUser?.name || 'Beheerder'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Dashboard Section */}
                        <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
                                Dashboard
                            </p>
                            {adminSections.filter(s => s.category === "dashboard").map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all card-hover-effect ${
                                        activeSection === section.id
                                            ? "bg-amber-500 text-white shadow-sm"
                                            : "text-foreground hover:bg-muted"
                                    }`}
                                >
                                    <section.icon className="w-4 h-4 shrink-0" />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">{section.label}</p>
                                        <p className="text-xs opacity-80">{section.description}</p>
                                    </div>
                                    {activeSection === section.id && (
                                        <ChevronRight className="w-4 h-4 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Settings Section */}
                        <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
                                Instellingen
                            </p>
                            {adminSections.filter(s => s.category === "instellingen").map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all card-hover-effect ${
                                        activeSection === section.id
                                            ? "bg-amber-500 text-white shadow-sm"
                                            : "text-foreground hover:bg-muted"
                                    }`}
                                >
                                    <section.icon className="w-4 h-4 shrink-0" />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">{section.label}</p>
                                        <p className="text-xs opacity-80">{section.description}</p>
                                    </div>
                                    {activeSection === section.id && (
                                        <ChevronRight className="w-4 h-4 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer - Role indicator */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10">
                            <Shield className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                                Beheerderstoegang
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-8">
                        {/* Page Header */}
                        <div className="mb-6 relative">
                            {/* Decorative Isometric Element */}
                            <div className="absolute right-0 top-0 w-32 h-32 opacity-5 pointer-events-none -mr-4 -mt-4">
                                <IsoTrophy />
                            </div>
                            
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <activeConfig.icon className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-foreground">
                                        {activeConfig.label}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">{activeConfig.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        {renderContent()}
                    </div>
                </div>
            </div>
        </AccessGuard>
    )
}
