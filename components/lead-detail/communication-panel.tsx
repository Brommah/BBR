"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Phone,
    Mail,
    MessageSquare,
    Send,
    Plus,
    Loader2,
    AtSign,
    Paperclip,
    StickyNote,
    Trash2,
    SmilePlus,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useCurrentUser, useAllUsers } from "@/lib/auth"
import { getCommunications, createCommunication, addNote, getNotes, deleteNote, createMentionNotifications, toggleNoteReaction } from "@/lib/db-actions"
import { MentionInput, MentionText, extractMentions } from "@/components/ui/mention-input"

// WhatsApp-style emoji reactions
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

/** Unified entry type for both notes and communications */
interface CommunicationEntry {
    id: string
    type: "note" | "call" | "email" | "whatsapp"
    direction?: "inbound" | "outbound"
    subject?: string
    content: string
    timestamp: string
    author: string
    duration?: number // for calls, in seconds
    reactions?: Record<string, string[]> | null // emoji reactions (notes only)
}

/** Avatar color mapping for consistent engineer colors */
const authorColors: Record<string, string> = {
    "Angelo": "bg-blue-600",
    "Venka": "bg-purple-600",
    "Roina": "bg-emerald-600",
    "Cathleen Broersma": "bg-amber-600",
    "CF Broersma": "bg-teal-600",
    "Martijn Broersma": "bg-indigo-600",
    "Martijn": "bg-amber-600",
    "System": "bg-slate-500",
}

interface CommunicationPanelProps {
    leadId: string
    leadName?: string
    clientPhone?: string
    clientEmail?: string
}

/**
 * Unified Communication & Notes Panel
 * Combines notes (with @mentions) and communications (calls, emails, WhatsApp) in a single view.
 */
export function CommunicationPanel({ leadId, leadName, clientPhone, clientEmail }: CommunicationPanelProps) {
    const currentUser = useCurrentUser()
    const { users } = useAllUsers()
    const [communications, setCommunications] = useState<CommunicationEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [newNote, setNewNote] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [filter, setFilter] = useState<"all" | "note" | "call" | "email">("all")
    const [newEntry, setNewEntry] = useState({
        type: "call" as "call" | "email" | "whatsapp",
        direction: "outbound" as "inbound" | "outbound",
        content: "",
        subject: ""
    })
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
    const [reactionPickerOpen, setReactionPickerOpen] = useState<string | null>(null)
    const [isPendingReaction, startReactionTransition] = useTransition()

    // Check if current user is admin
    const isAdmin = currentUser?.role === 'admin'

    // Handle adding/removing a reaction on a note
    const handleReaction = async (noteId: string, emoji: string) => {
        if (!currentUser?.name) return
        
        // Optimistic update
        setCommunications(prevComms => prevComms.map(entry => {
            if (entry.id !== noteId || entry.type !== 'note') return entry
            
            const reactions = { ...(entry.reactions || {}) }
            const currentReactors = reactions[emoji] || []
            const hasReacted = currentReactors.includes(currentUser.name)
            
            if (hasReacted) {
                reactions[emoji] = currentReactors.filter(name => name !== currentUser.name)
                if (reactions[emoji].length === 0) {
                    delete reactions[emoji]
                }
            } else {
                reactions[emoji] = [...currentReactors, currentUser.name]
            }
            
            return { 
                ...entry, 
                reactions: Object.keys(reactions).length > 0 ? reactions : null 
            }
        }))
        
        setReactionPickerOpen(null)
        
        // Server update
        startReactionTransition(async () => {
            const result = await toggleNoteReaction(noteId, emoji, currentUser.name)
            if (!result.success) {
                // Revert on error - reload communications
                toast.error("Kon reactie niet opslaan")
                const [commsResult, notesResult] = await Promise.all([
                    getCommunications(leadId),
                    getNotes(leadId)
                ])
                // Rebuild communications list
                const comms: CommunicationEntry[] = []
                if (commsResult.success && commsResult.data) {
                    const commsData = commsResult.data as Array<{
                        id: string; type: string; direction: string; subject?: string;
                        content: string; createdAt: string; author: string; duration?: number
                    }>
                    comms.push(...commsData.map(c => ({
                        id: c.id, type: c.type as "call" | "email" | "whatsapp",
                        direction: c.direction as "inbound" | "outbound", subject: c.subject,
                        content: c.content, timestamp: c.createdAt, author: c.author, duration: c.duration
                    })))
                }
                if (notesResult.success && notesResult.data) {
                    const notesData = notesResult.data as Array<{
                        id: string; content: string; author: string; createdAt: string;
                        reactions?: Record<string, string[]> | null
                    }>
                    comms.push(...notesData.map(n => ({
                        id: n.id, type: "note" as const, content: n.content,
                        timestamp: n.createdAt, author: n.author, reactions: n.reactions
                    })))
                }
                comms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                setCommunications(comms)
            }
        })
    }

    // Format users for mention input (including avatars)
    const mentionableUsers = useMemo(() => 
        users.map(u => ({ id: u.id, name: u.name, role: u.role, avatar: u.avatar })),
        [users]
    )

    // Load communications and notes from database
    useEffect(() => {
        let isMounted = true

        async function loadCommunications() {
            if (!leadId) return
            setIsLoading(true)

            try {
                // Load both communications and notes in parallel
                const [commsResult, notesResult] = await Promise.all([
                    getCommunications(leadId),
                    getNotes(leadId)
                ])

                if (isMounted) {
                    const comms: CommunicationEntry[] = []
                    
                    // Add communications
                    if (commsResult.success && commsResult.data) {
                        const commsData = commsResult.data as Array<{
                            id: string
                            type: string
                            direction: string
                            subject?: string
                            content: string
                            createdAt: string
                            author: string
                            duration?: number
                        }>
                        comms.push(...commsData.map(c => ({
                            id: c.id,
                            type: c.type as "call" | "email" | "whatsapp",
                            direction: c.direction as "inbound" | "outbound",
                            subject: c.subject,
                            content: c.content,
                            timestamp: c.createdAt,
                            author: c.author,
                            duration: c.duration
                        })))
                    }
                    
                    // Add notes (with reactions)
                    if (notesResult.success && notesResult.data) {
                        const notesData = notesResult.data as Array<{
                            id: string
                            content: string
                            author: string
                            createdAt: string
                            reactions?: Record<string, string[]> | null
                        }>
                        comms.push(...notesData.map(n => ({
                            id: n.id,
                            type: "note" as const,
                            content: n.content,
                            timestamp: n.createdAt,
                            author: n.author,
                            reactions: n.reactions
                        })))
                    }

                    // Sort by timestamp descending (newest first)
                    comms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    setCommunications(comms)
                }
            } catch (error) {
                console.error('[CommunicationPanel] Failed to load:', error)
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

    const filteredCommunications = filter === "all"
        ? communications
        : communications.filter(c => c.type === filter)

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

    const getTypeBadge = (entry: CommunicationEntry) => {
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
            case "whatsapp":
                return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-0 text-[10px]">WhatsApp</Badge>
            case "note":
                return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0 text-[10px]">Notitie</Badge>
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "call": return <Phone className="w-3 h-3" />
            case "email": return <Mail className="w-3 h-3" />
            case "whatsapp": return <MessageSquare className="w-3 h-3" />
            case "note": return <StickyNote className="w-3 h-3" />
            default: return <MessageSquare className="w-3 h-3" />
        }
    }

    /** Handle adding a new note with @mention support */
    const handleAddNote = async () => {
        if (!newNote.trim() || !currentUser) return
        setIsSaving(true)

        try {
            const result = await addNote(leadId, newNote, currentUser.name)

            if (result.success && result.data) {
                const entry: CommunicationEntry = {
                    id: (result.data as { id: string }).id || `note-${Date.now()}`,
                    type: "note",
                    content: newNote,
                    timestamp: new Date().toISOString(),
                    author: currentUser.name
                }
                setCommunications([entry, ...communications])
                
                // Check for mentions and create real notifications
                const mentions = extractMentions(newNote)
                if (mentions.length > 0 && users.length > 0) {
                    const notifResult = await createMentionNotifications(
                        newNote,
                        leadId,
                        leadName || 'Project',
                        currentUser.name,
                        users.map(u => ({ id: u.id, name: u.name }))
                    )
                    
                    if (notifResult.success) {
                        const count = (notifResult.data as { notificationsCreated: number })?.notificationsCreated || 0
                        if (count > 0) {
                            toast.success("Notitie toegevoegd", {
                                description: `${count} melding${count !== 1 ? 'en' : ''} verzonden.`
                            })
                        } else {
                            toast.success("Notitie toegevoegd")
                        }
                    } else {
                        toast.success("Notitie toegevoegd")
                    }
                } else {
                    toast.success("Notitie toegevoegd")
                }
                
                setNewNote("")
            } else {
                toast.error("Kon notitie niet opslaan")
            }
        } catch (error) {
            console.error('[CommunicationPanel] Failed to add note:', error)
            toast.error("Fout bij opslaan notitie")
        } finally {
            setIsSaving(false)
        }
    }

    /** Handle deleting a note (admin only) */
    const handleDeleteNote = async (noteId: string) => {
        if (!currentUser || !isAdmin) return
        
        setDeletingNoteId(noteId)
        try {
            const result = await deleteNote(noteId, currentUser.name)
            
            if (result.success) {
                setCommunications(prev => prev.filter(c => c.id !== noteId))
                toast.success("Notitie verwijderd")
            } else {
                toast.error(result.error || "Kon notitie niet verwijderen")
            }
        } catch (error) {
            console.error('[CommunicationPanel] Failed to delete note:', error)
            toast.error("Fout bij verwijderen notitie")
        } finally {
            setDeletingNoteId(null)
        }
    }

    /** Handle adding a communication entry (call/email/whatsapp) */
    const handleAddEntry = async () => {
        if (!currentUser) return
        setIsSaving(true)

        try {
            const result = await createCommunication({
                leadId,
                type: newEntry.type,
                direction: newEntry.direction,
                subject: newEntry.subject || undefined,
                content: newEntry.content,
                author: currentUser.name
            })

            if (result.success) {
                const entry: CommunicationEntry = {
                    id: `${newEntry.type}-${Date.now()}`,
                    type: newEntry.type,
                    direction: newEntry.direction,
                    subject: newEntry.subject || undefined,
                    content: newEntry.content,
                    timestamp: new Date().toISOString(),
                    author: currentUser.name
                }

                setCommunications([entry, ...communications])
                setIsAddOpen(false)
                setNewEntry({ type: "call", direction: "outbound", content: "", subject: "" })
                toast.success("Communicatie gelogd")
            } else {
                toast.error("Kon communicatie niet opslaan")
            }
        } catch (error) {
            console.error('[CommunicationPanel] Failed to add entry:', error)
            toast.error("Fout bij opslaan")
        } finally {
            setIsSaving(false)
        }
    }

    // Count items per type for badges
    const noteCount = communications.filter(c => c.type === 'note').length
    const emailCount = communications.filter(c => c.type === 'email' || c.type === 'whatsapp').length

    if (isLoading) {
        return (
            <Card className="flex-1 min-h-0 flex flex-col">
                <CardHeader className="pb-3">
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <div className="flex gap-2">
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 flex-1" />
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="flex-1 min-h-0 flex flex-col">
                <CardHeader className="pb-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Communicatie & Notities
                            <Badge variant="secondary" className="text-xs">
                                {communications.length}
                            </Badge>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setIsAddOpen(true)}
                            title="Gesprek of e-mail loggen"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 mt-2">
                        {[
                            { key: "all", label: "Alles", count: communications.length },
                            { key: "note", label: "Notities", count: noteCount },
                            { key: "email", label: "E-mails", count: emailCount }
                        ].map(f => (
                            <Button
                                key={f.key}
                                variant={filter === f.key ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 text-xs px-2 gap-1"
                                onClick={() => setFilter(f.key as typeof filter)}
                            >
                                {f.label}
                                {f.count > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        ({f.count})
                                    </span>
                                )}
                            </Button>
                        ))}
                    </div>
                </CardHeader>

                {/* Communication & Notes List */}
                <ScrollArea className="flex-1 min-h-0">
                    <CardContent className="pt-0 space-y-1">
                        {filteredCommunications.map((entry) => {
                            // Find user's avatar from users list
                            const authorUser = users.find(u => u.name === entry.author)
                            const authorAvatar = authorUser?.avatar
                            // Check if this is a system/automated entry
                            const isSystemEntry = ['Systeem', 'System', 'Website Intake', 'Receptie', 'Admin', 'Broersma Bouwadvies'].some(
                                s => entry.author.toLowerCase().includes(s.toLowerCase())
                            )
                            
                            return (
                            <div key={entry.id} className="flex items-start gap-3 py-2">
                                <Avatar className="w-8 h-8 flex-shrink-0 shadow-sm">
                                    {isSystemEntry ? (
                                        <AvatarImage src="/branding/logo-white-gold.png" alt={entry.author} className="object-cover bg-slate-700 p-1" />
                                    ) : authorAvatar ? (
                                        <AvatarImage src={authorAvatar} alt={entry.author} />
                                    ) : null}
                                    <AvatarFallback className={cn(
                                        "text-white text-xs font-bold",
                                        isSystemEntry ? "bg-slate-700" : (authorColors[entry.author] || "bg-slate-600")
                                    )}>
                                        {isSystemEntry ? "BB" : entry.author[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-foreground">
                                            {entry.author}
                                        </span>
                                        {getTypeBadge(entry)}
                                        {entry.duration != null && entry.duration > 0 && (
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {formatDuration(entry.duration)}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground ml-auto">
                                            {formatTimestamp(entry.timestamp)}
                                        </span>
                                        {/* Delete button - admin only, notes only */}
                                        {isAdmin && entry.type === 'note' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteNote(entry.id)}
                                                disabled={deletingNoteId === entry.id}
                                                title="Notitie verwijderen"
                                            >
                                                {deletingNoteId === entry.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3 h-3" />
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    {entry.subject && (
                                        <p className="font-medium text-sm text-foreground">{entry.subject}</p>
                                    )}

                                    <div className="relative group/note">
                                        <div className="text-sm text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/50 leading-relaxed">
                                            {entry.type === 'note' ? (
                                                <MentionText text={entry.content} />
                                            ) : (
                                                entry.content
                                            )}
                                        </div>
                                        
                                        {/* Reaction button - notes only, appears on hover */}
                                        {entry.type === 'note' && (
                                            <Popover 
                                                open={reactionPickerOpen === entry.id} 
                                                onOpenChange={(open) => setReactionPickerOpen(open ? entry.id : null)}
                                            >
                                                <PopoverTrigger asChild>
                                                    <button
                                                        className={cn(
                                                            "absolute -right-1 -top-1 p-1 rounded-full bg-background border border-border shadow-sm transition-all duration-200",
                                                            "opacity-0 group-hover/note:opacity-100 hover:scale-110 hover:bg-muted",
                                                            reactionPickerOpen === entry.id && "opacity-100"
                                                        )}
                                                        title="Reageer met emoji"
                                                    >
                                                        <SmilePlus className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent 
                                                    className="w-auto p-2" 
                                                    side="top" 
                                                    align="end"
                                                    sideOffset={8}
                                                >
                                                    <div className="flex gap-1">
                                                        {REACTION_EMOJIS.map((emoji) => {
                                                            const hasReacted = entry.reactions?.[emoji]?.includes(currentUser?.name || '')
                                                            return (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => handleReaction(entry.id, emoji)}
                                                                    className={cn(
                                                                        "p-2 text-xl rounded-lg transition-all hover:scale-125 hover:bg-muted",
                                                                        hasReacted && "bg-primary/10"
                                                                    )}
                                                                    disabled={isPendingReaction}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                        
                                        {/* Display existing reactions */}
                                        {entry.type === 'note' && entry.reactions && Object.keys(entry.reactions).length > 0 && (
                                            <TooltipProvider delayDuration={200}>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {Object.entries(entry.reactions).map(([emoji, reactors]) => {
                                                        const hasReacted = reactors.includes(currentUser?.name || '')
                                                        return (
                                                            <Tooltip key={emoji}>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => handleReaction(entry.id, emoji)}
                                                                        className={cn(
                                                                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-all",
                                                                            "border hover:scale-105",
                                                                            hasReacted 
                                                                                ? "bg-primary/10 border-primary/30 text-primary"
                                                                                : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                                                                        )}
                                                                        disabled={isPendingReaction}
                                                                    >
                                                                        <span className="text-xs">{emoji}</span>
                                                                        <span>{reactors.length}</span>
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="bottom" className="max-w-[200px]">
                                                                    <p className="text-xs">
                                                                        {reactors.join(', ')}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )
                                                    })}
                                                </div>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )})}

                        {filteredCommunications.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Geen {filter === 'all' ? 'communicatie' : filter === 'note' ? 'notities' : filter === 'call' ? 'gesprekken' : 'e-mails'} gevonden</p>
                                <p className="text-xs mt-1">Voeg een notitie toe hieronder of log een gesprek</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>

                {/* Quick Note Input with @mention support */}
                <div className="p-4 bg-muted/30 border-t border-border shrink-0">
                    <div className="relative">
                        <MentionInput
                            value={newNote}
                            onChange={setNewNote}
                            users={mentionableUsers}
                            placeholder="Schrijf een notitie... (type @ om iemand te vermelden)"
                            disabled={isSaving}
                            className="min-h-[80px] pr-24 resize-none bg-background border-border"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.metaKey) {
                                    handleAddNote()
                                }
                            }}
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2">
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="Bijlage toevoegen"
                            >
                                <Paperclip className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 gap-1"
                                onClick={handleAddNote}
                                disabled={!newNote.trim() || isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Send className="w-3 h-3" />
                                )}
                                Verzend
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span className="font-medium">⌘ + Enter verzenden</span>
                        <span className="flex items-center gap-1">
                            <AtSign className="w-3 h-3" />
                            om teamlid te vermelden
                        </span>
                    </div>
                </div>
            </Card>

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
                        <Button onClick={handleAddEntry} disabled={!newEntry.content || isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Opslaan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
