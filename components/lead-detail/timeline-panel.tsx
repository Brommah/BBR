"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Sparkles, Send, Paperclip, Mail, MessageSquare, FileText, BookOpen, ExternalLink } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import { getKnowledgeBaseArticles } from "@/app/actions"

const events = [
    {
        id: 1,
        type: "email_in",
        author: "J. de Vries",
        content: "Goedemiddag, ik heb een vraag over de vergunningsaanvraag. Moet ik die zelf regelen?",
        time: "10:30",
        date: "Vandaag"
    },
    {
        id: 2,
        type: "note",
        author: "Angelo",
        content: "Ik zie op de satellietfoto dat er al een uitbouw staat bij de buren, dus vergunning is waarschijnlijk makkelijk.",
        time: "11:45",
        date: "Gisteren"
    },
    {
        id: 3,
        type: "system",
        content: "Lead status changed to Triage",
        time: "09:00",
        date: "Gisteren"
    },
     {
        id: 4,
        type: "email_out",
        author: "Auto-Responder",
        content: "Bedankt voor uw aanvraag. We komen er zo snel mogelijk op terug.",
        time: "08:55",
        date: "Gisteren"
    }
]

export function TimelinePanel() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [articles, setArticles] = useState<any[]>([])

    useEffect(() => {
        getKnowledgeBaseArticles().then(setArticles)
    }, [])

    return (
        <Tabs defaultValue="activity" className="flex flex-col h-full bg-background/50 rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-background flex-shrink-0">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="emails">Emails</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <TabsContent value="activity" className="h-full flex flex-col m-0 data-[state=inactive]:hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {events.map((event) => (
                            <div key={event.id} className="flex gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    {event.type === 'email_in' && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Mail className="w-4 h-4" /></div>}
                                    {event.type === 'email_out' && <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Send className="w-4 h-4" /></div>}
                                    {event.type === 'note' && <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><MessageSquare className="w-4 h-4" /></div>}
                                    {event.type === 'system' && <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><FileText className="w-4 h-4" /></div>}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-foreground">{event.author || 'System'}</span>
                                        <span className="text-[10px] text-muted-foreground">{event.date}, {event.time}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground bg-white dark:bg-muted p-3 rounded-md border border-border shadow-sm">
                                        {event.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Input Area (only for activity/notes/emails) */}
                    <div className="p-4 bg-background border-t border-border space-y-3 flex-shrink-0">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary">
                                <Sparkles className="w-3 h-3" />
                                Suggest Reply
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                                Draft Rejection
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                                Summarize
                            </Button>
                        </div>
                        <div className="relative">
                            <Textarea 
                                placeholder="Type a note or email..." 
                                className="min-h-[100px] pr-12 resize-none"
                            />
                            <div className="absolute bottom-2 right-2 flex gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                                    <Paperclip className="w-4 h-4" />
                                </Button>
                                <Button size="icon" className="h-8 w-8">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="knowledge" className="h-full overflow-y-auto p-4 m-0 data-[state=inactive]:hidden">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Internal Knowledge Base (Notion)</h3>
                             <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Connected</span>
                        </div>
                        
                        {articles.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                                <div className="animate-pulse">Fetching from Notion...</div>
                            </div>
                        ) : (
                            articles.map(article => (
                                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="group block p-4 bg-card border border-border rounded-md hover:border-primary/50 hover:shadow-sm transition-all">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-primary" />
                                            <span className="font-medium text-sm group-hover:text-primary transition-colors">{article.title}</span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate block font-mono opacity-50">{article.url}</span>
                                </a>
                            ))
                        )}
                     </div>
                </TabsContent>
                
                <TabsContent value="emails" className="h-full flex items-center justify-center m-0 data-[state=inactive]:hidden">
                    <p className="text-muted-foreground">Email filter view placeholder</p>
                </TabsContent>
                 <TabsContent value="notes" className="h-full flex items-center justify-center m-0 data-[state=inactive]:hidden">
                    <p className="text-muted-foreground">Notes filter view placeholder</p>
                </TabsContent>
            </div>
        </Tabs>
    )
}
