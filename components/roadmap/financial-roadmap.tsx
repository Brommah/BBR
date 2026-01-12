"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, TrendingUp, DollarSign, Target, CalendarDays, CheckCircle2 } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const financialData = [
  { name: 'Jan', revenue: 45000, target: 40000 },
  { name: 'Feb', revenue: 52000, target: 42000 },
  { name: 'Mar', revenue: 48000, target: 45000 },
  { name: 'Apr', revenue: 61000, target: 48000 },
  { name: 'May', revenue: 55000, target: 50000 },
  { name: 'Jun', revenue: 67000, target: 52000 },
]

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
    return (
        <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-primary text-primary-foreground border-none">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary-foreground/70">YTD Revenue</CardDescription>
                        <CardTitle className="text-3xl font-semibold text-currency">€ 328.000</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            <ArrowUpRight className="w-4 h-4 text-green-300" />
                            <span className="text-green-300 font-semibold">+12%</span>
                            <span className="text-primary-foreground/50">vs last year</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Project Value</CardDescription>
                        <CardTitle className="text-2xl font-semibold text-currency">€ 3.850</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-semibold">+5%</span>
                            <span className="text-muted-foreground">vs target</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Quote Conversion</CardDescription>
                        <CardTitle className="text-2xl font-semibold text-value">42.8%</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Progress value={42.8} className="h-2 mt-2" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pipeline Value</CardDescription>
                        <CardTitle className="text-2xl font-semibold text-currency">€ 145.200</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="w-4 h-4" />
                            <span>65 active leads</span>
                         </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Financial Chart */}
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue vs Target</CardTitle>
                        <CardDescription>Monthly financial performance 2026</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={financialData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                        formatter={(value: number) => `€ ${value.toLocaleString()}`}
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
