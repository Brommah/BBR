"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth"
import { useWalkthroughStore } from "@/lib/walkthrough"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, ChevronUp, Sparkles, BookOpen } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"

export function UserMenu() {
    const { currentUser, isAuthenticated, logout, isAdmin } = useAuthStore()
    const { startWalkthrough } = useWalkthroughStore()
    const router = useRouter()
    const { setOpen, setLocked } = useSidebar()
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const handleLogout = () => {
        logout()
        toast.info("Uitgelogd", {
            description: "Tot ziens!"
        })
        router.push("/login")
    }

    const handleStartWalkthrough = () => {
        startWalkthrough()
        toast.info("Rondleiding gestart", {
            description: "Navigeer door alle functies van het systeem."
        })
    }

    if (!isAuthenticated || !currentUser) {
        return (
            <Button variant="outline" size="sm" asChild>
                <Link href="/login">Inloggen</Link>
            </Button>
        )
    }

    const initials = currentUser.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const roleLabel = currentUser.role === 'admin' 
        ? 'Admin' 
        : currentUser.role === 'projectleider' 
            ? 'Projectleider' 
            : 'Engineer'

    // Handle dropdown open/close and keep sidebar open while dropdown is open
    const handleOpenChange = (open: boolean) => {
        setDropdownOpen(open)
        setLocked(open) // Lock sidebar open when dropdown is open
        if (open) {
            setOpen(true) // Ensure sidebar is expanded when dropdown opens
        }
    }

    return (
        <DropdownMenu open={dropdownOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full rounded-lg hover:bg-sidebar-accent transition-all duration-200 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center p-2 group-data-[collapsible=icon]:p-1">
                    <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-border transition-all duration-200 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9">
                        {currentUser.avatar && (
                            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                        )}
                        <AvatarFallback className={currentUser.role === 'admin' 
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white text-sm font-semibold'
                            : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-semibold'
                        }>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 transition-all duration-200 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                            {currentUser.name}
                        </p>
                        <p className="text-xs text-sidebar-foreground/60 truncate">
                            {roleLabel}
                        </p>
                    </div>
                    <ChevronUp className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-all duration-200 shrink-0 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                side="top" 
                align="start"
                className="w-56 mb-2"
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleStartWalkthrough}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Rondleiding
                </DropdownMenuItem>
                {isAdmin() && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Instellingen
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/roadmap" className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Wat is nieuw?
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Uitloggen
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/**
 * Compact user menu for navbar/header
 */
export function UserMenuCompact() {
    const { currentUser, isAuthenticated } = useAuthStore()

    if (!isAuthenticated || !currentUser) {
        return null
    }

    const initials = currentUser.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                {currentUser.avatar && (
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                )}
                <AvatarFallback className={currentUser.role === 'admin' 
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xs font-semibold'
                    : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-semibold'
                }>
                    {initials}
                </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden md:inline">{currentUser.name}</span>
        </div>
    )
}
