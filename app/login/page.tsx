"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

/**
 * Get the default landing page based on user role
 * - Admin: starts on /admin
 * - Engineer/Viewer: starts on / (werkvoorraad/werken)
 */
function getDefaultRoute(role: string | undefined): string {
    return role === 'admin' ? '/admin' : '/'
}

export default function LoginPage() {
    const { isAuthenticated, checkSession, currentUser } = useAuthStore()
    const router = useRouter()

    // Check session on mount
    useEffect(() => {
        checkSession()
    }, [checkSession])

    // Redirect based on role if authenticated
    useEffect(() => {
        if (isAuthenticated && currentUser) {
            router.push(getDefaultRoute(currentUser.role))
        }
    }, [isAuthenticated, currentUser, router])

    // Always show the login form - the redirect will happen via useEffect
    // This prevents blank screen issues
    return <LoginForm />
}
