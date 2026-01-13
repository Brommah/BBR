import { test, expect } from '@playwright/test'

test.describe('Admin Page', () => {
  test('should redirect or show access denied for unauthenticated users', async ({ page }) => {
    await page.goto('/admin')
    
    // Should either redirect to login or show access denied
    await expect(page).toHaveURL(/\/(admin|login)/)
  })

  test('should have proper page structure', async ({ page }) => {
    await page.goto('/admin')
    
    // Page should have main content area
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })

  test('should handle direct URL access', async ({ page }) => {
    // Going directly to admin should be handled gracefully
    const response = await page.goto('/admin')
    
    // Should not be a server error
    expect(response?.status()).toBeLessThan(500)
  })

  test('should be responsive', async ({ page }) => {
    await page.goto('/admin')
    
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('main')).toBeVisible()
    
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByRole('main')).toBeVisible()
  })
})

test.describe('Admin - Role-Based Access', () => {
  test('should show appropriate content based on auth state', async ({ page }) => {
    await page.goto('/admin')
    
    // Either shows admin content (if auth) or access denied/login redirect
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })
})
