"use client"

import { Button } from "@/components/ui/button"
import { Send, Loader2, AtSign, Paperclip } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { getNotes, addNote, createMentionNotifications } from "@/lib/db-actions"
import { useCurrentUser, useAllUsers } from "@/lib/auth"
import { toast } from "sonner"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { MentionInput, MentionText, extractMentions } from "@/components/ui/mention-input"

interface Note {
    id: string
    author: string
    content: string
    createdAt: string
    isSystem?: boolean
}

interface NotesPanelProps {
    leadId: string
    leadName?: string
}

/** Avatar color mapping for consistent engineer colors */
const authorColors: Record<string, string> = {
    "Angelo": "bg-blue-600",
    "Venka": "bg-purple-600",
    "Roina": "bg-emerald-600",
    "Cathleen Broersma": "bg-amber-600",
    "CF Broersma": "bg-teal-600",
    "Martijn Broersma": "bg-indigo-600",
    "System": "bg-slate-500"
}

export function NotesPanel({ leadId, leadName }: NotesPanelProps) {
    const [notes, setNotes] = useState<Note[]>([])
    const [newNote, setNewNote] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const currentUser = useCurrentUser()
    const { users } = useAllUsers()

    // Format users for mention input (including avatars)
    const mentionableUsers = useMemo(() => 
        users.map(u => ({ id: u.id, name: u.name, role: u.role, avatar: u.avatar })),
        [users]
    )

    // Fetch notes from database
    useEffect(() => {
        let isMounted = true

        async function loadNotes() {
            if (!leadId) return
            setIsLoading(true)

            try {
                const result = await getNotes(leadId)
                if (isMounted && result.success && result.data) {
                    setNotes(result.data as Note[])
                }
            } catch (error) {
                console.error('[NotesPanel] Failed to load notes:', error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadNotes()

        return () => {
            isMounted = false
        }
    }, [leadId])

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffHours < 1) return "Zojuist"
        if (diffHours < 24) return `Vandaag, ${format(date, "HH:mm", { locale: nl })}`
        if (diffHours < 48) return `Gisteren, ${format(date, "HH:mm", { locale: nl })}`
        return format(date, "d MMM, HH:mm", { locale: nl })
    }

    const handleAddNote = async () => {
        if (!newNote.trim() || !leadId) return
        
        setIsSaving(true)
        try {
            const result = await addNote(
                leadId,
                newNote,
                currentUser?.name || "Onbekend"
            )

            if (result.success && result.data) {
                setNotes([result.data as Note, ...notes])
                
                // Check for mentions and create real notifications
                const mentions = extractMentions(newNote)
                if (mentions.length > 0 && users.length > 0) {
                    // Create notifications for mentioned users
                    const notifResult = await createMentionNotifications(
                        newNote,
                        leadId,
                        leadName || 'Project',
                        currentUser?.name || 'Onbekend',
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
            console.error('[NotesPanel] Failed to add note:', error)
            toast.error("Fout bij opslaan notitie")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Notities & Activiteit
                    </h3>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    Notities & Activiteit
                    <span className="text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 py-0.5 rounded-full font-bold">
                        {notes.length}
                    </span>
                </h3>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {notes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Nog geen notities</p>
                        <p className="text-xs mt-1">Voeg een notitie toe hieronder</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="group relative">
                            {note.isSystem ? (
                                // System message
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2">
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                    <span className="px-2 italic">{note.content}</span>
                                    <span className="text-slate-400 dark:text-slate-500">{formatTimestamp(note.createdAt)}</span>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                </div>
                            ) : (
                                // User note - lookup avatar from users list
                                (() => {
                                    const authorUser = users.find(u => u.name === note.author)
                                    const authorAvatar = authorUser?.avatar
                                    // Check if this is a system/automated entry
                                    const isSystemEntry = ['Systeem', 'System', 'Website Intake', 'Receptie', 'Admin', 'Broersma Bouwadvies'].some(
                                        s => note.author.toLowerCase().includes(s.toLowerCase())
                                    )
                                    return (
                                <div className="flex items-start gap-3">
                                    <Avatar className="w-9 h-9 flex-shrink-0 shadow-sm">
                                        {isSystemEntry ? (
                                            <AvatarImage src="/branding/logo-white-gold.png" alt={note.author} className="object-cover bg-slate-700 p-1" />
                                        ) : authorAvatar ? (
                                            <AvatarImage src={authorAvatar} alt={note.author} />
                                        ) : null}
                                        <AvatarFallback className={cn(
                                            "text-white text-sm font-bold",
                                            isSystemEntry ? "bg-slate-700" : (authorColors[note.author] || "bg-slate-600")
                                        )}>
                                            {isSystemEntry ? "BB" : note.author[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                {note.author}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                {formatTimestamp(note.createdAt)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed">
                                            <MentionText text={note.content} />
                                        </div>
                                    </div>
                                </div>
                                    )
                                })()
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <MentionInput
                        value={newNote}
                        onChange={setNewNote}
                        users={mentionableUsers}
                        placeholder="Schrijf een notitie... (type @ om iemand te vermelden)"
                        disabled={isSaving}
                        className="min-h-[80px] pr-24 resize-none bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-500"
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
                            className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            title="Bijlage toevoegen"
                        >
                            <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            className="h-8 w-8 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900" 
                            onClick={handleAddNote} 
                            disabled={!newNote.trim() || isSaving}
                            title="Verzenden"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">⌘ + Enter verzenden</span>
                    <span className="flex items-center gap-1">
                        <AtSign className="w-3 h-3" />
                        om teamlid te vermelden
                    </span>
                </div>
            </div>
        </div>
    )
}
