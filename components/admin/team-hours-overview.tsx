"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock, 
  Users, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Target,
  BarChart3,
  Briefcase
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLeadStore } from "@/lib/store"
import { useAllUsers } from "@/lib/auth"
import { getTeamTimeEntries, getAverageBillableHoursPerEmployee } from "@/lib/db-actions"

interface TeamMemberHours {
  userId: string
  userName: string
  avatar?: string
  totalMinutes: number
  billableMinutes: number
  nonBillableMinutes: number
  projectBreakdown: {
    leadId: string
    leadName: string
    minutes: number
  }[]
}

interface EmployeeAverage {
  userId: string
  userName: string
  avgBillableHoursPerWeek: number
  avgTotalHoursPerWeek: number
  weeksAnalyzed: number
  billablePercent: number
}

/**
 * Get the Monday of a given week
 */
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Format minutes to human readable
 */
function formatMinutes(minutes: number): string {
  if (minutes === 0) return "0u"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}u${mins}m`
  if (hours > 0) return `${hours}u`
  return `${mins}m`
}

/**
 * Format week range for display
 */
function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 4)
  
  const formatDate = (d: Date) => d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
}

/**
 * Team Hours Overview - For projectleiders to see team workload
 * Shows hours per team member per project
 */
export function TeamHoursOverview() {
  const { leads } = useLeadStore()
  const { users } = useAllUsers()
  
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart())
  const [teamHours, setTeamHours] = useState<TeamMemberHours[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Average billable hours state
  const [employeeAverages, setEmployeeAverages] = useState<EmployeeAverage[]>([])
  const [teamAvgBillable, setTeamAvgBillable] = useState<number>(0)
  const [isLoadingAverages, setIsLoadingAverages] = useState(true)
  
  // Track which user's projects are expanded
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  
  // Load time entries for all team members
  useEffect(() => {
    async function loadTeamHours() {
      setIsLoading(true)
      
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      try {
        const result = await getTeamTimeEntries(
          currentWeekStart.toISOString().split("T")[0],
          weekEnd.toISOString().split("T")[0]
        )
        
        if (result.success && result.data) {
          const entries = result.data as Array<{
            userId: string
            userName: string
            leadId: string
            duration: number
            category: string
          }>
          
          // Group by user
          const userMap = new Map<string, TeamMemberHours>()
          
          entries.forEach(entry => {
            if (!userMap.has(entry.userId)) {
              const user = users.find(u => u.id === entry.userId)
              userMap.set(entry.userId, {
                userId: entry.userId,
                userName: entry.userName,
                avatar: user?.avatar,
                totalMinutes: 0,
                billableMinutes: 0,
                nonBillableMinutes: 0,
                projectBreakdown: []
              })
            }
            
            const userHours = userMap.get(entry.userId)!
            userHours.totalMinutes += entry.duration
            
            // Check if billable
            const isBillable = !['administratie', 'algemeen'].includes(entry.category)
            if (isBillable) {
              userHours.billableMinutes += entry.duration
            } else {
              userHours.nonBillableMinutes += entry.duration
            }
            
            // Add to project breakdown
            const lead = leads.find(l => l.id === entry.leadId)
            const existingProject = userHours.projectBreakdown.find(p => p.leadId === entry.leadId)
            if (existingProject) {
              existingProject.minutes += entry.duration
            } else {
              userHours.projectBreakdown.push({
                leadId: entry.leadId,
                leadName: lead?.clientName || "Onbekend project",
                minutes: entry.duration
              })
            }
          })
          
          setTeamHours(Array.from(userMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes))
        }
      } catch (error) {
        console.error("Failed to load team hours:", error)
      }
      
      setIsLoading(false)
    }
    
    loadTeamHours()
  }, [currentWeekStart, leads, users])
  
  // Load average billable hours (runs once on mount)
  useEffect(() => {
    async function loadAverages() {
      setIsLoadingAverages(true)
      try {
        const result = await getAverageBillableHoursPerEmployee(12) // Last 12 weeks
        if (result.success && result.data) {
          const data = result.data as {
            employees: EmployeeAverage[]
            teamAverage: number
          }
          setEmployeeAverages(data.employees)
          setTeamAvgBillable(data.teamAverage)
        }
      } catch (error) {
        console.error("Failed to load average billable hours:", error)
      }
      setIsLoadingAverages(false)
    }
    
    loadAverages()
  }, [])
  
  // Week navigation
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeekStart)
    newWeek.setDate(newWeek.getDate() - 7)
    setCurrentWeekStart(newWeek)
  }
  
  const goToNextWeek = () => {
    const newWeek = new Date(currentWeekStart)
    newWeek.setDate(newWeek.getDate() + 7)
    setCurrentWeekStart(newWeek)
  }
  
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart())
  }
  
  const isCurrentWeek = useMemo(() => {
    const now = getWeekStart()
    return currentWeekStart.getTime() === now.getTime()
  }, [currentWeekStart])
  
  // Total hours this week
  const totalTeamMinutes = teamHours.reduce((sum, m) => sum + m.totalMinutes, 0)
  const totalBillableMinutes = teamHours.reduce((sum, m) => sum + m.billableMinutes, 0)
  const billablePercent = totalTeamMinutes > 0 ? Math.round((totalBillableMinutes / totalTeamMinutes) * 100) : 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Week Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Team Urenregistratie
          </h2>
          <p className="text-sm text-muted-foreground">{formatWeekRange(currentWeekStart)}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant={isCurrentWeek ? "default" : "outline"} 
            size="sm"
            onClick={goToCurrentWeek}
          >
            Deze week
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Team totaal</p>
                <p className="text-2xl font-bold">{formatMinutes(totalTeamMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billable ratio</p>
                <p className={cn(
                  "text-2xl font-bold",
                  billablePercent >= 85 ? "text-emerald-600" : 
                  billablePercent >= 70 ? "text-amber-600" : "text-rose-600"
                )}>
                  {billablePercent}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Average Billable Hours Card */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Gem. billable uren/week</p>
                <div className="flex items-baseline gap-2">
                  {isLoadingAverages ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {teamAvgBillable}u
                      </p>
                      <span className="text-xs text-muted-foreground">per medewerker</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Gemiddeld over afgelopen 12 weken
                </p>
              </div>
              {!isLoadingAverages && (
                <div className="text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    teamAvgBillable >= 32 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                    teamAvgBillable >= 24 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                    "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                  )}>
                    <Target className="w-3 h-3" />
                    {teamAvgBillable >= 32 ? "Op target" : teamAvgBillable >= 24 ? "Bijna target" : "Onder target"}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Target: 32u/week</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per Teamlid</CardTitle>
          <CardDescription>Uren deze week per engineer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamHours.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen uren geregistreerd deze week</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teamHours.map(member => {
                const targetMinutes = 40 * 60
                const progressPercent = Math.min(100, (member.totalMinutes / targetMinutes) * 100)
                const billableRatio = member.totalMinutes > 0 
                  ? Math.round((member.billableMinutes / member.totalMinutes) * 100) 
                  : 0
                const isExpanded = expandedUserId === member.userId
                
                return (
                  <div 
                    key={member.userId} 
                    className={cn(
                      "p-3 rounded-lg bg-muted/30 space-y-2 transition-all",
                      isExpanded && "ring-2 ring-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10"
                    )}
                  >
                    {/* Clickable header */}
                    <button
                      onClick={() => setExpandedUserId(isExpanded ? null : member.userId)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          {member.avatar && <AvatarImage src={member.avatar} />}
                          <AvatarFallback className="text-xs font-bold">
                            {member.userName.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.projectBreakdown.length} project{member.projectBreakdown.length !== 1 && "en"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-mono">{formatMinutes(member.totalMinutes)}</p>
                          <p className={cn(
                            "text-xs",
                            billableRatio >= 85 ? "text-emerald-600" : 
                            billableRatio >= 70 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {billableRatio}% billable
                          </p>
                        </div>
                        <ChevronDown className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </div>
                    </button>
                    
                    <Progress value={progressPercent} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground text-right">
                      {Math.round(progressPercent)}% van 40u target
                    </p>
                    
                    {/* Expandable project breakdown */}
                    {isExpanded && member.projectBreakdown.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3" />
                          Projecten deze week
                        </p>
                        <div className="space-y-1.5">
                          {member.projectBreakdown
                            .sort((a, b) => b.minutes - a.minutes)
                            .map(project => {
                              const projectPercent = member.totalMinutes > 0 
                                ? Math.round((project.minutes / member.totalMinutes) * 100) 
                                : 0
                              return (
                                <div 
                                  key={project.leadId}
                                  className="flex items-center justify-between p-2 rounded bg-background/60 text-sm"
                                >
                                  <span className="truncate flex-1 pr-2">
                                    {project.leadName || 'Algemeen'}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-muted-foreground">
                                      {projectPercent}%
                                    </span>
                                    <span className="font-mono font-medium">
                                      {formatMinutes(project.minutes)}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                    
                    {isExpanded && member.projectBreakdown.length === 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Geen projecten geregistreerd
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Average Billable Hours Per Employee */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Gemiddelde Billable Uren per Week
          </CardTitle>
          <CardDescription>Per medewerker over de afgelopen 12 weken</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAverages ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : employeeAverages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen gegevens beschikbaar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employeeAverages.map((employee, index) => {
                const user = users.find(u => u.id === employee.userId)
                const targetHours = 32 // 80% of 40 hours
                const progressPercent = Math.min(100, (employee.avgBillableHoursPerWeek / targetHours) * 100)
                const isOnTarget = employee.avgBillableHoursPerWeek >= targetHours
                
                return (
                  <div 
                    key={employee.userId} 
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      isOnTarget 
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                        : "bg-muted/30 border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold">
                        {index + 1}
                      </div>
                      <Avatar className="w-8 h-8">
                        {user?.avatar && <AvatarImage src={user.avatar} />}
                        <AvatarFallback className="text-xs font-bold">
                          {employee.userName.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{employee.userName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{employee.weeksAnalyzed} weken data</span>
                          <span>•</span>
                          <span className={cn(
                            employee.billablePercent >= 85 ? "text-emerald-600" : 
                            employee.billablePercent >= 70 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {employee.billablePercent}% billable
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-lg font-bold font-mono",
                          isOnTarget ? "text-emerald-600" : "text-foreground"
                        )}>
                          {employee.avgBillableHoursPerWeek}u
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          / {employee.avgTotalHoursPerWeek}u totaal
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={progressPercent} 
                      className={cn(
                        "h-1.5 mt-2",
                        isOnTarget && "[&>div]:bg-emerald-500"
                      )} 
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
