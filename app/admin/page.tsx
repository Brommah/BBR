"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { Loader2 } from "lucide-react"

/**
 * Admin page - redirects to home since the admin console is now the home page for admins.
 * This page exists for backwards compatibility with old links/bookmarks.
 */
export default function AdminPage() {
    const router = useRouter()
    const { currentUser, isAuthenticated, isInitialized } = useAuthStore()

    useEffect(() => {
        // Don't redirect until auth is initialized (prevents HMR redirect issues)
        if (!isInitialized) {
            return
        }
        
        // Redirect admins to home (which is now the admin console)
        if (isAuthenticated && currentUser?.role === 'admin') {
            router.replace('/')
        } else if (isAuthenticated) {
            // Non-admins should not access this page
            router.replace('/')
        } else {
            // Not authenticated, go to login
            router.replace('/login')
        }
    }, [isAuthenticated, currentUser, router, isInitialized])

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Doorsturen...</p>
        </div>
    )
}
