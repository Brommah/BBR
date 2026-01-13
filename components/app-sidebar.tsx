"use client"

import { Home, Bell, Kanban, Shield, ClipboardPlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { UserMenu } from "@/components/auth/user-menu"
import { useInboxCount } from "@/components/dashboard/dashboard-notifications"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"

// Menu items - some are role-restricted
const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    roles: ['admin', 'engineer', 'viewer'] as const,
  },
  {
    title: "Nieuw Project",
    url: "/submit",
    icon: ClipboardPlus,
    roles: ['admin'] as const,
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: Bell,
    roles: ['admin', 'engineer'] as const,
    dynamicBadge: true, // Will be populated with actual inbox count
  },
  {
    title: "Pipeline",
    url: "/pipeline",
    icon: Kanban,
    roles: ['admin'] as const,
  },
  {
    title: "Admin",
    url: "/admin",
    icon: Shield,
    roles: ['admin'] as const,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { currentUser, isAuthenticated } = useAuthStore()
  const inboxCount = useInboxCount()

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(item => {
    if (!currentUser) return (item.roles as readonly string[]).includes('viewer')
    return (item.roles as readonly string[]).includes(currentUser.role)
  })

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-36 h-14 mb-1">
            <Image 
              src="https://www.bureau-broersma.nl/wp-content/uploads/2015/09/logo-white-gold.png" 
              alt="Bureau Broersma Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60 font-medium">
            Engineer OS
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold mb-2 px-2">
            Navigatie
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-10 px-3 rounded-md transition-all duration-150 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:font-medium"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                      {item.roles.length === 1 && item.roles[0] === 'admin' && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          Admin
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                  {'dynamicBadge' in item && item.dynamicBadge && inboxCount > 0 && (
                    <SidebarMenuBadge className="bg-rose-500 text-white border-none font-semibold text-[10px] min-w-5 h-5 flex items-center justify-center">
                      {inboxCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {isAuthenticated && currentUser ? (
          <UserMenu />
        ) : (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              ?
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Niet ingelogd</p>
              <Link href="/login" className="text-xs text-primary hover:underline">
                Inloggen
              </Link>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
