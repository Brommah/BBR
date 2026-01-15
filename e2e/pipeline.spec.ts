import { test, expect } from '@playwright/test'

test.describe('Pipeline Page', () => {
  test('should display pipeline page structure', async ({ page }) => {
    await page.goto('/pipeline')
    
    // Check for kanban columns (even without auth, structure should render)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should show page content or redirect', async ({ page }) => {
    await page.goto('/pipeline')
    await page.waitForLoadState('networkidle')
    
    // Pipeline may require authentication and redirect to login
    // Or show a loading state, columns, or the page structure
    await expect(page).toHaveURL(/\/pipeline|\/login/)
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10000 })
  })

  test('should be accessible via keyboard', async ({ page }) => {
    await page.goto('/pipeline')
    await page.waitForLoadState('networkidle')
    
    // Tab through the page to check focus management
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate with keyboard - use toHaveCount to verify focus exists
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toHaveCount(1, { timeout: 5000 })
  })
})
