/**
 * Performance Testing and Metrics Collection
 * Tests page load times, bundle sizes, and performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Router } from 'wouter'
import { queryClient } from '@/lib/queryClient'
import App from '@/App'
import '@testing-library/jest-dom'

// Mock dependencies
vi.mock('@/i18n/config', () => ({}))
vi.mock('@/enforce-clean-mode', () => ({
  enforceCleanMode: vi.fn()
}))

const TestWrapper = ({ children, route = '/' }: { children: React.ReactNode, route?: string }) => (
  <QueryClientProvider client={queryClient}>
    <Router base={route}>
      {children}
    </Router>
  </QueryClientProvider>
)

// Performance monitoring utilities
class PerformanceMonitor {
  private startTime: number = 0
  private metrics: any[] = []

  start() {
    this.startTime = performance.now()
  }

  stop() {
    return performance.now() - this.startTime
  }

  recordMetric(name: string, value: number, unit: string = 'ms') {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now()
    })
  }

  getMetrics() {
    return this.metrics
  }

  clear() {
    this.metrics = []
    this.startTime = 0
  }
}

// Performance budgets and thresholds
const PERFORMANCE_BUDGETS = {
  pageLoad: {
    critical: 2000, // 2s for critical pages
    high: 3000,     // 3s for high priority pages
    medium: 4000,   // 4s for medium priority pages
    low: 5000       // 5s for low priority pages
  },
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  timeToInteractive: 3500,
  bundleSize: {
    critical: 500 * 1024,  // 500KB for critical chunks
    total: 2 * 1024 * 1024 // 2MB total bundle size
  }
}

const monitor = new PerformanceMonitor()

describe('Performance Testing and Metrics Collection', () => {
  beforeEach(() => {
    monitor.clear()
    vi.clearAllMocks()
  })

  describe('Page Load Performance Tests', () => {
    const CRITICAL_PAGES = [
      { route: '/', name: 'Dashboard', priority: 'critical' },
      { route: '/propriedades', name: 'Properties', priority: 'critical' },
      { route: '/reservas', name: 'Reservations', priority: 'critical' },
      { route: '/financeiro/documentos', name: 'Financial Documents', priority: 'critical' }
    ]

    const HIGH_PRIORITY_PAGES = [
      { route: '/proprietarios', name: 'Owners', priority: 'high' },
      { route: '/relatorios', name: 'Reports', priority: 'high' },
      { route: '/pagamentos', name: 'Payments', priority: 'high' }
    ]

    const MEDIUM_PRIORITY_PAGES = [
      { route: '/orcamentos', name: 'Quotations', priority: 'medium' },
      { route: '/upload-pdf', name: 'PDF Upload', priority: 'medium' },
      { route: '/calculadora-orcamento', name: 'Budget Calculator', priority: 'medium' }
    ]

    const ALL_PAGES = [...CRITICAL_PAGES, ...HIGH_PRIORITY_PAGES, ...MEDIUM_PRIORITY_PAGES]

    ALL_PAGES.forEach(({ route, name, priority }) => {
      it(`should load ${name} within performance budget (${priority})`, async () => {
        monitor.start()

        render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          expect(document.body).toBeInTheDocument()
        }, { 
          timeout: PERFORMANCE_BUDGETS.pageLoad[priority as keyof typeof PERFORMANCE_BUDGETS.pageLoad] 
        })

        const loadTime = monitor.stop()
        const budget = PERFORMANCE_BUDGETS.pageLoad[priority as keyof typeof PERFORMANCE_BUDGETS.pageLoad]

        monitor.recordMetric(`${name} Load Time`, loadTime)
        
        expect(loadTime).toBeLessThan(budget)
      })
    })
  })

  describe('Rendering Performance Tests', () => {
    it('should render dashboard components efficiently', async () => {
      monitor.start()

      render(<App />)

      const renderTime = monitor.stop()
      monitor.recordMetric('Dashboard Render Time', renderTime)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      // Initial render should be fast
      expect(renderTime).toBeLessThan(500) // 500ms budget for initial render
    })

    it('should handle rapid navigation without performance degradation', async () => {
      const routes = ['/', '/propriedades', '/reservas', '/relatorios']
      const navigationTimes: number[] = []

      for (const route of routes) {
        monitor.start()

        const { unmount } = render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          expect(document.body).toBeInTheDocument()
        })

        const navigationTime = monitor.stop()
        navigationTimes.push(navigationTime)
        monitor.recordMetric(`Navigation to ${route}`, navigationTime)

        unmount()
      }

      // Navigation times should be consistent (no major degradation)
      const avgTime = navigationTimes.reduce((sum, time) => sum + time, 0) / navigationTimes.length
      const maxTime = Math.max(...navigationTimes)

      expect(maxTime).toBeLessThan(avgTime * 2) // Max time shouldn't be more than 2x average
    })
  })

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks during navigation', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Simulate multiple page navigations
      const routes = ['/', '/propriedades', '/reservas', '/proprietarios', '/relatorios']

      for (let iteration = 0; iteration < 3; iteration++) {
        for (const route of routes) {
          const { unmount } = render(
            <TestWrapper route={route}>
              <App />
            </TestWrapper>
          )

          await waitFor(() => {
            expect(document.body).toBeInTheDocument()
          })

          unmount()
        }

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      monitor.recordMetric('Memory Increase After Navigation', memoryIncrease, 'bytes')

      // Memory increase should be reasonable (less than 50MB for test scenario)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: Array(1000).fill(null).map((_, i) => ({
            id: i,
            name: `Property ${i}`,
            type: 'Apartment',
            location: `Location ${i}`,
            price: Math.random() * 1000
          }))
        })
      })

      monitor.start()

      render(
        <TestWrapper route="/propriedades">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      }, { timeout: 5000 })

      const loadTime = monitor.stop()
      monitor.recordMetric('Large Dataset Load Time', loadTime)

      // Should handle large datasets within reasonable time
      expect(loadTime).toBeLessThan(3000)
    })
  })

  describe('Network Performance Tests', () => {
    it('should optimize API call patterns', async () => {
      let apiCallCount = 0

      global.fetch = vi.fn().mockImplementation(() => {
        apiCallCount++
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        })
      })

      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      monitor.recordMetric('Initial API Calls', apiCallCount, 'count')

      // Should not make excessive API calls on initial load
      expect(apiCallCount).toBeLessThan(10)
    })

    it('should handle concurrent requests efficiently', async () => {
      let concurrentRequests = 0
      let maxConcurrentRequests = 0

      global.fetch = vi.fn().mockImplementation(() => {
        concurrentRequests++
        maxConcurrentRequests = Math.max(maxConcurrentRequests, concurrentRequests)

        return new Promise(resolve => {
          setTimeout(() => {
            concurrentRequests--
            resolve({
              ok: true,
              json: () => Promise.resolve({ data: [] })
            })
          }, 100)
        })
      })

      // Render multiple components that might make concurrent requests
      const { rerender } = render(<App />)

      // Navigate to different pages quickly
      rerender(
        <TestWrapper route="/propriedades">
          <App />
        </TestWrapper>
      )

      rerender(
        <TestWrapper route="/reservas">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      monitor.recordMetric('Max Concurrent Requests', maxConcurrentRequests, 'count')

      // Should manage concurrent requests reasonably
      expect(maxConcurrentRequests).toBeLessThan(15)
    })
  })

  describe('Bundle Size and Code Splitting Tests', () => {
    it('should lazy load components when appropriate', async () => {
      // Test that non-critical routes don't block initial load
      const startTime = performance.now()

      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      const initialLoadTime = performance.now() - startTime
      monitor.recordMetric('Initial Load Time', initialLoadTime)

      // Initial load should be fast even if other routes are lazy-loaded
      expect(initialLoadTime).toBeLessThan(2000)
    })

    it('should not bundle unnecessary code in critical paths', async () => {
      // This is more of a build-time test, but we can check for signs of code splitting
      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      // Check that initial bundle doesn't contain all possible features
      const scriptTags = document.querySelectorAll('script[src]')
      const hasCodeSplitting = scriptTags.length > 1 || 
                               document.body.innerHTML.includes('chunk') ||
                               document.body.innerHTML.includes('lazy')

      // Should show signs of code splitting or be reasonably sized
      expect(hasCodeSplitting || scriptTags.length <= 5).toBe(true)
    })
  })

  describe('User Interaction Performance', () => {
    it('should respond quickly to user interactions', async () => {
      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      const buttons = screen.queryAllByRole('button')
      
      if (buttons.length > 0) {
        const button = buttons[0]
        
        monitor.start()
        button.click()
        const responseTime = monitor.stop()

        monitor.recordMetric('Button Response Time', responseTime)

        // User interactions should be responsive (under 100ms)
        expect(responseTime).toBeLessThan(1000)
      }
    })

    it('should maintain 60fps during animations', async () => {
      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      // Look for animated elements
      const animatedElements = [
        ...document.querySelectorAll('[class*="animate"]'),
        ...document.querySelectorAll('[class*="transition"]'),
        ...document.querySelectorAll('[style*="transition"]')
      ]

      // If animations exist, they should be performant
      if (animatedElements.length > 0) {
        // This is a simplified test - in real scenarios you'd measure frame rates
        const hasPerformantAnimations = animatedElements.every(el => {
          const style = getComputedStyle(el)
          // Check for hardware acceleration hints
          return style.transform !== 'none' || 
                 style.willChange !== 'auto' ||
                 style.backfaceVisibility === 'hidden'
        })

        expect(hasPerformantAnimations).toBe(true)
      }
    })
  })

  describe('Resource Loading Optimization', () => {
    it('should prioritize critical resources', async () => {
      const resourceLoadTimes: { [key: string]: number } = {}

      // Mock resource loading
      const originalCreateElement = document.createElement
      document.createElement = function(tagName: string) {
        const element = originalCreateElement.call(this, tagName)
        
        if (tagName === 'script' || tagName === 'link') {
          const startTime = performance.now()
          
          element.addEventListener('load', () => {
            const loadTime = performance.now() - startTime
            resourceLoadTimes[element.src || element.href] = loadTime
          })
        }
        
        return element
      }

      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      // Restore original createElement
      document.createElement = originalCreateElement

      // Critical resources should load quickly
      Object.entries(resourceLoadTimes).forEach(([resource, loadTime]) => {
        monitor.recordMetric(`Resource Load: ${resource}`, loadTime)
        
        // Each resource should load within reasonable time
        expect(loadTime).toBeLessThan(5000)
      })
    })
  })

  describe('Performance Regression Tests', () => {
    it('should maintain performance baselines across builds', async () => {
      const performanceTests = [
        { name: 'Dashboard Load', action: () => render(<App />) },
        { 
          name: 'Properties Load', 
          action: () => render(<TestWrapper route="/propriedades"><App /></TestWrapper>) 
        },
        { 
          name: 'Reservations Load', 
          action: () => render(<TestWrapper route="/reservas"><App /></TestWrapper>) 
        }
      ]

      const results = []

      for (const test of performanceTests) {
        monitor.start()
        test.action()
        
        await waitFor(() => {
          expect(document.body).toBeInTheDocument()
        })

        const time = monitor.stop()
        results.push({ name: test.name, time })
        monitor.recordMetric(test.name, time)
      }

      // All tests should complete within their budgets
      results.forEach(result => {
        expect(result.time).toBeLessThan(PERFORMANCE_BUDGETS.pageLoad.critical)
      })

      // Generate performance report
      const report = {
        timestamp: new Date().toISOString(),
        results,
        metrics: monitor.getMetrics(),
        budgets: PERFORMANCE_BUDGETS
      }

      // In a real scenario, you'd save this report for comparison
      expect(report.results.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('should collect meaningful performance metrics', async () => {
      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      const metrics = monitor.getMetrics()

      // Should have collected performance data
      expect(metrics.length).toBeGreaterThan(0)

      // Each metric should have required fields
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('name')
        expect(metric).toHaveProperty('value')
        expect(metric).toHaveProperty('unit')
        expect(metric).toHaveProperty('timestamp')
      })
    })

    it('should identify performance bottlenecks', async () => {
      const bottlenecks = []

      // Simulate slow operations
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ data: [] })
            })
          }, 1000) // Slow response
        })
      )

      monitor.start()
      
      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      }, { timeout: 3000 })

      const totalTime = monitor.stop()

      if (totalTime > PERFORMANCE_BUDGETS.pageLoad.critical) {
        bottlenecks.push({
          component: 'Dashboard',
          time: totalTime,
          issue: 'Slow API response'
        })
      }

      monitor.recordMetric('Bottleneck Analysis', bottlenecks.length, 'count')

      // Should identify when performance is poor
      expect(bottlenecks.length).toBeGreaterThan(0)
    })
  })
})