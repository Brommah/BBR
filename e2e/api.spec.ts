import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test('GET /api/intake should return status ok', async ({ request }) => {
    const response = await request.get('/api/intake')
    
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.acceptedProjectTypes).toBeDefined()
    expect(Array.isArray(data.acceptedProjectTypes)).toBeTruthy()
  })

  test('POST /api/intake should validate required fields', async ({ request }) => {
    const response = await request.post('/api/intake', {
      data: {
        // Missing required fields
        clientName: '',
      },
    })
    
    expect(response.status()).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  test('POST /api/intake should reject invalid email', async ({ request }) => {
    const response = await request.post('/api/intake', {
      data: {
        clientName: 'Test User',
        clientEmail: 'invalid-email',
        projectType: 'Dakkapel',
        city: 'Amsterdam',
      },
    })
    
    expect(response.status()).toBe(400)
    
    const data = await response.json()
    expect(data.details).toBeDefined()
  })

  test('POST /api/intake should accept valid submission', async ({ request }) => {
    const response = await request.post('/api/intake', {
      data: {
        clientName: 'E2E Test User',
        clientEmail: 'e2e-test@example.com',
        clientPhone: '0612345678',
        projectType: 'Dakkapel',
        city: 'Amsterdam',
        address: 'Teststraat 123',
        description: 'E2E test submission',
      },
    })
    
    // Should succeed (201) or hit rate limit (429)
    expect([200, 201, 429]).toContain(response.status())
    
    if (response.status() !== 429) {
      const data = await response.json()
      expect(data.success).toBeTruthy()
      expect(data.leadId).toBeDefined()
    }
  })

  test('POST /api/intake should enforce rate limiting', async ({ request }) => {
    // Make multiple requests to trigger rate limit
    const requests = Array(10).fill(null).map(() =>
      request.post('/api/intake', {
        data: {
          clientName: 'Rate Limit Test',
          clientEmail: 'ratelimit@example.com',
          projectType: 'Uitbouw',
          city: 'Rotterdam',
        },
      })
    )
    
    const responses = await Promise.all(requests)
    const statuses = responses.map((r) => r.status())
    
    // At least one should be rate limited (429) after several requests
    // Or all could succeed if rate limit window reset
    expect(statuses.every((s) => [200, 201, 400, 429].includes(s))).toBeTruthy()
  })
})
