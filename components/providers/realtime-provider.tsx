"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth"
import { useRealtimeSubscriptions } from "@/lib/realtime"

/**
 * RealtimeProvider - Sets up Supabase real-time subscriptions
 *
 * Place this component near the root of your app (inside AuthProvider)
 * to enable real-time updates for leads and notifications.
 *
 * Features:
 * - Automatically subscribes when user is authenticated
 * - Unsubscribes on logout
 * - Shows toast notifications for new leads and notifications
 *
 * Usage in layout.tsx:
 * ```tsx
 * <AuthProvider>
 *   <RealtimeProvider />
 *   {children}
 * </AuthProvider>
 * ```
 */
export function RealtimeProvider() {
  const { currentUser, isAuthenticated } = useAuthStore()

  // Set up real-time subscriptions when authenticated
  const { isFullySubscribed } = useRealtimeSubscriptions(
    isAuthenticated ? currentUser?.name : undefined
  )

  useEffect(() => {
    if (isAuthenticated && isFullySubscribed) {
      console.log("[RealtimeProvider] Real-time subscriptions active")
    }
  }, [isAuthenticated, isFullySubscribed])

  // This component doesn't render anything
  return null
}
