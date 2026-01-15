"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface AppLayoutWrapperProps {
  children: React.ReactNode
}

// Routes that don't show the sidebar (public pages)
const NO_SIDEBAR_ROUTES = ["/login", "/intake", "/offerte", "/algemene-voorwaarden"]

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname()
  // Check if pathname matches or starts with any no-sidebar route
  const showSidebar = !NO_SIDEBAR_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (!showSidebar) {
    // Full-page layout without sidebar
    return (
      <main className="w-full min-h-screen">
        {children}
      </main>
    )
  }

  // Standard layout with sidebar - starts collapsed, expands on hover
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <main className="flex-1 min-h-screen relative flex flex-col overflow-hidden">
        <div className="absolute top-4 left-4 z-50 md:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  )
}
