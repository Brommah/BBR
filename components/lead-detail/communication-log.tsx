"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
    Phone, 
    Mail, 
    MessageSquare, 
    Plus,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    User,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CommunicationEntry {
    id: string
    type: "call" | "email" | "note"
    direction?: "inbound" | "outbound"
    subject?: string
    content: string
    timestamp: string
    user: string
    duration?: number // for calls, in seconds
}

const mockCommunications: CommunicationEntry[] = [
    {
        id: "1",
        type: "call",
        direction: "outbound",
        content: "Klant gebeld over offerte. Besproken: dakkapel afmetingen 4m breed. Klant wil graag een bezoek op locatie.",
        timestamp: "2026-01-12T14:30:00",
        user: "Angelo",
        duration: 480
    },
    {
        id: "2",
        type: "email",
        direction: "outbound",
        subject: "Offerte Dakkapel - J. de Vries",
        content: "Offerte verzonden met bezoek op locatie als optie.",
        timestamp: "2026-01-12T14:45:00",
        user: "Angelo"
    },
    {
        id: "3",
        type: "call",
        direction: "inbound",
        content: "Klant belt terug. Gaat akkoord met offerte inclusief bezoek.",
        timestamp: "2026-01-12T16:20:00",
        user: "Angelo",
        duration: 180
    },
    {
        id: "4",
        type: "note",
        content: "Afspraak gepland voor woensdag 15 jan. Adres: Keizersgracht 100",
        timestamp: "2026-01-12T16:25:00",
        user: "Angelo"
    }
]

interface CommunicationLogProps {
    leadId?: string
    clientPhone?: string
    clientEmail?: string
}

export function CommunicationLog({ clientPhone = "+31 6 12345678", clientEmail = "j.devries@email.nl" }: CommunicationLogProps) {
    const [entries, setEntries] = useState<CommunicationEntry[]>(mockCommunications)
    const [isExpanded, setIsExpanded] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newEntry, setNewEntry] = useState({
        type: "note" as "call" | "email" | "note",
        direction: "outbound" as "inbound" | "outbound",
        content: "",
        subject: ""
    })

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getIcon = (entry: CommunicationEntry) => {
        switch (entry.type) {
            case "call":
                return entry.direction === "inbound" 
                    ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    : <ArrowUpRight className="w-4 h-4 text-blue-500" />
            case "email":
                return <Mail className="w-4 h-4 text-purple-500" />
            case "note":
                return <MessageSquare className="w-4 h-4 text-amber-500" />
        }
    }

    const getTypeBadge = (entry: CommunicationEntry) => {
        switch (entry.type) {
            case "call":
                return (
                    <Badge className={`text-[10px] border-0 ${
                        entry.direction === "inbound" 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        {entry.direction === "inbound" ? "Inkomend" : "Uitgaand"} gesprek
                    </Badge>
                )
            case "email":
                return <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">E-mail</Badge>
            case "note":
                return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Notitie</Badge>
        }
    }

    const handleQuickCall = () => {
        // Add call entry
        const entry: CommunicationEntry = {
            id: Date.now().toString(),
            type: "call",
            direction: "outbound",
            content: "Gesprek gestart...",
            timestamp: new Date().toISOString(),
            user: "Angelo",
            duration: 0
        }
        setEntries([entry, ...entries])
        
        // Open phone dialer (on supported devices)
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
        const entry: CommunicationEntry = {
            id: Date.now().toString(),
            type: newEntry.type,
            direction: newEntry.type === "note" ? undefined : newEntry.direction,
            subject: newEntry.subject || undefined,
            content: newEntry.content,
            timestamp: new Date().toISOString(),
            user: "Angelo"
        }
        
        setEntries([entry, ...entries])
        setIsAddOpen(false)
        setNewEntry({ type: "note", direction: "outbound", content: "", subject: "" })
        
        toast.success("Communicatie gelogd")
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Phone className="w-4 h-4 text-emerald-600" />
                            Communicatielog
                            <Badge variant="outline" className="ml-1 text-[10px]">
                                {entries.length}
                            </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => setIsAddOpen(true)}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
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
                </CardHeader>

                {isExpanded && (
                    <CardContent className="space-y-2 pt-2">
                        <Separator />
                        
                        {/* Communication Timeline */}
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {entries.map((entry, index) => (
                                <div key={entry.id} className="flex gap-3">
                                    {/* Timeline Line */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            {getIcon(entry)}
                                        </div>
                                        {index < entries.length - 1 && (
                                            <div className="w-px h-full bg-slate-200 dark:bg-slate-700 my-1" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getTypeBadge(entry)}
                                            {entry.duration && (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {formatDuration(entry.duration)}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {entry.subject && (
                                            <p className="font-medium text-sm">{entry.subject}</p>
                                        )}
                                        
                                        <p className="text-sm text-muted-foreground">{entry.content}</p>
                                        
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(entry.timestamp), "d MMM HH:mm", { locale: nl })}
                                            <span>•</span>
                                            <User className="w-3 h-3" />
                                            {entry.user}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Add Communication Dialog */}
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
                                    onValueChange={(v) => setNewEntry({ ...newEntry, type: v as "call" | "email" | "note" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="call">Telefoongesprek</SelectItem>
                                        <SelectItem value="email">E-mail</SelectItem>
                                        <SelectItem value="note">Notitie</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {newEntry.type !== "note" && (
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
                            )}
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
