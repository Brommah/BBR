"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Trophy, Zap, Target, TrendingUp, Star, Flame, Award, Clock, Users, Euro } from "lucide-react"
import { DEFAULT_ENGINEER_PROFILE, INCENTIVE_TIERS } from "@/lib/incentives"

const leaderboard = [
    { name: "Angelo", quotesWon: 14, revenue: 42500, streak: 12 },
    { name: "Venka", quotesWon: 11, revenue: 38200, streak: 8 },
    { name: "Roina", quotesWon: 9, revenue: 31000, streak: 5 },
]

const xpActions = [
    { action: "Offerte verzonden", xp: 25 },
    { action: "Offerte gewonnen", xp: 100 },
    { action: "Reactie < 2 uur", xp: 15 },
    { action: "5-sterren review", xp: 50 },
    { action: "Dagelijkse streak", xp: 10 },
]

export function IncentiveDashboard() {
    const stats = DEFAULT_ENGINEER_PROFILE
    const xpProgress = (stats.xp / stats.xpToNext) * 100
    const conversionRate = (stats.monthlyStats.quotesWon / stats.monthlyStats.quotesGenerated) * 100

    return (
        <div className="space-y-6">
            {/* Hero Card - Current Status */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/30">
                                {stats.avatar}
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{stats.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                                        Level {stats.level}
                                    </Badge>
                                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                        #{stats.leaderboardRank} Leaderboard
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-amber-400">
                                <Flame className="w-5 h-5" />
                                <span className="text-2xl font-bold">{stats.currentStreakDays}</span>
                                <span className="text-sm text-white/60">dagen streak</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* XP Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/60">XP Progress naar Level {stats.level + 1}</span>
                            <span className="font-mono">{stats.xp.toLocaleString()} / {stats.xpToNext.toLocaleString()}</span>
                        </div>
                        <div className="relative">
                            <Progress value={xpProgress} className="h-3 bg-white/10" />
                            <div 
                                className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                                style={{ width: `${xpProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-3 pt-2">
                        {stats.badges.map((badge) => (
                            <div 
                                key={badge.id}
                                className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                                title={badge.name}
                            >
                                {badge.icon}
                            </div>
                        ))}
                        <div className="w-12 h-12 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 text-xl">
                            ?
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
                                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{conversionRate.toFixed(0)}%</p>
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
                                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.monthlyStats.avgResponseTimeHours}u</p>
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
                                <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{stats.monthlyStats.quotesGenerated}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                                <Euro className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Omzet</p>
                                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">€{(stats.monthlyStats.revenueEur/1000).toFixed(0)}k</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Rating</p>
                                <p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{stats.monthlyStats.clientSatisfaction}</p>
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
                            Leaderboard - Januari 2026
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {leaderboard.map((engineer, index) => (
                            <div 
                                key={engineer.name}
                                className={`flex items-center gap-4 p-3 rounded-lg ${
                                    index === 0 ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' :
                                    'bg-slate-50 dark:bg-slate-800/50'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                    index === 0 ? 'bg-amber-500 text-white' :
                                    index === 1 ? 'bg-slate-400 text-white' :
                                    'bg-amber-700 text-white'
                                }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{engineer.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {engineer.quotesWon} gewonnen • €{engineer.revenue.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-amber-600">
                                    <Flame className="w-4 h-4" />
                                    <span className="font-bold">{engineer.streak}</span>
                                </div>
                            </div>
                        ))}
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
                                {xpActions.map((item) => (
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
                                            stats.xp >= tier.minXP ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-slate-50 dark:bg-slate-800/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${tier.colorClass}`} />
                                            <span className={stats.xp >= tier.minXP ? 'font-medium' : 'text-muted-foreground'}>
                                                {tier.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">({tier.minXP}+ XP)</span>
                                        </div>
                                        <span className={`font-bold ${stats.xp >= tier.minXP ? 'text-emerald-600' : 'text-muted-foreground'}`}>
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
