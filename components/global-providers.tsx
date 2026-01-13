"use client"

import { useEffect } from "react"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { useLeadStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/sonner"
import { WalkthroughProvider } from "@/components/walkthrough"
import { QueryProvider } from "@/lib/query-client"

/**
 * Initializes the store by loading leads from database
 * Runs once on app mount when authenticated
 */
function StoreInitializer() {
  const loadLeads = useLeadStore(state => state.loadLeads)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  
  useEffect(() => {
    // Only load leads if authenticated
    if (isAuthenticated) {
      loadLeads()
    }
  }, [loadLeads, isAuthenticated])
  
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
 * Global providers wrapper
 * Includes:
 * - Error boundary for catching runtime errors
 * - React Query for server state management
 * - Auth initialization
 * - Store initialization (Zustand for client state)
 * - Keyboard shortcuts
 * - Toast notifications
 * - Introduction walkthrough
 */
export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthInitializer />
        <StoreInitializer />
        {children}
        <KeyboardShortcuts />
        <WalkthroughProvider />
        <Toaster position="bottom-right" richColors closeButton />
      </QueryProvider>
    </ErrorBoundary>
  )
}
