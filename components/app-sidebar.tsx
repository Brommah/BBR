"use client"

import { Home, Bell, Kanban, ClipboardPlus, AtSign, LayoutDashboard, ClipboardCheck, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { useLeadStore } from "@/lib/store"
import { UserMenu } from "@/components/auth/user-menu"
import { useInboxCount, useNotificationCount } from "@/components/dashboard/dashboard-notifications"
import { cn } from "@/lib/utils"

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
    title: "Pipeline",
    url: "/pipeline",
    icon: Kanban,
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
    title: "Goedkeuringen",
    url: "/?tab=goedkeuringen",
    icon: ClipboardCheck,
    roles: ['admin'] as const,
    approvalBadge: true,
  },
  {
    title: "Meldingen",
    url: "/notifications",
    icon: AtSign,
    roles: ['admin', 'projectleider', 'engineer'] as const,
    notificationBadge: true, // @-mention notifications
  },
  {
    title: "Uren",
    url: "/?tab=uren",
    icon: Clock,
    roles: ['admin'] as const,
  },
]

// Distinct action items
const actionItems = [
  {
    title: "Nieuw Project",
    url: "/submit",
    icon: ClipboardPlus,
    roles: ['admin', 'projectleider'] as const,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { currentUser, isAuthenticated } = useAuthStore()
  const { leads } = useLeadStore()
  const inboxCount = useInboxCount()
  const notificationCount = useNotificationCount(currentUser?.name)
  const { state, setOpen, locked } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Count pending quote approvals
  const pendingApprovalsCount = leads.filter(l => l.quoteApproval === "pending").length

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(item => {
    if (!currentUser) return false
    return (item.roles as readonly string[]).includes(currentUser.role)
  })

  const visibleActions = actionItems.filter(item => {
    if (!currentUser) return false
    return (item.roles as readonly string[]).includes(currentUser.role)
  })

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-sidebar-border/50 bg-sidebar/95 backdrop-blur-xl shadow-[1px_0_8px_rgba(0,0,0,0.04)]"
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
      
      <SidebarContent className="p-2 flex flex-col justify-between">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleItems.map((item) => {
                // Determine notifications/badges
                const isMeldingen = 'notificationBadge' in item && item.notificationBadge
                const isInbox = 'dynamicBadge' in item && item.dynamicBadge
                const isApprovals = 'approvalBadge' in item && item.approvalBadge
                const isAdminHome = item.url === "/" && currentUser?.role === "admin"
                
                // Calculate badge count and visibility
                let badgeCount = 0
                let badgeColor = "bg-amber-500" // Default
                
                if (isMeldingen) {
                  badgeCount = notificationCount
                  badgeColor = "bg-amber-500"
                } else if (isInbox) {
                  badgeCount = inboxCount
                  badgeColor = "bg-rose-500"
                } else if (isApprovals) {
                  badgeCount = pendingApprovalsCount
                  badgeColor = "bg-amber-600"
                }

                const hasBadge = badgeCount > 0
                const displayTitle = isAdminHome ? "Admin Panel" : item.title
                const DisplayIcon = isAdminHome ? LayoutDashboard : item.icon
                
                // Check if active - handle query params
                const itemTab = item.url.includes('tab=') ? item.url.split('tab=')[1] : null
                const currentTab = searchParams.get('tab')
                const isUrlMatch = pathname === item.url.split('?')[0]
                const isActive = isUrlMatch && itemTab === currentTab
                
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    tooltip={displayTitle}
                    className="rounded-lg h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:font-medium data-[active=true]:shadow-sm"
                  >
                    <Link href={item.url} className="flex items-center px-3 overflow-hidden">
                      {/* Show icon, with notification badge overlay when collapsed */}
                      <div className="relative shrink-0">
                        <DisplayIcon className="w-5 h-5" />
                        {hasBadge && isCollapsed && (
                          <span className={cn(
                            "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-sidebar shadow-sm",
                            badgeColor
                          )}>
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        )}
                        {/* Always show a small dot for Meldingen even when expanded, if that's the style */}
                        {isMeldingen && hasBadge && !isCollapsed && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-sidebar shadow-sm" />
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
                  
                  {/* Show dedicated badge when NOT collapsed */}
                  {hasBadge && !isCollapsed && (
                    <SidebarMenuBadge 
                      className={cn(
                        "text-white border-none font-semibold text-[10px] min-w-5 h-5 flex items-center justify-center transition-opacity duration-200",
                        badgeColor
                      )}
                    >
                      {badgeCount}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto pt-4 border-t border-sidebar-border/50">
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="rounded-xl h-11 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    <Link href={item.url} className="flex items-center px-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span 
                        className="ml-3 font-semibold text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ease-out"
                        style={{ 
                          opacity: isCollapsed ? 0 : 1,
                          width: isCollapsed ? 0 : 'auto',
                          marginLeft: isCollapsed ? 0 : 12
                        }}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
