"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useLeadStore, Lead } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  MapPin,
  ChevronRight,
  CheckCircle2,
  Plus,
  Building2,
  Hash,
  Phone,
  Loader2,
  TrendingUp,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createTimeEntry, getTimeEntriesByUser, type TimeCategory } from "@/lib/db-actions"

// Category configuration for time entries
const CATEGORY_CONFIG: Record<TimeCategory, { label: string; color: string }> = {
  calculatie: { label: "Calculatie", color: "bg-blue-500" },
  overleg: { label: "Overleg", color: "bg-purple-500" },
  administratie: { label: "Administratie", color: "bg-slate-500" },
  "site-bezoek": { label: "Site bezoek", color: "bg-emerald-500" },
  overig: { label: "Overig", color: "bg-amber-500" },
}

interface TimeEntry {
  id: string
  leadId: string
  date: string
  duration: number
  description: string
}

interface ProjectHours {
  [leadId: string]: {
    [date: string]: number // minutes
  }
}

// Get weekday names in Dutch
const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr"]
const WEEKDAY_FULL = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"]

/**
 * Get the remaining workdays of the current week (Mon-Fri)
 * Returns array of { date: string (YYYY-MM-DD), dayIndex: number (0-4), label: string }
 */
function getRemainingWorkdays(): { date: string; dayIndex: number; label: string; isToday: boolean }[] {
  const today = new Date()
  const currentDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // If weekend, return empty (no workdays left this week)
  if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
    return []
  }
  
  const result: { date: string; dayIndex: number; label: string; isToday: boolean }[] = []
  
  // Start from today, go through remaining workdays
  for (let d = currentDayOfWeek; d <= 5; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + (d - currentDayOfWeek))
    
    result.push({
      date: date.toISOString().split("T")[0],
      dayIndex: d - 1, // 0 = Monday
      label: WEEKDAYS[d - 1],
      isToday: d === currentDayOfWeek,
    })
  }
  
  return result
}

/**
 * Get start of current week (Monday)
 */
function getWeekStart(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
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
 * Engineer Dashboard - Ultra-clean project list with inline hours registration
 */
interface TimeEntryDialog {
  open: boolean
  lead: Lead | null
  date: string
  dayLabel: string
}

export function EngineerDashboard() {
  const router = useRouter()
  const { leads } = useLeadStore()
  const { currentUser } = useAuthStore()
  
  const [projectHours, setProjectHours] = useState<ProjectHours>({})
  const [isLoadingHours, setIsLoadingHours] = useState(true)
  const [savingFor, setSavingFor] = useState<string | null>(null) // leadId_date being saved
  const [quickAddValues, setQuickAddValues] = useState<{ [key: string]: string }>({})
  
  // Time entry dialog state
  const [timeDialog, setTimeDialog] = useState<TimeEntryDialog>({
    open: false,
    lead: null,
    date: "",
    dayLabel: "",
  })
  const [dialogHours, setDialogHours] = useState("")
  const [dialogDescription, setDialogDescription] = useState("")
  const [dialogCategory, setDialogCategory] = useState<TimeCategory>("calculatie")
  const [isDialogSaving, setIsDialogSaving] = useState(false)
  
  const userName = currentUser?.name || "Gast"
  
  // Get my active projects
  const myProjects = useMemo(() => {
    return leads
      .filter(l => l.assignee === userName && l.status !== "Archief")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [leads, userName])
  
  // Get remaining workdays
  const remainingDays = useMemo(() => getRemainingWorkdays(), [])
  const todayStr = new Date().toISOString().split("T")[0]
  
  // Load time entries for current user
  useEffect(() => {
    async function loadHours() {
      if (!currentUser) return
      
      setIsLoadingHours(true)
      const weekStart = getWeekStart()
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const result = await getTimeEntriesByUser(
        currentUser.id,
        weekStart.toISOString().split("T")[0],
        weekEnd.toISOString().split("T")[0]
      )
      
      if (result.success && result.data) {
        const entries = result.data as TimeEntry[]
        const hours: ProjectHours = {}
        
        entries.forEach(entry => {
          if (!hours[entry.leadId]) hours[entry.leadId] = {}
          if (!hours[entry.leadId][entry.date]) hours[entry.leadId][entry.date] = 0
          hours[entry.leadId][entry.date] += entry.duration
        })
        
        setProjectHours(hours)
      }
      setIsLoadingHours(false)
    }
    
    loadHours()
  }, [currentUser])
  
  // Calculate total hours this week across all projects
  const totalWeekMinutes = useMemo(() => {
    let total = 0
    Object.values(projectHours).forEach(dates => {
      Object.values(dates).forEach(mins => {
        total += mins
      })
    })
    return total
  }, [projectHours])
  
  // Open time entry dialog for a specific day
  const openTimeDialog = useCallback((lead: Lead, date: string, dayLabel: string) => {
    setDialogHours("")
    setDialogDescription("")
    setDialogCategory("calculatie")
    setTimeDialog({
      open: true,
      lead,
      date,
      dayLabel,
    })
  }, [])

  // Save time entry from dialog
  const handleDialogSave = useCallback(async () => {
    if (!currentUser || !timeDialog.lead || !dialogHours) return
    
    // Parse hours input (supports formats like "1.5", "1,5", "1:30", "90m")
    let minutes = 0
    const input = dialogHours.trim().toLowerCase()
    
    if (input.includes(":")) {
      // Format: "1:30" -> 90 minutes
      const [h, m] = input.split(":").map(Number)
      minutes = (h || 0) * 60 + (m || 0)
    } else if (input.endsWith("m")) {
      // Format: "90m" -> 90 minutes
      minutes = parseInt(input.replace("m", ""), 10) || 0
    } else if (input.endsWith("u")) {
      // Format: "1.5u" -> 90 minutes
      const hours = parseFloat(input.replace("u", "").replace(",", ".")) || 0
      minutes = Math.round(hours * 60)
    } else {
      // Format: "1.5" or "1,5" -> hours
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
        leadId: timeDialog.lead.id,
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
        setProjectHours(prev => ({
          ...prev,
          [timeDialog.lead!.id]: {
            ...prev[timeDialog.lead!.id],
            [timeDialog.date]: (prev[timeDialog.lead!.id]?.[timeDialog.date] || 0) + minutes,
          },
        }))
        
        toast.success(`${formatMinutes(minutes)} toegevoegd`, {
          description: `${timeDialog.lead.clientName} - ${dialogDescription || dialogCategory}`,
        })
        
        setTimeDialog({ open: false, lead: null, date: "", dayLabel: "" })
      } else {
        toast.error("Kon uren niet opslaan")
      }
    } catch {
      toast.error("Er ging iets mis")
    } finally {
      setIsDialogSaving(false)
    }
  }, [currentUser, timeDialog, dialogHours, dialogDescription, dialogCategory])

  // Quick add hours for a project on a specific day (legacy - kept for preset buttons)
  const handleQuickAdd = useCallback(async (lead: Lead, date: string, minutes: number) => {
    if (!currentUser || minutes <= 0) return
    
    const key = `${lead.id}_${date}`
    setSavingFor(key)
    
    try {
      const result = await createTimeEntry({
        leadId: lead.id,
        userId: currentUser.id,
        userName: currentUser.name,
        date,
        startTime: "09:00",
        endTime: `${9 + Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`,
        duration: minutes,
        description: "Werkzaamheden",
        category: "calculatie",
      })
      
      if (result.success) {
        // Update local state
        setProjectHours(prev => ({
          ...prev,
          [lead.id]: {
            ...prev[lead.id],
            [date]: (prev[lead.id]?.[date] || 0) + minutes,
          },
        }))
        
        // Clear input
        setQuickAddValues(prev => ({ ...prev, [key]: "" }))
        toast.success(`${formatMinutes(minutes)} toegevoegd`, {
          description: lead.clientName,
        })
      } else {
        toast.error("Kon uren niet opslaan")
      }
    } catch {
      toast.error("Er ging iets mis")
    } finally {
      setSavingFor(null)
    }
  }, [currentUser])
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Goedemorgen"
    if (hour < 18) return "Goedemiddag"
    return "Goedenavond"
  }
  
  const formatDayLabel = (date: string, isToday: boolean) => {
    if (isToday) return "Vandaag"
    const d = new Date(date)
    return WEEKDAY_FULL[d.getDay() - 1]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {userName.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {myProjects.length === 0 
              ? "Je hebt geen actieve projecten."
              : `${myProjects.length} actieve project${myProjects.length !== 1 ? "en" : ""} toegewezen.`
            }
          </p>
        </div>

        {/* Week Overview Card */}
        <Card className="mb-6 border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white overflow-hidden">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Deze week gewerkt</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    {isLoadingHours ? "..." : formatMinutes(totalWeekMinutes)}
                  </span>
                  {totalWeekMinutes > 0 && (
                    <span className="text-emerald-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      actief
                    </span>
                  )}
                </div>
              </div>
              
              {/* Week Progress Bar */}
              <div className="hidden sm:flex items-center gap-1">
                {WEEKDAYS.map((day, idx) => {
                  const isActive = remainingDays.some(d => d.dayIndex === idx)
                  const isPast = !isActive && idx < (new Date().getDay() - 1)
                  const isToday = remainingDays.find(d => d.dayIndex === idx)?.isToday
                  
                  return (
                    <div
                      key={day}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                        isToday && "bg-amber-500 text-white",
                        isPast && "bg-slate-700 text-slate-400",
                        !isToday && isActive && "bg-slate-700/50 text-slate-300",
                      )}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        {myProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Geen actieve projecten</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Er zijn momenteel geen projecten aan je toegewezen. Neem contact op met de administratie voor nieuwe opdrachten.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                remainingDays={remainingDays}
                projectHours={projectHours[project.id] || {}}
                savingFor={savingFor}
                onOpenProject={() => router.push(`/leads/${project.id}`)}
                onOpenTimeDialog={openTimeDialog}
                isLoadingHours={isLoadingHours}
              />
            ))}
          </div>
        )}

        {/* Footer hint */}
        {myProjects.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            Klik op een project om alle details te bekijken • Uren worden automatisch opgeslagen
          </p>
        )}
      </div>

      {/* Time Entry Dialog */}
      <Dialog 
        open={timeDialog.open} 
        onOpenChange={(open) => {
          if (!open) setTimeDialog({ open: false, lead: null, date: "", dayLabel: "" })
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
              <p className="text-sm font-medium">{timeDialog.lead?.clientName}</p>
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

            {/* Category */}
            <div className="space-y-2">
              <Label>Categorie</Label>
              <Select value={dialogCategory} onValueChange={(v) => setDialogCategory(v as TimeCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
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
              onClick={() => setTimeDialog({ open: false, lead: null, date: "", dayLabel: "" })}
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

/**
 * Project Card with inline hour registration
 */
function ProjectCard({
  project,
  remainingDays,
  projectHours,
  savingFor,
  onOpenProject,
  onOpenTimeDialog,
  isLoadingHours,
}: {
  project: Lead
  remainingDays: { date: string; dayIndex: number; label: string; isToday: boolean }[]
  projectHours: { [date: string]: number }
  savingFor: string | null
  onOpenProject: () => void
  onOpenTimeDialog: (lead: Lead, date: string, dayLabel: string) => void
  isLoadingHours: boolean
}) {
  // Total hours this week for this project
  const weekTotal = Object.values(projectHours).reduce((sum, mins) => sum + mins, 0)

  return (
    <Card 
      className={cn(
        "group transition-all duration-200 hover:shadow-md",
        "border-l-4",
        project.status === "Opdracht" ? "border-l-emerald-500" : "border-l-amber-500"
      )}
    >
      <CardContent className="p-4">
        {/* Project Header - Clickable */}
        <div 
          className="flex items-start justify-between gap-4 cursor-pointer"
          onClick={onOpenProject}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {project.werknummer && (
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5 shrink-0">
                  <Hash className="w-2.5 h-2.5 mr-0.5" />
                  {project.werknummer}
                </Badge>
              )}
              <h3 className="font-semibold truncate">{project.clientName}</h3>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {project.projectType}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {project.address ? `${project.address}, ${project.city}` : project.city}
              </span>
              {project.clientPhone && (
                <a 
                  href={`tel:${project.clientPhone}`}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-3.5 h-3.5" />
                  {project.clientPhone}
                </a>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {/* Week total for this project */}
            <div className="text-right">
              <p className="text-lg font-bold font-mono">
                {isLoadingHours ? "..." : formatMinutes(weekTotal)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">deze week</p>
            </div>
            
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        {/* Quick Add Hours Section */}
        {remainingDays.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Uren toevoegen:</span>
              
              <div className="flex-1 flex items-center gap-1.5 justify-end">
                {remainingDays.map((day) => {
                  const key = `${project.id}_${day.date}`
                  const isSaving = savingFor === key
                  const dayHours = projectHours[day.date] || 0
                  
                  return (
                    <Button
                      key={day.date}
                      variant={day.isToday ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 min-w-[52px] gap-1 text-xs font-medium transition-all",
                        day.isToday && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
                        dayHours > 0 && !day.isToday && "border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenTimeDialog(project, day.date, WEEKDAY_FULL[day.dayIndex])
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          {dayHours > 0 ? (
                            <span className="font-mono">{formatMinutes(dayHours)}</span>
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          <span>{day.label}</span>
                        </>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
