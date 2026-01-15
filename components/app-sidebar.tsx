"use client"

import { Home, Bell, Kanban, ClipboardPlus, AtSign, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { UserMenu } from "@/components/auth/user-menu"
import { useInboxCount, useNotificationCount } from "@/components/dashboard/dashboard-notifications"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar"

// Menu items - some are role-restricted
const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    roles: ['admin', 'projectleider', 'engineer'] as const,
  },
  {
    title: "Nieuw Project",
    url: "/submit",
    icon: ClipboardPlus,
    roles: ['admin', 'projectleider'] as const,
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: Bell,
    roles: ['admin'] as const,
    dynamicBadge: true, // Will be populated with actual inbox count
  },
  {
    title: "Pipeline",
    url: "/pipeline",
    icon: Kanban,
    roles: ['admin', 'projectleider'] as const,
  },
  {
    title: "Meldingen",
    url: "/notifications",
    icon: AtSign,
    roles: ['admin', 'projectleider', 'engineer'] as const,
    notificationBadge: true, // @-mention notifications
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { currentUser, isAuthenticated } = useAuthStore()
  const inboxCount = useInboxCount()
  const notificationCount = useNotificationCount(currentUser?.name)
  const { state, setOpen, locked } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(item => {
    if (!currentUser) return false // No menu items for unauthenticated users
    return (item.roles as readonly string[]).includes(currentUser.role)
  })

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => !locked && setOpen(false)}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center h-14 px-3 overflow-hidden">
          <div className="w-8 h-8 shrink-0 relative">
            <Image 
              src="https://www.bureau-broersma.nl/wp-content/uploads/2015/09/logo-white-gold.png" 
              alt="Bureau Broersma Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <span 
            className="ml-3 font-semibold text-sm text-sidebar-foreground whitespace-nowrap overflow-hidden transition-all duration-200 ease-out"
            style={{ 
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : 'auto',
              marginLeft: isCollapsed ? 0 : 12
            }}
          >
            Bureau Broersma
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleItems.map((item) => {
                // Check if this is the notifications item and has unread notifications
                const hasNotifications = 'notificationBadge' in item && item.notificationBadge && notificationCount > 0
                
                // Show "Admin Panel" for admin users on the Home item
                const isAdminHome = item.url === "/" && currentUser?.role === "admin"
                const displayTitle = isAdminHome ? "Admin Panel" : item.title
                const DisplayIcon = isAdminHome ? LayoutDashboard : item.icon
                
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={displayTitle}
                    className="rounded-lg h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:font-medium data-[active=true]:shadow-sm"
                  >
                    <Link href={item.url} className="flex items-center px-3 overflow-hidden">
                      {/* Show icon, with notification badge overlay when there are notifications */}
                      <div className="relative shrink-0">
                        <DisplayIcon className="w-5 h-5" />
                        {hasNotifications && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-sidebar shadow-sm">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </span>
                        )}
                      </div>
                      <span 
                        className="ml-3 text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ease-out"
                        style={{ 
                          opacity: isCollapsed ? 0 : 1,
                          width: isCollapsed ? 0 : 'auto',
                          marginLeft: isCollapsed ? 0 : 12
                        }}
                      >
                        {displayTitle}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                  {'dynamicBadge' in item && item.dynamicBadge && inboxCount > 0 && (
                    <SidebarMenuBadge 
                      className="bg-rose-500 text-white border-none font-semibold text-[10px] min-w-5 h-5 flex items-center justify-center transition-opacity duration-200"
                      style={{ opacity: isCollapsed ? 0 : 1 }}
                    >
                      {inboxCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-2">
        {isAuthenticated && currentUser ? (
          <UserMenu />
        ) : (
          <div className="flex items-center rounded-lg h-10 px-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              ?
            </div>
            <div 
              className="ml-3 flex-1 min-w-0 overflow-hidden transition-all duration-200 ease-out"
              style={{ 
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : 'auto',
                marginLeft: isCollapsed ? 0 : 12
              }}
            >
              <p className="text-sm text-muted-foreground whitespace-nowrap">Niet ingelogd</p>
              <Link href="/login" className="text-xs text-primary hover:underline whitespace-nowrap">
                Inloggen
              </Link>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
