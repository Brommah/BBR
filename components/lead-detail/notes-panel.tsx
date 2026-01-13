"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Paperclip } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Note {
    id: number
    author: string
    content: string
    time: string
    date: string
    isSystem?: boolean
}

const initialNotes: Note[] = [
    {
        id: 1,
        author: "Angelo",
        content: "Ik zie op de satellietfoto dat er al een uitbouw staat bij de buren, dus vergunning is waarschijnlijk makkelijk.",
        time: "11:45",
        date: "Gisteren"
    },
    {
        id: 2,
        author: "Venka",
        content: "Telefoon gehad met klant - wil weten wanneer we kunnen beginnen. Heb gezegd binnen 2 weken na akkoord.",
        time: "09:30",
        date: "Vandaag"
    },
    {
        id: 3,
        author: "System",
        content: "Lead status gewijzigd naar Calculatie",
        time: "09:00",
        date: "Gisteren",
        isSystem: true
    }
]

const authorColors: Record<string, string> = {
    "Angelo": "bg-blue-600",
    "Venka": "bg-purple-600",
    "Roina": "bg-emerald-600",
    "System": "bg-slate-500"
}

export function NotesPanel() {
    const [notes, setNotes] = useState<Note[]>(initialNotes)
    const [newNote, setNewNote] = useState("")

    const handleAddNote = () => {
        if (!newNote.trim()) return
        
        const note: Note = {
            id: Date.now(),
            author: "Angelo", // Mock current user
            content: newNote,
            time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
            date: "Nu"
        }
        setNotes([note, ...notes])
        setNewNote("")
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
                {notes.map((note) => (
                    <div key={note.id} className="group relative">
                        {note.isSystem ? (
                            // System message
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2">
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                <span className="px-2 italic">{note.content}</span>
                                <span className="text-slate-400 dark:text-slate-500">{note.time}</span>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            </div>
                        ) : (
                            // User note
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm",
                                    authorColors[note.author] || "bg-slate-600"
                                )}>
                                    {note.author[0]}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            {note.author}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {note.date}, {note.time}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed">
                                        {note.content}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <Textarea 
                        placeholder="Schrijf een notitie..." 
                        className="min-h-[80px] pr-24 resize-none bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-400 dark:focus:border-slate-500"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
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
                        >
                            <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            className="h-8 w-8 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900" 
                            onClick={handleAddNote} 
                            disabled={!newNote.trim()}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    ⌘ + Enter om te verzenden
                </p>
            </div>
        </div>
    )
}
