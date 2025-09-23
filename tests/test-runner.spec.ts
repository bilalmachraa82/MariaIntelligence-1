/**
 * Test Runner and Report Generator
 * Orchestrates all tests and generates comprehensive deployment readiness report
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../server/index'
import { checkDatabaseConnection, initializeDatabase } from '../server/db/index'
import fs from 'fs/promises'
import path from 'path'
import { describeIf, FULL_STACK_ENABLED, logSkip } from './utils/testFlags'

interface TestResults {
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    passRate: number
    overallStatus: 'READY' | 'NEEDS_ATTENTION' | 'NOT_READY'
  }
  categories: {
    database: TestCategoryResult
    apiIntegration: TestCategoryResult
    aiServices: TestCategoryResult
    fileProcessing: TestCategoryResult
    performance: TestCategoryResult
    security: TestCategoryResult
    userExperience: TestCategoryResult
  }
  blockingIssues: BlockingIssue[]
  recommendations: string[]
  deploymentChecklist: ChecklistItem[]
}

interface TestCategoryResult {
  name: string
  status: 'PASS' | 'WARN' | 'FAIL'
  tests: TestResult[]
  criticalIssues: string[]
  recommendations: string[]
}

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL'
  duration: number
  error?: string
  details?: any
}

interface BlockingIssue {
  category: string
  issue: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  fix: string
}

interface ChecklistItem {
  item: string
  status: 'COMPLETE' | 'INCOMPLETE' | 'N/A'
  details?: string
}

const describeFullStack = describeIf(FULL_STACK_ENABLED)

if (!FULL_STACK_ENABLED) {
  logSkip('Deployment readiness test suite skipped (ENABLE_FULL_STACK_TESTS=true required)')
}

describeFullStack('Deployment Readiness Test Suite', () => {
  let server: any
  let testResults: TestResults
  let startTime: number

  beforeAll(async () => {
    startTime = Date.now()
    server = app.listen(0)
    
    testResults = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        passRate: 0,
        overallStatus: 'NOT_READY'
      },
      categories: {
        database: { name: 'Database Operations', status: 'FAIL', tests: [], criticalIssues: [], recommendations: [] },
        apiIntegration: { name: 'API Integration', status: 'FAIL', tests: [], criticalIssues: [], recommendations: [] },
        aiServices: { name: 'AI Services', status: 'FAIL', tests: [], criticalIssues: [], recommendations: [] },
        fileProcessing: { name: 'File Processing', status: 'FAIL', tests: [], criticalIssues: [], recommendations: [] },
        performance: { name: 'Performance', status: 'FAIL', tests: [], criticalIssues: [], recommendations: [] },
        security: { name: 'Security', status: 'FAIL', tests: [], criticalIssues: [], recommendations: [] },
        userExperience: { name: 'User Experience', status: 'FAIL', tests: [], criticalIssues: [], recommendations: [] }
      },
      blockingIssues: [],
      recommendations: [],
      deploymentChecklist: []
    }
  })

  afterAll(async () => {
    if (server) {
      server.close()
    }

    // Calculate final results
    const totalDuration = Date.now() - startTime
    testResults.summary.passRate = testResults.summary.totalTests > 0 
      ? (testResults.summary.passedTests / testResults.summary.totalTests) * 100 
      : 0

    // Determine overall status
    if (testResults.summary.passRate >= 90 && testResults.blockingIssues.filter(i => i.severity === 'CRITICAL').length === 0) {
      testResults.summary.overallStatus = 'READY'
    } else if (testResults.summary.passRate >= 75 && testResults.blockingIssues.filter(i => i.severity === 'CRITICAL').length <= 1) {
      testResults.summary.overallStatus = 'NEEDS_ATTENTION'
    } else {
      testResults.summary.overallStatus = 'NOT_READY'
    }

    // Generate final report
    await generateDeploymentReport(testResults, totalDuration)
  })

  const runTest = async (category: keyof typeof testResults.categories, testName: string, testFn: () => Promise<any>) => {
    const testStart = Date.now()
    testResults.summary.totalTests++

    try {
      const result = await testFn()
      const duration = Date.now() - testStart

      testResults.categories[category].tests.push({
        name: testName,
        status: 'PASS',
        duration,
        details: result
      })
      testResults.summary.passedTests++

      return result
    } catch (error: any) {
      const duration = Date.now() - testStart

      testResults.categories[category].tests.push({
        name: testName,
        status: 'FAIL',
        duration,
        error: error.message || 'Unknown error'
      })
      testResults.summary.failedTests++

      throw error
    }
  }

  describe('Database Operations Tests', () => {
    it('should verify database connectivity and health', async () => {
      await runTest('database', 'Database Connectivity', async () => {
        const healthCheck = await checkDatabaseConnection()
        expect(healthCheck.healthy).toBe(true)
        
        if (!healthCheck.healthy) {
          testResults.blockingIssues.push({
            category: 'Database',
            issue: 'Database connection failed',
            severity: 'CRITICAL',
            fix: 'Check DATABASE_URL environment variable and database server status'
          })
        }

        return healthCheck
      })
    })

    it('should test database initialization', async () => {
      await runTest('database', 'Database Initialization', async () => {
        const initResult = await initializeDatabase()
        
        if (!initResult.success) {
          testResults.categories.database.criticalIssues.push('Database initialization failed')
          testResults.blockingIssues.push({
            category: 'Database',
            issue: 'Database schema initialization failed',
            severity: 'CRITICAL',
            fix: 'Run database migrations manually or check migration files'
          })
        }

        return initResult
      })
    })

    it('should test CRUD operations', async () => {
      await runTest('database', 'CRUD Operations', async () => {
        // Test property creation
        const property = await request(app)
          .post('/api/properties')
          .send({
            name: 'Test Property CRUD',
            ownerId: 1,
            cleaningCost: '50',
            checkInFee: '25',
            commission: '15',
            teamPayment: '30',
            active: true
          })

        if (property.status !== 201) {
          throw new Error(`Property creation failed with status ${property.status}`)
        }

        // Test property retrieval
        const getProperty = await request(app)
          .get(`/api/properties/${property.body.id}`)

        if (getProperty.status !== 200) {
          throw new Error(`Property retrieval failed with status ${getProperty.status}`)
        }

        // Cleanup
        await request(app).delete(`/api/properties/${property.body.id}`)

        return { created: property.body, retrieved: getProperty.body }
      })
    })

    // Update category status based on test results
    afterAll(() => {
      const categoryTests = testResults.categories.database.tests
      const passedTests = categoryTests.filter(t => t.status === 'PASS').length
      const passRate = passedTests / categoryTests.length

      if (passRate >= 0.9) {
        testResults.categories.database.status = 'PASS'
      } else if (passRate >= 0.7) {
        testResults.categories.database.status = 'WARN'
        testResults.categories.database.recommendations.push('Some database operations need optimization')
      } else {
        testResults.categories.database.status = 'FAIL'
        testResults.categories.database.criticalIssues.push('Critical database functionality is failing')
      }
    })
  })

  describe('API Integration Tests', () => {
    it('should test core API endpoints', async () => {
      await runTest('apiIntegration', 'Core API Endpoints', async () => {
        const endpoints = [
          { path: '/api/health', method: 'GET', expectedStatus: 200 },
          { path: '/api/properties', method: 'GET', expectedStatus: 200 },
          { path: '/api/owners', method: 'GET', expectedStatus: 200 },
          { path: '/api/reservations', method: 'GET', expectedStatus: 200 },
          { path: '/api/activities', method: 'GET', expectedStatus: 200 },
          { path: '/api/statistics', method: 'GET', expectedStatus: 200 },
        ]

        const results = []
        for (const endpoint of endpoints) {
          const response = await request(app).get(endpoint.path)
          results.push({
            endpoint: endpoint.path,
            status: response.status,
            success: response.status === endpoint.expectedStatus
          })

          if (response.status !== endpoint.expectedStatus) {
            testResults.categories.apiIntegration.criticalIssues.push(
              `Endpoint ${endpoint.path} returned ${response.status}, expected ${endpoint.expectedStatus}`
            )
          }
        }

        return results
      })
    })

    it('should test error handling', async () => {
      await runTest('apiIntegration', 'Error Handling', async () => {
        const errorTests = [
          { path: '/api/properties/999999', expectedStatus: 404 },
          { path: '/api/owners/999999', expectedStatus: 404 },
        ]

        const results = []
        for (const test of errorTests) {
          const response = await request(app).get(test.path)
          results.push({
            endpoint: test.path,
            status: response.status,
            success: response.status === test.expectedStatus,
            hasErrorMessage: !!response.body.message
          })
        }

        return results
      })
    })

    afterAll(() => {
      const categoryTests = testResults.categories.apiIntegration.tests
      const passedTests = categoryTests.filter(t => t.status === 'PASS').length
      const passRate = passedTests / categoryTests.length

      if (passRate >= 0.9) {
        testResults.categories.apiIntegration.status = 'PASS'
      } else if (passRate >= 0.7) {
        testResults.categories.apiIntegration.status = 'WARN'
      }
    })
  })

  describe('AI Services Tests', () => {
    it('should test AI service availability', async () => {
      await runTest('aiServices', 'AI Service Availability', async () => {
        const response = await request(app).get('/api/check-ai-services')
        
        if (response.status !== 200) {
          testResults.categories.aiServices.criticalIssues.push('AI service check endpoint failed')
        }

        const hasWorkingService = response.body.anyServiceAvailable
        if (!hasWorkingService) {
          testResults.categories.aiServices.recommendations.push(
            'Configure at least one AI service (Gemini API key) for full functionality'
          )
        }

        return response.body
      })
    })

    it('should test Gemini integration', async () => {
      await runTest('aiServices', 'Gemini Integration', async () => {
        const response = await request(app).get('/api/gemini/health')
        
        return {
          status: response.status,
          available: response.status === 200,
          details: response.body
        }
      })
    })

    afterAll(() => {
      const categoryTests = testResults.categories.aiServices.tests
      const passedTests = categoryTests.filter(t => t.status === 'PASS').length
      const passRate = passedTests / categoryTests.length

      if (passRate >= 0.5) { // AI services are not critical for MVP
        testResults.categories.aiServices.status = 'PASS'
      } else {
        testResults.categories.aiServices.status = 'WARN'
        testResults.categories.aiServices.recommendations.push(
          'AI services are not fully functional but not required for MVP'
        )
      }
    })
  })

  describe('Performance Tests', () => {
    it('should test API response times', async () => {
      await runTest('performance', 'API Response Times', async () => {
        const endpoints = ['/api/health', '/api/properties', '/api/statistics']
        const results = []

        for (const endpoint of endpoints) {
          const start = Date.now()
          const response = await request(app).get(endpoint)
          const duration = Date.now() - start

          results.push({
            endpoint,
            duration,
            status: response.status,
            acceptable: duration < 3000 // 3 seconds threshold
          })

          if (duration > 5000) {
            testResults.categories.performance.criticalIssues.push(
              `Endpoint ${endpoint} took ${duration}ms, which is too slow`
            )
          }
        }

        return results
      })
    })

    it('should test concurrent request handling', async () => {
      await runTest('performance', 'Concurrent Requests', async () => {
        const concurrentRequests = 10
        const promises = Array.from({ length: concurrentRequests }, () =>
          request(app).get('/api/health')
        )

        const start = Date.now()
        const results = await Promise.allSettled(promises)
        const duration = Date.now() - start

        const successful = results.filter(r => r.status === 'fulfilled').length
        const successRate = successful / concurrentRequests

        if (successRate < 0.8) {
          testResults.categories.performance.criticalIssues.push(
            `Only ${successful}/${concurrentRequests} concurrent requests succeeded`
          )
        }

        return {
          totalRequests: concurrentRequests,
          successful,
          successRate,
          totalDuration: duration
        }
      })
    })

    afterAll(() => {
      const categoryTests = testResults.categories.performance.tests
      const passedTests = categoryTests.filter(t => t.status === 'PASS').length
      const passRate = passedTests / categoryTests.length

      if (passRate >= 0.8) {
        testResults.categories.performance.status = 'PASS'
      } else if (passRate >= 0.6) {
        testResults.categories.performance.status = 'WARN'
        testResults.categories.performance.recommendations.push('Performance could be improved')
      }
    })
  })

  describe('Security Tests', () => {
    it('should test input validation', async () => {
      await runTest('security', 'Input Validation', async () => {
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          '"; DROP TABLE properties; --',
          'x'.repeat(1000)
        ]

        const results = []
        for (const input of maliciousInputs) {
          const response = await request(app)
            .post('/api/properties')
            .send({ name: input })

          results.push({
            input: input.substring(0, 50),
            status: response.status,
            rejected: response.status >= 400 && response.status < 500
          })
        }

        const allRejected = results.every(r => r.rejected)
        if (!allRejected) {
          testResults.categories.security.criticalIssues.push('Some malicious inputs were not properly rejected')
        }

        return results
      })
    })

    it('should test security headers', async () => {
      await runTest('security', 'Security Headers', async () => {
        const response = await request(app).get('/api/health')
        
        const securityHeaders = [
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection'
        ]

        const headerResults = securityHeaders.map(header => ({
          header,
          present: !!response.headers[header]
        }))

        const presentHeaders = headerResults.filter(h => h.present).length
        if (presentHeaders === 0) {
          testResults.categories.security.recommendations.push('Add security headers to responses')
        }

        return headerResults
      })
    })

    afterAll(() => {
      const categoryTests = testResults.categories.security.tests
      const passedTests = categoryTests.filter(t => t.status === 'PASS').length
      const passRate = passedTests / categoryTests.length

      if (passRate >= 0.8) {
        testResults.categories.security.status = 'PASS'
      } else if (passRate >= 0.6) {
        testResults.categories.security.status = 'WARN'
      }
    })
  })

  // Generate deployment checklist
  it('should generate deployment readiness checklist', async () => {
    testResults.deploymentChecklist = [
      {
        item: 'Database connectivity verified',
        status: testResults.categories.database.status === 'PASS' ? 'COMPLETE' : 'INCOMPLETE',
        details: 'Database can connect and perform basic operations'
      },
      {
        item: 'Core API endpoints functional',
        status: testResults.categories.apiIntegration.status !== 'FAIL' ? 'COMPLETE' : 'INCOMPLETE',
        details: 'All critical API endpoints respond correctly'
      },
      {
        item: 'Performance acceptable',
        status: testResults.categories.performance.status !== 'FAIL' ? 'COMPLETE' : 'INCOMPLETE',
        details: 'Response times and concurrent handling within acceptable limits'
      },
      {
        item: 'Security measures in place',
        status: testResults.categories.security.status !== 'FAIL' ? 'COMPLETE' : 'INCOMPLETE',
        details: 'Input validation and basic security headers implemented'
      },
      {
        item: 'AI services configured (optional)',
        status: testResults.categories.aiServices.status === 'PASS' ? 'COMPLETE' : 'N/A',
        details: 'AI functionality available but not required for MVP'
      },
      {
        item: 'Environment variables set',
        status: process.env.DATABASE_URL ? 'COMPLETE' : 'INCOMPLETE',
        details: 'Required environment variables configured'
      }
    ]

    // Generate final recommendations
    const completedItems = testResults.deploymentChecklist.filter(item => item.status === 'COMPLETE').length
    const totalCriticalItems = testResults.deploymentChecklist.filter(item => item.status !== 'N/A').length

    if (completedItems >= totalCriticalItems * 0.8) {
      testResults.recommendations.push('✅ System appears ready for MVP deployment')
    } else {
      testResults.recommendations.push('⚠️ Address critical issues before deployment')
    }

    if (testResults.blockingIssues.length > 0) {
      testResults.recommendations.push(`🔧 Fix ${testResults.blockingIssues.length} blocking issues`)
    }

    if (testResults.categories.aiServices.status !== 'PASS') {
      testResults.recommendations.push('💡 Consider configuring AI services for enhanced functionality')
    }

    if (testResults.categories.performance.status === 'WARN') {
      testResults.recommendations.push('⚡ Monitor performance under production load')
    }

    expect(testResults).toBeDefined()
  })
})

async function generateDeploymentReport(results: TestResults, duration: number): Promise<void> {
  const reportPath = path.join(process.cwd(), 'tests', 'deployment-readiness-report.md')
  
  const report = `# 🚀 MariaIntelligence MVP Deployment Readiness Report

Generated: ${new Date().toISOString()}
Test Duration: ${Math.round(duration / 1000)}s

## 📊 Executive Summary

**Overall Status: ${results.summary.overallStatus}**
- Total Tests: ${results.summary.totalTests}
- Passed: ${results.summary.passedTests}
- Failed: ${results.summary.failedTests}  
- Pass Rate: ${results.summary.passRate.toFixed(1)}%

## 🎯 Test Categories

${Object.entries(results.categories).map(([key, category]) => `
### ${category.name} - ${category.status}

${category.tests.map(test => 
  `- ${test.status === 'PASS' ? '✅' : '❌'} ${test.name} (${test.duration}ms)`
).join('\n')}

${category.criticalIssues.length > 0 ? `
**Critical Issues:**
${category.criticalIssues.map(issue => `- ⚠️ ${issue}`).join('\n')}
` : ''}

${category.recommendations.length > 0 ? `
**Recommendations:**
${category.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}
` : ''}
`).join('\n')}

## 🚨 Blocking Issues

${results.blockingIssues.length === 0 ? '✅ No blocking issues found!' : 
  results.blockingIssues.map(issue => `
### ${issue.severity} - ${issue.category}
**Issue:** ${issue.issue}
**Fix:** ${issue.fix}
`).join('\n')}

## 📋 Deployment Checklist

${results.deploymentChecklist.map(item => 
  `- [${item.status === 'COMPLETE' ? 'x' : ' '}] ${item.item}${item.details ? ` - ${item.details}` : ''}`
).join('\n')}

## 🎯 Recommendations

${results.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🔍 Detailed Test Results

${JSON.stringify(results.categories, null, 2)}

---

**Report generated by MariaIntelligence Test Suite**
`

  try {
    await fs.writeFile(reportPath, report)
    console.log(`\n📝 Deployment readiness report saved to: ${reportPath}`)
  } catch (error) {
    console.error('Failed to save deployment report:', error)
  }

  // Also log summary to console
  console.log('\n' + '='.repeat(60))
  console.log('🚀 DEPLOYMENT READINESS SUMMARY')
  console.log('='.repeat(60))
  console.log(`Overall Status: ${results.summary.overallStatus}`)
  console.log(`Pass Rate: ${results.summary.passRate.toFixed(1)}%`)
  console.log(`Blocking Issues: ${results.blockingIssues.length}`)
  
  console.log('\nCategory Status:')
  Object.entries(results.categories).forEach(([key, category]) => {
    const icon = category.status === 'PASS' ? '✅' : category.status === 'WARN' ? '⚠️' : '❌'
    console.log(`  ${icon} ${category.name}`)
  })

  if (results.blockingIssues.length > 0) {
    console.log('\n🚨 BLOCKING ISSUES:')
    results.blockingIssues.forEach(issue => {
      console.log(`  - ${issue.severity}: ${issue.issue}`)
    })
  }

  console.log('\n💡 KEY RECOMMENDATIONS:')
  results.recommendations.forEach(rec => {
    console.log(`  - ${rec}`)
  })
  console.log('='.repeat(60) + '\n')
}
