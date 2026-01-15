"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
    ChevronUp,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCommunications, createCommunication } from "@/lib/db-actions"
import { useCurrentUser } from "@/lib/auth"

interface CommunicationEntry {
    id: string
    type: "call" | "email" | "whatsapp"
    direction: "inbound" | "outbound"
    subject?: string | null
    content: string
    createdAt: string
    author: string
    duration?: number | null // for calls, in seconds
}

interface CommunicationLogProps {
    leadId: string
    clientPhone?: string
    clientEmail?: string
}

export function CommunicationLog({ leadId, clientPhone, clientEmail }: CommunicationLogProps) {
    const [entries, setEntries] = useState<CommunicationEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const currentUser = useCurrentUser()

    // Fetch communications from database
    useEffect(() => {
        let isMounted = true

        async function loadCommunications() {
            if (!leadId) return
            setIsLoading(true)

            try {
                const result = await getCommunications(leadId)
                if (isMounted && result.success && result.data) {
                    setEntries(result.data as CommunicationEntry[])
                }
            } catch (error) {
                console.error('[CommunicationLog] Failed to load communications:', error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadCommunications()

        return () => {
            isMounted = false
        }
    }, [leadId])
    const [isExpanded, setIsExpanded] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newEntry, setNewEntry] = useState({
        type: "call" as "call" | "email" | "whatsapp",
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
            case "whatsapp":
                return <MessageSquare className="w-4 h-4 text-emerald-500" />
            default:
                return <MessageSquare className="w-4 h-4 text-slate-500" />
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
            case "whatsapp":
                return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">WhatsApp</Badge>
            default:
                return <Badge className="bg-slate-100 text-slate-700 border-0 text-[10px]">{entry.type}</Badge>
        }
    }

    const handleQuickCall = async () => {
        if (!leadId) return
        
        // Open phone dialer first (on supported devices)
        if (clientPhone) {
            window.open(`tel:${clientPhone}`, '_self')
        }
        
        // Create call entry in database
        try {
            const result = await createCommunication({
                leadId,
                type: "call",
                direction: "outbound",
                content: "Uitgaand gesprek gestart",
                author: currentUser?.name || "Onbekend"
            })
            
            if (result.success && result.data) {
                setEntries([result.data as CommunicationEntry, ...entries])
                toast.success("Gesprek geregistreerd", {
                    description: clientPhone ? `Bellen naar ${clientPhone}` : undefined
                })
            }
        } catch (error) {
            console.error('[CommunicationLog] Failed to log call:', error)
        }
    }

    const handleQuickEmail = () => {
        if (clientEmail) {
            window.open(`mailto:${clientEmail}`, '_blank')
            toast.success("E-mail client geopend", {
                description: `Mailen naar ${clientEmail}`
            })
        }
    }

    const handleAddEntry = async () => {
        if (!leadId || !newEntry.content.trim()) return
        
        setIsSaving(true)
        try {
            // Map 'note' type to 'whatsapp' since DB only has call/email/whatsapp
            const dbType = newEntry.type === "call" ? "call" : newEntry.type === "email" ? "email" : "whatsapp"
            
            const result = await createCommunication({
                leadId,
                type: dbType,
                direction: newEntry.direction,
                subject: newEntry.subject || undefined,
                content: newEntry.content,
                author: currentUser?.name || "Onbekend"
            })
            
            if (result.success && result.data) {
                setEntries([result.data as CommunicationEntry, ...entries])
                setIsAddOpen(false)
                setNewEntry({ type: "call", direction: "outbound", content: "", subject: "" })
                toast.success("Communicatie gelogd")
            } else {
                toast.error("Kon communicatie niet opslaan")
            }
        } catch (error) {
            console.error('[CommunicationLog] Failed to create communication:', error)
            toast.error("Fout bij opslaan")
        } finally {
            setIsSaving(false)
        }
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
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-3">
                                            <Skeleton className="w-8 h-8 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : entries.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    Geen communicatie gelogd
                                </div>
                            ) : (
                                entries.map((entry, index) => (
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
                                                {format(new Date(entry.createdAt), "d MMM HH:mm", { locale: nl })}
                                                <span>•</span>
                                                <User className="w-3 h-3" />
                                                {entry.author}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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
                                    onValueChange={(v) => setNewEntry({ ...newEntry, type: v as "call" | "email" | "whatsapp" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="call">Telefoongesprek</SelectItem>
                                        <SelectItem value="email">E-mail</SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {newEntry.type !== "whatsapp" && (
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, subject: e.target.value })}
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
                        <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSaving}>
                            Annuleren
                        </Button>
                        <Button onClick={handleAddEntry} disabled={!newEntry.content || isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Opslaan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
