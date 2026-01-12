"use client"

import { useEffect } from "react"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { useLeadStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"

/**
 * Initializes the store by loading leads from database
 * Runs once on app mount
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
 * Includes error boundary, store initialization, and keyboard shortcuts
 */
export function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthInitializer />
      <StoreInitializer />
      {children}
      <KeyboardShortcuts />
    </ErrorBoundary>
  )
}
