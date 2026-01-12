"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lead } from "@/lib/store"
import { Clock, CheckCircle2, AlertCircle, ArrowRight, CalendarDays, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

interface EngineerDashboardProps {
    leads: Lead[]
    userName: string // e.g., "Angelo"
}

export function MyProjectsWidget({ leads, userName }: EngineerDashboardProps) {
    const router = useRouter()
    
    // Filter leads assigned to this engineer that are active (not archived or new)
    const myProjects = leads.filter(l => 
        l.assignee === userName && 
        l.status !== "Archief" && 
        l.status !== "Nieuw"
    )

    // Sort by urgency: Urgent first, then oldest
    const sortedProjects = myProjects.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1
        if (!a.isUrgent && b.isUrgent) return 1
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    return (
        <Card className="col-span-4 lg:col-span-4 border border-border shadow-sm hover:shadow-md transition-all bg-card">
            <CardHeader className="pb-3 border-b border-border">
                <div className="flex justify-between items-center">
                    <div>
                         <CardTitle className="section-title">
                             Mijn Actieve Projecten
                         </CardTitle>
                         <CardDescription>
                             Directe focus op jouw lopende zaken.
                         </CardDescription>
                    </div>
                    <Badge className="px-3 py-1 text-value bg-primary text-primary-foreground">
                        {sortedProjects.length} Actief
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-1">
                    {sortedProjects.length === 0 ? (
                         <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-border">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                            <p className="font-medium">Geen actieve projecten.</p>
                            <p className="text-sm">Tijd voor koffie of nieuwe leads oppakken!</p>
                         </div>
                    ) : (
                        sortedProjects.map(project => (
                            <div 
                                key={project.id} 
                                onClick={() => router.push(`/leads/${project.id}`)}
                                className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-0"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`status-dot ${project.isUrgent ? 'status-error animate-pulse ring-4 ring-red-500/20' : 'status-success'}`} />
                                    <div>
                                        <div className="font-semibold text-sm flex items-center gap-2 text-foreground">
                                            {project.clientName}
                                            <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
                                                {project.projectType}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                            <span className="truncate max-w-[150px]">{project.city}</span>
                                            <span className="opacity-50">•</span>
                                            <span className="text-value">{project.status}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                         <span className="block text-sm text-currency">
                                             € {project.value.toLocaleString()}
                                         </span>
                                         <span className="block text-label">
                                             Est. Value
                                         </span>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function IncomingRequestsWidget({ leads }: { leads: Lead[] }) {
    const router = useRouter()
    // Unassigned leads in "Nieuw" or "Triage"
    const incoming = leads.filter(l => !l.assignee && (l.status === "Nieuw" || l.status === "Triage"))

    return (
        <Card className="col-span-3 lg:col-span-3 border border-accent bg-accent/10 shadow-sm hover:shadow-md transition-all">
             <CardHeader className="pb-3 border-b border-accent/30">
                <div className="flex justify-between items-center">
                    <div>
                         <CardTitle className="section-title text-accent-foreground">
                             Instroom Bak
                         </CardTitle>
                         <CardDescription className="text-accent-foreground/70">
                             Nieuwe aanvragen om op te pakken.
                         </CardDescription>
                    </div>
                    <Badge className="border-0 bg-accent text-accent-foreground font-semibold">
                        {incoming.length} Nieuw
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                 <div className="space-y-3">
                    {incoming.length === 0 ? (
                        <div className="text-center py-4 text-accent-foreground/70">
                            <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">De inbox is leeg.</p>
                        </div>
                    ) : (
                        incoming.slice(0, 5).map(lead => (
                            <div key={lead.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-accent/30 shadow-sm">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                        {lead.projectType}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {lead.city} • {lead.clientName}
                                    </p>
                                </div>
                                <Button 
                                    size="sm" 
                                    className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-sm" 
                                    onClick={() => router.push(`/leads/${lead.id}`)}
                                >
                                    Oppakken
                                </Button>
                            </div>
                        ))
                    )}
                    {incoming.length > 5 && (
                        <Button 
                            variant="link" 
                            className="w-full text-xs text-accent-foreground font-medium" 
                            onClick={() => router.push('/pipeline')}
                        >
                            Bekijk alle {incoming.length} leads →
                        </Button>
                    )}
                 </div>
            </CardContent>
        </Card>
    )
}

export function QuickActionsWidget() {
    return (
        <div className="col-span-7 grid grid-cols-4 gap-4 mt-2">
             <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                <CalendarDays className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium">Beschikbaarheid Checken</span>
             </Button>
             <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium">Email Templates</span>
             </Button>
             <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium">Uren Registreren</span>
             </Button>
             <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium">Probleem Melden</span>
             </Button>
        </div>
    )
}
