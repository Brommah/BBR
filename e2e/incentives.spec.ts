import { test, expect } from '@playwright/test'

test.describe('Incentives Page', () => {
  test('should load incentives page', async ({ page }) => {
    await page.goto('/incentives')
    
    await expect(page).toHaveURL(/\/incentives/)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should have proper page structure', async ({ page }) => {
    await page.goto('/incentives')
    
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })

  test('should be responsive', async ({ page }) => {
    await page.goto('/incentives')
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('main')).toBeVisible()
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should handle page load without errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/incentives')
    await page.waitForLoadState('networkidle')

    const criticalErrors = errors.filter(
      (err) => !err.includes('ResizeObserver') && !err.includes('favicon')
    )

    expect(criticalErrors).toHaveLength(0)
  })
})
