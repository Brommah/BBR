import { test, expect } from '@playwright/test'

test.describe('Inbox Page', () => {
  test('should load inbox page or redirect to login', async ({ page }) => {
    await page.goto('/inbox')
    await page.waitForLoadState('networkidle')
    
    // Inbox page may require authentication and redirect to login
    await expect(page).toHaveURL(/\/inbox|\/login/)
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10000 })
  })

  test('should handle unauthenticated access', async ({ page }) => {
    await page.goto('/inbox')
    
    // Should show content or redirect
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/inbox')
    
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/inbox')
    await page.waitForLoadState('networkidle')

    const criticalErrors = errors.filter(
      (err) => 
        !err.includes('ResizeObserver') && 
        !err.includes('favicon')
    )

    expect(criticalErrors).toHaveLength(0)
  })
})
