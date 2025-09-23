#!/usr/bin/env ts-node
/**
 * Test Runner Script for MariaIntelligence Comprehensive Page Testing
 * Executes all test suites and generates consolidated report
 */

import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

interface TestResult {
  suite: string
  passed: number
  failed: number
  skipped: number
  duration: number
  coverage?: number
}

interface TestSuite {
  name: string
  file: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Page Framework Tests',
    file: 'page-test-framework.test.tsx',
    description: 'Comprehensive page loading and routing tests for all 47 routes',
    priority: 'critical'
  },
  {
    name: 'Individual Page Tests',
    file: 'individual-page-tests.test.tsx',
    description: 'Detailed functionality testing of each page component',
    priority: 'critical'
  },
  {
    name: 'Translation Tests',
    file: 'translation-test.test.tsx',
    description: 'Portuguese translation coverage and i18n functionality',
    priority: 'high'
  },
  {
    name: 'Responsive Design Tests',
    file: 'responsive-mobile-tests.test.tsx',
    description: 'Mobile compatibility and responsive design validation',
    priority: 'high'
  },
  {
    name: 'Error Handling Tests',
    file: 'error-handling-tests.test.tsx',
    description: 'Error boundaries, edge cases, and failure scenarios',
    priority: 'medium'
  },
  {
    name: 'Performance Tests',
    file: 'performance-metrics-tests.test.tsx',
    description: 'Load times, performance metrics, and optimization validation',
    priority: 'medium'
  }
]

class TestRunner {
  private results: TestResult[] = []
  private startTime: number = 0
  private readonly testDir = '/Users/bilal/Programaçao/MariaIntelligence-1/tests'
  private readonly reportPath = path.join(this.testDir, 'test-execution-report.json')
  private readonly summaryPath = path.join(this.testDir, 'test-execution-summary.md')

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting MariaIntelligence Comprehensive Page Testing...\n')
    this.startTime = Date.now()

    try {
      // Check if test files exist
      await this.validateTestFiles()

      // Run each test suite
      for (const suite of TEST_SUITES) {
        await this.runTestSuite(suite)
      }

      // Generate reports
      await this.generateReports()

      // Display summary
      this.displaySummary()

    } catch (error) {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    }
  }

  private async validateTestFiles(): Promise<void> {
    console.log('📋 Validating test files...')
    
    for (const suite of TEST_SUITES) {
      const filePath = path.join(this.testDir, suite.file)
      try {
        await fs.access(filePath)
        console.log(`  ✅ ${suite.file}`)
      } catch (error) {
        throw new Error(`Test file not found: ${filePath}`)
      }
    }
    console.log()
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`🧪 Running ${suite.name}...`)
    console.log(`   ${suite.description}`)

    const startTime = Date.now()
    let result: TestResult

    try {
      // Run the test suite using vitest
      const command = `cd "${this.testDir}/.." && npx vitest run "${this.testDir}/${suite.file}" --reporter=json --run`
      
      const output = execSync(command, { 
        encoding: 'utf-8',
        timeout: 60000, // 1 minute timeout per suite
        stdio: ['pipe', 'pipe', 'pipe']
      })

      // Parse vitest JSON output
      const testOutput = this.parseVitestOutput(output)
      const duration = Date.now() - startTime

      result = {
        suite: suite.name,
        passed: testOutput.passed || 0,
        failed: testOutput.failed || 0,
        skipped: testOutput.skipped || 0,
        duration,
        coverage: testOutput.coverage
      }

      if (result.failed > 0) {
        console.log(`   ⚠️  ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`)
      } else {
        console.log(`   ✅ ${result.passed} passed, ${result.skipped} skipped`)
      }

    } catch (error) {
      // Handle test execution errors
      const duration = Date.now() - startTime
      result = {
        suite: suite.name,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration
      }

      console.log(`   ❌ Test suite failed to execute`)
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s\n`)
    this.results.push(result)
  }

  private parseVitestOutput(output: string): any {
    try {
      // Try to extract JSON from vitest output
      const lines = output.split('\n')
      const jsonLine = lines.find(line => line.trim().startsWith('{'))
      
      if (jsonLine) {
        return JSON.parse(jsonLine)
      }

      // Fallback: parse text output
      return this.parseTextOutput(output)
    } catch (error) {
      console.warn('Could not parse test output, using fallback')
      return this.parseTextOutput(output)
    }
  }

  private parseTextOutput(output: string): any {
    const lines = output.split('\n')
    let passed = 0
    let failed = 0
    let skipped = 0

    lines.forEach(line => {
      if (line.includes('✓') || line.includes('PASS')) passed++
      if (line.includes('✗') || line.includes('FAIL')) failed++
      if (line.includes('○') || line.includes('SKIP')) skipped++
    })

    return { passed, failed, skipped }
  }

  private async generateReports(): Promise<void> {
    console.log('📊 Generating test reports...')

    const totalDuration = Date.now() - this.startTime
    const summary = this.calculateSummary(totalDuration)

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary,
      results: this.results,
      testSuites: TEST_SUITES.map(suite => ({
        name: suite.name,
        description: suite.description,
        priority: suite.priority
      }))
    }

    await fs.writeFile(this.reportPath, JSON.stringify(jsonReport, null, 2))
    console.log(`   📄 JSON report: ${this.reportPath}`)

    // Generate Markdown summary
    const markdownSummary = this.generateMarkdownSummary(summary, totalDuration)
    await fs.writeFile(this.summaryPath, markdownSummary)
    console.log(`   📝 Summary report: ${this.summaryPath}`)

    console.log()
  }

  private calculateSummary(totalDuration: number) {
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0)
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0)
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0)
    const totalTests = totalPassed + totalFailed + totalSkipped

    const criticalSuites = this.results.filter((_, index) => 
      TEST_SUITES[index]?.priority === 'critical'
    )
    const criticalFailures = criticalSuites.reduce((sum, r) => sum + r.failed, 0)

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
      criticalFailures,
      suitesRun: this.results.length,
      totalDuration
    }
  }

  private generateMarkdownSummary(summary: any, totalDuration: number): string {
    const timestamp = new Date().toLocaleString()
    
    return `# MariaIntelligence Test Execution Summary

Generated: ${timestamp}

## Overall Results

| Metric | Value |
|--------|-------|
| **Total Tests** | ${summary.totalTests} |
| **Passed** | ✅ ${summary.totalPassed} |
| **Failed** | ❌ ${summary.totalFailed} |
| **Skipped** | ⏭️ ${summary.totalSkipped} |
| **Success Rate** | ${summary.successRate.toFixed(1)}% |
| **Total Duration** | ${(totalDuration / 1000).toFixed(2)}s |

## Test Suite Results

${this.results.map((result, index) => {
  const suite = TEST_SUITES[index]
  const status = result.failed > 0 ? '❌' : '✅'
  const priority = suite?.priority || 'unknown'
  
  return `### ${status} ${result.suite} (${priority} priority)
- **Passed**: ${result.passed}
- **Failed**: ${result.failed}
- **Skipped**: ${result.skipped}
- **Duration**: ${(result.duration / 1000).toFixed(2)}s
${result.coverage ? `- **Coverage**: ${result.coverage}%` : ''}
`
}).join('\n')}

## Critical Issues Summary

${summary.criticalFailures > 0 
  ? `⚠️ **${summary.criticalFailures} critical test failures detected**\n\nImmediate attention required for production readiness.`
  : '✅ **All critical tests passed**\n\nApplication meets basic functionality requirements.'
}

## Recommendations

${this.generateRecommendations(summary)}

---

*This report was generated automatically by the MariaIntelligence test runner.*
`
  }

  private generateRecommendations(summary: any): string {
    const recommendations = []

    if (summary.criticalFailures > 0) {
      recommendations.push('🔴 **Critical**: Fix failing critical tests before deployment')
    }

    if (summary.successRate < 80) {
      recommendations.push('🟡 **Performance**: Success rate below 80% - investigate failing tests')
    }

    if (summary.successRate >= 95) {
      recommendations.push('🟢 **Excellent**: High test success rate - ready for production')
    }

    if (summary.totalDuration > 300000) { // 5 minutes
      recommendations.push('⚡ **Optimization**: Test suite taking >5 minutes - consider optimization')
    }

    return recommendations.length > 0 
      ? recommendations.join('\n') 
      : '✅ No specific recommendations - test results look good!'
  }

  private displaySummary(): void {
    const summary = this.calculateSummary(Date.now() - this.startTime)
    
    console.log('📈 TEST EXECUTION COMPLETE')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${summary.totalTests}`)
    console.log(`Passed: ✅ ${summary.totalPassed}`)
    console.log(`Failed: ❌ ${summary.totalFailed}`)
    console.log(`Skipped: ⏭️ ${summary.totalSkipped}`)
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`)
    console.log(`Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`)
    console.log('=' .repeat(50))

    if (summary.criticalFailures > 0) {
      console.log(`\n⚠️  WARNING: ${summary.criticalFailures} critical test failures!`)
      console.log('Review failing critical tests before deployment.\n')
    } else if (summary.totalFailed > 0) {
      console.log(`\n⚡ ${summary.totalFailed} non-critical tests failed.`)
      console.log('Review and fix when possible.\n')
    } else {
      console.log('\n🎉 All tests passed! Application ready for production.\n')
    }
  }
}

// Run the tests if called directly
if (require.main === module) {
  const runner = new TestRunner()
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error)
    process.exit(1)
  })
}

export { TestRunner, TEST_SUITES }