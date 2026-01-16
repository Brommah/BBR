"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { sendPasswordResetByEmail } from "@/lib/rbac-actions"

/**
 * Get the default landing page based on user role
 * All users start on / - the home page shows role-appropriate content:
 * - Admin: sees admin console
 * - Projectleider: sees assigned projects with team management
 * - Engineer: sees their assigned work queue
 */
function getDefaultRoute(_role: string | undefined): string {
    return '/'
}

export function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isResetMode, setIsResetMode] = useState(false)
    const [isResetLoading, setIsResetLoading] = useState(false)
    
    const { login, isLoading, error, clearError } = useAuthStore()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()
        
        if (!email.trim() || !password) {
            toast.error("Vul alle velden in")
            return
        }
        
        const success = await login(email, password)
        
        if (success) {
            toast.success("Welkom terug!", {
                description: "Je bent succesvol ingelogd."
            })
            // Get fresh state after login to determine role-based redirect
            const { currentUser: user } = useAuthStore.getState()
            router.push(getDefaultRoute(user?.role))
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) {
            toast.error("Vul je e-mailadres in")
            return
        }

        setIsResetLoading(true)
        const result = await sendPasswordResetByEmail(email)
        setIsResetLoading(false)

        if (result.success) {
            toast.success("E-mail verzonden", {
                description: "Check je inbox voor de instructies om je wachtwoord te resetten."
            })
            setIsResetMode(false)
        } else {
            toast.error(result.error || "Kon reset e-mail niet verzenden")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            
            <Card className="w-full max-w-md relative z-10 border-slate-700 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
                <CardHeader className="text-center pb-2">
                    {/* Logo */}
                    <div className="mx-auto w-24 h-24 mb-4 relative">
                        <Image 
                            src="/branding/logo-white-gold.png"
                            alt="Bureau Broersma Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <CardTitle className="text-2xl font-semibold text-white">
                        {isResetMode ? "Wachtwoord herstellen" : "Broersma Engineer OS"}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        {isResetMode 
                            ? "Voer je e-mailadres in om een herstellink te ontvangen." 
                            : "Log in om toegang te krijgen tot het backoffice systeem."}
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-4">
                    {/* Error message */}
                    {!isResetMode && error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {isResetMode ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    type="email"
                                    placeholder="E-mailadres"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                                    required
                                    disabled={isResetLoading}
                                    autoComplete="email"
                                />
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold disabled:opacity-50"
                                disabled={isResetLoading}
                            >
                                {isResetLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Versturen...
                                    </>
                                ) : (
                                    "Stuur herstellink"
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setIsResetMode(false)}
                                className="w-full text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                                disabled={isResetLoading}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Terug naar inloggen
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    type="email"
                                    placeholder="E-mailadres"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                                    required
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                            
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Wachtwoord"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                                    required
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsResetMode(true)}
                                    className="text-xs text-amber-500/70 hover:text-amber-500 transition-colors"
                                    disabled={isLoading}
                                >
                                    Wachtwoord vergeten?
                                </button>
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Inloggen...
                                    </>
                                ) : (
                                    "Inloggen"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                
                <CardFooter className="justify-center pt-0 pb-6 flex-col gap-2">
                    <p className="text-xs text-slate-500 text-center">
                        Gebruik je Broersma account om in te loggen.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
