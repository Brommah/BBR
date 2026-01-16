"use client"

import { useAuthStore } from "@/lib/auth"
import { Suspense } from "react"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { EngineerDashboard } from "@/components/dashboard/engineer-dashboard"
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

/**
 * Home page - shows different dashboards based on user role:
 * - Admin: Full admin console with approvals, team overview, settings
 * - Projectleider: Project oversight with team assignment capabilities
 * - Engineer: Personal work queue and project focus
 * - Unauthenticated: Login prompt
 */
export default function HomePage() {
  const router = useRouter()
  const { currentUser, isAuthenticated, isInitialized, isLoading: authLoading } = useAuthStore()

  // Wait for auth to initialize before making any auth-based decisions
  // This prevents flashing login screen during HMR
  if (!isInitialized || authLoading) {
    // If we have a persisted user, show skeleton (likely still logged in)
    // Otherwise show a neutral loading state
    if (currentUser) {
      return (
        <div className="page-container">
          <DashboardSkeleton />
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Laden...</p>
      </div>
    )
  }

  // NOTE: We no longer check leadsLoading here because it causes an infinite loop.
  // When leadsLoading is true, this component renders DashboardSkeleton, which 
  // unmounts EngineerDashboard (destroying its hasLoadedRef). When loading finishes,
  // EngineerDashboard remounts with a new ref and calls loadLeads() again → infinite loop.
  // Dashboard components now handle their own loading states internally.

  // Show login prompt if not authenticated (only after auth is initialized)
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-semibold mb-4">Welkom bij Broersma Engineer OS</h1>
          <p className="text-muted-foreground mb-6">Log in om je dashboard te bekijken.</p>
          <Button onClick={() => router.push('/login')}>
            Inloggen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Admin users see the admin console as their home
  if (currentUser.role === 'admin') {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    )
  }

  // Engineers and other roles see the engineer dashboard
  return <EngineerDashboard />
}
