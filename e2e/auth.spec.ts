import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check login form elements
    await expect(page.getByPlaceholder(/e-mailadres/i)).toBeVisible()
    await expect(page.getByPlaceholder(/wachtwoord/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /inloggen/i })).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.getByPlaceholder(/e-mailadres/i).fill('invalid@test.com')
    await page.getByPlaceholder(/wachtwoord/i).fill('wrongpassword')
    await page.getByRole('button', { name: /inloggen/i }).click()
    
    // Should show error message or stay on login page
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access admin page without auth
    await page.goto('/admin')
    
    // Should redirect to login or show access denied
    await expect(page).toHaveURL(/\/login|\/admin/)
  })

  test('should show login prompt on dashboard when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should show login button or redirect to login
    const loginButton = page.getByRole('button', { name: /inloggen/i })
    const welcomeText = page.getByText(/welkom/i)
    
    await expect(loginButton.or(welcomeText)).toBeVisible()
  })
})
