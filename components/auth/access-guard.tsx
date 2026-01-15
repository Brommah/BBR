"use client"

import { useAuthStore, Permission } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode, useSyncExternalStore, useCallback } from "react"
import { toast } from "sonner"

interface AccessGuardProps {
    children: ReactNode
    /** Required permission to access this content */
    permission?: Permission
    /** Required role(s) to access this content */
    roles?: Array<'admin' | 'projectleider' | 'engineer'>
    /** Fallback component when access denied */
    fallback?: ReactNode
    /** Redirect path when not authenticated */
    redirectTo?: string
}

// Hydration detection using useSyncExternalStore (no cascading renders)
const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

function useIsHydrated() {
    return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
}

/**
 * Access Guard - Protects routes/components based on user permissions
 * 
 * Usage:
 * <AccessGuard permission="admin:access">
 *   <AdminPanel />
 * </AccessGuard>
 * 
 * <AccessGuard roles={['admin', 'engineer']}>
 *   <SensitiveContent />
 * </AccessGuard>
 */
export function AccessGuard({ 
    children, 
    permission, 
    roles, 
    fallback,
    redirectTo = "/"
}: AccessGuardProps) {
    const { isAuthenticated, currentUser, hasPermission, isInitialized } = useAuthStore()
    const router = useRouter()
    const isHydrated = useIsHydrated()

    const handleRedirect = useCallback(() => {
        toast.error("Niet ingelogd", {
            description: "Log in om toegang te krijgen."
        })
        router.push(redirectTo)
    }, [router, redirectTo])

    useEffect(() => {
        // Only redirect after hydration AND auth initialization is complete
        // This prevents false redirects during HMR
        if (isHydrated && isInitialized && !isAuthenticated) {
            handleRedirect()
        }
    }, [isAuthenticated, isHydrated, isInitialized, handleRedirect])

    // Show loading state during hydration or auth initialization
    if (!isHydrated || !isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-muted-foreground">Laden...</div>
            </div>
        )
    }

    if (!isAuthenticated || !currentUser) {
        return fallback || null
    }

    // Check permission
    if (permission && !hasPermission(permission)) {
        return fallback || <AccessDenied />
    }

    // Check roles
    if (roles && roles.length > 0 && !roles.includes(currentUser.role)) {
        return fallback || <AccessDenied />
    }

    return <>{children}</>
}

function AccessDenied() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg 
                        className="w-8 h-8 text-destructive" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    Geen Toegang
                </h3>
                <p className="text-muted-foreground text-sm">
                    Je hebt geen rechten om deze pagina te bekijken.
                    Neem contact op met een beheerder als je denkt dat dit een fout is.
                </p>
            </div>
        </div>
    )
}

/**
 * Hook to conditionally render based on permission
 */
export function useCanAccess(permission: Permission): boolean {
    return useAuthStore(state => state.hasPermission(permission))
}

/**
 * Component to conditionally render based on permission
 */
export function Can({ 
    permission, 
    children, 
    fallback = null 
}: { 
    permission: Permission
    children: ReactNode
    fallback?: ReactNode 
}) {
    const canAccess = useCanAccess(permission)
    return canAccess ? <>{children}</> : <>{fallback}</>
}
