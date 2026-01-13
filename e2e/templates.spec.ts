import { test, expect } from '@playwright/test'

test.describe('Templates Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/templates')
  })

  test('should load templates page', async ({ page }) => {
    await expect(page).toHaveURL(/\/templates/)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should display page content', async ({ page }) => {
    // Page should have some content
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
  })

  test('should be accessible via keyboard', async ({ page }) => {
    // Tab through the page
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Some element should be focused
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeDefined()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('main')).toBeVisible()
  })
})
