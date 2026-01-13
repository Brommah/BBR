"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

interface AppLayoutWrapperProps {
  children: React.ReactNode
}

// Routes that don't show the sidebar (public pages)
const NO_SIDEBAR_ROUTES = ["/login", "/intake"]

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname()
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname)

  if (!showSidebar) {
    // Full-page layout without sidebar
    return (
      <main className="w-full min-h-screen">
        {children}
      </main>
    )
  }

  // Standard layout with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full min-h-screen relative flex flex-col">
        <div className="absolute top-4 left-4 z-50 md:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  )
}
