"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, Pause, Clock, History, Euro, TrendingUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getTimeEntries, createTimeEntry } from "@/lib/db-actions"
import { useCurrentUser } from "@/lib/auth"

interface TimeEntry {
    id: string
    date: string
    startTime: string
    endTime: string
    duration: number // in minutes
    description: string
    userName: string
    category: string
}

interface TimeTrackerProps {
    leadId: string
    hourlyRate?: number
}

export function TimeTracker({ leadId, hourlyRate = 85 }: TimeTrackerProps) {
    const [isTracking, setIsTracking] = useState(false)
    const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const currentUser = useCurrentUser()

    // Fetch time entries from database
    useEffect(() => {
        let isMounted = true

        async function loadTimeEntries() {
            if (!leadId) return
            setIsLoading(true)

            try {
                const result = await getTimeEntries(leadId)
                if (isMounted && result.success && result.data) {
                    setTimeEntries(result.data as TimeEntry[])
                }
            } catch (error) {
                console.error('[TimeTracker] Failed to load time entries:', error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadTimeEntries()

        return () => {
            isMounted = false
        }
    }, [leadId])

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        
        if (isTracking && currentSessionStart) {
            interval = setInterval(() => {
                const now = new Date()
                const diff = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)
                setElapsedTime(diff)
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isTracking, currentSessionStart])

    const formatDuration = useCallback((seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }, [])

    const startTracking = () => {
        setIsTracking(true)
        setCurrentSessionStart(new Date())
        setElapsedTime(0)
        toast.success("Tijdregistratie gestart", {
            description: "De timer loopt nu."
        })
    }

    const stopTracking = async () => {
        if (!currentSessionStart || !leadId || !currentUser) return
        
        const now = new Date()
        const durationSeconds = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)
        const durationMinutes = Math.ceil(durationSeconds / 60)
        
        setIsSaving(true)
        try {
            const startTimeStr = currentSessionStart.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
            const endTimeStr = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
            
            const result = await createTimeEntry({
                leadId,
                userId: currentUser.id,
                userName: currentUser.name,
                date: now.toISOString().split('T')[0],
                startTime: startTimeStr,
                endTime: endTimeStr,
                duration: durationMinutes,
                description: "Werkzaamheden",
                category: "calculatie"
            })

            if (result.success && result.data) {
                setTimeEntries([result.data as TimeEntry, ...timeEntries])
                toast.success("Tijdregistratie opgeslagen", {
                    description: `${formatDuration(durationSeconds)} geregistreerd.`
                })
            } else {
                toast.error("Kon tijd niet opslaan")
            }
        } catch (error) {
            console.error('[TimeTracker] Failed to save time entry:', error)
            toast.error("Fout bij opslaan tijdregistratie")
        } finally {
            setIsTracking(false)
            setCurrentSessionStart(null)
            setElapsedTime(0)
            setIsSaving(false)
        }
    }

    // Duration is stored in minutes, elapsedTime is in seconds
    const totalMinutes = timeEntries.reduce((acc, entry) => acc + entry.duration, 0)
    const totalSeconds = (totalMinutes * 60) + (isTracking ? elapsedTime : 0)
    const totalHours = totalSeconds / 3600
    const estimatedCost = totalHours * hourlyRate

    if (isLoading) {
        return (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Tijdregistratie
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Tijdregistratie
                    </div>
                    {isTracking ? (
                        <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={stopTracking}
                            className="gap-1 h-7"
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
                            Stop
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            onClick={startTracking}
                            className="gap-1 h-7 bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Play className="w-3 h-3" />
                            Start
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Timer */}
                {isTracking && (
                    <div className="text-center py-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 animate-pulse">
                        <p className="text-3xl font-mono font-bold text-emerald-600">
                            {formatDuration(elapsedTime)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Timer actief</p>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg text-center">
                        <History className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                        <p className="text-lg font-bold font-mono">{formatDuration(totalSeconds)}</p>
                        <p className="text-[10px] text-muted-foreground">Totaal</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg text-center">
                        <TrendingUp className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                        <p className="text-lg font-bold">{timeEntries.length + (isTracking ? 1 : 0)}</p>
                        <p className="text-[10px] text-muted-foreground">Sessies</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg text-center">
                        <Euro className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                        <p className="text-lg font-bold">€{estimatedCost.toFixed(0)}</p>
                        <p className="text-[10px] text-muted-foreground">Kosten</p>
                    </div>
                </div>

                <Separator />

                {/* Time Entries */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <History className="w-3 h-3" />
                        Recente registraties
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {timeEntries.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                                Nog geen uren geregistreerd
                            </div>
                        ) : (
                            timeEntries.slice(0, 5).map((entry) => (
                                <div 
                                    key={entry.id}
                                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                            {entry.startTime}
                                        </Badge>
                                        <span className="text-muted-foreground truncate max-w-[120px]">
                                            {entry.description}
                                        </span>
                                    </div>
                                    <span className="font-mono font-medium text-xs">
                                        {formatDuration(entry.duration * 60)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Hourly Rate Info */}
                <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                    Uurtarief: €{hourlyRate}/uur
                </div>
            </CardContent>
        </Card>
    )
}
