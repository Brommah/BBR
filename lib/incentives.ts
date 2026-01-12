import { Lead } from "@/lib/store"

export interface IncentiveTier {
  level: number
  name: string
  minXP: number
  monthlyBonusEur: number
  colorClass: string
}

export interface EngineerIncentivesProfile {
  name: string
  avatar: string
  level: number
  xp: number
  xpToNext: number
  currentStreakDays: number
  monthlyStats: {
    quotesGenerated: number
    quotesWon: number
    avgResponseTimeHours: number
    revenueEur: number
    clientSatisfaction: number // 1-5
  }
  badges: {
    id: string
    name: string
    icon: string
    earnedAt: string
  }[]
  leaderboardRank: number
}

export interface SideJobRewardEstimate {
  bonusEur: number
  xp: number
}

export const INCENTIVE_TIERS: IncentiveTier[] = [
  { level: 1, name: "Starter", minXP: 0, monthlyBonusEur: 0, colorClass: "bg-slate-400" },
  { level: 2, name: "Apprentice", minXP: 500, monthlyBonusEur: 50, colorClass: "bg-emerald-500" },
  { level: 3, name: "Professional", minXP: 1000, monthlyBonusEur: 100, colorClass: "bg-blue-500" },
  { level: 4, name: "Expert", minXP: 2000, monthlyBonusEur: 200, colorClass: "bg-purple-500" },
  { level: 5, name: "Master", minXP: 3500, monthlyBonusEur: 350, colorClass: "bg-amber-500" },
  { level: 6, name: "Legend", minXP: 5000, monthlyBonusEur: 500, colorClass: "bg-rose-500" },
]

export const DEFAULT_ENGINEER_PROFILE: EngineerIncentivesProfile = {
  name: "Angelo",
  avatar: "A",
  level: 7,
  xp: 2340,
  xpToNext: 3000,
  currentStreakDays: 12,
  monthlyStats: {
    quotesGenerated: 28,
    quotesWon: 14,
    avgResponseTimeHours: 1.8,
    revenueEur: 42500,
    clientSatisfaction: 4.7,
  },
  badges: [
    { id: "1", name: "Snelle Starter", icon: "⚡", earnedAt: "2026-01-05" },
    { id: "2", name: "Quote Machine", icon: "📝", earnedAt: "2026-01-08" },
    { id: "3", name: "Klant Favoriet", icon: "⭐", earnedAt: "2026-01-10" },
    { id: "4", name: "Perfect Week", icon: "🔥", earnedAt: "2026-01-12" },
  ],
  leaderboardRank: 1,
}

export interface LeaderboardEntry {
  name: string
  avatar: string
  quotesWon: number
  revenueEur: number
  streakDays: number
  tier: string
}

export const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { name: "Angelo", avatar: "A", quotesWon: 14, revenueEur: 42500, streakDays: 12, tier: "Expert" },
  { name: "Venka", avatar: "V", quotesWon: 11, revenueEur: 38200, streakDays: 8, tier: "Professional" },
  { name: "Roina", avatar: "R", quotesWon: 9, revenueEur: 31000, streakDays: 5, tier: "Professional" },
]

export const XP_ACTIONS = [
  { action: "Offerte verzonden", xp: 25 },
  { action: "Offerte gewonnen", xp: 100 },
  { action: "Reactie < 2 uur", xp: 15 },
  { action: "5-sterren review", xp: 50 },
  { action: "Dagelijkse streak", xp: 10 },
  { action: "Bonus job afgerond", xp: 40 },
]

export function getTierForXp(xp: number): { current: IncentiveTier; next?: IncentiveTier } {
  const tiers = [...INCENTIVE_TIERS].sort((a, b) => a.minXP - b.minXP)
  let current = tiers[0]
  for (const tier of tiers) {
    if (xp >= tier.minXP) current = tier
  }
  const next = tiers.find((t) => t.minXP > current.minXP)
  return { current, next }
}

/**
 * Estimate "side job" reward for picking up a small lead outside normal hours.
 * This is intentionally simple + deterministic for now.
 */
export function estimateSideJobReward(lead: Lead): SideJobRewardEstimate {
  // Small jobs get a predictable bonus band + XP reward.
  // Tune later based on real policy (margin, complexity, SLA, etc).
  const baseBonus = Math.max(25, Math.round(lead.value * 0.03)) // ~3% with a floor
  const complexityMultiplier = lead.projectType.toLowerCase().includes("renov") ? 1.3 : 1
  const urgentMultiplier = lead.isUrgent ? 1.2 : 1

  const bonusEur = Math.round(baseBonus * complexityMultiplier * urgentMultiplier)

  const xp = Math.round(20 + Math.min(80, lead.value / 250)) // caps around +80

  return { bonusEur, xp }
}

