"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Clock,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Euro,
  FileText,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth"
import { createTimeEntry, getTimeEntries, deleteTimeEntry, updateTimeEntry, type TimeCategory } from "@/lib/db-actions"

/** Time entry from database */
interface TimeEntry {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  duration: number // in minutes
  description: string
  category: TimeCategory
  userName: string
}

const CATEGORY_CONFIG: Record<TimeCategory, { label: string; color: string; billable: boolean }> = {
  calculatie: { label: "Calculatie", color: "bg-blue-500", billable: true },
  overleg: { label: "Overleg", color: "bg-purple-500", billable: true },
  administratie: { label: "Administratie", color: "bg-amber-500", billable: false },
  "site-bezoek": { label: "Site bezoek", color: "bg-emerald-500", billable: true },
  overig: { label: "Overig", color: "bg-slate-500", billable: true },
  algemeen: { label: "Algemeen (non-billable)", color: "bg-rose-500", billable: false },
  prive: { label: "Privé (non-billable)", color: "bg-orange-500", billable: false },
}

// Project-level categories (excludes 'algemeen' which is only for personal tracker)
const PROJECT_CATEGORIES = Object.entries(CATEGORY_CONFIG).filter(([key]) => key !== 'algemeen')

interface HourRegistrationPanelProps {
  leadId: string
  hourlyRate?: number
}

export function HourRegistrationPanel({
  leadId,
  hourlyRate = 85,
}: HourRegistrationPanelProps) {
  const { currentUser } = useAuthStore()

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Helper to get local date string (fixes timezone issue)
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Modal state for new entry
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    date: getLocalDateString(),
    startTime: "09:00",
    endTime: "10:00",
    description: "",
    category: "calculatie" as TimeCategory,
  })

  // Modal state for editing entry
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [editEntry, setEditEntry] = useState({
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    category: "calculatie" as TimeCategory,
  })

  // Time entries from database
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load time entries from database
  // Engineers only see their own entries, admin/projectleider see all
  useEffect(() => {
    async function loadEntries() {
      if (!currentUser) return
      setIsLoading(true)
      const result = await getTimeEntries(leadId, {
        userId: currentUser.id,
        role: currentUser.role as 'admin' | 'projectleider' | 'engineer'
      })
      if (result.success && result.data) {
        setTimeEntries(result.data as TimeEntry[])
      }
      setIsLoading(false)
    }
    loadEntries()
  }, [leadId, currentUser])

  // Formatters
  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}u ${mins}m`
    }
    return `${mins}m`
  }, [])

  // Manual entry
  const handleAddEntry = async () => {
    if (!currentUser) {
      toast.error("Je moet ingelogd zijn")
      return
    }

    const [startH, startM] = newEntry.startTime.split(":").map(Number)
    const [endH, endM] = newEntry.endTime.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const duration = endMinutes - startMinutes

    if (duration <= 0) {
      toast.error("Eindtijd moet na starttijd liggen")
      return
    }

    setIsSaving(true)
    const result = await createTimeEntry({
      leadId,
      userId: currentUser.id,
      userName: currentUser.name,
      date: newEntry.date,
      startTime: newEntry.startTime,
      endTime: newEntry.endTime,
      duration,
      description: newEntry.description || "Werkzaamheden",
      category: newEntry.category,
    })

    if (result.success && result.data) {
      setTimeEntries([result.data as TimeEntry, ...timeEntries].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.startTime.localeCompare(a.startTime)
      }))
      toast.success("Uren geregistreerd")
    } else {
      toast.error("Kon uren niet opslaan")
    }

    setIsAddModalOpen(false)
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      description: "",
      category: "calculatie",
    })
    setIsSaving(false)
  }

  const handleDeleteEntry = async (id: string) => {
    const result = await deleteTimeEntry(id)
    if (result.success) {
      setTimeEntries(timeEntries.filter((e) => e.id !== id))
      toast.success("Registratie verwijderd")
    } else {
      toast.error("Kon registratie niet verwijderen")
    }
  }

  // Open edit modal
  const openEditModal = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setEditEntry({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      description: entry.description,
      category: entry.category,
    })
    setIsEditModalOpen(true)
  }

  // Handle edit entry
  const handleEditEntry = async () => {
    if (!editingEntry) return

    const [startH, startM] = editEntry.startTime.split(":").map(Number)
    const [endH, endM] = editEntry.endTime.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const duration = endMinutes - startMinutes

    if (duration <= 0) {
      toast.error("Eindtijd moet na starttijd liggen")
      return
    }

    setIsSaving(true)
    const result = await updateTimeEntry(editingEntry.id, {
      date: editEntry.date,
      startTime: editEntry.startTime,
      endTime: editEntry.endTime,
      duration,
      description: editEntry.description || "Werkzaamheden",
      category: editEntry.category,
    })

    if (result.success && result.data) {
      setTimeEntries(timeEntries.map((e) => 
        e.id === editingEntry.id ? (result.data as TimeEntry) : e
      ).sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.startTime.localeCompare(a.startTime)
      }))
      toast.success("Uren bijgewerkt")
    } else {
      toast.error("Kon uren niet bijwerken")
    }

    setIsEditModalOpen(false)
    setEditingEntry(null)
    setIsSaving(false)
  }

  // Calendar logic - using local dates to avoid timezone issues
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
      const dateStr = getLocalDateString(date)
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
      const dateStr = getLocalDateString(date)
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
      const dateStr = getLocalDateString(date)
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
  const totalMinutes = timeEntries.reduce((sum, e) => sum + e.duration, 0)
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
    return dateStr === getLocalDateString()
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-4">
        <Card className="shrink-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="py-3">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          <Card><CardContent className="p-4"><Skeleton className="h-full w-full" /></CardContent></Card>
          <Card><CardContent className="p-4"><Skeleton className="h-full w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Add Entry Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
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
                            {PROJECT_CATEGORIES.map(
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
                      <Button variant="outline" disabled={isSaving}>Annuleren</Button>
                    </DialogClose>
                    <Button onClick={handleAddEntry} disabled={isSaving}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Opslaan
                    </Button>
                  </DialogFooter>
                </DialogContent>
      </Dialog>

      {/* Edit Entry Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uren aanpassen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={editEntry.date}
                  onChange={(e) =>
                    setEditEntry({ ...editEntry, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select
                  value={editEntry.category}
                  onValueChange={(v) =>
                    setEditEntry({
                      ...editEntry,
                      category: v as TimeCategory,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map(
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
                  value={editEntry.startTime}
                  onChange={(e) =>
                    setEditEntry({
                      ...editEntry,
                      startTime: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Eindtijd</Label>
                <Input
                  type="time"
                  value={editEntry.endTime}
                  onChange={(e) =>
                    setEditEntry({ ...editEntry, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Omschrijving</Label>
              <Textarea
                placeholder="Wat heb je gedaan?"
                value={editEntry.description}
                onChange={(e) =>
                  setEditEntry({
                    ...editEntry,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSaving}>Annuleren</Button>
            </DialogClose>
            <Button onClick={handleEditEntry} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Bijwerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Row */}
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-3 shrink-0">
        <Button
          size="lg"
          className="h-auto py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setIsAddModalOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium opacity-90">Nieuw</p>
              <p className="text-base font-bold">Uren toevoegen</p>
            </div>
          </div>
        </Button>
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
        {/* Cost card - only visible for admin/projectleider, not engineers */}
        {currentUser?.role !== 'engineer' && (
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
        )}
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
              {calendarDays.map((day) => {
                const dayNum = parseInt(day.date.split('-')[2], 10)
                const hoursWorked = day.totalMinutes / 60
                return (
                  <button
                    key={day.date}
                    onClick={() =>
                      setSelectedDate(
                        day.date === selectedDate ? null : day.date
                      )
                    }
                    className={cn(
                      "aspect-square rounded-md text-xs font-medium transition-all relative flex flex-col items-center justify-center",
                      "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50",
                      !day.isCurrentMonth && "text-muted-foreground/50",
                      isToday(day.date) &&
                        "ring-2 ring-primary ring-offset-1 ring-offset-background",
                      selectedDate === day.date && "bg-primary text-primary-foreground",
                      // More prominent styling for worked days
                      day.hasEntries && selectedDate !== day.date && hoursWorked >= 4 && "bg-emerald-200 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100 font-bold",
                      day.hasEntries && selectedDate !== day.date && hoursWorked >= 1 && hoursWorked < 4 && "bg-blue-200 dark:bg-blue-800/50 text-blue-900 dark:text-blue-100 font-semibold",
                      day.hasEntries && selectedDate !== day.date && hoursWorked < 1 && "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    )}
                  >
                    <span>{dayNum}</span>
                    {day.hasEntries && day.totalMinutes > 0 && (
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold leading-none",
                          selectedDate === day.date
                            ? "text-primary-foreground/80"
                            : hoursWorked >= 4 
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-blue-700 dark:text-blue-300"
                        )}
                      >
                        {hoursWorked >= 1 ? `${hoursWorked.toFixed(1)}u` : `${day.totalMinutes}m`}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time Entries List */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 shrink-0 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {selectedDate
                  ? `Registraties ${formatDate(selectedDate)}`
                  : "Alle registraties"}
              </CardTitle>
              {selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => {
                    setNewEntry({ ...newEntry, date: selectedDate })
                    setIsAddModalOpen(true)
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Toevoegen
                </Button>
              )}
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {(selectedDate ? selectedDateEntries : timeEntries).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Geen registraties</p>
                  {selectedDate && (
                    <p className="text-xs mt-1">Klik op &apos;Toevoegen&apos; om uren te registreren</p>
                  )}
                </div>
              ) : (
                <>
                  {(selectedDate ? selectedDateEntries : timeEntries).map(
                    (entry) => {
                      const isOwnEntry = entry.userId === currentUser?.id
                      const canEdit = currentUser?.role !== 'engineer' || isOwnEntry
                      
                      return (
                        <div
                          key={entry.id}
                          className="group p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Left: Category dot + Description */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={cn(
                                  "w-3 h-3 rounded-full shrink-0",
                                  CATEGORY_CONFIG[entry.category].color
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold truncate">
                                    {entry.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                                  {/* Show who submitted for admin/projectleider */}
                                  {currentUser?.role !== 'engineer' && (
                                    <Badge className="text-[10px] h-5 px-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                                      {entry.userName}
                                    </Badge>
                                  )}
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
                                    className="text-[10px] h-4 px-1.5"
                                  >
                                    {CATEGORY_CONFIG[entry.category].label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {/* Right: Duration + Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-base font-mono font-bold text-primary">
                                {formatDuration(entry.duration)}
                              </span>
                              {canEdit && (
                                <div className="flex items-center border-l pl-2 ml-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openEditModal(entry)}
                                    title="Bewerken"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    title="Verwijderen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }
                  )}
                  
                  {/* Summary for selected date */}
                  {selectedDate && selectedDateEntries.length > 0 && (
                    <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Totaal {formatDate(selectedDate)}</span>
                      <span className="font-mono font-bold text-primary">
                        {formatDuration(selectedDateEntries.reduce((sum, e) => sum + e.duration, 0))}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Footer with hourly rate - only show rate for admin/projectleider */}
      <div className="shrink-0 text-center text-xs text-muted-foreground py-2 border-t">
        {currentUser?.role !== 'engineer' ? `Uurtarief: €${hourlyRate}/uur • ` : ''}Lead: {leadId.slice(0, 8)}...
      </div>
    </div>
  )
}
