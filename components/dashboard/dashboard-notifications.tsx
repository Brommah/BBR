"use client"
import { useEffect, useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useLeadStore, Lead } from "@/lib/store"
import { getUnreadNotificationCount } from "@/lib/db-actions"

export function DashboardNotifications() {
  const router = useRouter()
  const { leads } = useLeadStore()
  const shownLeadIdsRef = useRef<Set<string>>(new Set())
  const initialLoadRef = useRef(true)

  // Get new leads (status "Nieuw") that haven't been shown yet
  const getNewLeads = useCallback(() => {
    return leads.filter(lead => 
      lead.status === "Nieuw" && 
      !shownLeadIdsRef.current.has(lead.id)
    )
  }, [leads])

  // Show notification for a specific lead
  const showLeadNotification = useCallback((lead: Lead) => {
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

  // Check for new leads and show notifications
  const checkForNewLeads = useCallback(() => {
    const newLeads = getNewLeads()
    
    // On initial load, mark all existing new leads as "seen" but show notification for the first one
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      
      // Mark all as seen
      newLeads.forEach(lead => shownLeadIdsRef.current.add(lead.id))
      
      // Show notification for the most recent one if exists
      if (newLeads.length > 0) {
        const mostRecent = newLeads.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
        
        // Remove from shown set so it can be shown
        shownLeadIdsRef.current.delete(mostRecent.id)
        
        setTimeout(() => {
          showLeadNotification(mostRecent)
        }, 2000)
      }
      return
    }
    
    // For subsequent checks, show notifications for all new leads
    newLeads.forEach(lead => {
      showLeadNotification(lead)
    })
  }, [getNewLeads, showLeadNotification])

  useEffect(() => {
    // Initial check
    checkForNewLeads()
    
    // Periodically check for new leads (in case they're added externally)
    const interval = setInterval(checkForNewLeads, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [checkForNewLeads])

  // Also check whenever leads array changes
  useEffect(() => {
    if (!initialLoadRef.current) {
      checkForNewLeads()
    }
  }, [leads, checkForNewLeads])

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
 * Polls every 30 seconds to keep count updated
 */
export function useNotificationCount(userName: string | undefined) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userName) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setCount(0))
      return
    }
    
    // Fetch count and set up polling
    let isMounted = true
    const doFetch = async () => {
      const result = await getUnreadNotificationCount(userName)
      if (isMounted && result.success && typeof result.data === 'number') {
        setCount(result.data)
      }
    }
    
    doFetch()
    const interval = setInterval(doFetch, 30000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [userName])

  return count
}
