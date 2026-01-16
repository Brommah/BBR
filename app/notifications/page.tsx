"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuthStore } from "@/lib/auth"
import { AccessGuard } from "@/components/auth/access-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  AtSign, 
  Bell, 
  CheckCircle2, 
  MessageSquare,
  FileText,
  Clock,
  ChevronRight,
  User,
  Trash2,
  UserPlus,
  RefreshCw,
  Circle,
  CheckCheck,
  Inbox,
  Sparkles,
  MapPin
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification as deleteNotificationAction 
} from "@/lib/db-actions"
import { toast } from "sonner"

interface Notification {
  id: string
  type: 'mention' | 'status_change' | 'document' | 'quote_feedback' | 'assignment' | 'new_lead'
  title: string
  message: string
  leadId: string | null
  leadName: string | null
  fromUserName: string | null
  createdAt: string
  read: boolean
}

const NOTIFICATION_ICONS = {
  mention: AtSign,
  status_change: Bell,
  document: FileText,
  quote_feedback: MessageSquare,
  assignment: UserPlus,
  new_lead: Sparkles,
}

const NOTIFICATION_COLORS = {
  mention: {
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-800'
  },
  status_change: {
    bg: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-200 dark:ring-blue-800'
  },
  document: {
    bg: 'bg-purple-100 dark:bg-purple-900/50',
    text: 'text-purple-700 dark:text-purple-300',
    ring: 'ring-purple-200 dark:ring-purple-800'
  },
  quote_feedback: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-800'
  },
  assignment: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    ring: 'ring-indigo-200 dark:ring-indigo-800'
  },
  new_lead: {
    bg: 'bg-rose-100 dark:bg-rose-900/50',
    text: 'text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-200 dark:ring-rose-800'
  },
}

function NotificationsContent() {
  const { currentUser } = useAuthStore()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const userName = currentUser?.name

  const loadNotifications = useCallback(async () => {
    if (!userName) return
    
    const result = await getNotifications(userName)
    if (result.success && result.data) {
      setNotifications(result.data as Notification[])
    }
  }, [userName])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await loadNotifications()
      setIsLoading(false)
    }
    load()
  }, [loadNotifications])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadNotifications()
    setIsRefreshing(false)
    toast.success("Meldingen vernieuwd")
  }

  const markAsRead = async (id: string) => {
    const result = await markNotificationRead(id)
    if (result.success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    }
  }

  const markAllAsRead = async () => {
    if (!currentUser?.name) return
    const result = await markAllNotificationsRead(currentUser.name)
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success("Alle meldingen gemarkeerd als gelezen")
    }
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await deleteNotificationAction(id)
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success("Melding verwijderd")
    }
  }

  // Split notifications into unread and read
  const { unreadNotifications, readNotifications } = useMemo(() => {
    const unread = notifications.filter(n => !n.read)
    const read = notifications.filter(n => n.read)
    return { unreadNotifications: unread, readNotifications: read }
  }, [notifications])

  const unreadCount = unreadNotifications.length

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffHours < 1) return "Zojuist"
    if (diffHours < 24) return `${Math.floor(diffHours)} uur geleden`
    if (diffHours < 48) return "Gisteren"
    return format(date, "d MMM 'om' HH:mm", { locale: nl })
  }

  const handleCardClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    // Navigate to lead detail page for new_lead notifications (and others with leadId)
    if (notification.leadId) {
      router.push(`/leads/${notification.leadId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="mb-3">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const NotificationCard = ({ notification, isUnread }: { notification: Notification; isUnread: boolean }) => {
    const Icon = NOTIFICATION_ICONS[notification.type]
    const colors = NOTIFICATION_COLORS[notification.type]
    
    return (
      <Card 
        onClick={() => handleCardClick(notification)}
        className={cn(
          "transition-all cursor-pointer group relative overflow-hidden",
          isUnread 
            ? "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent border-l-4 border-l-amber-500 shadow-sm hover:shadow-md" 
            : "bg-card/50 hover:bg-card border-l-4 border-l-transparent opacity-75 hover:opacity-100"
        )}
      >
        {/* Unread indicator dot */}
        {isUnread && (
          <div className="absolute top-4 left-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
        
        <CardContent className={cn("p-4", isUnread && "pl-6")}>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-2",
              colors.bg,
              colors.text,
              isUnread ? colors.ring : "ring-transparent"
            )}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "font-semibold text-sm",
                  isUnread ? "text-foreground" : "text-muted-foreground"
                )}>
                  {notification.title}
                </span>
                {isUnread && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0 font-bold">
                    NIEUW
                  </Badge>
                )}
                {!isUnread && (
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              
              <p className={cn(
                "text-sm mb-2",
                isUnread ? "text-foreground/80" : "text-muted-foreground"
              )}>
                {notification.message}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {notification.fromUserName && notification.type !== 'new_lead' && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {notification.fromUserName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(notification.createdAt)}
                </span>
                {notification.leadId && notification.leadName && notification.type !== 'new_lead' && (
                  <Link 
                    href={`/leads/${notification.leadId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    {notification.leadName}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
              
              {/* Prominent CTA for new_lead notifications */}
              {notification.type === 'new_lead' && notification.leadId && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <Link 
                    href={`/leads/${notification.leadId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors shadow-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    Dossier bekijken & configureren
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUnread && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
                  onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }}
                  title="Markeer als gelezen"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => deleteNotification(notification.id, e)}
                title="Verwijderen"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 flex items-center justify-center shadow-sm">
            <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meldingen</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 
                ? <span className="text-amber-600 dark:text-amber-400 font-medium">{unreadCount} nieuw{unreadCount !== 1 ? 'e' : ''}</span>
                : <span className="text-emerald-600 dark:text-emerald-400">Alles bijgewerkt ✓</span>
              }
              {' • '}{notifications.length} totaal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Vernieuwen
          </Button>
          {unreadCount > 0 && (
            <Button variant="default" size="sm" onClick={markAllAsRead} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCheck className="w-4 h-4 mr-2" />
              Alles gelezen
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Geen meldingen</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Je hebt momenteel geen meldingen. Als iemand je @vermeldt in een notitie,
              zie je dat hier.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unread Section */}
          {unreadNotifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Circle className="w-3 h-3 fill-amber-500 text-amber-500" />
                <h2 className="text-sm font-semibold text-foreground">
                  Nieuw ({unreadNotifications.length})
                </h2>
              </div>
              <div className="space-y-2">
                {unreadNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} isUnread={true} />
                ))}
              </div>
            </div>
          )}

          {/* Divider if both sections have items */}
          {unreadNotifications.length > 0 && readNotifications.length > 0 && (
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground font-medium">EERDER</span>
              <Separator className="flex-1" />
            </div>
          )}

          {/* Read Section */}
          {readNotifications.length > 0 && (
            <div>
              {unreadNotifications.length === 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    Gelezen ({readNotifications.length})
                  </h2>
                </div>
              )}
              <div className="space-y-2">
                {readNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} isUnread={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <AccessGuard roles={['admin', 'projectleider', 'engineer']}>
      <NotificationsContent />
    </AccessGuard>
  )
}
