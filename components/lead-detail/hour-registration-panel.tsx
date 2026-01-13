"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Play,
  Pause,
  Clock,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Euro,
  Timer,
  FileText,
  Trash2,
  Edit2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/** Time entry stored in state */
interface TimeEntry {
  id: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  duration: number // in minutes
  description: string
  category: TimeCategory
  user: string
}

type TimeCategory = "calculatie" | "overleg" | "administratie" | "site-bezoek" | "overig"

const CATEGORY_CONFIG: Record<TimeCategory, { label: string; color: string }> = {
  calculatie: { label: "Calculatie", color: "bg-blue-500" },
  overleg: { label: "Overleg", color: "bg-purple-500" },
  administratie: { label: "Administratie", color: "bg-amber-500" },
  "site-bezoek": { label: "Site bezoek", color: "bg-emerald-500" },
  overig: { label: "Overig", color: "bg-slate-500" },
}

interface HourRegistrationPanelProps {
  leadId: string
  hourlyRate?: number
}

export function HourRegistrationPanel({
  leadId,
  hourlyRate = 85,
}: HourRegistrationPanelProps) {
  // Timer state
  const [isTracking, setIsTracking] = useState(false)
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Modal state for new entry
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    description: "",
    category: "calculatie" as TimeCategory,
  })

  // Time entries (local state - would be persisted to DB in future)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTracking && currentSessionStart) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = Math.floor(
          (now.getTime() - currentSessionStart.getTime()) / 1000
        )
        setElapsedSeconds(diff)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, currentSessionStart])

  // Formatters
  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}u ${mins}m`
    }
    return `${mins}m`
  }, [])

  const formatTimerDisplay = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Timer controls
  const startTracking = () => {
    setIsTracking(true)
    setCurrentSessionStart(new Date())
    setElapsedSeconds(0)
    toast.success("Timer gestart")
  }

  const stopTracking = () => {
    if (!currentSessionStart) return

    const now = new Date()
    const durationMinutes = Math.round(
      (now.getTime() - currentSessionStart.getTime()) / 60000
    )

    if (durationMinutes < 1) {
      toast.error("Sessie te kort om op te slaan")
      setIsTracking(false)
      setCurrentSessionStart(null)
      setElapsedSeconds(0)
      return
    }

    const startTimeStr = currentSessionStart.toTimeString().slice(0, 5)
    const endTimeStr = now.toTimeString().slice(0, 5)

    const entry: TimeEntry = {
      id: Date.now().toString(),
      date: currentSessionStart.toISOString().split("T")[0],
      startTime: startTimeStr,
      endTime: endTimeStr,
      duration: durationMinutes,
      description: "Timer sessie",
      category: "calculatie",
      user: "Angelo",
    }

    setTimeEntries([entry, ...timeEntries])
    setIsTracking(false)
    setCurrentSessionStart(null)
    setElapsedSeconds(0)
    toast.success(`${formatDuration(durationMinutes)} opgeslagen`)
  }

  // Manual entry
  const handleAddEntry = () => {
    const [startH, startM] = newEntry.startTime.split(":").map(Number)
    const [endH, endM] = newEntry.endTime.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const duration = endMinutes - startMinutes

    if (duration <= 0) {
      toast.error("Eindtijd moet na starttijd liggen")
      return
    }

    const entry: TimeEntry = {
      id: Date.now().toString(),
      date: newEntry.date,
      startTime: newEntry.startTime,
      endTime: newEntry.endTime,
      duration,
      description: newEntry.description || "Werkzaamheden",
      category: newEntry.category,
      user: "Angelo",
    }

    setTimeEntries([entry, ...timeEntries].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.startTime.localeCompare(a.startTime)
    }))
    setIsAddModalOpen(false)
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      description: "",
      category: "calculatie",
    })
    toast.success("Uren geregistreerd")
  }

  const handleDeleteEntry = (id: string) => {
    setTimeEntries(timeEntries.filter((e) => e.id !== id))
    toast.success("Registratie verwijderd")
  }

  // Calendar logic
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = (firstDay.getDay() + 6) % 7 // Monday = 0

    const days: { date: string; isCurrentMonth: boolean; hasEntries: boolean; totalMinutes: number }[] = []

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      const dateStr = date.toISOString().split("T")[0]
      const dayEntries = timeEntries.filter((e) => e.date === dateStr)
      days.push({
        date: dateStr,
        isCurrentMonth: false,
        hasEntries: dayEntries.length > 0,
        totalMinutes: dayEntries.reduce((sum, e) => sum + e.duration, 0),
      })
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      const dateStr = date.toISOString().split("T")[0]
      const dayEntries = timeEntries.filter((e) => e.date === dateStr)
      days.push({
        date: dateStr,
        isCurrentMonth: true,
        hasEntries: dayEntries.length > 0,
        totalMinutes: dayEntries.reduce((sum, e) => sum + e.duration, 0),
      })
    }

    // Next month padding to complete the grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      const dateStr = date.toISOString().split("T")[0]
      const dayEntries = timeEntries.filter((e) => e.date === dateStr)
      days.push({
        date: dateStr,
        isCurrentMonth: false,
        hasEntries: dayEntries.length > 0,
        totalMinutes: dayEntries.reduce((sum, e) => sum + e.duration, 0),
      })
    }

    return days
  }, [currentMonth, timeEntries])

  // Stats
  const totalMinutes = timeEntries.reduce((sum, e) => sum + e.duration, 0) + (isTracking ? Math.floor(elapsedSeconds / 60) : 0)
  const totalHours = totalMinutes / 60
  const estimatedCost = totalHours * hourlyRate

  // Get entries for selected date
  const selectedDateEntries = selectedDate
    ? timeEntries.filter((e) => e.date === selectedDate)
    : []

  // This week's entries
  const thisWeekEntries = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    startOfWeek.setHours(0, 0, 0, 0)

    return timeEntries.filter((e) => new Date(e.date) >= startOfWeek)
  }, [timeEntries])

  const thisWeekMinutes = thisWeekEntries.reduce((sum, e) => sum + e.duration, 0)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split("T")[0]
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Quick Timer */}
      <Card className="shrink-0">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  isTracking
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-muted"
                )}
              >
                <Timer
                  className={cn(
                    "w-6 h-6",
                    isTracking
                      ? "text-emerald-600 animate-pulse"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold tracking-tight">
                  {formatTimerDisplay(elapsedSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isTracking ? "Timer actief" : "Klaar om te starten"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isTracking ? (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={stopTracking}
                  className="gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Stop
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={startTracking}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Play className="w-4 h-4" />
                  Start
                </Button>
              )}
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Handmatig
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Uren registreren</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Datum</Label>
                        <Input
                          type="date"
                          value={newEntry.date}
                          onChange={(e) =>
                            setNewEntry({ ...newEntry, date: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Categorie</Label>
                        <Select
                          value={newEntry.category}
                          onValueChange={(v) =>
                            setNewEntry({
                              ...newEntry,
                              category: v as TimeCategory,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORY_CONFIG).map(
                              ([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={cn(
                                        "w-2 h-2 rounded-full",
                                        config.color
                                      )}
                                    />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Starttijd</Label>
                        <Input
                          type="time"
                          value={newEntry.startTime}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Eindtijd</Label>
                        <Input
                          type="time"
                          value={newEntry.endTime}
                          onChange={(e) =>
                            setNewEntry({ ...newEntry, endTime: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Omschrijving</Label>
                      <Textarea
                        placeholder="Wat heb je gedaan?"
                        value={newEntry.description}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Annuleren</Button>
                    </DialogClose>
                    <Button onClick={handleAddEntry}>Opslaan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Totaal project</p>
                <p className="text-lg font-bold font-mono">
                  {formatDuration(totalMinutes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deze week</p>
                <p className="text-lg font-bold font-mono">
                  {formatDuration(thisWeekMinutes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Euro className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kosten</p>
                <p className="text-lg font-bold">€{estimatedCost.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar + Entries */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Mini Calendar */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {currentMonth.toLocaleDateString("nl-NL", {
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1
                      )
                    )
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1
                      )
                    )
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] font-medium text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => (
                <button
                  key={day.date}
                  onClick={() =>
                    setSelectedDate(
                      day.date === selectedDate ? null : day.date
                    )
                  }
                  className={cn(
                    "aspect-square rounded-md text-xs font-medium transition-all relative",
                    "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50",
                    !day.isCurrentMonth && "text-muted-foreground/50",
                    isToday(day.date) &&
                      "ring-2 ring-primary ring-offset-1 ring-offset-background",
                    selectedDate === day.date && "bg-primary text-primary-foreground",
                    day.hasEntries && selectedDate !== day.date && "bg-blue-100 dark:bg-blue-900/30"
                  )}
                >
                  {new Date(day.date).getDate()}
                  {day.hasEntries && day.totalMinutes > 0 && (
                    <span
                      className={cn(
                        "absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-mono",
                        selectedDate === day.date
                          ? "text-primary-foreground/80"
                          : "text-blue-600"
                      )}
                    >
                      {Math.round(day.totalMinutes / 60)}u
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Entries List */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 shrink-0 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {selectedDate
                ? `Registraties ${formatDate(selectedDate)}`
                : "Alle registraties"}
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {(selectedDate ? selectedDateEntries : timeEntries).length ===
              0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Geen registraties</p>
                  {selectedDate && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setNewEntry({ ...newEntry, date: selectedDate })
                        setIsAddModalOpen(true)
                      }}
                    >
                      Uren toevoegen
                    </Button>
                  )}
                </div>
              ) : (
                (selectedDate ? selectedDateEntries : timeEntries).map(
                  (entry) => (
                    <div
                      key={entry.id}
                      className="group p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                CATEGORY_CONFIG[entry.category].color
                              )}
                            />
                            <span className="text-xs font-medium truncate">
                              {entry.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {!selectedDate && (
                              <>
                                <span>{formatDate(entry.date)}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className="font-mono">
                              {entry.startTime} - {entry.endTime}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4 px-1"
                            >
                              {CATEGORY_CONFIG[entry.category].label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono font-bold">
                            {formatDuration(entry.duration)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Footer with hourly rate */}
      <div className="shrink-0 text-center text-xs text-muted-foreground py-2 border-t">
        Uurtarief: €{hourlyRate}/uur • Lead: {leadId}
      </div>
    </div>
  )
}
