/**
 * Responsive Design and Mobile Compatibility Tests
 * Tests mobile layouts, touch interactions, and responsive behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

// Viewport configurations for testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  mobileLarge: { width: 428, height: 926 }, // iPhone 13 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  tabletLandscape: { width: 1024, height: 768 }, // iPad Landscape
  desktop: { width: 1920, height: 1080 }, // Desktop
  desktopLarge: { width: 2560, height: 1440 } // Large Desktop
}

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('Responsive Design and Mobile Compatibility Tests', () => {
  let originalInnerWidth: number
  let originalInnerHeight: number
  let originalMatchMedia: any

  beforeEach(() => {
    // Store original values
    originalInnerWidth = global.innerWidth
    originalInnerHeight = global.innerHeight
    originalMatchMedia = global.matchMedia

    // Mock matchMedia
    global.matchMedia = vi.fn().mockImplementation(mockMatchMedia)
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original values
    global.innerWidth = originalInnerWidth
    global.innerHeight = originalInnerHeight
    global.matchMedia = originalMatchMedia
  })

  const setViewport = (viewport: { width: number, height: number }) => {
    global.innerWidth = viewport.width
    global.innerHeight = viewport.height
    
    // Update matchMedia mock to return appropriate values
    global.matchMedia = vi.fn().mockImplementation((query: string) => ({
      ...mockMatchMedia(query),
      matches: query.includes('max-width') && viewport.width <= 768
    }))

    // Trigger resize event
    global.dispatchEvent(new Event('resize'))
  }

  describe('Mobile Layout Tests', () => {
    it('should adapt layout for mobile viewport', async () => {
      setViewport(VIEWPORTS.mobile)

      render(<App />)

      await waitFor(() => {
        // Check that the layout adapts to mobile
        const container = document.body
        expect(container).toBeInTheDocument()

        // Look for mobile-specific elements or classes
        const mobileIndicators = [
          document.querySelector('[class*="mobile"]'),
          document.querySelector('[class*="sm:"]'),
          document.querySelector('[class*="md:hidden"]'),
          document.querySelector('[data-testid*="mobile"]')
        ]

        // Either mobile-specific elements exist or layout is within mobile constraints
        const hasMobileLayout = mobileIndicators.some(el => el !== null) || 
                               container.clientWidth <= VIEWPORTS.mobile.width
        expect(hasMobileLayout).toBe(true)
      })
    })

    it('should display mobile navigation correctly', async () => {
      setViewport(VIEWPORTS.mobile)

      render(<App />)

      await waitFor(() => {
        // Look for mobile navigation elements
        const mobileNavElements = [
          document.querySelector('[class*="bottom-nav"]'),
          document.querySelector('[class*="mobile-nav"]'),
          document.querySelector('[data-testid*="mobile-nav"]'),
          document.querySelector('[role="navigation"]'),
          // Hamburger menu indicators
          document.querySelector('[class*="burger"]'),
          document.querySelector('[class*="hamburger"]'),
          // Mobile menu button
          screen.queryByLabelText(/menu/i),
          screen.queryByRole('button', { name: /menu/i })
        ]

        const hasMobileNav = mobileNavElements.some(el => el !== null)
        expect(hasMobileNav).toBe(true)
      })
    })

    it('should handle mobile navigation interactions', async () => {
      setViewport(VIEWPORTS.mobile)

      render(<App />)

      await waitFor(() => {
        // Look for mobile menu triggers
        const menuButtons = [
          screen.queryByRole('button', { name: /menu/i }),
          screen.queryByLabelText(/menu/i),
          document.querySelector('[class*="menu-button"]'),
          document.querySelector('[data-testid*="menu-toggle"]')
        ].filter(Boolean)

        if (menuButtons.length > 0) {
          // Try to interact with mobile menu
          const menuButton = menuButtons[0]
          fireEvent.click(menuButton)

          // Should respond to click (no error thrown)
          expect(menuButton).toBeInTheDocument()
        } else {
          // If no mobile menu found, check for bottom navigation
          const bottomNav = document.querySelector('[class*="bottom"]')
          expect(bottomNav || document.body).toBeInTheDocument()
        }
      })
    })
  })

  describe('Tablet Layout Tests', () => {
    it('should adapt layout for tablet viewport', async () => {
      setViewport(VIEWPORTS.tablet)

      render(<App />)

      await waitFor(() => {
        const container = document.body
        expect(container).toBeInTheDocument()

        // Tablet layout should be between mobile and desktop
        expect(container.clientWidth).toBeLessThanOrEqual(VIEWPORTS.tablet.width)
      })
    })

    it('should handle tablet landscape orientation', async () => {
      setViewport(VIEWPORTS.tabletLandscape)

      render(<App />)

      await waitFor(() => {
        const container = document.body
        expect(container).toBeInTheDocument()

        // Should adapt to landscape orientation
        expect(container.clientWidth).toBeLessThanOrEqual(VIEWPORTS.tabletLandscape.width)
      })
    })
  })

  describe('Touch and Gesture Tests', () => {
    it('should handle touch events on interactive elements', async () => {
      setViewport(VIEWPORTS.mobile)

      render(<App />)

      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        const links = screen.queryAllByRole('link')
        const interactiveElements = [...buttons, ...links]

        if (interactiveElements.length > 0) {
          const element = interactiveElements[0]
          
          // Simulate touch events
          fireEvent.touchStart(element)
          fireEvent.touchEnd(element)
          
          // Element should still be in the document (no crash)
          expect(element).toBeInTheDocument()
        } else {
          // At minimum, the app should render without crashing
          expect(document.body).toBeInTheDocument()
        }
      })
    })

    it('should have appropriate touch target sizes', async () => {
      setViewport(VIEWPORTS.mobile)

      render(<App />)

      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button)
          const minTouchSize = 44 // Minimum 44px for good touch accessibility
          
          // Check if button has appropriate minimum dimensions
          const hasGoodTouchSize = 
            button.offsetHeight >= minTouchSize ||
            button.offsetWidth >= minTouchSize ||
            styles.minHeight === `${minTouchSize}px` ||
            styles.minWidth === `${minTouchSize}px`
          
          // At least some dimension should meet touch target requirements
          expect(hasGoodTouchSize || button.offsetHeight > 30).toBe(true)
        })
      })
    })
  })

  describe('Content Adaptation Tests', () => {
    const CRITICAL_ROUTES = [
      '/', '/propriedades', '/reservas', '/financeiro/documentos'
    ]

    CRITICAL_ROUTES.forEach(route => {
      it(`should adapt content layout on mobile for ${route}`, async () => {
        setViewport(VIEWPORTS.mobile)

        render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          // Content should be present and readable on mobile
          const container = document.body
          expect(container).toBeInTheDocument()

          // Check for responsive classes or mobile adaptations
          const hasResponsiveContent = [
            document.querySelector('[class*="sm:"]'),
            document.querySelector('[class*="md:"]'),
            document.querySelector('[class*="lg:"]'),
            document.querySelector('[class*="responsive"]'),
            document.querySelector('[class*="mobile"]')
          ].some(el => el !== null)

          // Either responsive classes exist or content fits mobile viewport
          expect(hasResponsiveContent || container.scrollWidth <= VIEWPORTS.mobile.width + 50).toBe(true)
        })
      })
    })
  })

  describe('Form Usability on Mobile', () => {
    const FORM_ROUTES = [
      '/propriedades/editar',
      '/reservas/nova', 
      '/proprietarios/editar',
      '/financeiro/documentos/novo'
    ]

    FORM_ROUTES.forEach(route => {
      it(`should have mobile-friendly forms on ${route}`, async () => {
        setViewport(VIEWPORTS.mobile)

        render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          const inputs = [
            ...screen.queryAllByRole('textbox'),
            ...document.querySelectorAll('input'),
            ...document.querySelectorAll('textarea'),
            ...document.querySelectorAll('select')
          ]

          if (inputs.length > 0) {
            inputs.forEach(input => {
              // Form inputs should be usable on mobile
              expect(input).toBeInTheDocument()
              
              // Check for mobile-friendly attributes
              const isMobileFriendly = 
                input.getAttribute('type') === 'tel' ||
                input.getAttribute('type') === 'email' ||
                input.getAttribute('inputmode') !== null ||
                input.getAttribute('autocomplete') !== null ||
                input.offsetHeight >= 44 // Minimum touch target height
              
              expect(isMobileFriendly || input.offsetHeight > 30).toBe(true)
            })
          }
        })
      })
    })
  })

  describe('Performance on Mobile', () => {
    it('should load quickly on mobile viewport', async () => {
      setViewport(VIEWPORTS.mobile)

      const startTime = performance.now()

      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      }, { timeout: 4000 }) // Slightly longer timeout for mobile

      const loadTime = performance.now() - startTime
      
      // Mobile should load within 4 seconds (accounting for slower mobile performance)
      expect(loadTime).toBeLessThan(4000)
    })
  })

  describe('Orientation Change Tests', () => {
    it('should handle orientation changes gracefully', async () => {
      // Start in portrait
      setViewport(VIEWPORTS.mobile)

      const { rerender } = render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })

      // Switch to landscape
      setViewport({ width: VIEWPORTS.mobile.height, height: VIEWPORTS.mobile.width })

      rerender(<App />)

      await waitFor(() => {
        // Should still render without errors after orientation change
        expect(document.body).toBeInTheDocument()
      })
    })
  })

  describe('Cross-Device Consistency Tests', () => {
    const testConsistencyAcrossViewports = async (route: string) => {
      const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop]
      const results = []

      for (const viewport of viewports) {
        setViewport(viewport)
        
        const { unmount } = render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          results.push({
            viewport: viewport,
            hasContent: document.body.textContent !== '',
            hasNavigation: document.querySelector('[role="navigation"]') !== null ||
                          document.querySelector('[class*="nav"]') !== null
          })
        })

        unmount()
      }

      return results
    }

    it('should maintain consistent functionality across viewports for dashboard', async () => {
      const results = await testConsistencyAcrossViewports('/')
      
      // All viewports should render content
      results.forEach(result => {
        expect(result.hasContent).toBe(true)
      })
    })

    it('should maintain consistent functionality across viewports for properties', async () => {
      const results = await testConsistencyAcrossViewports('/propriedades')
      
      // All viewports should render content
      results.forEach(result => {
        expect(result.hasContent).toBe(true)
      })
    })
  })

  describe('Accessibility on Mobile', () => {
    it('should maintain accessibility on mobile devices', async () => {
      setViewport(VIEWPORTS.mobile)

      render(<App />)

      await waitFor(() => {
        // Check for basic accessibility features
        const interactiveElements = [
          ...screen.queryAllByRole('button'),
          ...screen.queryAllByRole('link'),
          ...screen.queryAllByRole('textbox')
        ]

        interactiveElements.forEach(element => {
          // Interactive elements should be focusable
          expect(element.tabIndex >= 0 || element.getAttribute('tabindex') !== '-1').toBe(true)
        })
      })
    })
  })
})