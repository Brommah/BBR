"use client"

import { useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, TrendingUp, Target, CalendarDays, ArrowDownRight } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useLeadStore } from "@/lib/store"

// Static roadmap items (product roadmap, not data-driven)
const roadmapItems = [
    {
        quarter: "Q1 2026",
        items: [
            { title: "Automated BAG Enrichment", status: "In Progress", impact: "High", cost: "€ 2.500" },
            { title: "Client Portal Beta", status: "Planned", impact: "High", cost: "€ 5.000" }
        ]
    },
    {
        quarter: "Q2 2026",
        items: [
            { title: "AI Quote Engine", status: "Research", impact: "Med", cost: "€ 3.500" },
            { title: "Mobile Field App", status: "Planned", impact: "High", cost: "€ 8.000" }
        ]
    },
     {
        quarter: "Q3 2026",
        items: [
            { title: "Financial Forecasting Module", status: "Backlog", impact: "Med", cost: "€ 2.000" },
            { title: "WhatsApp Integration", status: "Backlog", impact: "Low", cost: "€ 1.200" }
        ]
    }
]

export function FinancialRoadmapView() {
    const { leads, isLoading, loadLeads } = useLeadStore()

    // Load leads on mount
    useEffect(() => {
        loadLeads()
    }, [loadLeads])

    // Compute financial metrics from real lead data
    const financialMetrics = useMemo(() => {
        const now = new Date()
        const currentYear = now.getFullYear()
        
        // Calculate YTD revenue (completed orders - status Opdracht)
        const completedLeads = leads.filter(l => l.status === "Opdracht")
        const ytdRevenue = completedLeads.reduce((sum, l) => sum + (l.value || 0), 0)
        
        // Calculate average project value (from completed)
        const avgProjectValue = completedLeads.length > 0 
            ? Math.round(ytdRevenue / completedLeads.length) 
            : 0
        
        // Quote conversion rate (Opdracht / (Opdracht + sent quotes))
        const quoteSentLeads = leads.filter(l => l.status === "Offerte Verzonden")
        const conversionDenominator = completedLeads.length + quoteSentLeads.length
        const quoteConversion = conversionDenominator > 0 
            ? Math.round((completedLeads.length / conversionDenominator) * 1000) / 10
            : 0
        
        // Pipeline value (active leads not in Archief or Opdracht)
        const pipelineLeads = leads.filter(l => 
            l.status !== "Archief" && l.status !== "Opdracht"
        )
        const pipelineValue = pipelineLeads.reduce((sum, l) => sum + (l.value || 0), 0)
        const activeLeadsCount = pipelineLeads.length
        
        // Monthly revenue data for chart (group by month)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthlyData = monthNames.map((name, idx) => ({
            name,
            revenue: 0,
            target: 40000 + (idx * 2000) // Simple target growth
        }))
        
        // Populate with actual completed lead values by month
        completedLeads.forEach(lead => {
            const createdDate = new Date(lead.createdAt)
            if (createdDate.getFullYear() === currentYear) {
                const monthIdx = createdDate.getMonth()
                monthlyData[monthIdx].revenue += (lead.value || 0)
            }
        })
        
        // Only show months up to current month + 1
        const currentMonth = now.getMonth()
        const chartData = monthlyData.slice(0, currentMonth + 2)
        
        return {
            ytdRevenue,
            avgProjectValue,
            quoteConversion,
            pipelineValue,
            activeLeadsCount,
            chartData
        }
    }, [leads])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-28" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-7">
                    <Card className="md:col-span-4">
                        <CardContent className="p-6">
                            <Skeleton className="h-[300px] w-full" />
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-3">
                        <CardContent className="p-6">
                            <Skeleton className="h-[300px] w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-primary text-primary-foreground border-none">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary-foreground/70">YTD Revenue</CardDescription>
                        <CardTitle className="text-3xl font-semibold text-currency">
                            € {financialMetrics.ytdRevenue.toLocaleString('nl-NL')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            {financialMetrics.ytdRevenue > 0 ? (
                                <>
                                    <ArrowUpRight className="w-4 h-4 text-green-300" />
                                    <span className="text-green-300 font-semibold">Live</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight className="w-4 h-4 text-yellow-300" />
                                    <span className="text-yellow-300 font-semibold">Geen data</span>
                                </>
                            )}
                            <span className="text-primary-foreground/50">this year</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Project Value</CardDescription>
                        <CardTitle className="text-2xl font-semibold text-currency">
                            € {financialMetrics.avgProjectValue.toLocaleString('nl-NL')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-muted-foreground">
                                van {leads.filter(l => l.status === "Opdracht").length} opdrachten
                            </span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Quote Conversion</CardDescription>
                        <CardTitle className="text-2xl font-semibold text-value">
                            {financialMetrics.quoteConversion}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Progress value={financialMetrics.quoteConversion} className="h-2 mt-2" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pipeline Value</CardDescription>
                        <CardTitle className="text-2xl font-semibold text-currency">
                            € {financialMetrics.pipelineValue.toLocaleString('nl-NL')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="w-4 h-4" />
                            <span>{financialMetrics.activeLeadsCount} active leads</span>
                         </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Financial Chart */}
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue vs Target</CardTitle>
                        <CardDescription>Monthly financial performance {new Date().getFullYear()}</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={financialMetrics.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12 }} 
                                        tickFormatter={(value) => `€${value/1000}k`} 
                                    />
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <Tooltip 
                                        formatter={(value) => `€ ${(value ?? 0).toLocaleString()}`}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="hsl(var(--primary))" 
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                        strokeWidth={2}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="target" 
                                        stroke="hsl(var(--muted-foreground))" 
                                        strokeDasharray="5 5" 
                                        fill="none" 
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Strategic Roadmap List */}
                <Card className="md:col-span-3 bg-slate-50/50 dark:bg-slate-900/20">
                    <CardHeader>
                        <CardTitle>Strategic Roadmap</CardTitle>
                        <CardDescription>Key initiatives & investments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {roadmapItems.map((period, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-primary" />
                                    <h4 className="font-bold text-sm text-primary">{period.quarter}</h4>
                                </div>
                                <div className="space-y-2 pl-6 border-l-2 border-primary/10">
                                    {period.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-background rounded border border-border/50 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{item.title}</span>
                                                <div className="flex gap-2">
                                                     <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{item.status}</Badge>
                                                     {item.impact === 'High' && <Badge variant="default" className="text-[10px] px-1 py-0 h-4 bg-green-500 hover:bg-green-600">High Impact</Badge>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xs font-mono font-medium">{item.cost}</span>
                                                <span className="block text-[10px] text-muted-foreground">Est. Cost</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
