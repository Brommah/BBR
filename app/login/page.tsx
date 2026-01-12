"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
    const { isAuthenticated } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/")
        }
    }, [isAuthenticated, router])

    // If already authenticated, don't show login
    if (isAuthenticated) {
        return null
    }

    return <LoginForm />
}
