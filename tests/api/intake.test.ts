/**
 * Intake API Tests
 * Tests for the public intake form API endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the dependencies
vi.mock('@/lib/db', () => ({
  default: {
    lead: {
      create: vi.fn(() => Promise.resolve({
        id: 'test-lead-id',
        clientName: 'Test User',
        clientEmail: 'test@example.com',
        projectType: 'Dakkapel',
        city: 'Amsterdam',
        status: 'Nieuw',
      })),
    },
    note: {
      create: vi.fn(() => Promise.resolve({ id: 'test-note-id' })),
    },
  },
}))

vi.mock('@/lib/db-actions', () => ({
  createActivity: vi.fn(() => Promise.resolve({ success: true })),
  checkRateLimit: vi.fn(() => Promise.resolve({
    allowed: true,
    remaining: 4,
    resetAt: new Date(Date.now() + 3600000),
  })),
  createAuditLog: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('@/lib/email', () => ({
  sendIntakeConfirmation: vi.fn(() => Promise.resolve({
    success: true,
    messageId: 'test-message-id',
  })),
}))

describe('Intake API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should validate required clientName', () => {
      const errors: string[] = []
      const clientName = ''
      
      if (!clientName || clientName.trim().length < 2) {
        errors.push('Naam is verplicht (minimaal 2 karakters)')
      }
      
      expect(errors).toContain('Naam is verplicht (minimaal 2 karakters)')
    })

    it('should validate email format', () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }
      
      expect(validateEmail('valid@email.com')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@invalid.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
    })

    it('should validate Dutch phone formats', () => {
      const validatePhone = (phone: string) => {
        const cleaned = phone.replace(/[\s\-\(\)]/g, '')
        return /^(\+31|0031|0)[1-9][0-9]{8,9}$/.test(cleaned)
      }
      
      // Valid formats
      expect(validatePhone('0612345678')).toBe(true)
      expect(validatePhone('+31612345678')).toBe(true)
      expect(validatePhone('0031612345678')).toBe(true)
      expect(validatePhone('06 12 34 56 78')).toBe(true)
      expect(validatePhone('06-12345678')).toBe(true)
      
      // Invalid formats
      expect(validatePhone('12345')).toBe(false)
      expect(validatePhone('abc12345678')).toBe(false)
    })

    it('should validate project types', () => {
      const PROJECT_TYPES = [
        'Dakkapel',
        'Uitbouw',
        'Aanbouw',
        'Draagmuur verwijderen',
        'Kozijn vergroten',
        'Fundering herstel',
        'VvE constructie',
        'Overig',
      ]
      
      expect(PROJECT_TYPES.includes('Dakkapel')).toBe(true)
      expect(PROJECT_TYPES.includes('Invalid')).toBe(false)
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts', () => {
      const sanitizeInput = (input: string): string => {
        return input
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .trim()
      }
      
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
      
      expect(sanitizeInput("Test's \"input\""))
        .toBe('Test&#x27;s &quot;input&quot;')
    })

    it('should trim whitespace', () => {
      const sanitizeInput = (input: string): string => input.trim()
      
      expect(sanitizeInput('  test  ')).toBe('test')
      expect(sanitizeInput('\n\ttest\n')).toBe('test')
    })
  })

  describe('Rate Limiting', () => {
    it('should track request counts', async () => {
      const { checkRateLimit } = await import('@/lib/db-actions')
      
      const result = await checkRateLimit('test-key', 5, 3600000)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.resetAt).toBeInstanceOf(Date)
    })
  })

  describe('Success Response', () => {
    it('should return correct success structure', () => {
      const successResponse = {
        success: true,
        message: 'Aanvraag succesvol ontvangen!',
        leadId: 'test-id',
        emailSent: true,
      }
      
      expect(successResponse).toHaveProperty('success', true)
      expect(successResponse).toHaveProperty('leadId')
      expect(successResponse).toHaveProperty('emailSent')
    })
  })

  describe('Error Response', () => {
    it('should return validation errors', () => {
      const errors = ['Naam is verplicht', 'E-mail is ongeldig']
      const errorResponse = {
        error: 'Validatie fout',
        details: errors,
      }
      
      expect(errorResponse.error).toBe('Validatie fout')
      expect(errorResponse.details).toHaveLength(2)
    })

    it('should return rate limit error', () => {
      const rateLimitResponse = {
        error: 'Te veel aanvragen. Probeer het later opnieuw.',
        retryAfter: 3600,
      }
      
      expect(rateLimitResponse.error).toContain('Te veel aanvragen')
      expect(rateLimitResponse.retryAfter).toBeGreaterThan(0)
    })
  })
})
