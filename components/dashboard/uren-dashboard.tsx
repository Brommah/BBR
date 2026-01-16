"use client"

import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { useAuthStore } from "@/lib/auth"
import { TeamHoursOverview } from "@/components/admin/team-hours-overview"

/**
 * UrenDashboard - Dedicated tab for team hours overview
 * For admin/projectleider: shows detailed team hours with budget tracking
 * For engineers: no access
 */
export function UrenDashboard() {
  const { currentUser } = useAuthStore()
  const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'projectleider'

  return (
    <div className="space-y-6">
      {/* Team Hours Overview - Only for admin/projectleider */}
      {isManagerOrAdmin ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TeamHoursOverview />
        </motion.div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Geen toegang tot team uren overzicht</p>
        </div>
      )}
    </div>
  )
}
