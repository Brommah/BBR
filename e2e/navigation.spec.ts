import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate to all public pages', async ({ page }) => {
    // Test intake page (public)
    await page.goto('/intake')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/intake/)
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10000 })
    
    // Test login page (public)
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10000 })
    
    // Test templates page (may be protected - should either show or redirect to login)
    await page.goto('/templates')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/templates|\/login/)
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10000 })
  })

  test('should handle 404 for non-existent routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345')
    
    // Should return 404 status
    expect(response?.status()).toBe(404)
  })

  test('should load pages without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/intake')
    await page.waitForLoadState('networkidle')
    
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('ResizeObserver') && !err.includes('favicon')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })

  test('should have valid meta tags', async ({ page }) => {
    await page.goto('/')
    
    // Check for essential meta tags
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })
})
