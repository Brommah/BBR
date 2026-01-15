"use client"

import { useAuthStore } from "@/lib/auth"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { EngineerDashboard } from "@/components/dashboard/engineer-dashboard"
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLeadStore } from "@/lib/store"

/**
 * Home page - shows different dashboards based on user role:
 * - Admin: Full admin console with approvals, team overview, settings
 * - Engineer: Personal work queue and project focus
 * - Viewer/Unauthenticated: Login prompt
 */
export default function HomePage() {
  const router = useRouter()
  const { currentUser, isAuthenticated } = useAuthStore()
  const { isLoading } = useLeadStore()

  // Show skeleton loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="page-container">
        <DashboardSkeleton />
      </div>
    )
  }

  // Show login prompt if not authenticated
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
    return <AdminDashboard />
  }

  // Engineers and other roles see the engineer dashboard
  return <EngineerDashboard />
}
