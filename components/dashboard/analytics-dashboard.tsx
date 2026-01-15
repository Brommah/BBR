"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
  Briefcase,
  Target,
  Zap,
  Timer,
} from "lucide-react"
import { getDashboardAnalytics, type DashboardAnalytics } from "@/lib/analytics-actions"
import { cn } from "@/lib/utils"

// Status config with colors
const STATUS_CONFIG = {
  Nieuw: { color: "#3b82f6", label: "Nieuw" },
  Calculatie: { color: "#f59e0b", label: "Calculatie" },
  OfferteVerzonden: { color: "#8b5cf6", label: "Offerte" },
  Opdracht: { color: "#10b981", label: "Opdracht" },
}

// Format currency
const formatCurrency = (value: number) => {
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}k`
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

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
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
        {/* Row 1: 4 KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-tactile rounded-xl p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-10 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        {/* Row 2: 3 Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-tactile rounded-xl p-6">
              <Skeleton className="h-[200px]" />
            </div>
          ))}
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

  const { pipelineData, pipelineDistribution, conversionTime, revenueData, totals } = analytics
  
  const currentPipelineDistribution = [
    { name: "Nieuw", value: pipelineDistribution.Nieuw, color: STATUS_CONFIG.Nieuw.color },
    { name: "Calculatie", value: pipelineDistribution.Calculatie, color: STATUS_CONFIG.Calculatie.color },
    { name: "Offerte", value: pipelineDistribution.OfferteVerzonden, color: STATUS_CONFIG.OfferteVerzonden.color },
    { name: "Opdracht", value: pipelineDistribution.Opdracht, color: STATUS_CONFIG.Opdracht.color },
  ].filter(d => d.value > 0)
  
  const lastWeekRevenue = revenueData[revenueData.length - 1]?.revenue || 0
  const prevWeekRevenue = revenueData[revenueData.length - 2]?.revenue || 0
  const revenueTrend = prevWeekRevenue > 0 ? ((lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0
  const recentTotalRevenue = revenueData.reduce((sum, w) => sum + w.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Row 1: 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="card-tactile rounded-xl p-5 h-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-micro mb-1">Omzet 3 weken</p>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatCurrencyFull(recentTotalRevenue)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {revenueTrend !== 0 && (
                    <span className={cn(
                      "pill-glass-emerald px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                      revenueTrend < 0 && "pill-glass-rose"
                    )}>
                      {revenueTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {revenueTrend > 0 ? '+' : ''}{revenueTrend.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Euro className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="card-tactile rounded-xl p-5 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-micro mb-1">Actieve Projecten</p>
                <p className="text-3xl font-bold tracking-tight">{totals.totalLeads}</p>
                <p className="text-xs text-muted-foreground mt-2">in pipeline</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Conversion Rate */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="card-tactile rounded-xl p-5 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-micro mb-1">Conversie</p>
                <p className="text-3xl font-bold tracking-tight">{totals.conversionRate}%</p>
                <p className="text-xs text-muted-foreground mt-2">lead → opdracht</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Doorlooptijd */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="card-tactile rounded-xl p-5 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-micro mb-1">Doorlooptijd</p>
                <p className="text-3xl font-bold tracking-tight">
                  {conversionTime.current}<span className="text-lg font-medium ml-0.5">d</span>
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {conversionTime.trend < 0 ? (
                    <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                      <Zap className="w-3 h-3" />{Math.abs(conversionTime.trend).toFixed(0)}% sneller
                    </span>
                  ) : conversionTime.trend > 0 ? (
                    <span className="text-xs text-amber-600 flex items-center gap-0.5">
                      <Timer className="w-3 h-3" />{conversionTime.trend.toFixed(0)}% trager
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">gemiddeld</span>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 2: 3 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Trend - Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="card-tactile rounded-xl overflow-hidden h-full">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Omzet Trend</CardTitle>
                <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">3 weken</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="meshGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="weekLabel" 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCurrency}
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrencyFull(Number(value)), 'Omzet']}
                      labelStyle={{ color: '#64748b', fontSize: '12px' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.95)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                        fontSize: '12px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#6366f1" 
                      strokeWidth={2.5}
                      fill="url(#meshGradient)"
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </div>
        </motion.div>

        {/* Pipeline Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="card-tactile rounded-xl h-full">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Pipeline Activiteit</CardTitle>
                <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">3 weken</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="weekLabel" 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={20}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="Nieuw" stackId="a" fill={STATUS_CONFIG.Nieuw.color} isAnimationActive={true} />
                    <Bar dataKey="Calculatie" stackId="a" fill={STATUS_CONFIG.Calculatie.color} isAnimationActive={true} />
                    <Bar dataKey="OfferteVerzonden" stackId="a" fill={STATUS_CONFIG.OfferteVerzonden.color} isAnimationActive={true} />
                    <Bar dataKey="Opdracht" stackId="a" fill={STATUS_CONFIG.Opdracht.color} radius={[4, 4, 0, 0]} isAnimationActive={true} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </div>
        </motion.div>

        {/* Pipeline Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="card-tactile rounded-xl h-full">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-semibold">Pipeline Verdeling</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {currentPipelineDistribution.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Geen projecten</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stacked bar */}
                  <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                    {currentPipelineDistribution.map((entry, i) => {
                      const total = currentPipelineDistribution.reduce((sum, e) => sum + e.value, 0)
                      const percentage = total > 0 ? (entry.value / total) * 100 : 0
                      return (
                        <motion.div
                          key={entry.name}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                          className="h-full first:rounded-l-full last:rounded-r-full"
                          style={{ backgroundColor: entry.color, minWidth: percentage > 0 ? '4px' : '0' }}
                        />
                      )
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="space-y-2.5">
                    {currentPipelineDistribution.map((entry) => {
                      const total = currentPipelineDistribution.reduce((sum, e) => sum + e.value, 0)
                      const percentage = total > 0 ? (entry.value / total) * 100 : 0
                      return (
                        <div key={entry.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-sm text-muted-foreground">{entry.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums">{entry.value}</span>
                            <span className="text-xs text-muted-foreground/60 tabular-nums w-10 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
