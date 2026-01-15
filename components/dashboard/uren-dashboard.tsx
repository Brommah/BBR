"use client"

import { useState, useEffect } from "react"
import { motion, type Variants } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, Clock } from "lucide-react"
import { getDashboardAnalytics, type DashboardAnalytics, type EmployeeHoursData } from "@/lib/analytics-actions"
import { cn } from "@/lib/utils"

/**
 * Animation variants for cards
 */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
}

/**
 * UrenDashboard - Dedicated tab for team hours overview
 */
export function UrenDashboard() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card-tactile rounded-xl p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="card-tactile rounded-xl p-6">
            <Skeleton className="h-[280px]" />
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Kon uren data niet laden
      </div>
    )
  }

  const { employeeHours, totals } = analytics

  return (
    <div className="space-y-6">
      {/* Header Row with KPI and Team Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Team Uren KPI */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="card-tactile rounded-xl p-5 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-micro mb-1">Team Uren</p>
                <p className="text-4xl font-bold tracking-tight">
                  {totals.totalHours}<span className="text-xl font-medium ml-0.5">u</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{employeeHours.length} teamleden</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Hours Detail */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="card-tactile rounded-xl h-full">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Team Uren Overzicht</CardTitle>
                <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">
                  {totals.totalHours} uur totaal
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {employeeHours.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nog geen uurregistraties</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {employeeHours.slice(0, 8).map((employee, index) => {
                    const maxHours = Math.max(...employeeHours.map(e => e.hours))
                    const percentage = maxHours > 0 ? (employee.hours / maxHours) * 100 : 0
                    
                    return (
                      <motion.div 
                        key={index} 
                        className="space-y-1.5"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: employee.color }} 
                            />
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {employee.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums">{employee.hours}u</span>
                            <span className="text-xs text-muted-foreground/60">
                              ({employee.projects}p)
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                            style={{ backgroundColor: employee.color }} 
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </div>
        </motion.div>
      </div>

      {/* Additional Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="card-tactile">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Over Uren Registratie</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Dit overzicht toont de geregistreerde uren van de afgelopen 4 weken per teamlid.</p>
              <p>Uren worden automatisch bijgehouden vanuit projectdossiers en tijdregistraties.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
