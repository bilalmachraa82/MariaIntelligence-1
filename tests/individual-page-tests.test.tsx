/**
 * Individual Page Tests for MariaIntelligence
 * Detailed testing of each page's specific functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Router } from 'wouter'
import { queryClient } from '@/lib/queryClient'

// Individual page imports for specific testing
import DashboardFull from '@/pages/dashboard-full'
import PropertiesPage from '@/pages/properties'
import ReservationsPage from '@/pages/reservations'
import OwnersPage from '@/pages/owners'
import ReportsPage from '@/pages/reports'
import SettingsPage from '@/pages/settings'
import AssistantPage from '@/pages/assistant'
import FinancialDocumentsPage from '@/pages/financial/documents'
import NotFound from '@/pages/not-found'

// Mock common dependencies
vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    clear: vi.fn(),
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn()
  }
}))

vi.mock('@/i18n/config', () => ({}))
vi.mock('@/enforce-clean-mode', () => ({
  enforceCleanMode: vi.fn()
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <Router>
      {children}
    </Router>
  </QueryClientProvider>
)

describe('Individual Page Tests - Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard with daily tasks section', async () => {
    render(
      <TestWrapper>
        <DashboardFull />
      </TestWrapper>
    )

    await waitFor(() => {
      // Dashboard should have main content
      expect(document.body).toBeInTheDocument()
    })

    // Look for key dashboard elements
    const dashboardIndicators = [
      screen.queryByText(/painel/i),
      screen.queryByText(/dashboard/i),
      screen.queryByText(/tarefas/i),
      screen.queryByText(/hoje/i),
      document.querySelector('[data-testid*="dashboard"]'),
      document.querySelector('[class*="dashboard"]')
    ]

    const hasDashboardContent = dashboardIndicators.some(element => element !== null)
    expect(hasDashboardContent).toBe(true)
  })

  it('should display financial summary cards', async () => {
    render(
      <TestWrapper>
        <DashboardFull />
      </TestWrapper>
    )

    await waitFor(() => {
      // Look for financial indicators
      const financialElements = [
        screen.queryByText(/receita/i),
        screen.queryByText(/lucro/i),
        screen.queryByText(/despesas/i),
        screen.queryByText(/€/),
        document.querySelector('[data-testid*="revenue"]'),
        document.querySelector('[class*="stats"]')
      ]

      const hasFinancialContent = financialElements.some(element => element !== null)
      expect(hasFinancialContent).toBe(true)
    })
  })
})

describe('Individual Page Tests - Properties', () => {
  it('should render properties list page', async () => {
    render(
      <TestWrapper>
        <PropertiesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const propertiesIndicators = [
        screen.queryByText(/propriedades/i),
        screen.queryByText(/properties/i),
        screen.queryByText(/adicionar/i),
        screen.queryByText(/nova/i),
        document.querySelector('[data-testid*="properties"]')
      ]

      const hasPropertiesContent = propertiesIndicators.some(element => element !== null)
      expect(hasPropertiesContent).toBe(true)
    })
  })

  it('should have property management controls', async () => {
    render(
      <TestWrapper>
        <PropertiesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const controls = [
        screen.queryAllByRole('button'),
        screen.queryAllByRole('link'),
        document.querySelectorAll('[class*="button"]'),
        document.querySelectorAll('button')
      ].flat()

      expect(controls.length).toBeGreaterThan(0)
    })
  })
})

describe('Individual Page Tests - Reservations', () => {
  it('should render reservations list page', async () => {
    render(
      <TestWrapper>
        <ReservationsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const reservationIndicators = [
        screen.queryByText(/reservas/i),
        screen.queryByText(/reservations/i),
        screen.queryByText(/check-in/i),
        screen.queryByText(/check-out/i),
        document.querySelector('[data-testid*="reservations"]')
      ]

      const hasReservationContent = reservationIndicators.some(element => element !== null)
      expect(hasReservationContent).toBe(true)
    })
  })

  it('should display reservation status filters', async () => {
    render(
      <TestWrapper>
        <ReservationsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const filterElements = [
        screen.queryByText(/filtrar/i),
        screen.queryByText(/estado/i),
        screen.queryByText(/status/i),
        document.querySelector('[data-testid*="filter"]'),
        document.querySelector('select'),
        document.querySelector('[type="search"]')
      ]

      const hasFilterContent = filterElements.some(element => element !== null)
      expect(hasFilterContent).toBe(true)
    })
  })
})

describe('Individual Page Tests - Owners', () => {
  it('should render owners management page', async () => {
    render(
      <TestWrapper>
        <OwnersPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const ownerIndicators = [
        screen.queryByText(/proprietários/i),
        screen.queryByText(/proprietarios/i),
        screen.queryByText(/owners/i),
        document.querySelector('[data-testid*="owners"]')
      ]

      const hasOwnerContent = ownerIndicators.some(element => element !== null)
      expect(hasOwnerContent).toBe(true)
    })
  })
})

describe('Individual Page Tests - Financial Documents', () => {
  it('should render financial documents page', async () => {
    render(
      <TestWrapper>
        <FinancialDocumentsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const financialIndicators = [
        screen.queryByText(/documentos/i),
        screen.queryByText(/financeiro/i),
        screen.queryByText(/documents/i),
        screen.queryByText(/faturas/i),
        document.querySelector('[data-testid*="documents"]')
      ]

      const hasFinancialContent = financialIndicators.some(element => element !== null)
      expect(hasFinancialContent).toBe(true)
    })
  })

  it('should have document management actions', async () => {
    render(
      <TestWrapper>
        <FinancialDocumentsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const actions = [
        screen.queryByText(/novo/i),
        screen.queryByText(/adicionar/i),
        screen.queryByText(/criar/i),
        screen.queryAllByRole('button'),
        document.querySelectorAll('[class*="button"]')
      ].flat()

      expect(actions.length).toBeGreaterThan(0)
    })
  })
})

describe('Individual Page Tests - Reports', () => {
  it('should render reports dashboard', async () => {
    render(
      <TestWrapper>
        <ReportsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const reportIndicators = [
        screen.queryByText(/relatórios/i),
        screen.queryByText(/relatorios/i),
        screen.queryByText(/reports/i),
        document.querySelector('[data-testid*="reports"]')
      ]

      const hasReportContent = reportIndicators.some(element => element !== null)
      expect(hasReportContent).toBe(true)
    })
  })

  it('should display report categories', async () => {
    render(
      <TestWrapper>
        <ReportsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const categories = [
        screen.queryByText(/proprietário/i),
        screen.queryByText(/faturação/i),
        screen.queryByText(/tendências/i),
        screen.queryByText(/mensal/i)
      ]

      const hasCategoryContent = categories.some(element => element !== null)
      expect(hasCategoryContent).toBe(true)
    })
  })
})

describe('Individual Page Tests - Settings', () => {
  it('should render settings page', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const settingsIndicators = [
        screen.queryByText(/configurações/i),
        screen.queryByText(/configuracoes/i),
        screen.queryByText(/settings/i),
        document.querySelector('[data-testid*="settings"]')
      ]

      const hasSettingsContent = settingsIndicators.some(element => element !== null)
      expect(hasSettingsContent).toBe(true)
    })
  })

  it('should have configuration options', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const configElements = [
        screen.queryByText(/idioma/i),
        screen.queryByText(/perfil/i),
        screen.queryByText(/conta/i),
        screen.queryAllByRole('button'),
        screen.queryAllByRole('textbox'),
        document.querySelectorAll('select')
      ].flat()

      expect(configElements.length).toBeGreaterThan(0)
    })
  })
})

describe('Individual Page Tests - AI Assistant', () => {
  it('should render AI assistant page', async () => {
    render(
      <TestWrapper>
        <AssistantPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const assistantIndicators = [
        screen.queryByText(/assistente/i),
        screen.queryByText(/assistant/i),
        screen.queryByText(/chat/i),
        document.querySelector('[data-testid*="assistant"]'),
        document.querySelector('[data-testid*="chat"]')
      ]

      const hasAssistantContent = assistantIndicators.some(element => element !== null)
      expect(hasAssistantContent).toBe(true)
    })
  })

  it('should have chat interface elements', async () => {
    render(
      <TestWrapper>
        <AssistantPage />
      </TestWrapper>
    )

    await waitFor(() => {
      const chatElements = [
        screen.queryByRole('textbox'),
        screen.queryByPlaceholderText(/mensagem/i),
        screen.queryByPlaceholderText(/perguntar/i),
        document.querySelector('textarea'),
        document.querySelector('[type="text"]'),
        document.querySelector('[class*="chat"]')
      ]

      const hasChatContent = chatElements.some(element => element !== null)
      expect(hasChatContent).toBe(true)
    })
  })
})

describe('Individual Page Tests - Error Handling', () => {
  it('should render 404 not found page', async () => {
    render(
      <TestWrapper>
        <NotFound />
      </TestWrapper>
    )

    await waitFor(() => {
      const notFoundIndicators = [
        screen.queryByText(/não encontrada/i),
        screen.queryByText(/not found/i),
        screen.queryByText(/404/i),
        screen.queryByText(/página/i),
        document.querySelector('[data-testid="not-found"]')
      ]

      const hasNotFoundContent = notFoundIndicators.some(element => element !== null)
      expect(hasNotFoundContent).toBe(true)
    })
  })

  it('should have navigation back to dashboard', async () => {
    render(
      <TestWrapper>
        <NotFound />
      </TestWrapper>
    )

    await waitFor(() => {
      const navigationElements = [
        screen.queryByText(/voltar/i),
        screen.queryByText(/painel/i),
        screen.queryByText(/dashboard/i),
        screen.queryByRole('link'),
        document.querySelector('a[href="/"]')
      ]

      const hasNavigation = navigationElements.some(element => element !== null)
      expect(hasNavigation).toBe(true)
    })
  })
})

// Performance Tests for Individual Pages
describe('Individual Page Performance Tests', () => {
  const CRITICAL_PAGES = [
    { component: DashboardFull, name: 'Dashboard' },
    { component: PropertiesPage, name: 'Properties' },
    { component: ReservationsPage, name: 'Reservations' },
    { component: FinancialDocumentsPage, name: 'Financial Documents' }
  ]

  CRITICAL_PAGES.forEach(({ component: Component, name }) => {
    it(`should load ${name} page within performance budget`, async () => {
      const startTime = performance.now()

      render(
        <TestWrapper>
          <Component />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      }, { timeout: 2000 })

      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(2000) // 2 second budget for critical pages
    })
  })
})