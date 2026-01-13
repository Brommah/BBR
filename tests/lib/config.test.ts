/**
 * Configuration Tests
 * Tests for application configuration and constants
 */

import { describe, it, expect } from 'vitest'
import { 
  COMPANY,
  PROJECT_TYPES,
  LEAD_STATUSES,
  QUOTE_APPROVAL_STATUSES,
  DOCUMENT_CATEGORIES,
  PAGINATION,
  RATE_LIMITS,
  EMAIL,
  dbStatusToLabel,
  labelToDbStatus,
  isValidProjectType,
  isValidLeadStatus,
} from '@/lib/config'

describe('Configuration', () => {
  describe('COMPANY', () => {
    it('should have required company fields', () => {
      expect(COMPANY.name).toBeDefined()
      expect(COMPANY.email).toBeDefined()
      expect(COMPANY.website).toBeDefined()
      expect(COMPANY.tagline).toBeDefined()
    })

    it('should have valid email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test(COMPANY.email)).toBe(true)
    })

    it('should have valid website URL', () => {
      expect(COMPANY.website).toMatch(/^https?:\/\//)
    })
  })

  describe('PROJECT_TYPES', () => {
    it('should have at least 5 project types', () => {
      expect(PROJECT_TYPES.length).toBeGreaterThanOrEqual(5)
    })

    it('should include common project types', () => {
      expect(PROJECT_TYPES).toContain('Dakkapel')
      expect(PROJECT_TYPES).toContain('Uitbouw')
      expect(PROJECT_TYPES).toContain('Aanbouw')
    })

    it('should include "Overig" as fallback', () => {
      expect(PROJECT_TYPES).toContain('Overig')
    })
  })

  describe('LEAD_STATUSES', () => {
    it('should have all required statuses', () => {
      expect(LEAD_STATUSES.Nieuw).toBeDefined()
      expect(LEAD_STATUSES.Calculatie).toBeDefined()
      expect(LEAD_STATUSES.OfferteVerzonden).toBeDefined()
      expect(LEAD_STATUSES.Opdracht).toBeDefined()
      expect(LEAD_STATUSES.Archief).toBeDefined()
    })

    it('should have label, color, and dbValue for each status', () => {
      Object.values(LEAD_STATUSES).forEach(status => {
        expect(status.label).toBeDefined()
        expect(status.color).toBeDefined()
        expect(status.dbValue).toBeDefined()
      })
    })
  })

  describe('QUOTE_APPROVAL_STATUSES', () => {
    it('should have all approval statuses', () => {
      expect(QUOTE_APPROVAL_STATUSES.none).toBeDefined()
      expect(QUOTE_APPROVAL_STATUSES.pending).toBeDefined()
      expect(QUOTE_APPROVAL_STATUSES.approved).toBeDefined()
      expect(QUOTE_APPROVAL_STATUSES.rejected).toBeDefined()
    })
  })

  describe('DOCUMENT_CATEGORIES', () => {
    it('should have value and label for each category', () => {
      DOCUMENT_CATEGORIES.forEach(category => {
        expect(category.value).toBeDefined()
        expect(category.label).toBeDefined()
      })
    })

    it('should include common document types', () => {
      const values = DOCUMENT_CATEGORIES.map(c => c.value)
      expect(values).toContain('tekening')
      expect(values).toContain('offerte')
      expect(values).toContain('foto')
    })
  })

  describe('PAGINATION', () => {
    it('should have sensible defaults', () => {
      expect(PAGINATION.defaultPageSize).toBeGreaterThan(0)
      expect(PAGINATION.defaultPageSize).toBeLessThanOrEqual(PAGINATION.maxPageSize)
    })

    it('should have page size options including default', () => {
      expect(PAGINATION.pageSizeOptions).toContain(PAGINATION.defaultPageSize)
    })

    it('should not exceed max page size in options', () => {
      PAGINATION.pageSizeOptions.forEach(size => {
        expect(size).toBeLessThanOrEqual(PAGINATION.maxPageSize)
      })
    })
  })

  describe('RATE_LIMITS', () => {
    it('should have intake rate limit config', () => {
      expect(RATE_LIMITS.intake.windowMs).toBeGreaterThan(0)
      expect(RATE_LIMITS.intake.maxRequests).toBeGreaterThan(0)
    })

    it('should have api rate limit config', () => {
      expect(RATE_LIMITS.api.windowMs).toBeGreaterThan(0)
      expect(RATE_LIMITS.api.maxRequests).toBeGreaterThan(0)
    })

    it('should have stricter intake limits than API', () => {
      // Intake is public, should be more restricted
      expect(RATE_LIMITS.intake.maxRequests).toBeLessThanOrEqual(
        RATE_LIMITS.api.maxRequests
      )
    })
  })

  describe('EMAIL', () => {
    it('should have required email config', () => {
      expect(EMAIL.from).toBeDefined()
      expect(EMAIL.quoteValidityDays).toBeGreaterThan(0)
    })

    it('should have reminder days as array', () => {
      expect(Array.isArray(EMAIL.reminderDays)).toBe(true)
      expect(EMAIL.reminderDays.length).toBeGreaterThan(0)
    })
  })

  describe('Helper Functions', () => {
    describe('dbStatusToLabel', () => {
      it('should convert DB status to label', () => {
        expect(dbStatusToLabel('OfferteVerzonden')).toBe('Offerte Verzonden')
        expect(dbStatusToLabel('Nieuw')).toBe('Nieuw')
      })

      it('should return input for unknown status', () => {
        expect(dbStatusToLabel('Unknown')).toBe('Unknown')
      })
    })

    describe('labelToDbStatus', () => {
      it('should convert label to DB status', () => {
        expect(labelToDbStatus('Offerte Verzonden')).toBe('OfferteVerzonden')
        expect(labelToDbStatus('Nieuw')).toBe('Nieuw')
      })

      it('should return input for unknown label', () => {
        expect(labelToDbStatus('Unknown')).toBe('Unknown')
      })
    })

    describe('isValidProjectType', () => {
      it('should validate known project types', () => {
        expect(isValidProjectType('Dakkapel')).toBe(true)
        expect(isValidProjectType('Uitbouw')).toBe(true)
      })

      it('should reject unknown project types', () => {
        expect(isValidProjectType('InvalidType')).toBe(false)
        expect(isValidProjectType('')).toBe(false)
      })
    })

    describe('isValidLeadStatus', () => {
      it('should validate known statuses', () => {
        expect(isValidLeadStatus('Nieuw')).toBe(true)
        expect(isValidLeadStatus('OfferteVerzonden')).toBe(true)
      })

      it('should reject unknown statuses', () => {
        expect(isValidLeadStatus('InvalidStatus')).toBe(false)
        expect(isValidLeadStatus('')).toBe(false)
      })
    })
  })
})
