import { test, expect } from '@playwright/test'

test.describe('Pipeline Page', () => {
  test('should display pipeline page structure', async ({ page }) => {
    await page.goto('/pipeline')
    
    // Check for kanban columns (even without auth, structure should render)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/pipeline')
    
    // Should show either loading spinner or kanban columns
    const loader = page.locator('[class*="animate-spin"]')
    const columns = page.locator('[data-status]')
    
    // One of these should be visible
    await expect(loader.or(columns.first())).toBeVisible({ timeout: 10000 })
  })

  test('should be accessible via keyboard', async ({ page }) => {
    await page.goto('/pipeline')
    
    // Tab through the page to check focus management
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate with keyboard
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
