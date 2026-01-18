"use client"
import { useEffect, useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useLeadStore, Lead } from "@/lib/store"
import { getUnreadNotificationCount } from "@/lib/db-actions"
import { useLeadRealtime } from "@/lib/realtime"

/**
 * DashboardNotifications - Handles real-time lead notifications
 *
 * Uses Supabase real-time subscriptions for instant updates.
 * Falls back to store-based detection for leads added through other means.
 */
export function DashboardNotifications() {
  const router = useRouter()
  const { leads } = useLeadStore()
  const shownLeadIdsRef = useRef<Set<string>>(new Set())
  const initialLoadRef = useRef(true)

  // Show notification for a specific lead
  const showLeadNotification = useCallback((lead: Lead) => {
    // Skip if already shown
    if (shownLeadIdsRef.current.has(lead.id)) return

    shownLeadIdsRef.current.add(lead.id)

    toast("Nieuwe Lead", {
      description: `Aanvraag ontvangen: ${lead.clientName} (${lead.projectType})`,
      duration: 10000,
      action: {
        label: "Bekijken",
        onClick: () => router.push(`/leads/${lead.id}`)
      },
      classNames: {
        actionButton: "!bg-slate-900 !text-white hover:!bg-slate-800 !font-semibold"
      }
    })
  }, [router])

  // Real-time subscription for new leads (instant WebSocket updates)
  useLeadRealtime({
    showToasts: false, // We handle toasts ourselves with custom formatting
    onNewLead: (lead) => {
      if (lead.status === "Nieuw") {
        showLeadNotification(lead)
      }
    }
  })

  // On initial mount, mark existing "Nieuw" leads as seen
  useEffect(() => {
    if (initialLoadRef.current && leads.length > 0) {
      initialLoadRef.current = false

      // Mark all existing new leads as seen
      const newLeads = leads.filter(lead => lead.status === "Nieuw")
      newLeads.forEach(lead => shownLeadIdsRef.current.add(lead.id))

      // Show notification for the most recent one
      if (newLeads.length > 0) {
        const mostRecent = newLeads.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]

        // Remove from shown set so it can be displayed
        shownLeadIdsRef.current.delete(mostRecent.id)

        setTimeout(() => {
          showLeadNotification(mostRecent)
        }, 2000)
      }
    }
  }, [leads, showLeadNotification])

  return null
}

// Hook to get inbox count for sidebar badge
export function useInboxCount() {
  const { leads } = useLeadStore()
  return leads.filter(lead => lead.status === "Nieuw").length
}

/**
 * Hook for engineer-specific updates count
 * Counts projects with recent activity (updated in last 24h that engineer hasn't seen)
 */
export function useEngineerUpdatesCount(engineerName: string | undefined) {
  const { leads } = useLeadStore()
  
  if (!engineerName) return 0
  
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  // Count assigned leads with recent updates
  return leads.filter(lead => {
    // Only their assigned leads (check new team assignment fields - legacy 'assignee' is deprecated)
    const isAssigned = lead.assignedProjectleider === engineerName || 
                       lead.assignedRekenaar === engineerName || 
                       lead.assignedTekenaar === engineerName
    if (!isAssigned) return false
    
    // Only active statuses
    if (!['Calculatie', 'Opdracht'].includes(lead.status)) return false
    
    // Check for recent updates (updatedAt is more recent than 24h ago)
    // Use createdAt as fallback if updatedAt is not available
    const timestamp = lead.updatedAt || lead.createdAt
    if (!timestamp) return false
    
    const updatedAt = new Date(timestamp)
    return updatedAt > oneDayAgo
  }).length
}

/**
 * Types of updates engineers should see
 */
export interface EngineerUpdate {
  id: string
  leadId: string
  leadName: string
  type: 'status_change' | 'document_added' | 'admin_feedback' | 'priority_change' | 'deadline_set'
  message: string
  createdAt: string
  read: boolean
}

/**
 * Hook to get unread notification count from database
 * Uses real-time subscriptions for instant updates, with initial fetch
 */
export function useNotificationCount(userName: string | undefined) {
  const [count, setCount] = useState(0)

  // Initial fetch of notification count
  useEffect(() => {
    if (!userName) {
      queueMicrotask(() => setCount(0))
      return
    }

    let isMounted = true
    const doFetch = async () => {
      const result = await getUnreadNotificationCount(userName)
      if (isMounted && result.success && typeof result.data === 'number') {
        setCount(result.data)
      }
    }

    doFetch()

    return () => {
      isMounted = false
    }
  }, [userName])

  // Real-time subscription - increment count on new notification
  useEffect(() => {
    if (!userName) return

    // Dynamic import to avoid SSR issues
    let cleanup: (() => void) | undefined

    import('@/lib/supabase-browser').then(({ getSupabaseBrowserClient, isSupabaseConfigured }) => {
      if (!isSupabaseConfigured()) return

      const supabase = getSupabaseBrowserClient()
      if (!supabase) return

      const channel = supabase
        .channel(`notification-count-${userName}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Notification',
            filter: `userName=eq.${userName}`,
          },
          () => {
            // Increment count on new notification
            setCount(prev => prev + 1)
          }
        )
        .on(
          'postgres_changes' as const,
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Notification',
            filter: `userName=eq.${userName}`,
          },
          (payload: { old: { read?: boolean }; new: { read?: boolean } }) => {
            // Decrement if notification was marked as read
            const oldData = payload.old
            const newData = payload.new
            if (!oldData.read && newData.read) {
              setCount(prev => Math.max(0, prev - 1))
            }
          }
        )
        .subscribe()

      cleanup = () => {
        supabase.removeChannel(channel)
      }
    })

    return () => {
      cleanup?.()
    }
  }, [userName])

  return count
}
