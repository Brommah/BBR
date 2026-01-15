"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    ArrowRight,
    UserPlus,
    FileText,
    CheckCircle,
    XCircle,
    Send,
    Plus,
    Clock,
    Settings,
    RefreshCw,
} from "lucide-react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getActivities } from "@/lib/db-actions"

// Activity entry from system events
interface SystemActivity {
    id: string
    type: string
    content: string
    author: string | null
    createdAt: string
    metadata?: Record<string, unknown>
}

const activityIcons: Record<string, React.ReactNode> = {
    'lead_created': <Plus className="w-3 h-3" />,
    'status_change': <ArrowRight className="w-3 h-3" />,
    'assignment': <UserPlus className="w-3 h-3" />,
    'note_added': <FileText className="w-3 h-3" />,
    'document_uploaded': <FileText className="w-3 h-3" />,
    'quote_submitted': <Send className="w-3 h-3" />,
    'quote_approved': <CheckCircle className="w-3 h-3" />,
    'quote_rejected': <XCircle className="w-3 h-3" />,
    'quote_sent': <Send className="w-3 h-3" />,
    'email_sent': <Send className="w-3 h-3" />,
    'specs_updated': <RefreshCw className="w-3 h-3" />,
    'time_logged': <Clock className="w-3 h-3" />,
}

const activityColors: Record<string, string> = {
    'lead_created': 'bg-blue-500',
    'status_change': 'bg-purple-500',
    'assignment': 'bg-amber-500',
    'note_added': 'bg-slate-500',
    'document_uploaded': 'bg-emerald-500',
    'quote_submitted': 'bg-orange-500',
    'quote_approved': 'bg-green-500',
    'quote_rejected': 'bg-red-500',
    'quote_sent': 'bg-indigo-500',
    'email_sent': 'bg-violet-500',
    'specs_updated': 'bg-cyan-500',
    'time_logged': 'bg-teal-500',
}

interface TimelinePanelProps {
    leadId: string
}

export function TimelinePanel({ leadId }: TimelinePanelProps) {
    const [activities, setActivities] = useState<SystemActivity[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadActivities() {
            if (!leadId) return
            setIsLoading(true)

            try {
                const result = await getActivities(leadId)
                if (isMounted && result.success && result.data) {
                    setActivities(result.data as SystemActivity[])
                }
            } catch (error) {
                console.error('[TimelinePanel] Failed to load activities:', error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadActivities()

        return () => {
            isMounted = false
        }
    }, [leadId])

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffHours < 1) return "Zojuist"
        if (diffHours < 24) return format(date, "HH:mm", { locale: nl })
        if (diffHours < 48) return `Gisteren, ${format(date, "HH:mm", { locale: nl })}`
        return format(date, "d MMM yyyy, HH:mm", { locale: nl })
    }

    const getActivityLabel = (type: string): string => {
        const labels: Record<string, string> = {
            'lead_created': 'Aangemaakt',
            'status_change': 'Status gewijzigd',
            'assignment': 'Toegewezen',
            'note_added': 'Notitie',
            'document_uploaded': 'Document',
            'quote_submitted': 'Offerte ingediend',
            'quote_approved': 'Goedgekeurd',
            'quote_rejected': 'Afgekeurd',
            'quote_sent': 'Offerte verzonden',
            'email_sent': 'E-mail verzonden',
            'specs_updated': 'Specs bijgewerkt',
            'time_logged': 'Uren gelogd',
        }
        return labels[type] || type
    }

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Tijdlijn
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Tijdlijn
                    <Badge variant="secondary" className="text-xs ml-auto">
                        {activities.length} events
                    </Badge>
                </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
                <CardContent className="pt-0">
                    {activities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Geen activiteiten</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
                            
                            <div className="space-y-4">
                                {activities.map((activity, index) => (
                                    <div key={activity.id} className="relative flex gap-4 pl-2">
                                        {/* Icon bubble */}
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 z-10",
                                            activityColors[activity.type] || 'bg-slate-500'
                                        )}>
                                            {activityIcons[activity.type] || <Settings className="w-3 h-3" />}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pb-2">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Badge variant="outline" className="text-[10px] font-medium">
                                                    {getActivityLabel(activity.type)}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatTimestamp(activity.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground">
                                                {activity.content}
                                            </p>
                                            {activity.author && (
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    door {activity.author}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </ScrollArea>
        </Card>
    )
}
