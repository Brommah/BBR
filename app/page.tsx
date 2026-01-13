"use client"

import { DashboardNotifications } from "@/components/dashboard/dashboard-notifications"
import { useLeadStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Zap,
  FileText,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { IsoBlueprint } from "@/components/ui/illustrations"
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders"

export default function DashboardPage() {
  const router = useRouter()
  const { leads, isLoading } = useLeadStore()
  const { currentUser, isAuthenticated } = useAuthStore()
  
  // Get current user name from auth store
  const userName = currentUser?.name || "Gast"
  
  // Derive all dashboard data
  const dashboardData = useMemo(() => {
    const myProjects = leads.filter(l => l.assignee === userName)
    const activeProjects = myProjects.filter(l => l.status !== "Archief")
    const inCalculation = myProjects.filter(l => l.status === "Calculatie")
    const awaitingApproval = myProjects.filter(l => l.quoteApproval === "pending")
    const quotesApproved = myProjects.filter(l => l.quoteApproval === "approved" && l.status === "Calculatie")
    const completedThisMonth = myProjects.filter(l => l.status === "Archief").length
    
    // Find the #1 priority project (oldest first)
    const priorityProject = [...activeProjects].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })[0]
    
    const pipelineValue = activeProjects.reduce((sum, l) => sum + l.value, 0)
    
    return {
      myProjects,
      activeProjects,
      activeProjectsSorted: [...activeProjects].sort((a, b) => {
        // oldest first
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }),
      inCalculation,
      awaitingApproval,
      quotesApproved,
      completedThisMonth,
      priorityProject,
      pipelineValue
    }
  }, [leads, userName])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Goedemorgen"
    if (hour < 18) return "Goedemiddag"
    return "Goedenavond"
  }

  // Show skeleton loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="page-container">
        <DashboardSkeleton />
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-semibold mb-4">Welkom bij Broersma Engineer OS</h1>
          <p className="text-muted-foreground mb-6">Log in om je dashboard te bekijken.</p>
          <Button onClick={() => router.push('/login')}>
            Inloggen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <DashboardNotifications />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {currentUser.role === 'admin' 
            ? "Beheer je team en bekijk de voortgang." 
            : "Hier is je overzicht van actieve projecten."}
        </p>
      </div>

      {/* Focus Now */}
      {dashboardData.priorityProject && (
        <Card 
          className="mb-6 border border-border bg-card cursor-pointer hover:bg-muted/30 transition-colors relative overflow-hidden group"
          onClick={() => router.push(`/leads/${dashboardData.priorityProject!.id}`)}
        >
          {/* Decorative illustration */}
          <div className="absolute -right-6 -top-6 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <IsoBlueprint />
          </div>
          <CardContent className="py-4 relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Focus now</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                      {dashboardData.priorityProject.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {dashboardData.priorityProject.projectType} • {dashboardData.priorityProject.clientName} • {dashboardData.priorityProject.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono text-foreground">
                    € {dashboardData.priorityProject.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Open lead</div>
                </div>
                <Button size="sm">
                  Open
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiMini label="In bewerking" value={dashboardData.inCalculation.length} icon={<FileText className="w-4 h-4 text-blue-600" />} />
        <KpiMini label="Wacht op goedkeuring" value={dashboardData.awaitingApproval.length} icon={<Clock className="w-4 h-4 text-amber-600" />} />
        <KpiMini label="Klaar voor verzending" value={dashboardData.quotesApproved.length} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
      </div>

      {/* Work Queue */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Mijn queue</CardTitle>
              <CardDescription>Werk altijd top-down: urgent → oud → nieuw.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/pipeline")}>
              Pipeline
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {dashboardData.activeProjectsSorted.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium text-foreground">Geen actieve projecten</p>
              <p className="text-sm mt-1">
                Bekijk de inbox voor nieuwe leads.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {dashboardData.activeProjectsSorted.slice(0, 8).map((project) => (
                <ProjectRow key={project.id} project={project} onClick={() => router.push(`/leads/${project.id}`)} />
              ))}
              {dashboardData.activeProjectsSorted.length > 8 && (
                <Button variant="ghost" className="w-full text-sm text-muted-foreground mt-2" onClick={() => router.push("/pipeline")}>
                  + {dashboardData.activeProjectsSorted.length - 8} meer in pipeline
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiMini({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: number
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Card className={`card-hover-effect transition-all ${highlight ? "border-red-500/30 bg-red-500/5" : "bg-gradient-subtle"}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Project Row Component
function ProjectRow({ project, onClick }: { project: Lead; onClick: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Nieuw": return "bg-blue-500"
      case "Calculatie": return "bg-amber-500"
      case "Offerte Verzonden": return "bg-purple-500"
      case "Opdracht": return "bg-emerald-500"
      default: return "bg-muted"
    }
  }

  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">{project.clientName}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              {project.projectType}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{project.city}</span>
            <span className="opacity-50">•</span>
            <span className="font-medium">{project.status}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold font-mono text-foreground">
          € {project.value.toLocaleString()}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}
