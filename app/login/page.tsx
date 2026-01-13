"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
    const { isAuthenticated, checkSession } = useAuthStore()
    const router = useRouter()

    // Check session on mount
    useEffect(() => {
        checkSession()
    }, [checkSession])

    // Redirect to home if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/")
        }
    }, [isAuthenticated, router])

    // Always show the login form - the redirect will happen via useEffect
    // This prevents blank screen issues
    return <LoginForm />
}
