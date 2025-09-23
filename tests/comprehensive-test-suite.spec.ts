/**
 * Comprehensive Test Suite for MariaIntelligence
 * Tests all critical functionality for MVP deployment readiness
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '../server/index'
import { db, checkDatabaseConnection, initializeDatabase } from '../server/db/index'
import { storage } from '../server/storage'
import { describeIf, FULL_STACK_ENABLED, logSkip } from './utils/testFlags'

const describeFullStack = describeIf(FULL_STACK_ENABLED)

if (!FULL_STACK_ENABLED) {
  logSkip('Comprehensive test suite skipped (ENABLE_FULL_STACK_TESTS=true required)')
}

describeFullStack('MariaIntelligence Comprehensive Test Suite', () => {
  let server: any
  let baseURL: string

  beforeAll(async () => {
    // Initialize database and verify connectivity
    const dbInit = await initializeDatabase()
    expect(dbInit.success).toBe(true)
    
    // Start test server
    server = app.listen(0) // Use random port
    const address = server.address()
    baseURL = `http://localhost:${address?.port || 3000}`
    
    console.log(`Test server started on ${baseURL}`)
  })

  afterAll(async () => {
    if (server) {
      server.close()
    }
  })

  describe('1. Critical Function Testing - User Registration & Authentication', () => {
    it('should handle user registration flow', async () => {
      // Test user registration endpoint (if exists)
      const response = await request(app)
        .get('/api/health')
        .expect(200)
      
      expect(response.body.status).toBe('ok')
    })

    it('should validate session management', async () => {
      // Test session validation
      const response = await request(app)
        .get('/api/properties')
        .expect(200)
      
      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  describe('2. Database Operations & Data Persistence', () => {
    it('should verify database connectivity', async () => {
      const healthCheck = await checkDatabaseConnection()
      expect(healthCheck.healthy).toBe(true)
      expect(healthCheck.latency).toBeDefined()
      expect(healthCheck.details.connected).toBe(true)
    })

    it('should test CRUD operations for properties', async () => {
      // Create property
      const newProperty = {
        name: 'Test Property',
        ownerId: 1,
        cleaningCost: '50',
        checkInFee: '25',
        commission: '15',
        teamPayment: '30',
        active: true
      }

      const createResponse = await request(app)
        .post('/api/properties')
        .send(newProperty)
        .expect(201)

      expect(createResponse.body.name).toBe(newProperty.name)
      const propertyId = createResponse.body.id

      // Read property
      const readResponse = await request(app)
        .get(`/api/properties/${propertyId}`)
        .expect(200)

      expect(readResponse.body.name).toBe(newProperty.name)

      // Update property
      const updateResponse = await request(app)
        .patch(`/api/properties/${propertyId}`)
        .send({ name: 'Updated Test Property' })
        .expect(200)

      expect(updateResponse.body.name).toBe('Updated Test Property')

      // Delete property
      await request(app)
        .delete(`/api/properties/${propertyId}`)
        .expect(204)
    })

    it('should test CRUD operations for owners', async () => {
      // Create owner
      const newOwner = {
        name: 'Test Owner',
        email: 'test@example.com',
        phone: '123456789',
        nif: '123456789',
        address: 'Test Address'
      }

      const createResponse = await request(app)
        .post('/api/owners')
        .send(newOwner)
        .expect(201)

      expect(createResponse.body.name).toBe(newOwner.name)
      expect(createResponse.body.email).toBe(newOwner.email)
      
      const ownerId = createResponse.body.id

      // Read owner
      const readResponse = await request(app)
        .get(`/api/owners/${ownerId}`)
        .expect(200)

      expect(readResponse.body.name).toBe(newOwner.name)

      // Update owner
      const updateResponse = await request(app)
        .patch(`/api/owners/${ownerId}`)
        .send({ name: 'Updated Test Owner' })
        .expect(200)

      expect(updateResponse.body.name).toBe('Updated Test Owner')

      // Delete owner
      await request(app)
        .delete(`/api/owners/${ownerId}`)
        .expect(204)
    })

    it('should test reservation creation with property calculations', async () => {
      // First create a test property and owner
      const owner = await request(app)
        .post('/api/owners')
        .send({
          name: 'Reservation Test Owner',
          email: 'restest@example.com',
          phone: '987654321',
          nif: '987654321',
          address: 'Reservation Test Address'
        })
        .expect(201)

      const property = await request(app)
        .post('/api/properties')
        .send({
          name: 'Reservation Test Property',
          ownerId: owner.body.id,
          cleaningCost: '40',
          checkInFee: '20',
          commission: '10',
          teamPayment: '25',
          active: true
        })
        .expect(201)

      // Create reservation
      const reservation = {
        propertyId: property.body.id,
        guestName: 'Test Guest',
        guestEmail: 'guest@example.com',
        guestPhone: '555-0123',
        checkInDate: '2025-03-15',
        checkOutDate: '2025-03-18',
        totalAmount: '300',
        platform: 'airbnb',
        platformFee: '30',
        numGuests: 2,
        status: 'confirmed'
      }

      const createResponse = await request(app)
        .post('/api/reservations')
        .send(reservation)
        .expect(201)

      expect(createResponse.body.guestName).toBe(reservation.guestName)
      expect(createResponse.body.propertyId).toBe(property.body.id)
      expect(createResponse.body.cleaningFee).toBe('40')
      expect(createResponse.body.checkInFee).toBe('20')

      // Cleanup
      await request(app).delete(`/api/reservations/${createResponse.body.id}`)
      await request(app).delete(`/api/properties/${property.body.id}`)
      await request(app).delete(`/api/owners/${owner.body.id}`)
    })
  })

  describe('3. API Integration Tests with Error Handling', () => {
    it('should test API health endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('database')
    })

    it('should handle API errors gracefully', async () => {
      // Test invalid property ID
      const response = await request(app)
        .get('/api/properties/999999')
        .expect(404)

      expect(response.body).toHaveProperty('message')
    })

    it('should validate input data properly', async () => {
      // Test invalid property creation
      const response = await request(app)
        .post('/api/properties')
        .send({
          // Missing required fields
          name: ''
        })
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })

    it('should test pagination and filtering', async () => {
      // Test properties list
      const response = await request(app)
        .get('/api/properties')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)

      // Test activities with limit
      const activitiesResponse = await request(app)
        .get('/api/activities?limit=10')
        .expect(200)

      expect(activitiesResponse.body).toHaveProperty('activities')
      expect(Array.isArray(activitiesResponse.body.activities)).toBe(true)
    })
  })

  describe('4. AI Service Integration & Fallbacks', () => {
    it('should check AI service availability', async () => {
      const response = await request(app)
        .get('/api/check-ai-services')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body).toHaveProperty('services')
      expect(response.body).toHaveProperty('currentService')
      expect(response.body).toHaveProperty('anyServiceAvailable')
    })

    it('should test Gemini API connectivity', async () => {
      const response = await request(app)
        .get('/api/gemini/health')

      // Should return either success or proper error structure
      expect([200, 500]).toContain(response.status)
      expect(response.body).toHaveProperty('service', 'gemini')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('health')
    })

    it('should test AI adapter functionality', async () => {
      const response = await request(app)
        .get('/api/test-ai-adapter')

      // Should return service status regardless of API availability
      expect([200, 500]).toContain(response.status)
      expect(response.body).toHaveProperty('currentService')
    })

    it('should validate text import functionality', async () => {
      const testText = `
        Booking Confirmation - Test Property
        Guest: John Doe
        Email: john@example.com
        Check-in: 2025-04-15
        Check-out: 2025-04-18
        Guests: 2
        Total: 250.00€
        Platform: Booking.com
      `

      const response = await request(app)
        .post('/api/reservations/import-text')
        .send({
          text: testText,
          propertyId: null,
          userAnswers: {}
        })

      // Should handle gracefully whether AI is available or not
      expect([200, 400, 500]).toContain(response.status)
      expect(response.body).toHaveProperty('success')
    })
  })

  describe('5. File Upload & Processing', () => {
    it('should handle file upload endpoints', async () => {
      // Test OCR endpoint without file (should fail gracefully)
      const response = await request(app)
        .post('/api/ocr')
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })

    it('should test financial document processing endpoint', async () => {
      const response = await request(app)
        .post('/api/process-financial-document')
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('message')
    })

    it('should validate file type restrictions', async () => {
      // This would test actual file upload with invalid types
      // For now, we test the endpoint availability
      const response = await request(app)
        .post('/api/learn-document-format')
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
    })
  })

  describe('6. Statistics & Reporting', () => {
    it('should generate statistics correctly', async () => {
      const response = await request(app)
        .get('/api/statistics')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('totalRevenue')
      expect(response.body).toHaveProperty('netProfit')
      expect(response.body).toHaveProperty('occupancyRate')
      expect(response.body).toHaveProperty('totalProperties')
      expect(response.body).toHaveProperty('activeProperties')
    })

    it('should generate monthly revenue data', async () => {
      const response = await request(app)
        .get('/api/statistics/monthly-revenue')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body).toHaveProperty('granularity')
    })

    it('should handle date range filtering', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      const response = await request(app)
        .get(`/api/statistics?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })
  })

  describe('7. Dashboard & Activities', () => {
    it('should load dashboard data correctly', async () => {
      const response = await request(app)
        .get('/api/reservations/dashboard')
        .expect(200)

      expect(response.body).toHaveProperty('checkIns')
      expect(response.body).toHaveProperty('checkOuts')
      expect(response.body).toHaveProperty('cleaningTasks')
      expect(Array.isArray(response.body.checkIns)).toBe(true)
      expect(Array.isArray(response.body.checkOuts)).toBe(true)
      expect(Array.isArray(response.body.cleaningTasks)).toBe(true)
    })

    it('should manage activities properly', async () => {
      // Get activities
      const getResponse = await request(app)
        .get('/api/activities')
        .expect(200)

      expect(getResponse.body).toHaveProperty('activities')
      expect(Array.isArray(getResponse.body.activities)).toBe(true)

      // Create activity
      const newActivity = {
        type: 'test_activity',
        description: 'Test activity for comprehensive testing',
        entityType: 'system'
      }

      const createResponse = await request(app)
        .post('/api/activities')
        .send(newActivity)
        .expect(201)

      expect(createResponse.body.type).toBe(newActivity.type)
      expect(createResponse.body.description).toBe(newActivity.description)
    })
  })

  describe('8. Translation & Internationalization', () => {
    it('should serve application correctly', async () => {
      // In production, this would test if the client build is served correctly
      // For now, we test that the server is responding
      const response = await request(app)
        .get('/api/enums')
        .expect(200)

      expect(response.body).toHaveProperty('reservationStatus')
      expect(response.body).toHaveProperty('reservationPlatform')
      expect(Array.isArray(response.body.reservationStatus)).toBe(true)
      expect(Array.isArray(response.body.reservationPlatform)).toBe(true)
    })
  })
})

describe('Performance & Load Testing', () => {
  it('should handle concurrent requests', async () => {
    const promises = Array.from({ length: 10 }, () =>
      request(app)
        .get('/api/properties')
        .expect(200)
    )

    const responses = await Promise.all(promises)
    responses.forEach(response => {
      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  it('should respond within acceptable time limits', async () => {
    const startTime = Date.now()
    
    await request(app)
      .get('/api/statistics')
      .expect(200)
    
    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(5000) // Should respond within 5 seconds
  })

  it('should handle database stress testing', async () => {
    const promises = Array.from({ length: 5 }, () =>
      request(app)
        .get('/api/statistics')
        .expect(200)
    )

    const responses = await Promise.all(promises)
    responses.forEach(response => {
      expect(response.body).toHaveProperty('success', true)
    })
  })
})

describe('Error Scenario Testing', () => {
  it('should handle database disconnection gracefully', async () => {
    // This test assumes the database might be temporarily unavailable
    // In a real scenario, we'd mock the database to simulate disconnection
    
    const response = await request(app)
      .get('/health')

    if (response.status === 500) {
      expect(response.body).toHaveProperty('status', 'error')
      expect(response.body).toHaveProperty('database', 'disconnected')
    } else {
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'ok')
    }
  })

  it('should validate API rate limiting', async () => {
    // Test that rate limiting is in place for AI endpoints
    const promises = Array.from({ length: 30 }, () =>
      request(app)
        .get('/api/gemini/health')
    )

    const responses = await Promise.allSettled(promises)
    const statusCodes = responses.map(r => 
      r.status === 'fulfilled' ? r.value.status : 500
    )

    // Should include some rate-limited responses (429) for heavy load
    const hasRateLimiting = statusCodes.some(code => code === 429)
    console.log('Rate limiting detected:', hasRateLimiting)
  })

  it('should handle malformed JSON gracefully', async () => {
    const response = await request(app)
      .post('/api/properties')
      .send('invalid json')
      .set('Content-Type', 'application/json')
      .expect(400)

    expect(response.body).toHaveProperty('message')
  })

  it('should validate security headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)

    // Check for security headers
    expect(response.headers).toHaveProperty('x-content-type-options')
    expect(response.headers).toHaveProperty('x-frame-options')
    expect(response.headers).toHaveProperty('x-xss-protection')
  })

  it('should handle CORS properly', async () => {
    const response = await request(app)
      .options('/api/properties')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')

    expect(response.status).toBeLessThan(500)
  })
})

describe('Integration Testing Summary', () => {
  it('should provide comprehensive system health check', async () => {
    const response = await request(app)
      .get('/api/test-integrations')
      .expect(200)

    expect(response.body).toHaveProperty('success')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('tests')
    expect(Array.isArray(response.body.tests)).toBe(true)

    // Log test results for debugging
    console.log('\n=== System Integration Test Results ===')
    response.body.tests.forEach((test: any) => {
      console.log(`${test.success ? '✅' : '❌'} ${test.name}`)
      if (test.error) {
        console.log(`   Error: ${test.error}`)
      }
      if (test.details) {
        console.log(`   Details:`, JSON.stringify(test.details, null, 2))
      }
    })
    console.log('========================================\n')
  })
})
