import { test, expect } from '@playwright/test'

test.describe('Intake Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/intake')
  })

  test('should display the intake form correctly', async ({ page }) => {
    // Check page title and form elements
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.getByPlaceholder('Uw volledige naam')).toBeVisible()
    await expect(page.getByPlaceholder('uw@email.nl')).toBeVisible()
    await expect(page.getByRole('button', { name: /aanvraag/i })).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /aanvraag/i }).click()
    
    // Form should not submit (stay on same page)
    await expect(page).toHaveURL(/\/intake/)
  })

  test('should fill and submit intake form', async ({ page }) => {
    // Fill in the form
    await page.getByPlaceholder('Uw volledige naam').fill('Test Klant')
    await page.getByPlaceholder('uw@email.nl').fill('test@example.com')
    await page.getByPlaceholder('06 12345678').fill('0612345678')
    
    // Select project type
    await page.getByRole('combobox', { name: /projecttype/i }).click()
    await page.getByRole('option', { name: /dakkapel/i }).click()
    
    // Fill city
    await page.getByPlaceholder('bijv. Amsterdam').fill('Amsterdam')
    
    // Submit form
    await page.getByRole('button', { name: /aanvraag/i }).click()
    
    // Wait for success message or redirect
    await expect(page.getByText(/ontvangen|bedankt|succes/i)).toBeVisible({ timeout: 10000 })
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check form is still usable
    await expect(page.getByPlaceholder('Uw volledige naam')).toBeVisible()
    await expect(page.getByRole('button', { name: /aanvraag/i })).toBeVisible()
  })
})
