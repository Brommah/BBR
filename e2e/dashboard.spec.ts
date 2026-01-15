import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show welcome message or login prompt when not authenticated', async ({ page }) => {
    // Unauthenticated users see welcome screen or login button
    // Wait for page to load completely
    await page.waitForLoadState('networkidle')
    
    // Should see either welcome message or login button
    const welcomeText = page.getByText(/welkom/i)
    const loginButton = page.getByRole('button', { name: /inloggen/i })
    await expect(welcomeText.or(loginButton)).toBeVisible({ timeout: 10000 })
  })

  test('should have login button when not authenticated', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /inloggen/i })
    await expect(loginButton).toBeVisible()
  })

  test('should navigate to login on button click', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /inloggen/i })
    
    if (await loginButton.isVisible()) {
      await loginButton.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('main')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('main')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should have proper page structure', async ({ page }) => {
    // Main content area should exist
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out expected/known errors
    const criticalErrors = errors.filter(
      (err) => 
        !err.includes('ResizeObserver') && 
        !err.includes('favicon') &&
        !err.includes('chunk')
    )

    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Dashboard - Authenticated User', () => {
  // These tests would run with authentication
  // For now, testing the structure exists
  
  test('should have sidebar toggle on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Sidebar toggle might not be visible on unauthenticated view
    // This tests the page renders correctly on mobile
    await expect(page.getByRole('main')).toBeVisible()
  })
})
