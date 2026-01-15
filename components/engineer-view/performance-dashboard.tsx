"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    Trophy, Zap, Target, TrendingUp, Star, Flame, Award, Euro,
    MessageSquare, Sparkles, ThumbsUp, ArrowUp
} from "lucide-react"
import { INCENTIVE_TIERS, XP_ACTIONS, getTierForXp } from "@/lib/incentives"
import { IsoTrophy } from "@/components/ui/illustrations"
import { getEngineerLeaderboard, getEngineerStats, EngineerStats } from "@/lib/db-actions"
import { useCurrentUser } from "@/lib/auth"

interface LeaderboardEntry {
    name: string
    avatar: string
    quotesWon: number
    revenue: number
    hoursLogged: number
}

const xpActions = [
    { action: "Offerte gewonnen", xp: 100, icon: Trophy },
    { action: "5-sterren review", xp: 50, icon: Star },
    { action: "Offerte verzonden", xp: 25, icon: TrendingUp },
    { action: "Reactie < 2 uur", xp: 15, icon: Zap },
]

export function PerformanceDashboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [myStats, setMyStats] = useState<{
        quotesGenerated: number
        quotesWon: number
        revenue: number
        avgResponseTimeHours: number
        conversionRate: number
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const currentUser = useCurrentUser()

    // Fetch leaderboard and user stats
    useEffect(() => {
        let isMounted = true

        async function loadData() {
            setIsLoading(true)
            try {
                // Fetch leaderboard
                const leaderboardResult = await getEngineerLeaderboard()
                if (isMounted && leaderboardResult.success && leaderboardResult.data) {
                    setLeaderboard(leaderboardResult.data as LeaderboardEntry[])
                }

                // Fetch current user's stats
                if (currentUser?.name) {
                    const statsResult = await getEngineerStats(currentUser.name)
                    if (isMounted && statsResult.success && statsResult.data) {
                        setMyStats(statsResult.data as typeof myStats)
                    }
                }
            } catch (error) {
                console.error('[PerformanceDashboard] Failed to load data:', error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [currentUser?.name])

    // Calculate XP based on real performance
    const calculateXP = () => {
        if (!myStats) return 0
        return (myStats.quotesWon * 100) + (myStats.quotesGenerated * 25)
    }

    const xp = calculateXP()
    const { current: currentTier, next: nextTier } = getTierForXp(xp)
    const xpToNext = nextTier ? nextTier.minXP : currentTier.minXP + 1000
    const xpProgress = nextTier ? ((xp - currentTier.minXP) / (nextTier.minXP - currentTier.minXP)) * 100 : 100
    const conversionRate = myStats?.conversionRate || 0

    // NPS data (would come from feedback system in production)
    const npsScore = 0 // Not implemented yet
    const promoters = 0
    const passives = 0
    const detractors = 0

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                    <Skeleton className="lg:col-span-2 h-64" />
                    <Skeleton className="h-64" />
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-5">
                    <Skeleton className="lg:col-span-3 h-80" />
                    <Skeleton className="lg:col-span-2 h-80" />
                </div>
            </div>
        )
    }

    const myRank = leaderboard.findIndex(e => e.name === currentUser?.name) + 1

    return (
        <div className="space-y-6">
            {/* Hero: Engineer Profile + NPS Combined */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Hero */}
                <Card className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute -right-8 -bottom-8 w-64 h-64 opacity-5 pointer-events-none rotate-12">
                        <IsoTrophy />
                    </div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    
                    <CardHeader className="pb-2 relative z-10">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/30 ring-2 ring-white/20">
                                    {currentUser?.name?.[0] || "?"}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl tracking-tight">{currentUser?.name || "Engineer"}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-medium">
                                            {currentTier.name}
                                        </Badge>
                                        {myRank > 0 && (
                                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-medium">
                                                #{myRank} Ranking
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
                                    <div className="flex items-center gap-1.5 text-amber-400 justify-center">
                                        <Trophy className="w-5 h-5" />
                                        <span className="text-2xl font-bold">{myStats?.quotesWon || 0}</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-white/50">Gewonnen</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-5 relative z-10">
                        {/* XP Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm items-end">
                                <span className="text-white/70 font-medium">XP naar {nextTier?.name || "Max Level"}</span>
                                <span className="font-mono text-amber-300 text-base">{xp.toLocaleString()} <span className="text-white/40 text-xs">/ {xpToNext.toLocaleString()}</span></span>
                            </div>
                            <div className="relative h-4 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10">
                                <div 
                                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 transition-all duration-700 ease-out"
                                    style={{ width: `${Math.min(xpProgress, 100)}%` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-amber-400">{xp}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/50">XP Totaal</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-emerald-400">{conversionRate}%</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/50">Conversie</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-400">{myStats?.quotesGenerated || 0}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/50">Offertes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* NPS Score Card */}
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
                    <CardHeader className="pb-2 text-center">
                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Klanttevredenheid</span>
                        </div>
                        <CardTitle className="text-5xl font-bold tracking-tight">{npsScore}</CardTitle>
                        <CardDescription className="text-sm">Net Promoter Score</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Promoters
                                </span>
                                <span className="font-semibold">{promoters}%</span>
                            </div>
                            <Progress value={promoters} className="h-2" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    Passives
                                </span>
                                <span className="font-semibold">{passives}%</span>
                            </div>
                            <Progress value={passives} className="h-2" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                    Detractors
                                </span>
                                <span className="font-semibold">{detractors}%</span>
                            </div>
                            <Progress value={detractors} className="h-2" />
                        </div>
                    </CardContent>
                    <CardFooter className="text-[10px] text-muted-foreground justify-center pt-2 border-t">
                        Gebaseerd op 50 reviews • Laatste 30 dagen
                    </CardFooter>
                </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">Conversie</p>
                                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{conversionRate}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-400 font-semibold">Reactietijd</p>
                                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{myStats?.avgResponseTimeHours || 0}u</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-sm">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-purple-700 dark:text-purple-400 font-semibold">Offertes</p>
                                <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{myStats?.quotesGenerated || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
                                <Euro className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold">Omzet</p>
                                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">€{((myStats?.revenue || 0) / 1000).toFixed(0)}k</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20 border-rose-200/50 dark:border-rose-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-sm">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-400 font-semibold">Gewonnen</p>
                                <p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{myStats?.quotesWon || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Recent Activity - Takes 3 cols */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                                    Prestatie Overzicht
                                </CardTitle>
                                <CardDescription>Je prestaties deze maand</CardDescription>
                            </div>
                            {conversionRate > 0 && (
                                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                    {conversionRate}% conversie
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {myStats?.quotesGenerated === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
                                <p className="text-sm font-medium">Nog geen activiteit deze maand</p>
                                <p className="text-xs mt-1">Genereer offertes om XP te verdienen</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Stats Summary */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-center">
                                        <p className="text-3xl font-bold text-emerald-600">{myStats?.quotesGenerated || 0}</p>
                                        <p className="text-xs text-muted-foreground">Offertes gemaakt</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-center">
                                        <p className="text-3xl font-bold text-amber-600">{myStats?.quotesWon || 0}</p>
                                        <p className="text-xs text-muted-foreground">Opdrachten</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-center">
                                        <p className="text-3xl font-bold text-purple-600">€{((myStats?.revenue || 0) / 1000).toFixed(0)}k</p>
                                        <p className="text-xs text-muted-foreground">Omzet</p>
                                    </div>
                                </div>
                                
                                {/* XP Breakdown */}
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                    <h4 className="text-sm font-semibold mb-3">XP Verdiend</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Offertes verzonden ({myStats?.quotesGenerated || 0} × 25 XP)</span>
                                            <span className="font-mono font-medium">+{(myStats?.quotesGenerated || 0) * 25}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Offertes gewonnen ({myStats?.quotesWon || 0} × 100 XP)</span>
                                            <span className="font-mono font-medium">+{(myStats?.quotesWon || 0) * 100}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-sm font-semibold">
                                            <span>Totaal XP</span>
                                            <span className="font-mono text-amber-600">{xp}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: Leaderboard + XP */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Compact Leaderboard */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Team Ranking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {leaderboard.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nog geen leaderboard data</p>
                                </div>
                            ) : (
                                leaderboard.slice(0, 5).map((engineer, index) => (
                                    <div 
                                        key={engineer.name}
                                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                            engineer.name === currentUser?.name
                                                ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-800' 
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                                            index === 0 ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30' :
                                            index === 1 ? 'bg-slate-400 text-white' :
                                            index === 2 ? 'bg-amber-700 text-white' :
                                            'bg-slate-300 text-slate-700'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{engineer.name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {engineer.quotesWon} won • €{engineer.revenue.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            <span className="text-sm font-bold">{engineer.hoursLogged}u</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* XP & Bonus Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Award className="w-5 h-5 text-purple-500" />
                                XP & Bonus
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Compact XP Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                {xpActions.map((item) => (
                                    <div key={item.action} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <item.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-[11px] text-muted-foreground truncate">{item.action}</span>
                                        <Badge variant="secondary" className="ml-auto text-[10px] font-mono shrink-0">+{item.xp}</Badge>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Bonus Tiers Compact */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Maandbonus Tiers</p>
                                {INCENTIVE_TIERS.slice(1).map((tier) => {
                                    const unlocked = xp >= tier.minXP
                                    return (
                                        <div 
                                            key={tier.level}
                                            className={`flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                                                unlocked 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-200 dark:ring-emerald-800 shadow-sm' 
                                                    : 'bg-slate-50 dark:bg-slate-800/30 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${tier.colorClass}`} />
                                                <span className={unlocked ? 'font-medium' : 'text-muted-foreground'}>{tier.name}</span>
                                            </div>
                                            <span className={`font-bold ${unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                                €{tier.monthlyBonusEur}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
