"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ProjectEvent {
    id: string
    date: Date
    title: string
    engineer: string
    type: "Deadline" | "Visit" | "Call"
}

// Mock schedule data
const events: ProjectEvent[] = [
    { id: "1", date: new Date(), title: "Deadline: Fam. Bakker", engineer: "Venka", type: "Deadline" },
    { id: "2", date: new Date(), title: "Bezoek: Keizersgracht", engineer: "Angelo", type: "Visit" },
    { id: "3", date: new Date(new Date().setDate(new Date().getDate() + 2)), title: "Call: Gemeente A'dam", engineer: "Roina", type: "Call" },
    { id: "4", date: new Date(new Date().setDate(new Date().getDate() + 3)), title: "Deadline: Stichting 't Hof", engineer: "Venka", type: "Deadline" },
]

export function ResourceCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date())

    // Filter events for selected date
    const selectedDateEvents = events.filter(e => 
        date && e.date.toDateString() === date.toDateString()
    )

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
                            hasEvent: (date) => events.some(e => e.date.toDateString() === date.toDateString())
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
                        {selectedDateEvents.length === 0 ? (
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
