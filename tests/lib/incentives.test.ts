import { describe, it, expect } from 'vitest'
import {
  INCENTIVE_TIERS,
  getTierForXp,
  estimateSideJobReward,
  DEFAULT_ENGINEER_PROFILE,
  LEADERBOARD_DATA,
  XP_ACTIONS,
} from '@/lib/incentives'
import type { Lead } from '@/lib/store'

// Helper to create mock lead
function createMockLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test-1',
    clientName: 'Test Client',
    clientEmail: 'test@test.com',
    clientPhone: '0612345678',
    projectType: 'Dakkapel',
    city: 'Amsterdam',
    address: 'Test Street 1',
    status: 'Nieuw',
    value: 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    assignee: null,
    quoteApproval: 'none',
    quoteValue: null,
    quoteDescription: null,
    quoteLineItems: null,
    quoteEstimatedHours: null,
    quoteFeedback: null,
    specifications: [],
    ...overrides,
  }
}

describe('Incentives System', () => {
  describe('INCENTIVE_TIERS', () => {
    it('should have tiers in ascending XP order', () => {
      for (let i = 1; i < INCENTIVE_TIERS.length; i++) {
        expect(INCENTIVE_TIERS[i].minXP).toBeGreaterThan(INCENTIVE_TIERS[i - 1].minXP)
      }
    })

    it('should have increasing monthly bonuses', () => {
      for (let i = 1; i < INCENTIVE_TIERS.length; i++) {
        expect(INCENTIVE_TIERS[i].monthlyBonusEur).toBeGreaterThanOrEqual(
          INCENTIVE_TIERS[i - 1].monthlyBonusEur
        )
      }
    })

    it('should have unique tier levels', () => {
      const levels = INCENTIVE_TIERS.map((t) => t.level)
      const uniqueLevels = [...new Set(levels)]
      expect(levels).toHaveLength(uniqueLevels.length)
    })

    it('should have 6 tiers', () => {
      expect(INCENTIVE_TIERS).toHaveLength(6)
    })

    it('should have first tier starting at 0 XP', () => {
      expect(INCENTIVE_TIERS[0].minXP).toBe(0)
    })

    it('should have color classes for all tiers', () => {
      INCENTIVE_TIERS.forEach((tier) => {
        expect(tier.colorClass).toBeTruthy()
        expect(tier.colorClass.startsWith('bg-')).toBe(true)
      })
    })
  })

  describe('getTierForXp', () => {
    it('should return first tier for 0 XP', () => {
      const result = getTierForXp(0)
      expect(result.current.level).toBe(1)
      expect(result.next).toBeDefined()
    })

    it('should return correct tier for exact boundary', () => {
      const secondTier = INCENTIVE_TIERS[1]
      const result = getTierForXp(secondTier.minXP)
      expect(result.current.level).toBe(secondTier.level)
    })

    it('should return correct tier for value between boundaries', () => {
      const firstTier = INCENTIVE_TIERS[0]
      const secondTier = INCENTIVE_TIERS[1]
      const midpoint = Math.floor((firstTier.minXP + secondTier.minXP) / 2)
      const result = getTierForXp(midpoint)
      expect(result.current.level).toBe(firstTier.level)
    })

    it('should return highest tier for very high XP', () => {
      const highestTier = INCENTIVE_TIERS[INCENTIVE_TIERS.length - 1]
      const result = getTierForXp(999999)
      expect(result.current.level).toBe(highestTier.level)
      expect(result.next).toBeUndefined()
    })

    it('should return next tier when not at max', () => {
      const result = getTierForXp(0)
      expect(result.next).toBeDefined()
      expect(result.next!.level).toBe(2)
    })

    it('should return undefined next when at max tier', () => {
      const result = getTierForXp(999999)
      expect(result.next).toBeUndefined()
    })
  })

  describe('estimateSideJobReward', () => {
    it('should calculate reward based on project value', () => {
      const lead = createMockLead({ value: 10000 })
      const reward = estimateSideJobReward(lead)
      expect(reward.bonusEur).toBeGreaterThan(0)
      expect(reward.xp).toBeGreaterThan(0)
    })

    it('should give higher bonus for higher value projects', () => {
      const lowValueLead = createMockLead({ value: 5000 })
      const highValueLead = createMockLead({ value: 15000 })
      
      const lowReward = estimateSideJobReward(lowValueLead)
      const highReward = estimateSideJobReward(highValueLead)
      
      expect(highReward.bonusEur).toBeGreaterThan(lowReward.bonusEur)
    })

    it('should have minimum bonus floor', () => {
      const lowValueLead = createMockLead({ value: 100 })
      const reward = estimateSideJobReward(lowValueLead)
      expect(reward.bonusEur).toBeGreaterThanOrEqual(25)
    })

    it('should give higher bonus for renovation projects', () => {
      const normalLead = createMockLead({ value: 5000, projectType: 'Dakkapel' })
      const renovLead = createMockLead({ value: 5000, projectType: 'Renovatie' })
      
      const normalReward = estimateSideJobReward(normalLead)
      const renovReward = estimateSideJobReward(renovLead)
      
      expect(renovReward.bonusEur).toBeGreaterThan(normalReward.bonusEur)
    })

    it('should return XP reward', () => {
      const lead = createMockLead({ value: 5000 })
      const reward = estimateSideJobReward(lead)
      expect(reward.xp).toBeGreaterThan(0)
    })

    it('should cap XP around 100', () => {
      const highValueLead = createMockLead({ value: 100000 })
      const reward = estimateSideJobReward(highValueLead)
      expect(reward.xp).toBeLessThanOrEqual(100)
    })
  })

  describe('DEFAULT_ENGINEER_PROFILE', () => {
    it('should have required properties', () => {
      expect(DEFAULT_ENGINEER_PROFILE).toHaveProperty('name')
      expect(DEFAULT_ENGINEER_PROFILE).toHaveProperty('avatar')
      expect(DEFAULT_ENGINEER_PROFILE).toHaveProperty('level')
      expect(DEFAULT_ENGINEER_PROFILE).toHaveProperty('xp')
      expect(DEFAULT_ENGINEER_PROFILE).toHaveProperty('monthlyStats')
    })

    it('should have valid monthly stats', () => {
      const { monthlyStats } = DEFAULT_ENGINEER_PROFILE
      expect(monthlyStats.quotesGenerated).toBeGreaterThanOrEqual(0)
      expect(monthlyStats.quotesWon).toBeGreaterThanOrEqual(0)
      expect(monthlyStats.revenueEur).toBeGreaterThanOrEqual(0)
      expect(monthlyStats.clientSatisfaction).toBeGreaterThanOrEqual(1)
      expect(monthlyStats.clientSatisfaction).toBeLessThanOrEqual(5)
    })

    it('should have badges array', () => {
      expect(Array.isArray(DEFAULT_ENGINEER_PROFILE.badges)).toBe(true)
      DEFAULT_ENGINEER_PROFILE.badges.forEach((badge) => {
        expect(badge).toHaveProperty('id')
        expect(badge).toHaveProperty('name')
        expect(badge).toHaveProperty('icon')
        expect(badge).toHaveProperty('earnedAt')
      })
    })

    it('should have valid leaderboard rank', () => {
      expect(DEFAULT_ENGINEER_PROFILE.leaderboardRank).toBeGreaterThanOrEqual(1)
    })
  })

  describe('LEADERBOARD_DATA', () => {
    it('should be an array', () => {
      expect(Array.isArray(LEADERBOARD_DATA)).toBe(true)
    })

    it('should have valid entries', () => {
      LEADERBOARD_DATA.forEach((entry) => {
        expect(entry).toHaveProperty('name')
        expect(entry).toHaveProperty('avatar')
        expect(entry).toHaveProperty('quotesWon')
        expect(entry).toHaveProperty('revenueEur')
        expect(entry).toHaveProperty('tier')
      })
    })
  })

  describe('XP_ACTIONS', () => {
    it('should have actions with positive XP values', () => {
      XP_ACTIONS.forEach((action) => {
        expect(action.xp).toBeGreaterThan(0)
        expect(action.action).toBeTruthy()
      })
    })

    it('should have "Offerte gewonnen" as highest XP action', () => {
      const wonAction = XP_ACTIONS.find((a) => a.action.includes('gewonnen'))
      expect(wonAction).toBeDefined()
      expect(wonAction!.xp).toBe(100)
    })
  })
})
