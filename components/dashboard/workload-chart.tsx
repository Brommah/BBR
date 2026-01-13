"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  {
    name: "Venka",
    cases: 12,
    color: "#1e40af", // Deep blue
  },
  {
    name: "Angelo",
    cases: 8,
    color: "#c2410c", // Warm orange
  },
  {
    name: "Roina",
    cases: 4,
    color: "#059669", // Emerald
  },
]

export function WorkloadChart() {
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
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 5 }}>
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
