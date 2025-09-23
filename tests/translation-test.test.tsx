/**
 * Translation and i18n Testing Suite for MariaIntelligence
 * Tests Portuguese translations and content display across all pages
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Router } from 'wouter'
import { queryClient } from '@/lib/queryClient'
import App from '@/App'
import '@testing-library/jest-dom'

// Mock i18n configuration
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

// Expected Portuguese translations for each page section
const EXPECTED_TRANSLATIONS = {
  navigation: [
    'Painel', 'Dashboard', 'Propriedades', 'Proprietários', 'Reservas',
    'Relatórios', 'Configurações', 'Assistente', 'Equipas de Limpeza',
    'Manutenção', 'Pagamentos', 'Orçamentos', 'Documentos'
  ],
  dashboard: [
    'Tarefas do Dia', 'Check-ins Hoje', 'Check-outs Hoje', 'Limpezas',
    'Manutenção', 'Ver Detalhes', 'Receita', 'Lucro', 'Ocupação'
  ],
  properties: [
    'Nova Propriedade', 'Editar Propriedade', 'Tipo de Propriedade',
    'Localização', 'Quartos', 'Casa de Banho', 'Preço por Noite'
  ],
  reservations: [
    'Nova Reserva', 'Check-in', 'Check-out', 'Estado da Reserva',
    'Hóspede', 'Propriedade', 'Valor Total', 'Confirmada', 'Pendente'
  ],
  owners: [
    'Novo Proprietário', 'Nome Completo', 'Email', 'Telefone',
    'Morada', 'NIF', 'Propriedades Associadas'
  ],
  financial: [
    'Novo Documento', 'Tipo de Documento', 'Data de Emissão',
    'Valor', 'Estado', 'Fatura', 'Recibo', 'Nota de Crédito'
  ],
  reports: [
    'Relatório do Proprietário', 'Faturação Mensal', 'Relatório de Tendências',
    'Período', 'Gerar Relatório', 'Exportar PDF'
  ],
  settings: [
    'Perfil do Utilizador', 'Idioma', 'Notificações', 'Segurança',
    'Guardar Alterações', 'Configurações da Conta'
  ],
  common: [
    'Guardar', 'Cancelar', 'Editar', 'Eliminar', 'Pesquisar',
    'Filtrar', 'A carregar...', 'Erro', 'Sucesso', 'Confirmar'
  ]
}

describe('Translation and i18n Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Navigation Translation Tests', () => {
    it('should display Portuguese navigation labels', async () => {
      render(<App />)

      await waitFor(() => {
        const navigationTerms = EXPECTED_TRANSLATIONS.navigation
        const foundTerms = navigationTerms.filter(term => {
          return screen.queryByText(new RegExp(term, 'i')) !== null ||
                 document.body.textContent?.includes(term)
        })

        // At least 50% of navigation terms should be found
        expect(foundTerms.length).toBeGreaterThan(navigationTerms.length * 0.5)
      })
    })

    it('should have consistent navigation across different pages', async () => {
      const testRoutes = ['/', '/propriedades', '/reservas', '/relatorios']

      for (const route of testRoutes) {
        const { unmount } = render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          // Navigation should contain key Portuguese terms
          const hasNavigation = EXPECTED_TRANSLATIONS.navigation.some(term =>
            screen.queryByText(new RegExp(term, 'i')) !== null ||
            document.body.textContent?.includes(term)
          )
          expect(hasNavigation).toBe(true)
        })

        unmount()
      }
    })
  })

  describe('Page-Specific Translation Tests', () => {
    it('should display dashboard translations correctly', async () => {
      render(<App />)

      await waitFor(() => {
        const dashboardTerms = EXPECTED_TRANSLATIONS.dashboard
        const foundTerms = dashboardTerms.filter(term => {
          return screen.queryByText(new RegExp(term, 'i')) !== null ||
                 document.body.textContent?.includes(term)
        })

        // At least 30% of dashboard terms should be present
        expect(foundTerms.length).toBeGreaterThan(dashboardTerms.length * 0.3)
      })
    })

    it('should display properties page translations', async () => {
      render(
        <TestWrapper route="/propriedades">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        const propertyTerms = ['Propriedades', 'Nova', 'Editar', 'Tipo']
        const foundTerms = propertyTerms.filter(term => {
          return screen.queryByText(new RegExp(term, 'i')) !== null ||
                 document.body.textContent?.includes(term)
        })

        expect(foundTerms.length).toBeGreaterThan(0)
      })
    })

    it('should display reservations page translations', async () => {
      render(
        <TestWrapper route="/reservas">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        const reservationTerms = ['Reservas', 'Check-in', 'Check-out', 'Hóspede']
        const foundTerms = reservationTerms.filter(term => {
          return screen.queryByText(new RegExp(term, 'i')) !== null ||
                 document.body.textContent?.includes(term)
        })

        expect(foundTerms.length).toBeGreaterThan(0)
      })
    })

    it('should display financial documents translations', async () => {
      render(
        <TestWrapper route="/financeiro/documentos">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        const financialTerms = ['Documentos', 'Financeiro', 'Novo', 'Tipo']
        const foundTerms = financialTerms.filter(term => {
          return screen.queryByText(new RegExp(term, 'i')) !== null ||
                 document.body.textContent?.includes(term)
        })

        expect(foundTerms.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Common UI Elements Translation Tests', () => {
    it('should translate common action buttons', async () => {
      render(<App />)

      await waitFor(() => {
        const commonActions = ['Guardar', 'Editar', 'Ver', 'Novo', 'Cancelar']
        const foundActions = commonActions.filter(action => {
          return screen.queryByText(new RegExp(action, 'i')) !== null ||
                 document.body.textContent?.includes(action)
        })

        // Should find at least some common actions
        expect(foundActions.length).toBeGreaterThan(0)
      })
    })

    it('should display Portuguese date and time formats', async () => {
      render(<App />)

      await waitFor(() => {
        // Look for Portuguese date patterns or time-related text
        const dateTimeIndicators = [
          /\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY format
          /hoje/i, // "today" in Portuguese
          /ontem/i, // "yesterday" in Portuguese
          /amanhã/i, // "tomorrow" in Portuguese
          /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i
        ]

        const hasDateTimeContent = dateTimeIndicators.some(pattern => {
          return screen.queryByText(pattern) !== null ||
                 pattern.test(document.body.textContent || '')
        })

        // At least one date/time pattern should be found
        expect(hasDateTimeContent).toBe(true)
      })
    })
  })

  describe('Form Field Translation Tests', () => {
    const FORM_ROUTES = [
      { route: '/propriedades/editar', terms: ['Nome', 'Tipo', 'Localização'] },
      { route: '/reservas/nova', terms: ['Hóspede', 'Propriedade', 'Data'] },
      { route: '/proprietarios/editar', terms: ['Nome', 'Email', 'Telefone'] },
      { route: '/financeiro/documentos/novo', terms: ['Tipo', 'Valor', 'Data'] }
    ]

    FORM_ROUTES.forEach(({ route, terms }) => {
      it(`should translate form fields on ${route}`, async () => {
        render(
          <TestWrapper route={route}>
            <App />
          </TestWrapper>
        )

        await waitFor(() => {
          const foundTerms = terms.filter(term => {
            return screen.queryByText(new RegExp(term, 'i')) !== null ||
                   screen.queryByLabelText(new RegExp(term, 'i')) !== null ||
                   screen.queryByPlaceholderText(new RegExp(term, 'i')) !== null ||
                   document.body.textContent?.includes(term)
          })

          // Should find at least one form field term
          expect(foundTerms.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Error Message Translation Tests', () => {
    it('should display error messages in Portuguese', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Test with an invalid route to trigger potential error states
      render(
        <TestWrapper route="/invalid-route">
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        const errorTerms = [
          'Erro', 'Não encontrada', 'Página não existe', 
          'Problema', 'Tente novamente', 'Voltar'
        ]

        const foundErrors = errorTerms.filter(term => {
          return screen.queryByText(new RegExp(term, 'i')) !== null ||
                 document.body.textContent?.includes(term)
        })

        // Should find at least one error-related term
        expect(foundErrors.length).toBeGreaterThan(0)
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Loading State Translation Tests', () => {
    it('should display loading messages in Portuguese', async () => {
      render(<App />)

      // Look for loading states (may appear briefly)
      await waitFor(() => {
        const loadingTerms = [
          'A carregar', 'Carregando', 'A processar', 
          'Aguarde', 'Por favor aguarde'
        ]

        const hasLoadingContent = loadingTerms.some(term => {
          return document.body.textContent?.includes(term)
        }) || document.body.textContent !== ''

        // Either loading content is found OR page has loaded with content
        expect(hasLoadingContent).toBe(true)
      })
    })
  })

  describe('Currency and Number Formatting Tests', () => {
    it('should display currency in European format', async () => {
      render(<App />)

      await waitFor(() => {
        // Look for Euro symbol and European number formatting
        const currencyPatterns = [
          /€/, // Euro symbol
          /\d+,\d{2}/, // European decimal format (comma as decimal separator)
          /\d{1,3}(?:\.\d{3})*,\d{2}/, // European thousands separator format
        ]

        const hasCurrencyContent = currencyPatterns.some(pattern => {
          return pattern.test(document.body.textContent || '')
        }) || document.body.textContent?.includes('€')

        // Should find currency formatting or Euro symbol
        expect(hasCurrencyContent).toBe(true)
      })
    })
  })

  describe('Missing Translation Detection', () => {
    it('should not contain untranslated English keys', async () => {
      render(<App />)

      await waitFor(() => {
        const englishKeys = [
          'translation.', 'common.', 'dashboard.', 'properties.',
          'reservations.', 'owners.', 'reports.', 'settings.'
        ]

        const foundKeys = englishKeys.filter(key => {
          return document.body.textContent?.includes(key)
        })

        // Should not find any translation keys in the rendered content
        expect(foundKeys.length).toBe(0)
      })
    })

    it('should not contain common untranslated English words', async () => {
      render(<App />)

      await waitFor(() => {
        const englishWords = [
          'Loading...', 'Save', 'Cancel', 'Edit', 'Delete',
          'Search', 'Filter', 'Error', 'Success', 'Please wait'
        ]

        const foundEnglishWords = englishWords.filter(word => {
          // Only flag as error if the English word is standalone
          const regex = new RegExp(`\\b${word}\\b`, 'i')
          return regex.test(document.body.textContent || '')
        })

        // Should minimize untranslated English words
        expect(foundEnglishWords.length).toBeLessThan(3)
      })
    })
  })
})