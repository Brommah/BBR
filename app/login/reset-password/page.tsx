"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { toast } from "sonner"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = getSupabaseBrowserClient()

    useEffect(() => {
        // Check if we have a session (Supabase handles the token in the URL automatically)
        const checkSession = async () => {
            const { data: { session } } = await supabase!.auth.getSession()
            if (!session) {
                setError("Sessie verlopen of ongeldig. Vraag een nieuwe herstellink aan.")
            }
        }
        checkSession()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            toast.error("Wachtwoord moet minimaal 6 tekens bevatten")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Wachtwoorden komen niet overeen")
            return
        }

        setIsLoading(true)
        try {
            const { error } = await supabase!.auth.updateUser({
                password: password
            })

            if (error) {
                setError(error.message)
                toast.error(error.message)
            } else {
                setIsSuccess(true)
                toast.success("Wachtwoord succesvol gewijzigd")
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Onbekende fout"
            setError(msg)
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            
            <Card className="w-full max-w-md relative z-10 border-slate-700 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
                <CardHeader className="text-center pb-2">
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
                        Nieuw wachtwoord instellen
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Voer een nieuw wachtwoord in voor je account.
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-4">
                    {isSuccess ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-green-500" />
                            </div>
                            <p className="text-white font-medium">Je wachtwoord is gewijzigd!</p>
                            <p className="text-slate-400 text-sm">Je wordt over enkele seconden doorgestuurd naar het inlogscherm...</p>
                            <Button 
                                onClick={() => router.push("/login")}
                                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                            >
                                Direct naar inloggen
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nieuw wachtwoord"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                                    required
                                    disabled={isLoading || !!error}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Bevestig wachtwoord"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 pr-10 h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                                    required
                                    disabled={isLoading || !!error}
                                />
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold disabled:opacity-50"
                                disabled={isLoading || !!error}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Bezig met opslaan...
                                    </>
                                ) : (
                                    "Wachtwoord opslaan"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
