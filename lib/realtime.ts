/**
 * @fileoverview Supabase Real-time Subscriptions
 *
 * This module provides real-time data synchronization using Supabase's
 * built-in WebSocket subscriptions. Replaces polling with instant updates.
 *
 * Features:
 * - Real-time lead updates across all users
 * - Instant notification delivery
 * - Automatic reconnection handling
 * - Integration with Zustand stores
 *
 * @module lib/realtime
 */

import { useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { getSupabaseBrowserClient, isSupabaseConfigured } from './supabase-browser'
import { useLeadStore, Lead } from './store'
import { toast } from 'sonner'

// Supabase realtime payload type
interface RealtimePayload<T> {
  commit_timestamp: string
  errors: string[] | null
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | Record<string, never>
  old: Partial<T> | Record<string, never>
  schema: string
  table: string
}

// Database row types for Supabase real-time payloads
interface LeadRow {
  id: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  projectType: string
  city: string
  address: string | null
  status: string
  value: number
  createdAt: string
  updatedAt: string
  assignee: string | null
  werknummer: string | null
  addressValid: boolean
  quoteApproval: string | null
  quoteValue: number | null
  quoteDescription: string | null
  quoteLineItems: unknown | null
  quoteEstimatedHours: number | null
  quoteFeedback: unknown | null
  assignedProjectleider: string | null
  assignedRekenaar: string | null
  assignedTekenaar: string | null
  deletedAt: string | null
}

interface NotificationRow {
  id: string
  userId: string
  userName: string
  type: string
  title: string
  message: string
  leadId: string | null
  read: boolean
  createdAt: string
}

/**
 * Convert database row to Lead type
 */
function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    clientName: row.clientName,
    clientEmail: row.clientEmail || undefined,
    clientPhone: row.clientPhone || undefined,
    projectType: row.projectType,
    city: row.city,
    address: row.address || undefined,
    status: row.status as Lead['status'],
    value: row.value,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assignee: row.assignee || undefined,
    werknummer: row.werknummer || undefined,
    addressValid: row.addressValid,
    quoteApproval: (row.quoteApproval as Lead['quoteApproval']) || undefined,
    quoteValue: row.quoteValue || undefined,
    quoteDescription: row.quoteDescription || undefined,
    quoteLineItems: row.quoteLineItems as Lead['quoteLineItems'],
    quoteEstimatedHours: row.quoteEstimatedHours || undefined,
    quoteFeedback: row.quoteFeedback as Lead['quoteFeedback'],
    assignedProjectleider: row.assignedProjectleider,
    assignedRekenaar: row.assignedRekenaar,
    assignedTekenaar: row.assignedTekenaar,
  }
}

/**
 * Hook to subscribe to real-time lead updates
 *
 * Subscribes to INSERT, UPDATE, and DELETE events on the Lead table
 * and automatically updates the Zustand store.
 *
 * @param options - Configuration options
 * @param options.onNewLead - Callback when a new lead is created
 * @param options.onLeadUpdate - Callback when a lead is updated
 * @param options.onLeadDelete - Callback when a lead is deleted
 * @param options.showToasts - Whether to show toast notifications (default: true)
 */
export function useLeadRealtime(options?: {
  onNewLead?: (lead: Lead) => void
  onLeadUpdate?: (lead: Lead) => void
  onLeadDelete?: (leadId: string) => void
  showToasts?: boolean
}) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { leads } = useLeadStore()
  const showToasts = options?.showToasts ?? true

  const handleInsert = useCallback((payload: RealtimePayload<LeadRow>) => {
    const newRow = payload.new as LeadRow
    if (!newRow || newRow.deletedAt) return

    const newLead = rowToLead(newRow)

    // Update store - add new lead if not already present
    useLeadStore.setState((state) => {
      const exists = state.leads.some(l => l.id === newLead.id)
      if (exists) return state
      return { leads: [newLead, ...state.leads] }
    })

    // Show toast for new leads
    if (showToasts) {
      toast.success('Nieuwe lead', {
        description: `${newLead.clientName} - ${newLead.projectType}`,
      })
    }

    options?.onNewLead?.(newLead)
  }, [options, showToasts])

  const handleUpdate = useCallback((payload: RealtimePayload<LeadRow>) => {
    const updatedRow = payload.new as LeadRow
    if (!updatedRow) return

    // Handle soft delete
    if (updatedRow.deletedAt) {
      useLeadStore.setState((state) => ({
        leads: state.leads.filter(l => l.id !== updatedRow.id)
      }))
      options?.onLeadDelete?.(updatedRow.id)
      return
    }

    const updatedLead = rowToLead(updatedRow)

    // Update store - replace lead with updated data
    useLeadStore.setState((state) => ({
      leads: state.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
    }))

    options?.onLeadUpdate?.(updatedLead)
  }, [options])

  const handleDelete = useCallback((payload: RealtimePayload<LeadRow>) => {
    const deletedRow = payload.old as LeadRow
    if (!deletedRow) return

    // Remove from store
    useLeadStore.setState((state) => ({
      leads: state.leads.filter(l => l.id !== deletedRow.id)
    }))

    options?.onLeadDelete?.(deletedRow.id)
  }, [options])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('[Realtime] Supabase not configured, skipping real-time subscriptions')
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    // Create channel for lead updates
    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes' as const,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Lead',
        },
        (payload: RealtimePayload<LeadRow>) => handleInsert(payload)
      )
      .on(
        'postgres_changes' as const,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Lead',
        },
        (payload: RealtimePayload<LeadRow>) => handleUpdate(payload)
      )
      .on(
        'postgres_changes' as const,
        {
          event: 'DELETE',
          schema: 'public',
          table: 'Lead',
        },
        (payload: RealtimePayload<LeadRow>) => handleDelete(payload)
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to lead updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error - retrying...')
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [handleInsert, handleUpdate, handleDelete])

  return {
    isSubscribed: channelRef.current !== null,
  }
}

/**
 * Hook to subscribe to real-time notifications for a specific user
 *
 * @param userName - The username to filter notifications for
 * @param onNotification - Callback when a new notification is received
 */
export function useNotificationRealtime(
  userName: string | undefined,
  onNotification?: (notification: NotificationRow) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userName || !isSupabaseConfigured()) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    // Create channel for user-specific notifications
    const channel = supabase
      .channel(`notifications-${userName}`)
      .on(
        'postgres_changes' as const,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notification',
          filter: `userName=eq.${userName}`,
        },
        (payload: RealtimePayload<NotificationRow>) => {
          const notification = payload.new as NotificationRow
          if (!notification) return

          // Show toast notification
          toast(notification.title, {
            description: notification.message,
            duration: 8000,
          })

          onNotification?.(notification)
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to notifications for ${userName}`)
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userName, onNotification])

  return {
    isSubscribed: channelRef.current !== null,
  }
}

/**
 * Hook to subscribe to real-time quote approval updates
 * Useful for engineers waiting on admin approval
 *
 * @param leadId - Optional lead ID to filter for specific lead
 * @param onApproval - Callback when quote is approved
 * @param onRejection - Callback when quote is rejected
 */
export function useQuoteApprovalRealtime(
  leadId?: string,
  onApproval?: (lead: Lead) => void,
  onRejection?: (lead: Lead, feedback: string) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const channelName = leadId ? `quote-approval-${leadId}` : 'quote-approvals'
    const filter = leadId ? `id=eq.${leadId}` : undefined

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as const,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Lead',
          ...(filter && { filter }),
        },
        (payload: RealtimePayload<LeadRow>) => {
          const oldRow = payload.old as Partial<LeadRow>
          const newRow = payload.new as LeadRow
          if (!newRow) return

          // Check if quote approval status changed
          if (oldRow.quoteApproval !== newRow.quoteApproval) {
            const lead = rowToLead(newRow)

            if (newRow.quoteApproval === 'approved') {
              toast.success('Offerte goedgekeurd!', {
                description: `${lead.clientName} - Offerte is goedgekeurd door admin`,
              })
              onApproval?.(lead)
            } else if (newRow.quoteApproval === 'rejected') {
              const feedback = Array.isArray(newRow.quoteFeedback) && newRow.quoteFeedback.length > 0
                ? (newRow.quoteFeedback[newRow.quoteFeedback.length - 1] as { message?: string })?.message || ''
                : ''
              toast.error('Offerte afgekeurd', {
                description: feedback || `${lead.clientName} - Bekijk feedback voor details`,
              })
              onRejection?.(lead, feedback)
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [leadId, onApproval, onRejection])

  return {
    isSubscribed: channelRef.current !== null,
  }
}

/**
 * Combined hook that sets up all real-time subscriptions for a user
 * Use this at the app root level for comprehensive real-time updates
 *
 * @param userName - Current user's name for notification filtering
 */
export function useRealtimeSubscriptions(userName?: string) {
  const leadRealtime = useLeadRealtime()
  const notificationRealtime = useNotificationRealtime(userName)

  return {
    leads: leadRealtime,
    notifications: notificationRealtime,
    isFullySubscribed: leadRealtime.isSubscribed && notificationRealtime.isSubscribed,
  }
}
