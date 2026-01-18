"use client"

import { useEffect } from "react"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { useLeadStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { useRealtimeSubscriptions } from "@/lib/realtime"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/lib/query-client"

/**
 * Initializes the store by loading leads from database
 * Runs once on app mount when authenticated AND session is verified
 */
function StoreInitializer() {
  const loadLeads = useLeadStore(state => state.loadLeads)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  
  useEffect(() => {
    // Only load leads after auth is initialized AND user is authenticated
    // This prevents loading leads before session verification
    if (isInitialized && isAuthenticated) {
      loadLeads()
    }
  }, [loadLeads, isAuthenticated, isInitialized])
  
  return null
}

/**
 * Initializes auth by checking for existing session
 * Sets up Supabase auth state listener
 */
function AuthInitializer() {
  const checkSession = useAuthStore(state => state.checkSession)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  return null
}

/**
 * Initializes real-time subscriptions when authenticated
 * Provides instant updates for leads and notifications via WebSocket
 */
function RealtimeInitializer() {
  const currentUser = useAuthStore(state => state.currentUser)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)

  // Only subscribe after auth is verified
  const userName = isInitialized && isAuthenticated ? currentUser?.name : undefined

  useRealtimeSubscriptions(userName)

  return null
}

/**
 * Global providers wrapper
 * Includes:
 * - Error boundary for catching runtime errors
 * - React Query for server state management
 * - Auth initialization
 * - Store initialization (Zustand for client state)
 * - Real-time subscriptions (Supabase WebSocket)
 * - Keyboard shortcuts
 * - Toast notifications
 */
export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthInitializer />
        <StoreInitializer />
        <RealtimeInitializer />
        {children}
        <KeyboardShortcuts />
        <Toaster position="bottom-right" richColors closeButton />
      </QueryProvider>
    </ErrorBoundary>
  )
}
