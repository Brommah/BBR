"use client"

import { useEffect, useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeadStore } from "@/lib/store"

// Predefined colors for engineers
const ENGINEER_COLORS: Record<string, string> = {
  "Venka": "#1e40af",   // Deep blue
  "Angelo": "#c2410c", // Warm orange
  "Roina": "#059669",  // Emerald
}

const DEFAULT_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
]

export function WorkloadChart() {
  const { leads, isLoading, loadLeads } = useLeadStore()

  // Load leads on mount
  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  // Compute workload data from real leads
  const workloadData = useMemo(() => {
    // Count active cases (not Archief) per engineer
    const activeLeads = leads.filter(l => l.status !== "Archief" && l.assignee)
    
    // Group by assignee
    const workloadMap: Record<string, number> = {}
    activeLeads.forEach(lead => {
      if (lead.assignee) {
        workloadMap[lead.assignee] = (workloadMap[lead.assignee] || 0) + 1
      }
    })
    
    // Convert to array and sort by count descending
    const data = Object.entries(workloadMap)
      .map(([name, cases], index) => ({
        name,
        cases,
        color: ENGINEER_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
      }))
      .sort((a, b) => b.cases - a.cases)
    
    return data
  }, [leads])

  if (isLoading) {
    return (
      <Card className="col-span-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="pl-2">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (workloadData.length === 0) {
    return (
      <Card className="col-span-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-900 dark:text-slate-100 font-bold">Team Workload</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Actieve cases per engineer
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-sm">Geen actieve cases toegewezen</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-900 dark:text-slate-100 font-bold">Team Workload</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Actieve cases per engineer
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={workloadData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              width={60}
              tick={{ fill: '#475569', fontWeight: 600, fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '2px solid #e2e8f0',
                backgroundColor: '#fff',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              formatter={(value) => [`${value ?? 0} cases`, 'Actief']}
            />
            <Bar dataKey="cases" radius={[0, 6, 6, 0]} barSize={36}>
              {workloadData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
