"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Euro, Activity, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function KPIcards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Nieuwe Aanvragen (24u)"
        value="12"
        change="+3 vs gisteren"
        changeType="positive"
        icon={<Activity className="h-4 w-4" />}
      />
      <KPICard
        title="Conversie Ratio"
        value="42%"
        change="+2.1% deze maand"
        changeType="positive"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KPICard
        title="Revenue Pipeline"
        value="€ 48.250"
        change="+12% vs vorige maand"
        changeType="positive"
        icon={<Euro className="h-4 w-4" />}
      />
      <KPICard
        title="SLA Breach Risk"
        value="3"
        change="Leads wachten > 4u"
        changeType="negative"
        icon={<AlertTriangle className="h-4 w-4" />}
        variant="alert"
      />
    </div>
  )
}

// Named export for backward compatibility
export { KPIcards as DashboardKPICards }
