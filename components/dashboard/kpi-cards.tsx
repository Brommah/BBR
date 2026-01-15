"use client"

import { useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Euro, Activity, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLeadStore } from "@/lib/store"

interface KPICardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: React.ReactNode
  variant?: "default" | "alert"
}

function KPICard({ title, value, change, changeType, icon, variant = "default" }: KPICardProps) {
  return (
    <Card className={cn(
      "border-2 transition-all hover:shadow-md",
      variant === "alert" 
        ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800" 
        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "text-sm font-semibold",
          variant === "alert" 
            ? "text-red-700 dark:text-red-300" 
            : "text-slate-700 dark:text-slate-200"
        )}>
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-md",
          variant === "alert"
            ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-3xl font-bold font-mono tracking-tight",
          variant === "alert" 
            ? "text-red-700 dark:text-red-300" 
            : "text-slate-900 dark:text-slate-100"
        )}>
          {value}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {changeType === "positive" && (
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
          {changeType === "negative" && (
            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
          <p className={cn(
            "text-sm font-medium",
            changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
            changeType === "negative" && "text-red-600 dark:text-red-400",
            changeType === "neutral" && "text-slate-500 dark:text-slate-400"
          )}>
            {change}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function KPICardSkeleton() {
  return (
    <Card className="border-2 border-slate-200 dark:border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  )
}

export function KPIcards() {
  const { leads, isLoading, loadLeads } = useLeadStore()

  // Load leads on mount
  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  // Compute KPIs from real lead data
  const kpis = useMemo(() => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)
    
    // New leads in last 24 hours
    const newLeadsToday = leads.filter(l => {
      const created = new Date(l.createdAt)
      return created >= yesterday && l.status === "Nieuw"
    }).length
    
    // New leads from day before (for comparison)
    const newLeadsYesterday = leads.filter(l => {
      const created = new Date(l.createdAt)
      return created >= twoDaysAgo && created < yesterday && l.status === "Nieuw"
    }).length
    
    const newLeadsDiff = newLeadsToday - newLeadsYesterday
    
    // Conversion ratio (Opdracht / (Opdracht + Archief)) - completed leads
    const completedLeads = leads.filter(l => l.status === "Opdracht").length
    const archivedLeads = leads.filter(l => l.status === "Archief").length
    const totalClosed = completedLeads + archivedLeads
    const conversionRatio = totalClosed > 0 ? Math.round((completedLeads / totalClosed) * 100) : 0
    
    // Revenue pipeline (sum of values for active leads not in Archief)
    const pipelineValue = leads
      .filter(l => l.status !== "Archief")
      .reduce((sum, l) => sum + (l.value || 0), 0)
    
    // SLA Breach Risk (leads in "Nieuw" status for > 4 hours)
    const slaBreachLeads = leads.filter(l => {
      if (l.status !== "Nieuw") return false
      const created = new Date(l.createdAt)
      return created < fourHoursAgo
    }).length
    
    return {
      newLeadsToday,
      newLeadsDiff,
      conversionRatio,
      pipelineValue,
      slaBreachLeads
    }
  }, [leads])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Nieuwe Aanvragen (24u)"
        value={kpis.newLeadsToday.toString()}
        change={`${kpis.newLeadsDiff >= 0 ? '+' : ''}${kpis.newLeadsDiff} vs gisteren`}
        changeType={kpis.newLeadsDiff >= 0 ? "positive" : "negative"}
        icon={<Activity className="h-4 w-4" />}
      />
      <KPICard
        title="Conversie Ratio"
        value={`${kpis.conversionRatio}%`}
        change="Van afgeronde leads"
        changeType={kpis.conversionRatio >= 40 ? "positive" : "neutral"}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KPICard
        title="Revenue Pipeline"
        value={`€ ${kpis.pipelineValue.toLocaleString('nl-NL')}`}
        change={`${leads.filter(l => l.status !== "Archief").length} actieve leads`}
        changeType="positive"
        icon={<Euro className="h-4 w-4" />}
      />
      <KPICard
        title="SLA Breach Risk"
        value={kpis.slaBreachLeads.toString()}
        change={kpis.slaBreachLeads > 0 ? "Leads wachten > 4u" : "Alles onder controle"}
        changeType={kpis.slaBreachLeads > 0 ? "negative" : "neutral"}
        icon={<AlertTriangle className="h-4 w-4" />}
        variant={kpis.slaBreachLeads > 0 ? "alert" : "default"}
      />
    </div>
  )
}

// Named export for backward compatibility
export { KPIcards as DashboardKPICards }
