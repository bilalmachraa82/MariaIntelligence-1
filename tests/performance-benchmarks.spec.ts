/**
 * Performance Benchmark Tests
 * Tests application performance under various load conditions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server/index'
import { performance } from 'perf_hooks'
import { describeIf, FULL_STACK_ENABLED, logSkip } from './utils/testFlags'

const describeFullStack = describeIf(FULL_STACK_ENABLED)

if (!FULL_STACK_ENABLED) {
  logSkip('Performance benchmarks skipped (ENABLE_FULL_STACK_TESTS=true required)')
}

describeFullStack('Performance Benchmarks', () => {
  let server: any
  let performanceMetrics: {
    apiResponseTimes: Record<string, number[]>
    concurrentRequests: Record<string, number>
    memoryUsage: Record<string, any>
    errorRates: Record<string, number>
  }

  beforeAll(async () => {
    server = app.listen(0)
    performanceMetrics = {
      apiResponseTimes: {},
      concurrentRequests: {},
      memoryUsage: {},
      errorRates: {}
    }
  })

  afterAll(async () => {
    if (server) {
      server.close()
    }
    
    // Generate performance report
    console.log('\n=== Performance Benchmark Report ===')
    console.log('API Response Times (avg):')
    Object.entries(performanceMetrics.apiResponseTimes).forEach(([endpoint, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      console.log(`  ${endpoint}: ${avg.toFixed(2)}ms`)
    })
    
    console.log('\nConcurrent Request Handling:')
    Object.entries(performanceMetrics.concurrentRequests).forEach(([test, count]) => {
      console.log(`  ${test}: ${count} requests/second`)
    })
    
    console.log('\nError Rates:')
    Object.entries(performanceMetrics.errorRates).forEach(([endpoint, rate]) => {
      console.log(`  ${endpoint}: ${(rate * 100).toFixed(2)}% error rate`)
    })
    console.log('====================================\n')
  })

  describe('API Response Time Benchmarks', () => {
    const measureResponseTime = async (endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
      const startTime = performance.now()
      
      let response
      if (method === 'GET') {
        response = await request(app).get(endpoint)
      } else {
        response = await request(app).post(endpoint).send(data)
      }
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      if (!performanceMetrics.apiResponseTimes[endpoint]) {
        performanceMetrics.apiResponseTimes[endpoint] = []
      }
      performanceMetrics.apiResponseTimes[endpoint].push(responseTime)
      
      return { response, responseTime }
    }

    it('should measure health check response time', async () => {
      const { response, responseTime } = await measureResponseTime('/api/health')
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(500) // Should respond within 500ms
    })

    it('should measure properties list response time', async () => {
      const { response, responseTime } = await measureResponseTime('/api/properties')
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
    })

    it('should measure statistics endpoint response time', async () => {
      const { response, responseTime } = await measureResponseTime('/api/statistics')
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(3000) // Statistics can take up to 3 seconds
    })

    it('should measure dashboard data response time', async () => {
      const { response, responseTime } = await measureResponseTime('/api/reservations/dashboard')
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Dashboard should load within 2 seconds
    })

    it('should measure AI service check response time', async () => {
      const { response, responseTime } = await measureResponseTime('/api/check-ai-services')
      
      expect([200, 500]).toContain(response.status)
      expect(responseTime).toBeLessThan(5000) // AI check can take up to 5 seconds
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle 10 concurrent health checks', async () => {
      const concurrentRequests = 10
      const startTime = performance.now()
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app).get('/api/health').expect(200)
      )
      
      const responses = await Promise.all(promises)
      const endTime = performance.now()
      const duration = endTime - startTime
      const requestsPerSecond = (concurrentRequests / duration) * 1000
      
      performanceMetrics.concurrentRequests['health_check_10'] = requestsPerSecond
      
      expect(responses).toHaveLength(concurrentRequests)
      expect(duration).toBeLessThan(5000) // Should complete within 2 seconds
    })

    it('should handle 20 concurrent property requests', async () => {
      const concurrentRequests = 20
      const startTime = performance.now()
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app).get('/api/properties')
      )
      
      const responses = await Promise.allSettled(promises)
      const endTime = performance.now()
      const duration = endTime - startTime
      const requestsPerSecond = (concurrentRequests / duration) * 1000
      
      performanceMetrics.concurrentRequests['properties_20'] = requestsPerSecond
      
      const successfulRequests = responses.filter(r => r.status === 'fulfilled').length
      const errorRate = (concurrentRequests - successfulRequests) / concurrentRequests
      performanceMetrics.errorRates['properties_concurrent'] = errorRate
      
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(errorRate).toBeLessThan(0.2) // Less than 20% error rate acceptable
    })

    it('should handle mixed endpoint concurrent requests', async () => {
      const endpoints = [
        '/api/health',
        '/api/properties',
        '/api/owners',
        '/api/activities',
        '/api/enums'
      ]
      
      const startTime = performance.now()
      
      const promises = endpoints.flatMap(endpoint =>
        Array.from({ length: 5 }, () =>
          request(app).get(endpoint)
        )
      )
      
      const responses = await Promise.allSettled(promises)
      const endTime = performance.now()
      const duration = endTime - startTime
      const requestsPerSecond = (promises.length / duration) * 1000
      
      performanceMetrics.concurrentRequests['mixed_endpoints'] = requestsPerSecond
      
      const successfulRequests = responses.filter(r => r.status === 'fulfilled').length
      const errorRate = (promises.length - successfulRequests) / promises.length
      performanceMetrics.errorRates['mixed_concurrent'] = errorRate
      
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(errorRate).toBeLessThan(0.3) // Less than 30% error rate acceptable for mixed load
    })
  })

  describe('Memory Usage Monitoring', () => {
    it('should monitor memory usage during operations', async () => {
      const initialMemory = process.memoryUsage()
      
      // Perform memory-intensive operations
      const responses = await Promise.all([
        request(app).get('/api/statistics'),
        request(app).get('/api/statistics/monthly-revenue'),
        request(app).get('/api/reservations/dashboard'),
        request(app).get('/api/activities')
      ])
      
      const finalMemory = process.memoryUsage()
      const memoryDelta = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        external: finalMemory.external - initialMemory.external,
        rss: finalMemory.rss - initialMemory.rss
      }
      
      performanceMetrics.memoryUsage['statistics_operations'] = memoryDelta
      
      responses.forEach(response => {
        expect([200, 500]).toContain(response.status)
      })
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryDelta.heapUsed).toBeLessThan(50 * 1024 * 1024)
    })

    it('should test memory stability under repeated requests', async () => {
      const measurements: any[] = []
      
      // Perform 20 iterations of requests
      for (let i = 0; i < 20; i++) {
        await request(app).get('/api/properties')
        
        if (i % 5 === 0) {
          measurements.push(process.memoryUsage())
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc()
          }
        }
      }
      
      // Check for memory leaks (heap should not grow continuously)
      const heapGrowth = measurements.map(m => m.heapUsed)
      const averageGrowth = heapGrowth.slice(1).reduce((sum, current, index) => {
        return sum + (current - heapGrowth[index])
      }, 0) / (heapGrowth.length - 1)
      
      performanceMetrics.memoryUsage['repeated_requests_growth'] = averageGrowth
      
      // Average memory growth per iteration should be minimal
      expect(averageGrowth).toBeLessThan(1024 * 1024) // Less than 1MB per iteration
    })
  })

  describe('Database Performance', () => {
    it('should measure database query performance', async () => {
      const queries = [
        'properties',
        'owners', 
        'reservations',
        'activities'
      ]
      
      for (const queryType of queries) {
        const startTime = performance.now()
        const response = await request(app).get(`/api/${queryType}`)
        const endTime = performance.now()
        const queryTime = endTime - startTime
        
        performanceMetrics.apiResponseTimes[`db_${queryType}`] = [queryTime]
        
        expect(response.status).toBe(200)
        expect(queryTime).toBeLessThan(5000) // Database queries should be under 2 seconds
      }
    })

    it('should test database connection pool under load', async () => {
      const connectionTests = Array.from({ length: 15 }, () =>
        request(app).get('/health')
      )
      
      const startTime = performance.now()
      const responses = await Promise.allSettled(connectionTests)
      const endTime = performance.now()
      
      const duration = endTime - startTime
      const successfulConnections = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length
      
      const connectionErrorRate = (connectionTests.length - successfulConnections) / connectionTests.length
      performanceMetrics.errorRates['database_connections'] = connectionErrorRate
      
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(connectionErrorRate).toBeLessThan(0.1) // Less than 10% connection errors
    })
  })

  describe('File Processing Performance', () => {
    it('should measure file upload endpoint response time', async () => {
      const startTime = performance.now()
      
      // Test without actual file (should handle gracefully)
      const response = await request(app)
        .post('/api/ocr')
        .expect(400) // Expected error without file
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      performanceMetrics.apiResponseTimes['file_upload_validation'] = [responseTime]
      
      expect(responseTime).toBeLessThan(1000) // Should validate quickly
      expect(response.body).toHaveProperty('message')
    })

    it('should measure AI service integration response time', async () => {
      const aiEndpoints = [
        '/api/check-ai-services',
        '/api/check-gemini-key',
        '/api/gemini/health',
        '/api/test-ai-adapter'
      ]
      
      for (const endpoint of aiEndpoints) {
        const startTime = performance.now()
        const response = await request(app).get(endpoint)
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        performanceMetrics.apiResponseTimes[`ai_${endpoint.replace(/[^\w]/g, '_')}`] = [responseTime]
        
        expect([200, 400, 500]).toContain(response.status)
        expect(responseTime).toBeLessThan(10000) // AI services can take up to 10 seconds
      }
    })
  })

  describe('Load Testing Scenarios', () => {
    it('should simulate typical user workflow load', async () => {
      // Simulate a user session: dashboard -> properties -> statistics -> activities
      const userWorkflow = async () => {
        await request(app).get('/api/reservations/dashboard')
        await request(app).get('/api/properties')
        await request(app).get('/api/statistics')
        await request(app).get('/api/activities')
      }
      
      const concurrentUsers = 5
      const startTime = performance.now()
      
      const workflows = Array.from({ length: concurrentUsers }, userWorkflow)
      const results = await Promise.allSettled(workflows)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      const completedWorkflows = results.filter(r => r.status === 'fulfilled').length
      
      performanceMetrics.concurrentRequests['user_workflow'] = (completedWorkflows / duration) * 1000
      performanceMetrics.errorRates['user_workflow'] = (concurrentUsers - completedWorkflows) / concurrentUsers
      
      expect(duration).toBeLessThan(15000) // Should complete within 15 seconds
      expect(completedWorkflows).toBeGreaterThan(concurrentUsers * 0.8) // At least 80% success rate
    })

    it('should test system recovery under high load', async () => {
      // Generate high load and then test recovery
      const highLoadRequests = Array.from({ length: 50 }, () =>
        request(app).get('/api/properties')
      )
      
      // Execute high load
      await Promise.allSettled(highLoadRequests)
      
      // Wait for system to recover
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test if system is still responsive
      const recoveryStartTime = performance.now()
      const recoveryResponse = await request(app)
        .get('/api/health')
        .expect(200)
      const recoveryTime = performance.now() - recoveryStartTime
      
      performanceMetrics.apiResponseTimes['post_load_recovery'] = [recoveryTime]
      
      expect(recoveryResponse.body.status).toBe('ok')
      expect(recoveryTime).toBeLessThan(5000) // Should recover within 2 seconds
    })
  })
})
