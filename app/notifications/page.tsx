"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/lib/auth"
import { AccessGuard } from "@/components/auth/access-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  RefreshCw
} from "lucide-react"
import Link from "next/link"
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
  type: 'mention' | 'status_change' | 'document' | 'quote_feedback' | 'assignment'
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
}

const NOTIFICATION_COLORS = {
  mention: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  status_change: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  document: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  quote_feedback: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  assignment: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
}

function NotificationsContent() {
  const { currentUser } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!currentUser?.name) return
    
    const result = await getNotifications(currentUser.name)
    if (result.success && result.data) {
      setNotifications(result.data as Notification[])
    }
  }, [currentUser?.name])

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

  const deleteNotification = async (id: string) => {
    const result = await deleteNotificationAction(id)
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success("Melding verwijderd")
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffHours < 1) return "Zojuist"
    if (diffHours < 24) return `${Math.floor(diffHours)} uur geleden`
    if (diffHours < 48) return "Gisteren"
    return format(date, "d MMM", { locale: nl })
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AtSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meldingen</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 
                ? `${unreadCount} ongelezen melding${unreadCount !== 1 ? 'en' : ''}`
                : 'Geen ongelezen meldingen'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Vernieuwen
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Alles gelezen
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">Geen meldingen</h3>
            <p className="text-sm text-muted-foreground">
              Je hebt momenteel geen meldingen. Als iemand je @vermeldt in een notitie,<br />
              zie je dat hier.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type]
            return (
              <Card 
                key={notification.id}
                className={cn(
                  "transition-all hover:shadow-md",
                  !notification.read && "border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      NOTIFICATION_COLORS[notification.type]
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{notification.title}</span>
                        {!notification.read && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                            Nieuw
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {notification.fromUserName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {notification.fromUserName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notification.createdAt)}
                        </span>
                        {notification.leadId && notification.leadName && (
                          <Link 
                            href={`/leads/${notification.leadId}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            {notification.leadName}
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => markAsRead(notification.id)}
                          title="Markeer als gelezen"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <AccessGuard roles={['admin', 'engineer']}>
      <NotificationsContent />
    </AccessGuard>
  )
}
