"use client"

import { useAuthStore } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User, Shield, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// Note: You need to create the dropdown-menu component if it doesn't exist
// For now, using a simpler approach

export function UserMenu() {
    const { currentUser, isAuthenticated, logout, isAdmin } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        toast.info("Uitgelogd", {
            description: "Tot ziens!"
        })
        router.push("/login")
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
        ? 'Beheerder' 
        : currentUser.role === 'engineer' 
            ? 'Engineer' 
            : 'Viewer'

    const roleColor = currentUser.role === 'admin'
        ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800'
        : currentUser.role === 'engineer'
            ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800'
            : 'bg-slate-500/10 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-700'

    return (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
            <Avatar className="h-10 w-10">
                <AvatarFallback className={currentUser.role === 'admin' 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }>
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {currentUser.name}
                </p>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${roleColor}`}>
                        {currentUser.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {roleLabel}
                    </Badge>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {isAdmin() && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        asChild
                    >
                        <Link href="/admin">
                            <Settings className="h-4 w-4" />
                        </Link>
                    </Button>
                )}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

/**
 * Compact user menu for navbar/header
 */
export function UserMenuCompact() {
    const { currentUser, isAuthenticated, logout, isAdmin } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        toast.info("Uitgelogd", { description: "Tot ziens!" })
        router.push("/login")
    }

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
                <AvatarFallback className={currentUser.role === 'admin' 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs'
                }>
                    {initials}
                </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden md:inline">{currentUser.name}</span>
        </div>
    )
}
