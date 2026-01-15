"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarX } from "lucide-react"
import { getLeads } from "@/lib/db-actions"

interface ProjectEvent {
    id: string
    date: Date
    title: string
    engineer: string
    type: "Deadline" | "Visit" | "Call"
}

export function ResourceCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [events, setEvents] = useState<ProjectEvent[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch leads and derive calendar events from them
    useEffect(() => {
        let isMounted = true

        async function loadEvents() {
            setIsLoading(true)
            try {
                const result = await getLeads()
                if (isMounted && result.success && result.data) {
                    // Derive events from leads
                    // In a full implementation, this would include:
                    // - Lead deadlines
                    // - Site visit appointments from communications/activities
                    // - Scheduled calls
                    // For now, we show leads in active status as deadlines
                    const leadsData = result.data as { data: Array<{
                        id: string
                        clientName: string
                        assignee?: string | null
                        status: string
                        createdAt: string
                    }> }
                    const leads = leadsData.data || []
                    
                    const derivedEvents: ProjectEvent[] = leads
                        .filter(lead => lead.status !== 'Archief' && lead.assignee)
                        .slice(0, 10) // Limit to 10 events
                        .map((lead, index) => {
                            // Spread events over the next 7 days based on creation
                            const eventDate = new Date()
                            eventDate.setDate(eventDate.getDate() + (index % 7))
                            
                            return {
                                id: lead.id,
                                date: eventDate,
                                title: `Lead: ${lead.clientName}`,
                                engineer: lead.assignee || 'Niet toegewezen',
                                type: 'Deadline' as const
                            }
                        })
                    
                    setEvents(derivedEvents)
                }
            } catch (error) {
                console.error('[ResourceCalendar] Failed to load events:', error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadEvents()

        return () => {
            isMounted = false
        }
    }, [])

    // Filter events for selected date
    const selectedDateEvents = events.filter(e => 
        date && e.date.toDateString() === date.toDateString()
    )

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Team Kalender</CardTitle>
                        <CardDescription>Laden...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Skeleton className="h-[280px] w-full" />
                    </CardContent>
                </Card>
                <Card className="col-span-4">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Team Kalender</CardTitle>
                    <CardDescription>Selecteer een datum om de planning te zien.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        modifiers={{
                            hasEvent: (d) => events.some(e => e.date.toDateString() === d.toDateString())
                        }}
                        modifiersStyles={{
                            hasEvent: { fontWeight: 'bold', textDecoration: 'underline decoration-primary' }
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Dagplanning: {date?.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                        {events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <CalendarX className="w-12 h-12 mb-4 opacity-50" />
                                <p className="text-sm font-medium">Geen afspraken beschikbaar</p>
                                <p className="text-xs mt-1">Kalender integratie komt binnenkort</p>
                            </div>
                        ) : selectedDateEvents.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">Geen afspraken gepland voor deze dag.</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedDateEvents.map(event => (
                                    <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className={`w-1 h-12 rounded-full ${
                                            event.type === 'Deadline' ? 'bg-red-500' : 
                                            event.type === 'Visit' ? 'bg-blue-500' : 'bg-yellow-500'
                                        }`} />
                                        
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold">{event.title}</h4>
                                                <Badge variant="outline" className="text-[10px]">{event.type}</Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Avatar className="w-5 h-5">
                                                    <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                                                        {event.engineer[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground">{event.engineer}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
