"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Phone,
    Mail,
    MessageSquare,
    Send,
    Plus,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    User,
    Settings,
    Filter
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Unified activity entry type
interface ActivityEntry {
    id: string
    type: "note" | "call" | "email" | "system"
    direction?: "inbound" | "outbound"
    subject?: string
    content: string
    timestamp: string
    user: string
    duration?: number // for calls, in seconds
}

// Mock data combining notes and communications
const mockActivities: ActivityEntry[] = [
    {
        id: "sys-1",
        type: "system",
        content: "Lead aangemaakt via website intake",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        user: "System"
    },
    {
        id: "note-1",
        type: "note",
        content: "Ik zie op de satellietfoto dat er al een uitbouw staat bij de buren, dus vergunning is waarschijnlijk makkelijk.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        user: "Angelo"
    },
    {
        id: "call-1",
        type: "call",
        direction: "outbound",
        content: "Klant gebeld over offerte. Besproken: dakkapel afmetingen 4m breed. Klant wil graag een bezoek op locatie.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        user: "Angelo",
        duration: 480
    },
    {
        id: "email-1",
        type: "email",
        direction: "outbound",
        subject: "Offerte Dakkapel - Bevestiging Afspraak",
        content: "Afspraakbevestiging verzonden voor locatiebezoek.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
        user: "Angelo"
    },
    {
        id: "call-2",
        type: "call",
        direction: "inbound",
        content: "Klant belt terug. Gaat akkoord met offerte inclusief bezoek.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        user: "Angelo",
        duration: 180
    },
    {
        id: "note-2",
        type: "note",
        content: "Telefoon gehad met klant - wil weten wanneer we kunnen beginnen. Heb gezegd binnen 2 weken na akkoord.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user: "Venka"
    },
    {
        id: "sys-2",
        type: "system",
        content: "Status gewijzigd naar Calculatie",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        user: "System"
    }
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

const authorColors: Record<string, string> = {
    "Angelo": "bg-blue-600",
    "Venka": "bg-purple-600",
    "Roina": "bg-emerald-600",
    "System": "bg-slate-500"
}

interface ActivityPanelProps {
    leadId: string
    clientPhone?: string
    clientEmail?: string
}

export function ActivityPanel({ leadId, clientPhone = "+31 6 12345678", clientEmail = "client@email.nl" }: ActivityPanelProps) {
    const [activities, setActivities] = useState<ActivityEntry[]>(mockActivities)
    const [newNote, setNewNote] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [filter, setFilter] = useState<"all" | "note" | "call" | "email">("all")
    const [newEntry, setNewEntry] = useState({
        type: "call" as "call" | "email",
        direction: "outbound" as "inbound" | "outbound",
        content: "",
        subject: ""
    })

    const filteredActivities = filter === "all"
        ? activities
        : activities.filter(a => a.type === filter)

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffHours < 1) return "Zojuist"
        if (diffHours < 24) return format(date, "HH:mm", { locale: nl })
        if (diffHours < 48) return `Gisteren, ${format(date, "HH:mm", { locale: nl })}`
        return format(date, "d MMM, HH:mm", { locale: nl })
    }

    const getIcon = (entry: ActivityEntry) => {
        switch (entry.type) {
            case "call":
                return entry.direction === "inbound"
                    ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    : <ArrowUpRight className="w-4 h-4 text-blue-600" />
            case "email":
                return <Mail className="w-4 h-4 text-purple-600" />
            case "note":
                return <MessageSquare className="w-4 h-4 text-amber-600" />
            case "system":
                return <Settings className="w-4 h-4 text-slate-500" />
        }
    }

    const getTypeBadge = (entry: ActivityEntry) => {
        switch (entry.type) {
            case "call":
                return (
                    <Badge className={cn(
                        "text-[10px] border-0",
                        entry.direction === "inbound"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    )}>
                        {entry.direction === "inbound" ? "Inkomend" : "Uitgaand"}
                    </Badge>
                )
            case "email":
                return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-0 text-[10px]">E-mail</Badge>
            case "note":
                return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0 text-[10px]">Notitie</Badge>
            case "system":
                return null
        }
    }

    const handleAddNote = () => {
        if (!newNote.trim()) return

        const entry: ActivityEntry = {
            id: `note-${Date.now()}`,
            type: "note",
            content: newNote,
            timestamp: new Date().toISOString(),
            user: "Angelo" // Mock current user
        }
        setActivities([entry, ...activities])
        setNewNote("")
        toast.success("Notitie toegevoegd")
    }

    const handleQuickCall = () => {
        const entry: ActivityEntry = {
            id: `call-${Date.now()}`,
            type: "call",
            direction: "outbound",
            content: "Gesprek gestart...",
            timestamp: new Date().toISOString(),
            user: "Angelo",
            duration: 0
        }
        setActivities([entry, ...activities])
        window.open(`tel:${clientPhone}`, '_self')
        toast.success("Gesprek geregistreerd", {
            description: `Bellen naar ${clientPhone}`
        })
    }

    const handleQuickEmail = () => {
        window.open(`mailto:${clientEmail}`, '_blank')
        toast.success("E-mail client geopend", {
            description: `Mailen naar ${clientEmail}`
        })
    }

    const handleAddEntry = () => {
        const entry: ActivityEntry = {
            id: `${newEntry.type}-${Date.now()}`,
            type: newEntry.type,
            direction: newEntry.direction,
            subject: newEntry.subject || undefined,
            content: newEntry.content,
            timestamp: new Date().toISOString(),
            user: "Angelo"
        }

        setActivities([entry, ...activities])
        setIsAddOpen(false)
        setNewEntry({ type: "call", direction: "outbound", content: "", subject: "" })
        toast.success("Activiteit gelogd")
    }

    return (
        <>
            <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
                {/* Header with Quick Actions */}
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                            Activiteit
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                                {activities.length}
                            </span>
                        </h3>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsAddOpen(true)}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2 h-8"
                            onClick={handleQuickCall}
                        >
                            <Phone className="w-3 h-3" />
                            Bellen
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2 h-8"
                            onClick={handleQuickEmail}
                        >
                            <Mail className="w-3 h-3" />
                            E-mail
                        </Button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 mt-3">
                        {[
                            { key: "all", label: "Alles" },
                            { key: "note", label: "Notities" },
                            { key: "call", label: "Gesprekken" },
                            { key: "email", label: "E-mails" }
                        ].map(f => (
                            <Button
                                key={f.key}
                                variant={filter === f.key ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => setFilter(f.key as typeof filter)}
                            >
                                {f.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
                    {filteredActivities.map((entry) => (
                        <div key={entry.id} className="group">
                            {entry.type === "system" ? (
                                // System message - centered divider style
                                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="px-2 italic flex items-center gap-1.5">
                                        <Settings className="w-3 h-3" />
                                        {entry.content}
                                    </span>
                                    <span className="text-muted-foreground/60">{formatTimestamp(entry.timestamp)}</span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>
                            ) : (
                                // User activity - conversation style
                                <div className="flex items-start gap-3 py-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm",
                                        authorColors[entry.user] || "bg-slate-600"
                                    )}>
                                        {entry.user[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-foreground">
                                                {entry.user}
                                            </span>
                                            {getTypeBadge(entry)}
                                            {entry.duration && (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {formatDuration(entry.duration)}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground ml-auto">
                                                {formatTimestamp(entry.timestamp)}
                                            </span>
                                        </div>

                                        {entry.subject && (
                                            <p className="font-medium text-sm text-foreground">{entry.subject}</p>
                                        )}

                                        <div className="text-sm text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/50 leading-relaxed">
                                            {entry.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredActivities.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Geen activiteiten gevonden</p>
                        </div>
                    )}
                </div>

                {/* Quick Note Input */}
                <div className="p-4 bg-muted/30 border-t border-border">
                    <div className="relative">
                        <Textarea
                            placeholder="Schrijf een notitie..."
                            className="min-h-[70px] pr-20 resize-none bg-background border-border"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.metaKey) {
                                    handleAddNote()
                                }
                            }}
                        />
                        <div className="absolute bottom-2 right-2">
                            <Button
                                size="sm"
                                className="h-8 gap-2"
                                onClick={handleAddNote}
                                disabled={!newNote.trim()}
                            >
                                <Send className="w-3 h-3" />
                                Verzend
                            </Button>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                        ⌘ + Enter om te verzenden
                    </p>
                </div>
            </div>

            {/* Add Call/Email Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Communicatie Loggen</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select
                                    value={newEntry.type}
                                    onValueChange={(v) => setNewEntry({ ...newEntry, type: v as "call" | "email" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="call">Telefoongesprek</SelectItem>
                                        <SelectItem value="email">E-mail</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Richting</label>
                                <Select
                                    value={newEntry.direction}
                                    onValueChange={(v) => setNewEntry({ ...newEntry, direction: v as "inbound" | "outbound" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="outbound">Uitgaand</SelectItem>
                                        <SelectItem value="inbound">Inkomend</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {newEntry.type === "email" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Onderwerp</label>
                                <Input
                                    placeholder="E-mail onderwerp..."
                                    value={newEntry.subject}
                                    onChange={(e) => setNewEntry({ ...newEntry, subject: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Inhoud / Notities</label>
                            <Textarea
                                placeholder="Beschrijf de communicatie..."
                                rows={4}
                                value={newEntry.content}
                                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                            Annuleren
                        </Button>
                        <Button onClick={handleAddEntry} disabled={!newEntry.content}>
                            Opslaan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
