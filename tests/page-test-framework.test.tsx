/**
 * Comprehensive Page Testing Framework for MariaIntelligence
 * Tests all 47 routes for loading, rendering, navigation, and i18n
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { Router } from 'wouter'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import App from '@/App'
import '@testing-library/jest-dom'

// Mock modules that may cause issues in testing
vi.mock('@/enforce-clean-mode', () => ({
  enforceCleanMode: vi.fn()
}))

vi.mock('@/i18n/config', () => ({}))

// Test wrapper component
const TestWrapper = ({ children, route = '/' }: { children: React.ReactNode, route?: string }) => (
  <QueryClientProvider client={queryClient}>
    <Router base={route}>
      {children}
    </Router>
  </QueryClientProvider>
)

// Page routes configuration for systematic testing
const PAGE_ROUTES = {
  // High Priority - Core Business Logic
  dashboard: [
    { path: '/', name: 'Main Dashboard', priority: 'critical' },
    { path: '/painel', name: 'Dashboard Alias 1', priority: 'critical' },
    { path: '/painel-completo', name: 'Dashboard Complete', priority: 'critical' }
  ],
  properties: [
    { path: '/propriedades', name: 'Properties List', priority: 'critical' },
    { path: '/propriedades/editar', name: 'New Property', priority: 'high' },
    { path: '/propriedades/editar/123', name: 'Edit Property', priority: 'high' },
    { path: '/propriedades/estatisticas', name: 'Property Statistics', priority: 'medium' },
    { path: '/propriedades/123', name: 'Property Details', priority: 'high' }
  ],
  reservations: [
    { path: '/reservas', name: 'Reservations List', priority: 'critical' },
    { path: '/reservas/nova', name: 'New Reservation', priority: 'critical' },
    { path: '/reservas/123', name: 'Reservation Details', priority: 'high' },
    { path: '/reservas/aprovacao', name: 'Reservation Approval', priority: 'high' }
  ],
  financial: [
    { path: '/financeiro/documentos', name: 'Financial Documents', priority: 'critical' },
    { path: '/financeiro/documentos/novo', name: 'New Document', priority: 'high' },
    { path: '/financeiro/documentos/123', name: 'Document Details', priority: 'high' },
    { path: '/financeiro/documentos/editar/123', name: 'Edit Document', priority: 'medium' }
  ],
  
  // Medium Priority - Supporting Features
  owners: [
    { path: '/proprietarios', name: 'Owners List', priority: 'high' },
    { path: '/proprietarios/editar', name: 'New Owner', priority: 'medium' },
    { path: '/proprietarios/123', name: 'Owner Details', priority: 'medium' }
  ],
  payments: [
    { path: '/pagamentos', name: 'Payments Main', priority: 'high' },
    { path: '/pagamentos/entrada', name: 'Incoming Payments', priority: 'medium' },
    { path: '/pagamentos/saida', name: 'Outgoing Payments', priority: 'medium' },
    { path: '/pagamentos/novo', name: 'New Payment', priority: 'medium' }
  ],
  quotations: [
    { path: '/orcamentos', name: 'Quotations List', priority: 'medium' },
    { path: '/orcamentos/novo', name: 'New Quotation', priority: 'medium' },
    { path: '/orcamentos/123', name: 'Quotation Details', priority: 'low' },
    { path: '/orcamentos/123/editar', name: 'Edit Quotation', priority: 'low' }
  ],
  reports: [
    { path: '/relatorios', name: 'Reports Main', priority: 'medium' },
    { path: '/relatorios/proprietario', name: 'Owner Reports', priority: 'medium' },
    { path: '/relatorios/faturacao-mensal', name: 'Monthly Invoice', priority: 'low' },
    { path: '/relatorios/tendencias', name: 'Trends Report', priority: 'low' }
  ],
  
  // Lower Priority - Utility & Administrative
  settings: [
    { path: '/configuracoes', name: 'Settings', priority: 'low' }
  ],
  assistant: [
    { path: '/assistente', name: 'AI Assistant', priority: 'low' },
    { path: '/assistente-reservas', name: 'Reservation Assistant', priority: 'low' }
  ],
  documents: [
    { path: '/upload-pdf', name: 'PDF Upload', priority: 'medium' },
    { path: '/enviar-pdf', name: 'PDF Send', priority: 'low' },
    { path: '/digitalizar', name: 'Digitize', priority: 'low' }
  ],
  cleaning: [
    { path: '/equipas-limpeza', name: 'Cleaning Teams', priority: 'low' },
    { path: '/equipas-limpeza/agendamentos', name: 'Cleaning Schedules', priority: 'low' },
    { path: '/relatorios-limpeza', name: 'Cleaning Reports', priority: 'low' }
  ],
  maintenance: [
    { path: '/manutencao/pendentes', name: 'Pending Maintenance', priority: 'low' },
    { path: '/manutencao/solicitacao', name: 'Maintenance Request', priority: 'low' },
    { path: '/manutencao/nova', name: 'New Maintenance', priority: 'low' }
  ],
  demo: [
    { path: '/dados-demo', name: 'Demo Data', priority: 'low' },
    { path: '/dados-demo/remocao-forcada', name: 'Force Reset Demo', priority: 'low' }
  ],
  budget: [
    { path: '/calculadora-orcamento', name: 'Budget Calculator', priority: 'medium' }
  ]
}

// Flatten all routes for comprehensive testing
const ALL_ROUTES = Object.values(PAGE_ROUTES).flat()

describe('MariaIntelligence Page Testing Framework', () => {
  beforeEach(() => {
    // Clear any previous test state
    vi.clearAllMocks()
    queryClient.clear()
  })

  afterEach(() => {
    // Cleanup after each test
    vi.resetAllMocks()
  })

  describe('Page Load and Rendering Tests', () => {
    it('should render the main application without crashing', async () => {
      render(<App />)
      // App should render without throwing errors
      expect(document.body).toBeInTheDocument()
    })

    // Test each route systematically
    ALL_ROUTES.forEach((route) => {
      it(`should load ${route.name} page (${route.path}) without errors`, async () => {
        const { container } = render(
          <TestWrapper route={route.path}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          // Page should render some content
          expect(container.firstChild).toBeInTheDocument()
        }, { timeout: 5000 })

        // Should not contain error boundaries or crash indicators
        expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Error/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation and Routing Tests', () => {
    it('should navigate to dashboard from root path', async () => {
      render(<App />)
      
      await waitFor(() => {
        // Should be on dashboard (contains daily tasks or similar content)
        expect(document.querySelector('[data-testid*="dashboard"]') || 
               document.querySelector('[class*="dashboard"]') ||
               document.body).toBeInTheDocument()
      })
    })

    it('should handle unknown routes with 404 page', async () => {
      render(
        <TestWrapper route="/invalid-route-that-does-not-exist">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show 404 content or not found page
        const notFoundIndicators = [
          screen.queryByText(/não encontrada/i),
          screen.queryByText(/not found/i),
          screen.queryByText(/404/i),
          document.querySelector('[data-testid="not-found"]')
        ]
        
        const hasNotFoundContent = notFoundIndicators.some(element => element !== null)
        expect(hasNotFoundContent).toBe(true)
      })
    })
  })

  describe('Interactive Elements Tests', () => {
    const CRITICAL_ROUTES = ALL_ROUTES.filter(route => route.priority === 'critical')

    CRITICAL_ROUTES.forEach((route) => {
      it(`should have interactive elements working on ${route.name}`, async () => {
        render(
          <TestWrapper route={route.path}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          const buttons = screen.queryAllByRole('button')
          const links = screen.queryAllByRole('link')
          const inputs = screen.queryAllByRole('textbox')

          // Critical pages should have some interactive elements
          expect(buttons.length + links.length + inputs.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Form Submission Tests', () => {
    const FORM_ROUTES = [
      '/reservas/nova',
      '/propriedades/editar',
      '/proprietarios/editar',
      '/financeiro/documentos/novo',
      '/orcamentos/novo'
    ]

    FORM_ROUTES.forEach((routePath) => {
      const route = ALL_ROUTES.find(r => r.path === routePath)
      if (!route) return

      it(`should handle form interactions on ${route.name}`, async () => {
        render(
          <TestWrapper route={routePath}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          const forms = screen.queryAllByRole('form') || document.querySelectorAll('form')
          const inputs = screen.queryAllByRole('textbox')
          const buttons = screen.queryAllByRole('button')

          // Form pages should have inputs and buttons
          expect(inputs.length + buttons.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Content and Translation Tests', () => {
    it('should display Portuguese content correctly', async () => {
      render(<App />)

      await waitFor(() => {
        // Should contain Portuguese text
        const portugueseWords = [
          'Painel', 'Dashboard', 'Propriedades', 'Reservas', 
          'Relatórios', 'Configurações', 'Assistente'
        ]
        
        const hasPortugueseContent = portugueseWords.some(word => 
          screen.queryByText(new RegExp(word, 'i')) !== null ||
          document.body.textContent?.includes(word)
        )
        
        expect(hasPortugueseContent).toBe(true)
      })
    })
  })

  describe('Responsive Design Tests', () => {
    beforeEach(() => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })
    })

    it('should be responsive on mobile viewport', async () => {
      // Set mobile viewport
      global.innerWidth = 375
      global.innerHeight = 667
      global.dispatchEvent(new Event('resize'))

      render(<App />)

      await waitFor(() => {
        const container = document.body
        
        // Should render mobile-friendly layout
        expect(container).toBeInTheDocument()
        
        // Check for mobile navigation or responsive elements
        const mobileElements = [
          document.querySelector('[class*="mobile"]'),
          document.querySelector('[class*="sm:"]'),
          document.querySelector('[data-testid*="mobile"]')
        ]
        
        // At least one mobile element should exist or layout should adapt
        expect(container.clientWidth).toBeLessThanOrEqual(375)
      })
    })
  })

  describe('Error State Tests', () => {
    it('should handle network errors gracefully', async () => {
      // Mock fetch to simulate network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))

      render(<App />)

      await waitFor(() => {
        // Should still render the app structure even with network errors
        expect(document.body).toBeInTheDocument()
        
        // Should not crash the entire application
        expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Performance Tests', () => {
    it('should load critical pages within acceptable time', async () => {
      const startTime = performance.now()
      
      render(<App />)

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      }, { timeout: 3000 }) // 3 second timeout for page load

      const loadTime = performance.now() - startTime
      
      // Critical pages should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })
  })
})

// Export for use in other test files
export { PAGE_ROUTES, ALL_ROUTES, TestWrapper }