"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Zap, Target, TrendingUp, Star, Flame, Award, Euro } from "lucide-react"
import { INCENTIVE_TIERS, XP_ACTIONS, getTierForXp } from "@/lib/incentives"
import { getEngineerLeaderboard, getEngineerStats, EngineerStats } from "@/lib/db-actions"
import { useCurrentUser } from "@/lib/auth"

interface LeaderboardEntry {
    name: string
    avatar: string
    quotesWon: number
    revenue: number
    hoursLogged: number
}

export function IncentiveDashboard() {
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
                console.error('[IncentiveDashboard] Failed to load data:', error)
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

    // Calculate XP based on real performance (simplified formula)
    const calculateXP = () => {
        if (!myStats) return 0
        return (myStats.quotesWon * 100) + (myStats.quotesGenerated * 25)
    }

    const xp = calculateXP()
    const { current: currentTier, next: nextTier } = getTierForXp(xp)
    const xpToNext = nextTier ? nextTier.minXP : currentTier.minXP + 1000
    const xpProgress = nextTier ? ((xp - currentTier.minXP) / (nextTier.minXP - currentTier.minXP)) * 100 : 100
    const conversionRate = myStats?.conversionRate || 0
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <div className="grid gap-4 md:grid-cols-5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    const myRank = leaderboard.findIndex(e => e.name === currentUser?.name) + 1

    return (
        <div className="space-y-6">
            {/* Hero Card - Current Status */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/30">
                                {currentUser?.name?.[0] || "?"}
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{currentUser?.name || "Engineer"}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                                        {currentTier.name}
                                    </Badge>
                                    {myRank > 0 && (
                                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                            #{myRank} Leaderboard
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-amber-400">
                                <Trophy className="w-5 h-5" />
                                <span className="text-2xl font-bold">{myStats?.quotesWon || 0}</span>
                                <span className="text-sm text-white/60">gewonnen</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* XP Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/60">XP Progress naar {nextTier?.name || "Max Level"}</span>
                            <span className="font-mono">{xp.toLocaleString()} / {xpToNext.toLocaleString()}</span>
                        </div>
                        <div className="relative">
                            <Progress value={xpProgress} className="h-3 bg-white/10" />
                            <div 
                                className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                                style={{ width: `${Math.min(xpProgress, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 pt-2">
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

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Conversie</p>
                                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{conversionRate}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Reactietijd</p>
                                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{myStats?.avgResponseTimeHours || 0}u</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">Offertes</p>
                                <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{myStats?.quotesGenerated || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue card hidden per management request - engineers focus on hours not revenue */}

                <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Gewonnen</p>
                                <p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{myStats?.quotesWon || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Leaderboard */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            Leaderboard - {new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nog geen leaderboard data</p>
                            </div>
                        ) : (
                            leaderboard.slice(0, 5).map((engineer, index) => (
                                <div 
                                    key={engineer.name}
                                    className={`flex items-center gap-4 p-3 rounded-lg ${
                                        engineer.name === currentUser?.name ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' :
                                        'bg-slate-50 dark:bg-slate-800/50'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                        index === 0 ? 'bg-amber-500 text-white' :
                                        index === 1 ? 'bg-slate-400 text-white' :
                                        index === 2 ? 'bg-amber-700 text-white' :
                                        'bg-slate-300 text-slate-700'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{engineer.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {engineer.quotesWon} gewonnen • {engineer.hoursLogged}u gelogd
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-600">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="font-bold">{engineer.hoursLogged}u</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* XP Guide & Bonus Tiers */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Award className="w-5 h-5 text-purple-500" />
                            Bonus Structuur
                        </CardTitle>
                        <CardDescription>Verdien XP en unlock maandelijkse bonussen</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* XP Actions */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">XP Verdienen</p>
                            <div className="grid grid-cols-2 gap-2">
                                {XP_ACTIONS.map((item) => (
                                    <div key={item.action} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md text-sm">
                                        <span className="text-muted-foreground">{item.action}</span>
                                        <Badge variant="secondary" className="font-mono">+{item.xp}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Bonus Tiers */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Maandelijkse Bonus</p>
                            <div className="space-y-1">
                                {INCENTIVE_TIERS.slice(1).map((tier) => (
                                    <div 
                                        key={tier.level}
                                        className={`flex items-center justify-between p-2 rounded-md ${
                                            xp >= tier.minXP ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-slate-50 dark:bg-slate-800/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${tier.colorClass}`} />
                                            <span className={xp >= tier.minXP ? 'font-medium' : 'text-muted-foreground'}>
                                                {tier.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">({tier.minXP}+ XP)</span>
                                        </div>
                                        <span className={`font-bold ${xp >= tier.minXP ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                            €{tier.monthlyBonusEur}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
