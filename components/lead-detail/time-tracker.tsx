"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, Pause, Clock, History, TrendingUp, Euro } from "lucide-react"
import { toast } from "sonner"

interface TimeEntry {
    id: string
    startTime: string
    endTime?: string
    duration: number // in seconds
    description: string
    user: string
}

interface TimeTrackerProps {
    leadId: string
    hourlyRate?: number
}

export function TimeTracker({ leadId, hourlyRate = 85 }: TimeTrackerProps) {
    const [isTracking, setIsTracking] = useState(false)
    const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
        {
            id: "1",
            startTime: "2026-01-12T09:30:00",
            endTime: "2026-01-12T10:15:00",
            duration: 2700,
            description: "Initiële analyse en BAG check",
            user: "Angelo"
        },
        {
            id: "2",
            startTime: "2026-01-12T14:00:00",
            endTime: "2026-01-12T14:45:00",
            duration: 2700,
            description: "Constructieberekening",
            user: "Angelo"
        }
    ])

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

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    const startTracking = () => {
        setIsTracking(true)
        setCurrentSessionStart(new Date())
        setElapsedTime(0)
        toast.success("Tijdregistratie gestart", {
            description: "De timer loopt nu."
        })
    }

    const stopTracking = () => {
        if (!currentSessionStart) return
        
        const now = new Date()
        const duration = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)
        
        const newEntry: TimeEntry = {
            id: Date.now().toString(),
            startTime: currentSessionStart.toISOString(),
            endTime: now.toISOString(),
            duration,
            description: "Werkzaamheden",
            user: "Angelo"
        }
        
        setTimeEntries([newEntry, ...timeEntries])
        setIsTracking(false)
        setCurrentSessionStart(null)
        setElapsedTime(0)
        
        toast.success("Tijdregistratie opgeslagen", {
            description: `${formatDuration(duration)} geregistreerd.`
        })
    }

    const totalTime = timeEntries.reduce((acc, entry) => acc + entry.duration, 0) + (isTracking ? elapsedTime : 0)
    const totalHours = totalTime / 3600
    const estimatedCost = totalHours * hourlyRate

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
                        >
                            <Pause className="w-3 h-3" />
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
                        <p className="text-lg font-bold font-mono">{formatDuration(totalTime)}</p>
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
                        {timeEntries.slice(0, 5).map((entry) => (
                            <div 
                                key={entry.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        {formatTime(entry.startTime)}
                                    </Badge>
                                    <span className="text-muted-foreground truncate max-w-[120px]">
                                        {entry.description}
                                    </span>
                                </div>
                                <span className="font-mono font-medium text-xs">
                                    {formatDuration(entry.duration)}
                                </span>
                            </div>
                        ))}
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
