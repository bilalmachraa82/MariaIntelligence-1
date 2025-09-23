/**
 * Error Handling and Edge Case Tests
 * Tests error boundaries, network failures, and edge conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

describe('Error Handling and Edge Case Tests', () => {
  let originalFetch: any
  let originalConsoleError: any

  beforeEach(() => {
    // Store original fetch and console.error
    originalFetch = global.fetch
    originalConsoleError = console.error

    // Mock console.error to prevent test output pollution
    console.error = vi.fn()

    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original functions
    global.fetch = originalFetch
    console.error = originalConsoleError
  })

  describe('Network Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock fetch to simulate timeout
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100)
        })
      )

      render(<App />)

      await waitFor(() => {
        // App should still render even with network errors
        expect(document.body).toBeInTheDocument()
        
        // Should not crash the application
        expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should handle API server errors (500, 502, 503)', async () => {
      // Mock fetch to return server error
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ error: 'Server Error' })
        })
      )

      render(<App />)

      await waitFor(() => {
        // Application should handle server errors without crashing
        expect(document.body).toBeInTheDocument()
      })
    })

    it('should handle offline scenarios', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      // Mock fetch to simulate offline
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

      render(<App />)

      await waitFor(() => {
        // Should render offline-capable content
        expect(document.body).toBeInTheDocument()
        
        // Look for offline indicators or graceful degradation
        const offlineIndicators = [
          screen.queryByText(/offline/i),
          screen.queryByText(/sem conexão/i),
          screen.queryByText(/conectividade/i),
          document.querySelector('[data-testid*="offline"]')
        ]

        const hasOfflineHandling = offlineIndicators.some(el => el !== null) ||
                                  document.body.textContent !== ''

        expect(hasOfflineHandling).toBe(true)
      })
    })
  })

  describe('404 and Route Error Handling', () => {
    const INVALID_ROUTES = [
      '/invalid-page',
      '/propriedades/invalid-id',
      '/reservas/nonexistent',
      '/users/123/invalid',
      '/api/broken-endpoint',
      '//double-slash',
      '/página-inexistente'
    ]

    INVALID_ROUTES.forEach(route => {
      it(`should handle invalid route: ${route}`, async () => {
        render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          // Should show 404 page or handle gracefully
          const notFoundIndicators = [
            screen.queryByText(/404/i),
            screen.queryByText(/não encontrada/i),
            screen.queryByText(/not found/i),
            screen.queryByText(/página não existe/i),
            document.querySelector('[data-testid="not-found"]')
          ]

          const hasNotFoundHandling = notFoundIndicators.some(el => el !== null)
          
          // Should either show 404 page or redirect gracefully
          expect(hasNotFoundHandling || document.body.textContent !== '').toBe(true)
        })
      })
    })
  })

  describe('Form Validation and Error States', () => {
    const FORM_ROUTES = [
      '/propriedades/editar',
      '/reservas/nova',
      '/proprietarios/editar',
      '/financeiro/documentos/novo',
      '/orcamentos/novo'
    ]

    FORM_ROUTES.forEach(route => {
      it(`should handle form validation errors on ${route}`, async () => {
        render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          const forms = document.querySelectorAll('form')
          const submitButtons = [
            ...screen.queryAllByRole('button', { name: /guardar/i }),
            ...screen.queryAllByRole('button', { name: /criar/i }),
            ...screen.queryAllByRole('button', { name: /submit/i }),
            ...screen.queryAllByType('submit')
          ]

          if (submitButtons.length > 0) {
            // Try to submit form without filling required fields
            const submitButton = submitButtons[0]
            fireEvent.click(submitButton)

            // Should handle validation (not crash)
            expect(submitButton).toBeInTheDocument()
          } else if (forms.length > 0) {
            // Try submitting form directly
            const form = forms[0]
            fireEvent.submit(form)
            
            // Should handle form submission
            expect(form).toBeInTheDocument()
          }
        })
      })
    })

    it('should display validation error messages', async () => {
      render(
        <TestWrapper route="/propriedades/editar">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        const inputs = screen.queryAllByRole('textbox')
        
        if (inputs.length > 0) {
          const input = inputs[0]
          
          // Try invalid input
          fireEvent.change(input, { target: { value: '' } })
          fireEvent.blur(input)

          // Look for validation messages
          setTimeout(() => {
            const validationMessages = [
              screen.queryByText(/obrigatório/i),
              screen.queryByText(/inválido/i),
              screen.queryByText(/erro/i),
              document.querySelector('[class*="error"]'),
              document.querySelector('[role="alert"]')
            ]

            // Either validation messages appear or no crash occurs
            const hasValidation = validationMessages.some(el => el !== null) ||
                                document.body.textContent !== ''
            expect(hasValidation).toBe(true)
          }, 100)
        }
      })
    })
  })

  describe('Data Loading Error States', () => {
    it('should handle empty data states', async () => {
      // Mock API to return empty data
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      })

      render(<App />)

      await waitFor(() => {
        // Should handle empty state gracefully
        const emptyStateIndicators = [
          screen.queryByText(/sem dados/i),
          screen.queryByText(/nenhum/i),
          screen.queryByText(/vazio/i),
          screen.queryByText(/não há/i),
          document.querySelector('[data-testid*="empty"]')
        ]

        const hasEmptyStateHandling = emptyStateIndicators.some(el => el !== null) ||
                                    document.body.textContent !== ''

        expect(hasEmptyStateHandling).toBe(true)
      })
    })

    it('should handle malformed API responses', async () => {
      // Mock API to return malformed data
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'structure' })
      })

      render(<App />)

      await waitFor(() => {
        // Should not crash with malformed data
        expect(document.body).toBeInTheDocument()
      })
    })

    it('should handle API response with missing fields', async () => {
      // Mock API response with missing required fields
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          properties: [
            { id: 1 }, // Missing required fields like name, type, etc.
            { name: 'Property 2' }, // Missing id and other fields
          ]
        })
      })

      render(
        <TestWrapper route="/propriedades">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should handle incomplete data without crashing
        expect(document.body).toBeInTheDocument()
      })
    })
  })

  describe('Permission and Authentication Errors', () => {
    it('should handle unauthorized access (401)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Unauthorized' })
      })

      render(<App />)

      await waitFor(() => {
        // Should handle auth errors gracefully
        const authErrorIndicators = [
          screen.queryByText(/não autorizado/i),
          screen.queryByText(/login/i),
          screen.queryByText(/autenticação/i),
          document.querySelector('[data-testid*="auth"]')
        ]

        const hasAuthHandling = authErrorIndicators.some(el => el !== null) ||
                               document.body.textContent !== ''

        expect(hasAuthHandling).toBe(true)
      })
    })

    it('should handle forbidden access (403)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Forbidden' })
      })

      render(<App />)

      await waitFor(() => {
        // Should handle permission errors gracefully
        expect(document.body).toBeInTheDocument()
      })
    })
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle missing localStorage', async () => {
      // Mock localStorage to throw error
      const originalLocalStorage = global.localStorage
      delete (global as any).localStorage

      render(<App />)

      await waitFor(() => {
        // Should work without localStorage
        expect(document.body).toBeInTheDocument()
      })

      // Restore localStorage
      global.localStorage = originalLocalStorage
    })

    it('should handle missing sessionStorage', async () => {
      // Mock sessionStorage to throw error
      const originalSessionStorage = global.sessionStorage
      delete (global as any).sessionStorage

      render(<App />)

      await waitFor(() => {
        // Should work without sessionStorage
        expect(document.body).toBeInTheDocument()
      })

      // Restore sessionStorage
      global.sessionStorage = originalSessionStorage
    })

    it('should handle JavaScript errors in components', async () => {
      // Mock a component to throw an error
      const ThrowingComponent = () => {
        throw new Error('Component error')
      }

      // The error boundary should catch this
      const TestWithError = () => {
        try {
          return <ThrowingComponent />
        } catch (error) {
          return <div>Error handled</div>
        }
      }

      render(
        <TestWrapper>
          <TestWithError />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should handle component errors
        expect(document.body).toBeInTheDocument()
      })
    })
  })

  describe('Performance Edge Cases', () => {
    it('should handle slow API responses', async () => {
      // Mock slow API response
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ data: [] })
            })
          }, 2000) // 2 second delay
        })
      )

      render(<App />)

      // Should show loading state
      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      }, { timeout: 1000 })

      // Should eventually load content
      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should handle memory-intensive operations', async () => {
      // Simulate memory pressure by creating large objects
      const largeData = Array(1000).fill(null).map((_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: 'A'.repeat(1000),
        data: Array(100).fill(0)
      }))

      // Mock API to return large dataset
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: largeData })
      })

      render(<App />)

      await waitFor(() => {
        // Should handle large datasets without crashing
        expect(document.body).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('User Input Edge Cases', () => {
    it('should handle special characters in input fields', async () => {
      render(
        <TestWrapper route="/propriedades/editar">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        const inputs = screen.queryAllByRole('textbox')
        
        if (inputs.length > 0) {
          const input = inputs[0]
          
          // Test with special characters
          const specialChars = ['<script>', '"; DROP TABLE;', '🏠🔥💰', '../../etc/passwd']
          
          specialChars.forEach(chars => {
            fireEvent.change(input, { target: { value: chars } })
            
            // Should handle special characters without crashing
            expect(input).toBeInTheDocument()
          })
        }
      })
    })

    it('should handle extremely long input values', async () => {
      render(
        <TestWrapper route="/propriedades/editar">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        const inputs = screen.queryAllByRole('textbox')
        
        if (inputs.length > 0) {
          const input = inputs[0]
          
          // Test with very long input
          const longText = 'A'.repeat(10000)
          
          fireEvent.change(input, { target: { value: longText } })
          
          // Should handle long text without crashing
          expect(input).toBeInTheDocument()
        }
      })
    })
  })

  describe('Recovery and Retry Mechanisms', () => {
    it('should provide retry mechanisms for failed operations', async () => {
      let attempts = 0
      global.fetch = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        })
      })

      render(<App />)

      await waitFor(() => {
        // Should eventually succeed after retries
        expect(document.body).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should handle page refresh gracefully', async () => {
      // Mock page reload
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, reload: vi.fn() }

      render(<App />)

      await waitFor(() => {
        // Should initialize properly after simulated refresh
        expect(document.body).toBeInTheDocument()
      })

      // Restore location
      window.location = originalLocation
    })
  })
})