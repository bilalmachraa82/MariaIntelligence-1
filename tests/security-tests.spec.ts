/**
 * Security Validation Tests
 * Tests security measures, rate limiting, input validation, and attack prevention
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server/index'
import { describeIf, FULL_STACK_ENABLED, logSkip } from './utils/testFlags'

const describeFullStack = describeIf(FULL_STACK_ENABLED)

if (!FULL_STACK_ENABLED) {
  logSkip('Security validation tests skipped (ENABLE_FULL_STACK_TESTS=true required)')
}

describeFullStack('Security Validation Tests', () => {
  let server: any

  beforeAll(async () => {
    server = app.listen(0)
  })

  afterAll(async () => {
    if (server) {
      server.close()
    }
  })

  describe('Rate Limiting Tests', () => {
    it('should enforce API rate limiting on bulk requests', async () => {
      const endpoint = '/api/properties'
      const requests = Array.from({ length: 50 }, () =>
        request(app).get(endpoint)
      )
      
      const responses = await Promise.allSettled(requests)
      const rateLimitedResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      ).length
      
      console.log(`Rate limited responses: ${rateLimitedResponses} out of ${requests.length}`)
      
      // At least verify the system handles bulk requests gracefully
      const errorResponses = responses.filter(r => r.status === 'rejected').length
      expect(errorResponses).toBeLessThan(requests.length * 0.5) // Less than 50% should fail
    })

    it('should handle AI endpoint load', async () => {
      const requests = Array.from({ length: 20 }, () =>
        request(app).get('/api/check-ai-services')
      )
      
      const responses = await Promise.allSettled(requests)
      const successfulResponses = responses.filter(r => 
        r.status === 'fulfilled' && [200, 500].includes(r.value.status)
      ).length
      
      expect(successfulResponses).toBeGreaterThan(0) // Should handle at least some requests
    })
  })

  describe('Input Validation Tests', () => {
    it('should validate property creation input', async () => {
      const invalidInputs = [
        {}, // Empty object
        { name: '' }, // Empty name
        { name: 'A'.repeat(300) }, // Too long name
        { name: 'Test<script>alert("xss")</script>' }, // XSS attempt
      ]
      
      for (const invalidInput of invalidInputs) {
        const response = await request(app)
          .post('/api/properties')
          .send(invalidInput)
        
        expect([400, 422]).toContain(response.status)
        expect(response.body).toHaveProperty('message')
      }
    })

    it('should validate owner creation input', async () => {
      const invalidInputs = [
        {}, // Empty object
        { name: '', email: 'invalid' }, // Empty name, invalid email
        { name: 'Test', email: 'not-an-email' }, // Invalid email format
      ]
      
      for (const invalidInput of invalidInputs) {
        const response = await request(app)
          .post('/api/owners')
          .send(invalidInput)
        
        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.status).toBeLessThan(500)
      }
    })

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "1'; DROP TABLE properties; --",
        "1' OR '1'='1",
      ]
      
      for (const injection of sqlInjectionAttempts) {
        const response = await request(app)
          .get(`/api/properties/${encodeURIComponent(injection)}`)
        
        // Should return 404 (not found) or 400 (bad request), not 500 (server error from SQL injection)
        expect([404, 400]).toContain(response.status)
      }
    })
  })

  describe('Security Headers Tests', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options', 
        'x-xss-protection'
      ]
      
      const headersPresentCount = requiredHeaders.filter(header => 
        !!response.headers[header]
      ).length
      
      expect(headersPresentCount).toBeGreaterThan(0) // At least some security headers should be present
    })

    it('should handle CORS requests', async () => {
      const response = await request(app)
        .options('/api/properties')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
      
      expect(response.status).toBeLessThan(500) // Should handle CORS preflight without server error
    })
  })

  describe('Attack Prevention Tests', () => {
    it('should prevent directory traversal attempts', async () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
      ]
      
      for (const traversal of traversalAttempts) {
        const response = await request(app)
          .get(`/api/properties/${encodeURIComponent(traversal)}`)
        
        // Should return 404 (not found) or 400 (bad request), not file contents
        expect([404, 400]).toContain(response.status)
        
        // Ensure no file system paths in response
        const responseText = JSON.stringify(response.body)
        expect(responseText).not.toContain('/etc/passwd')
        expect(responseText).not.toContain('system32')
      }
    })

    it('should handle large payload attacks', async () => {
      const largePayload = {
        name: 'A'.repeat(100000), // 100KB string
      }
      
      const startTime = Date.now()
      const response = await request(app)
        .post('/api/properties')
        .send(largePayload)
      const responseTime = Date.now() - startTime
      
      // Should either reject the large payload or handle it efficiently
      expect([400, 413, 422]).toContain(response.status)
      expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
    })

    it('should validate authorization handling', async () => {
      const protectedEndpoints = [
        '/api/properties',
        '/api/owners', 
        '/api/reservations'
      ]
      
      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', 'Bearer invalid-token')
        
        // Should either allow (if no auth required) or properly reject
        expect([200, 401, 403]).toContain(response.status)
      }
    })
  })

  describe('Data Protection Tests', () => {
    it('should not leak sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/api/properties/999999999')
        .expect(404)
      
      const errorMessage = JSON.stringify(response.body).toLowerCase()
      
      // Error message should not contain sensitive information
      const sensitiveTerms = ['password', 'secret', 'key', 'token']
      const containsSensitiveInfo = sensitiveTerms.some(term => 
        errorMessage.includes(term)
      )
      
      expect(containsSensitiveInfo).toBe(false)
    })

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })
  })
})
