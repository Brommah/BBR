"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useLeadStore, Lead } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Target,
  TrendingUp,
  ExternalLink,
  Filter,
  Hash,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createTimeEntry, getTimeEntriesByUser, type TimeCategory } from "@/lib/db-actions"

// Category configuration for time entries
const CATEGORY_CONFIG: Record<TimeCategory, { label: string; color: string; billable: boolean }> = {
  calculatie: { label: "Calculatie", color: "bg-blue-500", billable: true },
  overleg: { label: "Overleg", color: "bg-purple-500", billable: true },
  administratie: { label: "Administratie", color: "bg-slate-500", billable: false },
  "site-bezoek": { label: "Site bezoek", color: "bg-emerald-500", billable: true },
  overig: { label: "Overig", color: "bg-amber-500", billable: true },
  algemeen: { label: "Algemeen", color: "bg-rose-500", billable: false },
  prive: { label: "Privé", color: "bg-orange-500", billable: false },
}

// Categories available for PROJECT hours (no algemeen/prive - that's only for non-project)
const PROJECT_CATEGORIES: TimeCategory[] = ['calculatie', 'overleg', 'administratie', 'site-bezoek', 'overig']
// Categories available for GENERAL (non-project) hours
const GENERAL_CATEGORIES: TimeCategory[] = ['algemeen', 'prive', 'administratie']

// Billable categories for 85% target
const BILLABLE_CATEGORIES: TimeCategory[] = ['calculatie', 'overleg', 'site-bezoek', 'overig']
const NON_BILLABLE_CATEGORIES: TimeCategory[] = ['administratie', 'algemeen', 'prive']

interface TimeEntry {
  id: string
  leadId: string | null
  date: string
  duration: number
  description: string
  category: TimeCategory
}

interface ProjectHours {
  [leadId: string]: {
    [date: string]: number // minutes
  }
}

// Weekdays in Dutch
const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr"]
const WEEKDAY_FULL = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"]

/**
 * Get the Monday of the current week
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
 * Get all workdays (Mon-Fri) of a week
 */
function getWeekDays(weekStart: Date): { date: string; dayIndex: number; label: string; isToday: boolean }[] {
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  
  return WEEKDAYS.map((label, idx) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + idx)
    const dateStr = date.toISOString().split("T")[0]
    
    return {
      date: dateStr,
      dayIndex: idx,
      label,
      isToday: dateStr === todayStr,
    }
  })
}

/**
 * Format minutes to human readable
 */
function formatMinutes(minutes: number): string {
  if (minutes === 0) return "-"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}u${mins}m`
  if (hours > 0) return `${hours}u`
  return `${mins}m`
}

/**
 * Format date for display
 */
function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 4)
  
  const formatDate = (d: Date) => d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
}

interface TimeEntryDialog {
  open: boolean
  lead: Lead | null
  date: string
  dayLabel: string
  isGeneral: boolean // For non-project hours
}

/**
 * Week Hour Calendar - Full-width calendar view for hour registration
 * Shows Ma-Di-Wo-Do-Vr columns with all projects as rows
 */
export function WeekHourCalendar() {
  const router = useRouter()
  const { leads, loadLeads } = useLeadStore()
  const { currentUser } = useAuthStore()
  const hasLoadedRef = useRef(false)
  
  // Refresh leads data on mount to ensure we have latest assignments
  // This fixes the issue where role changes made by admin aren't reflected
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadLeads()
    }
  }, [loadLeads])
  
  // Also refresh leads when window gains focus (user might have made changes in another tab)
  useEffect(() => {
    const handleFocus = () => {
      loadLeads()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadLeads])
  
  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart())
  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart])
  
  // Project filter toggle
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(true)
  
  // Hour data
  const [projectHours, setProjectHours] = useState<ProjectHours>({})
  const [generalHours, setGeneralHours] = useState<{ [date: string]: number }>({})
  const [isLoadingHours, setIsLoadingHours] = useState(true)
  
  // Time entry dialog state
  const [timeDialog, setTimeDialog] = useState<TimeEntryDialog>({
    open: false,
    lead: null,
    date: "",
    dayLabel: "",
    isGeneral: false,
  })
  const [dialogHours, setDialogHours] = useState("")
  const [dialogDescription, setDialogDescription] = useState("")
  const [dialogCategory, setDialogCategory] = useState<TimeCategory>("calculatie")
  const [isDialogSaving, setIsDialogSaving] = useState(false)
  
  const userName = currentUser?.name || "Gast"
  
  // Get projects based on filter
  // Only use the new team assignment fields (assignedProjectleider, assignedRekenaar, assignedTekenaar)
  // The legacy 'assignee' field is deprecated and may have stale data
  const activeProjects = useMemo(() => {
    const active = leads.filter(l => l.status !== "Archief")
    
    if (showOnlyAssigned) {
      return active.filter(l => 
        l.assignedProjectleider === userName || 
        l.assignedRekenaar === userName || 
        l.assignedTekenaar === userName
      )
    }
    
    return active
  }, [leads, userName, showOnlyAssigned])
  
  // Load time entries for current week
  useEffect(() => {
    async function loadHours() {
      if (!currentUser) return
      
      setIsLoadingHours(true)
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const result = await getTimeEntriesByUser(
        currentUser.id,
        currentWeekStart.toISOString().split("T")[0],
        weekEnd.toISOString().split("T")[0]
      )
      
      if (result.success && result.data) {
        const entries = result.data as TimeEntry[]
        const hours: ProjectHours = {}
        const general: { [date: string]: number } = {}
        
        entries.forEach(entry => {
          const dateStr = entry.date.split("T")[0]
          
          if (entry.leadId) {
            if (!hours[entry.leadId]) hours[entry.leadId] = {}
            if (!hours[entry.leadId][dateStr]) hours[entry.leadId][dateStr] = 0
            hours[entry.leadId][dateStr] += entry.duration
          } else {
            // General/non-project hours
            if (!general[dateStr]) general[dateStr] = 0
            general[dateStr] += entry.duration
          }
        })
        
        setProjectHours(hours)
        setGeneralHours(general)
      }
      setIsLoadingHours(false)
    }
    
    loadHours()
  }, [currentUser, currentWeekStart])
  
  // Calculate totals
  const totals = useMemo(() => {
    let billable = 0
    let nonBillable = 0
    const perDay: { [date: string]: number } = {}
    const perProject: { [leadId: string]: number } = {}
    
    // Add project hours
    Object.entries(projectHours).forEach(([leadId, dates]) => {
      Object.entries(dates).forEach(([date, mins]) => {
        billable += mins // Project hours are billable
        if (!perDay[date]) perDay[date] = 0
        perDay[date] += mins
        if (!perProject[leadId]) perProject[leadId] = 0
        perProject[leadId] += mins
      })
    })
    
    // Add general hours (non-billable)
    Object.entries(generalHours).forEach(([date, mins]) => {
      nonBillable += mins
      if (!perDay[date]) perDay[date] = 0
      perDay[date] += mins
    })
    
    const total = billable + nonBillable
    const billablePercent = total > 0 ? Math.round((billable / total) * 100) : 0
    const targetHours = 40 * 60 // 40 hours in minutes
    const progressPercent = Math.min(100, Math.round((total / targetHours) * 100))
    
    return { billable, nonBillable, total, billablePercent, perDay, perProject, progressPercent }
  }, [projectHours, generalHours])
  
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
  
  // Open time entry dialog
  const openTimeDialog = useCallback((lead: Lead | null, date: string, dayLabel: string, isGeneral = false) => {
    setDialogHours("")
    setDialogDescription("")
    setDialogCategory(isGeneral ? "algemeen" : "calculatie")
    setTimeDialog({
      open: true,
      lead,
      date,
      dayLabel,
      isGeneral,
    })
  }, [])

  // Save time entry from dialog
  const handleDialogSave = useCallback(async () => {
    if (!currentUser || !dialogHours) return
    if (!timeDialog.isGeneral && !timeDialog.lead) return
    
    // Parse hours input
    let minutes = 0
    const input = dialogHours.trim().toLowerCase()
    
    if (input.includes(":")) {
      const [h, m] = input.split(":").map(Number)
      minutes = (h || 0) * 60 + (m || 0)
    } else if (input.endsWith("m")) {
      minutes = parseInt(input.replace("m", ""), 10) || 0
    } else if (input.endsWith("u")) {
      const hours = parseFloat(input.replace("u", "").replace(",", ".")) || 0
      minutes = Math.round(hours * 60)
    } else {
      const hours = parseFloat(input.replace(",", ".")) || 0
      minutes = Math.round(hours * 60)
    }
    
    if (minutes <= 0) {
      toast.error("Voer een geldig aantal uren in")
      return
    }
    
    setIsDialogSaving(true)
    
    try {
      const result = await createTimeEntry({
        leadId: timeDialog.lead?.id || null, // null for general/non-project hours
        userId: currentUser.id,
        userName: currentUser.name,
        date: timeDialog.date,
        startTime: "09:00",
        endTime: `${9 + Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`,
        duration: minutes,
        description: dialogDescription || "Werkzaamheden",
        category: dialogCategory,
      })
      
      if (result.success) {
        // Update local state
        if (timeDialog.lead) {
          setProjectHours(prev => ({
            ...prev,
            [timeDialog.lead!.id]: {
              ...prev[timeDialog.lead!.id],
              [timeDialog.date]: (prev[timeDialog.lead!.id]?.[timeDialog.date] || 0) + minutes,
            },
          }))
        } else {
          setGeneralHours(prev => ({
            ...prev,
            [timeDialog.date]: (prev[timeDialog.date] || 0) + minutes,
          }))
        }
        
        toast.success(`${formatMinutes(minutes)} toegevoegd`, {
          description: timeDialog.lead?.clientName || "Algemeen",
        })
        
        setTimeDialog({ open: false, lead: null, date: "", dayLabel: "", isGeneral: false })
      } else {
        toast.error("Kon uren niet opslaan")
      }
    } catch {
      toast.error("Er ging iets mis")
    } finally {
      setIsDialogSaving(false)
    }
  }, [currentUser, timeDialog, dialogHours, dialogDescription, dialogCategory])

  const isCurrentWeek = useMemo(() => {
    const now = getWeekStart()
    return currentWeekStart.getTime() === now.getTime()
  }, [currentWeekStart])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Urenregistratie
            </h1>
            <p className="text-muted-foreground text-sm">
              {formatWeekRange(currentWeekStart)}
            </p>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant={isCurrentWeek ? "default" : "outline"} 
              size="sm"
              onClick={goToCurrentWeek}
            >
              {isCurrentWeek ? "Deze week" : formatWeekRange(currentWeekStart)}
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards - Billable stats only visible for admin/projectleider */}
        <div className={cn(
          "grid gap-4 mb-6",
          currentUser?.role === 'engineer' ? "grid-cols-1 max-w-xs" : "grid-cols-4"
        )}>
          {/* Total Hours - visible for everyone */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-medium">Totaal deze week</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{formatMinutes(totals.total)}</span>
                <span className="text-slate-400 text-sm">/ 40u</span>
              </div>
              <Progress value={totals.progressPercent} className="h-1.5 mt-2 bg-slate-700" />
            </CardContent>
          </Card>
          
          {/* Billable stats - only for admin/projectleider */}
          {currentUser?.role !== 'engineer' && (
            <>
              {/* Billable Hours */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-xs font-medium">Billable uren</span>
                    <Target className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-600">{formatMinutes(totals.billable)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Project gerelateerd werk</p>
                </CardContent>
              </Card>
              
              {/* Non-Billable Hours */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-xs font-medium">Non-billable</span>
                    <TrendingUp className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-rose-600">{formatMinutes(totals.nonBillable)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Algemeen & administratie</p>
                </CardContent>
              </Card>
              
              {/* Billable Percentage */}
              <Card className={cn(
                totals.billablePercent >= 85 ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200" : 
                totals.billablePercent >= 70 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200" :
                "bg-rose-50 dark:bg-rose-950/30 border-rose-200"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-xs font-medium">Billable ratio</span>
                    <Badge variant={totals.billablePercent >= 85 ? "default" : "destructive"} className="text-xs">
                      Target: 85%
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-3xl font-bold",
                      totals.billablePercent >= 85 ? "text-emerald-600" : 
                      totals.billablePercent >= 70 ? "text-amber-600" : "text-rose-600"
                    )}>
                      {totals.billablePercent}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="show-assigned" className="text-sm font-medium cursor-pointer">
              Alleen mijn projecten
            </Label>
            <Switch
              id="show-assigned"
              checked={showOnlyAssigned}
              onCheckedChange={setShowOnlyAssigned}
            />
            <span className="text-xs text-muted-foreground">
              {showOnlyAssigned ? `${activeProjects.length} projecten` : `${activeProjects.length} projecten (alle)`}
            </span>
          </div>
        </div>

        {/* Week Calendar Table */}
        <Card>
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Weekoverzicht
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingHours ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium text-sm w-64">Project</th>
                      {weekDays.map((day) => (
                        <th 
                          key={day.date} 
                          className={cn(
                            "text-center py-3 px-2 font-medium text-sm w-24",
                            day.isToday && "bg-amber-50 dark:bg-amber-950/30"
                          )}
                        >
                          <div>{day.label}</div>
                          <div className="text-xs font-normal text-muted-foreground">
                            {new Date(day.date).getDate()}
                          </div>
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 font-medium text-sm w-24 bg-muted/50">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* General / Non-billable Row - AT THE TOP */}
                    <tr className="border-b bg-rose-50/30 dark:bg-rose-950/10">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                            Overig
                          </Badge>
                          <span className="text-sm text-muted-foreground">Algemeen / Privé / Administratie</span>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const dayHours = generalHours[day.date] || 0
                        
                        return (
                          <td 
                            key={day.date} 
                            className={cn(
                              "text-center py-2 px-2",
                              day.isToday && "bg-amber-50/50 dark:bg-amber-950/20"
                            )}
                          >
                            <Button
                              variant={dayHours > 0 ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "w-16 h-8 text-xs font-mono",
                                dayHours > 0 && "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
                              )}
                              onClick={() => openTimeDialog(null, day.date, WEEKDAY_FULL[day.dayIndex], true)}
                            >
                              {dayHours > 0 ? formatMinutes(dayHours) : <Plus className="w-3 h-3" />}
                            </Button>
                          </td>
                        )
                      })}
                      <td className="text-center py-2 px-4 bg-muted/30 font-mono font-bold text-sm text-rose-600">
                        {formatMinutes(totals.nonBillable)}
                      </td>
                    </tr>

                    {/* Project Rows */}
                    {activeProjects.map((project) => {
                      const projectTotal = totals.perProject[project.id] || 0
                      
                      return (
                        <tr key={project.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-4">
                            <button
                              onClick={() => router.push(`/leads/${project.id}`)}
                              className="text-left hover:underline flex items-center gap-2 group"
                            >
                              {project.werknummer && (
                                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5 shrink-0">
                                  <Hash className="w-2.5 h-2.5 mr-0.5" />
                                  {project.werknummer}
                                </Badge>
                              )}
                              <span className="font-medium text-sm truncate max-w-[180px]">
                                {project.clientName}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                            </button>
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {project.projectType} • {project.city}
                            </div>
                          </td>
                          {weekDays.map((day) => {
                            const dayHours = projectHours[project.id]?.[day.date] || 0
                            
                            return (
                              <td 
                                key={day.date} 
                                className={cn(
                                  "text-center py-2 px-2",
                                  day.isToday && "bg-amber-50/50 dark:bg-amber-950/20"
                                )}
                              >
                                <Button
                                  variant={dayHours > 0 ? "secondary" : "ghost"}
                                  size="sm"
                                  className={cn(
                                    "w-16 h-8 text-xs font-mono",
                                    dayHours > 0 && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  )}
                                  onClick={() => openTimeDialog(project, day.date, WEEKDAY_FULL[day.dayIndex])}
                                >
                                  {dayHours > 0 ? formatMinutes(dayHours) : <Plus className="w-3 h-3" />}
                                </Button>
                              </td>
                            )
                          })}
                          <td className="text-center py-2 px-4 bg-muted/30 font-mono font-bold text-sm">
                            {formatMinutes(projectTotal)}
                          </td>
                        </tr>
                      )
                    })}
                    
                    {/* Daily Totals Row */}
                    <tr className="bg-muted/50 font-bold">
                      <td className="py-3 px-4 text-sm">Dagelijkse totalen</td>
                      {weekDays.map((day) => {
                        const dayTotal = totals.perDay[day.date] || 0
                        const targetMinutes = 8 * 60 // 8 hours per day
                        const isComplete = dayTotal >= targetMinutes
                        
                        return (
                          <td 
                            key={day.date} 
                            className={cn(
                              "text-center py-3 px-2",
                              day.isToday && "bg-amber-100/50 dark:bg-amber-900/30"
                            )}
                          >
                            <span className={cn(
                              "font-mono text-sm",
                              isComplete ? "text-emerald-600" : dayTotal > 0 ? "text-amber-600" : "text-muted-foreground"
                            )}>
                              {formatMinutes(dayTotal)}
                            </span>
                          </td>
                        )
                      })}
                      <td className="text-center py-3 px-4 bg-slate-200 dark:bg-slate-800 font-mono text-lg">
                        {formatMinutes(totals.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empty State */}
        {activeProjects.length === 0 && !isLoadingHours && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Geen projecten gevonden</h3>
            <p className="text-sm">
              {showOnlyAssigned 
                ? "Er zijn geen projecten aan jou toegewezen. Zet de filter uit om alle projecten te zien."
                : "Er zijn geen actieve projecten in het systeem."
              }
            </p>
          </div>
        )}
      </div>

      {/* Time Entry Dialog */}
      <Dialog 
        open={timeDialog.open} 
        onOpenChange={(open) => {
          if (!open) setTimeDialog({ open: false, lead: null, date: "", dayLabel: "", isGeneral: false })
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Uren registreren
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Project & Day info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium">
                {timeDialog.isGeneral ? "Algemeen (non-billable)" : timeDialog.lead?.clientName}
              </p>
              <p className="text-xs text-muted-foreground">{timeDialog.dayLabel} - {timeDialog.date}</p>
            </div>

            {/* Hours input */}
            <div className="space-y-2">
              <Label htmlFor="hours">Aantal uren</Label>
              <Input
                id="hours"
                type="text"
                placeholder="bijv. 1.5, 2u, 1:30, 90m"
                value={dialogHours}
                onChange={(e) => setDialogHours(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isDialogSaving) handleDialogSave()
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Formaten: 1.5 (uren), 1:30 (uur:min), 90m (minuten)
              </p>
            </div>

            {/* Category - filtered based on project vs general */}
            <div className="space-y-2">
              <Label>Categorie</Label>
              <Select value={dialogCategory} onValueChange={(v) => setDialogCategory(v as TimeCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(timeDialog.isGeneral ? GENERAL_CATEGORIES : PROJECT_CATEGORIES).map((key) => {
                    const config = CATEGORY_CONFIG[key]
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", config.color)} />
                          {config.label}
                          {!config.billable && (
                            <Badge variant="outline" className="text-[10px] ml-1">non-billable</Badge>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving (optioneel)</Label>
              <Textarea
                id="description"
                placeholder="Wat heb je gedaan?"
                value={dialogDescription}
                onChange={(e) => setDialogDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTimeDialog({ open: false, lead: null, date: "", dayLabel: "", isGeneral: false })}
              disabled={isDialogSaving}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleDialogSave}
              disabled={!dialogHours || isDialogSaving}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isDialogSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                "Opslaan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
