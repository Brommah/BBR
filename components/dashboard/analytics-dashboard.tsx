"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Euro,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Timer,
  Target,
  Zap,
} from "lucide-react"
import { getDashboardAnalytics, type DashboardAnalytics, type EmployeeHoursData } from "@/lib/analytics-actions"
import { cn } from "@/lib/utils"

// Status config with colors and labels
const STATUS_CONFIG = {
  Nieuw: { color: "#3b82f6", label: "Nieuw", bg: "bg-blue-500" },
  Calculatie: { color: "#f59e0b", label: "Calculatie", bg: "bg-amber-500" },
  OfferteVerzonden: { color: "#8b5cf6", label: "Offerte", bg: "bg-violet-500" },
  Opdracht: { color: "#10b981", label: "Opdracht", bg: "bg-emerald-500" },
}

// Format currency compactly
const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}k`
  }
  return `€${value}`
}

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true)
      try {
        const data = await getDashboardAnalytics()
        setAnalytics(data)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      }
      setIsLoading(false)
    }
    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-gradient-to-br from-muted/50 to-muted/30">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-28 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2"><CardContent className="p-6"><Skeleton className="h-[280px]" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-[280px]" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Kon analytics niet laden
      </div>
    )
  }

  const { pipelineData, pipelineDistribution, conversionTime, revenueData, employeeHours, totals } = analytics
  
  // Use pipeline distribution from server (current state of all leads)
  const currentPipelineDistribution = [
    { name: "Nieuw", value: pipelineDistribution.Nieuw, color: STATUS_CONFIG.Nieuw.color },
    { name: "Calculatie", value: pipelineDistribution.Calculatie, color: STATUS_CONFIG.Calculatie.color },
    { name: "Offerte", value: pipelineDistribution.OfferteVerzonden, color: STATUS_CONFIG.OfferteVerzonden.color },
    { name: "Opdracht", value: pipelineDistribution.Opdracht, color: STATUS_CONFIG.Opdracht.color },
  ].filter(d => d.value > 0)
  
  // Revenue trend (compare last 2 weeks)
  const lastWeekRevenue = revenueData[revenueData.length - 1]?.revenue || 0
  const prevWeekRevenue = revenueData[revenueData.length - 2]?.revenue || 0
  const revenueTrend = prevWeekRevenue > 0 ? ((lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0
  
  // Total recent revenue
  const recentTotalRevenue = revenueData.reduce((sum, w) => sum + w.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Hero KPIs - Large, impactful numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Actieve Projecten</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totals.totalLeads}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">in pipeline</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Revenue */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Omzet (4 wkn)</p>
                <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {formatCurrencyFull(recentTotalRevenue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {revenueTrend > 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  ) : revenueTrend < 0 ? (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  ) : null}
                  <span className={cn(
                    "text-xs",
                    revenueTrend > 0 ? "text-emerald-600" : revenueTrend < 0 ? "text-red-500" : "text-emerald-500"
                  )}>
                    {revenueTrend !== 0 ? `${revenueTrend > 0 ? '+' : ''}${revenueTrend.toFixed(0)}% vs vorige week` : 'stabiel'}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
                <Euro className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Conversie</p>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mt-1">{totals.conversionRate}%</p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">lead → opdracht</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Lead Time */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Doorlooptijd</p>
                <p className="text-4xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {conversionTime.current}<span className="text-xl font-medium ml-1">d</span>
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {conversionTime.trend < 0 ? (
                    <>
                      <Zap className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600">{Math.abs(conversionTime.trend).toFixed(0)}% sneller</span>
                    </>
                  ) : conversionTime.trend > 0 ? (
                    <>
                      <Timer className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500">{conversionTime.trend.toFixed(0)}% trager</span>
                    </>
                  ) : (
                    <span className="text-xs text-amber-500">gemiddeld</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Distribution - Donut Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pipeline Verdeling</CardTitle>
          </CardHeader>
          <CardContent>
            {currentPipelineDistribution.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Geen projecten</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stacked horizontal bar */}
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {currentPipelineDistribution.map((entry) => {
                    const total = currentPipelineDistribution.reduce((sum, e) => sum + e.value, 0)
                    const percentage = total > 0 ? (entry.value / total) * 100 : 0
                    return (
                      <div
                        key={entry.name}
                        className="h-full transition-all duration-500 first:rounded-l-lg last:rounded-r-lg"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: entry.color,
                          minWidth: percentage > 0 ? '8px' : '0'
                        }}
                        title={`${entry.name}: ${entry.value} (${percentage.toFixed(0)}%)`}
                      />
                    )
                  })}
                </div>
                
                {/* Detailed breakdown */}
                <div className="space-y-3">
                  {currentPipelineDistribution.map((entry) => {
                    const total = currentPipelineDistribution.reduce((sum, e) => sum + e.value, 0)
                    const percentage = total > 0 ? (entry.value / total) * 100 : 0
                    return (
                      <div key={entry.name} className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: entry.color }} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium truncate">{entry.name}</span>
                            <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                              {entry.value} <span className="text-xs">({percentage.toFixed(0)}%)</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend - Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Omzet Trend</CardTitle>
              <Badge variant="outline" className="text-xs font-normal">Laatste 4 weken</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                  <XAxis 
                    dataKey="weekLabel" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={50}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrencyFull(Number(value)), 'Omzet']}
                    labelStyle={{ color: '#64748b', fontSize: '12px' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Activity - Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Pipeline Activiteit</CardTitle>
              <div className="flex items-center gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: config.color }} />
                    <span className="text-[10px] text-muted-foreground">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                  <XAxis 
                    dataKey="weekLabel" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={25}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Nieuw" stackId="a" fill={STATUS_CONFIG.Nieuw.color} />
                  <Bar dataKey="Calculatie" stackId="a" fill={STATUS_CONFIG.Calculatie.color} />
                  <Bar dataKey="OfferteVerzonden" stackId="a" fill={STATUS_CONFIG.OfferteVerzonden.color} />
                  <Bar dataKey="Opdracht" stackId="a" fill={STATUS_CONFIG.Opdracht.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Team Uren</CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                {totals.totalHours} uur totaal
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {employeeHours.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nog geen uurregistraties</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {employeeHours.slice(0, 5).map((employee, index) => {
                  const maxHours = Math.max(...employeeHours.map(e => e.hours))
                  const percentage = maxHours > 0 ? (employee.hours / maxHours) * 100 : 0
                  
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: employee.color }} 
                          />
                          <span className="text-sm font-medium truncate max-w-[150px]">
                            {employee.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm tabular-nums font-semibold">{employee.hours}u</span>
                          <span className="text-xs text-muted-foreground">
                            ({employee.projects} {employee.projects === 1 ? 'project' : 'projecten'})
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: employee.color 
                          }} 
                        />
                      </div>
                    </div>
                  )
                })}
                {employeeHours.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{employeeHours.length - 5} meer teamleden
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
