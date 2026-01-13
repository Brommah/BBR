import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utilities', () => {
  describe('cn (className merge)', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded')
      expect(result).toBe('base included')
    })

    it('should handle undefined values', () => {
      const result = cn('foo', undefined, 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle null values', () => {
      const result = cn('foo', null, 'bar')
      expect(result).toBe('foo bar')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('p-4', 'p-8')
      // tailwind-merge should pick the last one
      expect(result).toBe('p-8')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle arrays', () => {
      const result = cn(['foo', 'bar'])
      expect(result).toBe('foo bar')
    })

    it('should handle objects', () => {
      const result = cn({ foo: true, bar: false, baz: true })
      expect(result).toBe('foo baz')
    })

    it('should handle repeated classes', () => {
      // Note: clsx/tailwind-merge doesn't dedupe non-tailwind classes
      const result = cn('foo', 'foo', 'foo')
      expect(typeof result).toBe('string')
    })

    it('should handle complex tailwind conflicts', () => {
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBe('text-blue-500')
    })

    it('should preserve non-conflicting classes', () => {
      const result = cn('bg-red-500', 'text-blue-500')
      expect(result).toContain('bg-red-500')
      expect(result).toContain('text-blue-500')
    })
  })
})
