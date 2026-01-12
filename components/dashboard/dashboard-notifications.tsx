"use client"
import { useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useLeadStore, Lead } from "@/lib/store"

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
