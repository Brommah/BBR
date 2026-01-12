"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
    Trophy, Zap, Target, TrendingUp, Star, Flame, Award, Euro,
    MessageSquare, Sparkles, ThumbsUp, ArrowUp
} from "lucide-react"
import { DEFAULT_ENGINEER_PROFILE, INCENTIVE_TIERS } from "@/lib/incentives"
import { IsoTrophy } from "@/components/ui/illustrations"

const leaderboard = [
    { name: "Angelo", quotesWon: 14, revenue: 42500, streak: 12, nps: 72 },
    { name: "Venka", quotesWon: 11, revenue: 38200, streak: 8, nps: 68 },
    { name: "Roina", quotesWon: 9, revenue: 31000, streak: 5, nps: 65 },
]

const recentFeedback = [
    { name: "Fam. Bakker", score: 10, comment: "Geweldige service! Dacht heel goed mee met de constructie.", project: "Uitbouw Haarlem", date: "2 dagen geleden" },
    { name: "Stichting 't Hof", score: 8, comment: "Goed advies, maar duurde iets langer dan verwacht.", project: "Renovatie Amsterdam", date: "5 dagen geleden" },
    { name: "P. Jansen", score: 9, comment: "Snel en duidelijk. Offerte was binnen 1 dag binnen.", project: "Draagmuur Utrecht", date: "1 week geleden" }
]

const xpActions = [
    { action: "Offerte gewonnen", xp: 100, icon: Trophy },
    { action: "5-sterren review", xp: 50, icon: Star },
    { action: "Offerte verzonden", xp: 25, icon: TrendingUp },
    { action: "Reactie < 2 uur", xp: 15, icon: Zap },
]

export function PerformanceDashboard() {
    const stats = DEFAULT_ENGINEER_PROFILE
    const xpProgress = (stats.xp / stats.xpToNext) * 100
    const conversionRate = (stats.monthlyStats.quotesWon / stats.monthlyStats.quotesGenerated) * 100

    // NPS data
    const npsScore = 72
    const promoters = 78
    const passives = 16
    const detractors = 6

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
                                    {stats.avatar}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl tracking-tight">{stats.name}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-medium">
                                            Level {stats.level}
                                        </Badge>
                                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-medium">
                                            #{stats.leaderboardRank} Ranking
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
                                    <div className="flex items-center gap-1.5 text-amber-400 justify-center">
                                        <Flame className="w-5 h-5" />
                                        <span className="text-2xl font-bold">{stats.currentStreakDays}</span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-white/50">Dagen Streak</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-5 relative z-10">
                        {/* XP Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm items-end">
                                <span className="text-white/70 font-medium">XP naar Level {stats.level + 1}</span>
                                <span className="font-mono text-amber-300 text-base">{stats.xp.toLocaleString()} <span className="text-white/40 text-xs">/ {stats.xpToNext.toLocaleString()}</span></span>
                            </div>
                            <div className="relative h-4 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10">
                                <div 
                                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 transition-all duration-700 ease-out"
                                    style={{ width: `${xpProgress}%` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase tracking-wider text-white/40 mr-2">Badges</span>
                            {stats.badges.map((badge) => (
                                <div 
                                    key={badge.id}
                                    className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-xl hover:scale-110 hover:bg-white/20 transition-all cursor-pointer ring-1 ring-white/10"
                                    title={badge.name}
                                >
                                    {badge.icon}
                                </div>
                            ))}
                            <div className="w-11 h-11 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-white/30 text-lg">
                                <Sparkles className="w-4 h-4" />
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
                                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{conversionRate.toFixed(0)}%</p>
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
                                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.monthlyStats.avgResponseTimeHours}u</p>
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
                                <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{stats.monthlyStats.quotesGenerated}</p>
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
                                <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">€{(stats.monthlyStats.revenueEur/1000).toFixed(0)}k</p>
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
                                <p className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-400 font-semibold">Rating</p>
                                <p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{stats.monthlyStats.clientSatisfaction}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Recent Feedback - Takes 3 cols */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                                    Recente Reviews
                                </CardTitle>
                                <CardDescription>Feedback van je klanten na projectafronding</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                <ArrowUp className="w-3 h-3 mr-1" />
                                +12% deze maand
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentFeedback.map((review, i) => (
                                <div key={i} className="flex gap-4 items-start p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                        review.score >= 9 
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' 
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                                    }`}>
                                        {review.score}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-semibold text-sm truncate">{review.name}</h4>
                                            <span className="text-[10px] text-muted-foreground shrink-0">{review.date}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">&ldquo;{review.comment}&rdquo;</p>
                                        <Badge variant="secondary" className="text-[10px]">{review.project}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                            {leaderboard.map((engineer, index) => (
                                <div 
                                    key={engineer.name}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                        index === 0 
                                            ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-800' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                                        index === 0 ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30' :
                                        index === 1 ? 'bg-slate-400 text-white' :
                                        'bg-amber-700 text-white'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{engineer.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {engineer.quotesWon} won • NPS {engineer.nps}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                        <Flame className="w-3.5 h-3.5" />
                                        <span className="text-sm font-bold">{engineer.streak}</span>
                                    </div>
                                </div>
                            ))}
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
                                    const unlocked = stats.xp >= tier.minXP
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
