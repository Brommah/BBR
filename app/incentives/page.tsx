"use client"

import { PerformanceDashboard } from "@/components/engineer-view/performance-dashboard"

export default function PerformancePage() {
    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">
                    Mijn Prestaties
                </h1>
                <p className="page-description">
                    Jouw performance metrics, klanttevredenheid en groeipotentieel op één plek.
                </p>
            </div>
            <PerformanceDashboard />
        </div>
    )
}
