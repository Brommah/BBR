"use client"

import { DashboardNotifications } from "@/components/dashboard/dashboard-notifications"
import { useLeadStore, Lead } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Zap,
  FileText,
  Trophy,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { DEFAULT_ENGINEER_PROFILE, estimateSideJobReward, getTierForXp } from "@/lib/incentives"
import { IsoBlueprint } from "@/components/ui/illustrations"
import { PageLoader } from "@/components/error-boundary"

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
    const urgentProjects = activeProjects.filter(l => l.isUrgent)
    const completedThisMonth = myProjects.filter(l => l.status === "Archief").length
    
    // Find the #1 priority project
    const priorityProject = [...activeProjects].sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1
      if (!a.isUrgent && b.isUrgent) return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })[0]
    
    // Bonus opportunities: intentionally small / quick jobs (policy can be tuned later)
    const bonusOpportunities = leads
      .filter((l) => !l.assignee && l.status === "Nieuw")
      .filter((l) => l.value <= 10000)
      .sort(
        (a, b) =>
          (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0) ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    
    const pipelineValue = activeProjects.reduce((sum, l) => sum + l.value, 0)
    
    return {
      myProjects,
      activeProjects,
      activeProjectsSorted: [...activeProjects].sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1
        if (!a.isUrgent && b.isUrgent) return 1
        // oldest first
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }),
      inCalculation,
      awaitingApproval,
      quotesApproved,
      urgentProjects,
      completedThisMonth,
      priorityProject,
      bonusOpportunities,
      pipelineValue
    }
  }, [leads, userName])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Goedemorgen"
    if (hour < 18) return "Goedemiddag"
    return "Goedenavond"
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return <PageLoader message="Dashboard laden..." />
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
            : "Focus eerst op je queue. Bonus jobs zijn optioneel."}
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
                    {dashboardData.priorityProject.isUrgent && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                        Urgent
                      </Badge>
                    )}
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

      {/* Core layout: left = Work queue, right = Earn/Inbox */}
      <div className="grid grid-cols-12 gap-6">

        {/* Left: Work Queue */}
        <div className="col-span-8 space-y-4">
          {/* Clean counters */}
          <div className="grid grid-cols-4 gap-4">
            <KpiMini label="In bewerking" value={dashboardData.inCalculation.length} icon={<FileText className="w-4 h-4 text-blue-600" />} />
            <KpiMini label="Wacht op goedkeuring" value={dashboardData.awaitingApproval.length} icon={<Clock className="w-4 h-4 text-amber-600" />} />
            <KpiMini label="Klaar voor verzending" value={dashboardData.quotesApproved.length} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
            <KpiMini label="Urgent" value={dashboardData.urgentProjects.length} icon={<AlertTriangle className="w-4 h-4 text-red-600" />} highlight={dashboardData.urgentProjects.length > 0} />
          </div>

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
                    {currentUser.role === 'admin' 
                      ? "Bekijk de inbox voor nieuwe leads." 
                      : "Als je wil, pak een bonus job op."}
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

        {/* Right: Incentives & Bonus Jobs */}
        <div className="col-span-4 space-y-4">
          <IncentivesCompact 
            userName={userName}
            onOpenIncentives={() => router.push("/incentives")} 
          />
          <BonusJobsCard
            leads={dashboardData.bonusOpportunities}
            onOpenLead={(id) => router.push(`/leads/${id}`)}
            onViewAll={() => router.push("/pipeline")}
          />
        </div>
      </div>
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

function IncentivesCompact({ userName, onOpenIncentives }: { userName: string, onOpenIncentives: () => void }) {
  const profile = { ...DEFAULT_ENGINEER_PROFILE, name: userName }
  const progressPct = Math.min(100, (profile.xp / profile.xpToNext) * 100)
  const { current, next } = getTierForXp(profile.xp)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent" />
          Incentives
        </CardTitle>
        <CardDescription>XP → tier → maandbonus. Bonus jobs zijn optioneel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
        <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{profile.name}</span>
                <Badge variant="secondary">Lvl {profile.level}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tier: <span className="font-medium text-foreground">{current.name}</span>
                {" • "}
                Streak: <span className="font-medium text-foreground">{profile.currentStreakDays}d</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next bonus</p>
            <p className="text-sm font-semibold text-foreground">{next ? `€${next.monthlyBonusEur}` : "Max"}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>XP</span>
            <span className="text-value">
              {profile.xp.toLocaleString()} / {profile.xpToNext.toLocaleString()}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        <Button variant="outline" className="w-full" onClick={onOpenIncentives}>
          Open incentives
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

function BonusJobsCard({
  leads,
  onOpenLead,
  onViewAll,
}: {
  leads: Lead[]
  onOpenLead: (id: string) => void
  onViewAll: () => void
}) {
  return (
    <Card className={leads.length > 0 ? "border-accent bg-accent/5" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Bonus jobs</CardTitle>
          {leads.length > 0 && (
            <Badge className="bg-accent text-accent-foreground">{leads.length}</Badge>
          )}
        </div>
        <CardDescription>Kleine klusjes (extra € + XP).</CardDescription>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Geen bonus jobs</p>
        ) : (
          <div className="space-y-2">
            {leads.slice(0, 3).map((lead) => {
              const reward = estimateSideJobReward(lead)
              return (
                <div
                  key={lead.id}
                  className="p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors cursor-pointer"
                  onClick={() => onOpenLead(lead.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{lead.projectType}</p>
                        {lead.isUrgent && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{lead.clientName} • {lead.city}</p>
                      <p className="text-xs text-muted-foreground mt-1">+€{reward.bonusEur} • +{reward.xp} XP</p>
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); onOpenLead(lead.id) }}>
                      Open
                    </Button>
                  </div>
                </div>
              )
            })}
            {leads.length > 3 && (
              <Button variant="link" className="w-full text-xs text-muted-foreground" onClick={onViewAll}>
                Bekijk alle bonus jobs →
              </Button>
            )}
          </div>
        )}
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
        <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)} ${project.isUrgent ? 'ring-4 ring-red-500/20 animate-pulse' : ''}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">{project.clientName}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              {project.projectType}
            </Badge>
            {project.isUrgent && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                Urgent
              </Badge>
            )}
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
