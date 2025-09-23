/**
 * Unit Tests for PropertyList Component
 * Tests component rendering, user interactions, and state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PropertyList from '@/pages/properties'
import { fixtures } from '../../fixtures/property.fixtures'

// Mock the useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn()
  }
})

// Mock router
vi.mock('wouter', () => ({
  useLocation: () => ['/propriedades', vi.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: { children: React.ReactNode; onClick?: () => void; variant?: string }) => (
    <button onClick={onClick} data-variant={variant}>{children}</button>
  )
}))

describe('PropertyList Component', () => {
  let queryClient: QueryClient
  const mockUseQuery = vi.mocked(require('@tanstack/react-query').useQuery)

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const renderWithQuery = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Loading States', () => {
    it('should show loading state when data is being fetched', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      expect(screen.getByText('Carregando propriedades...')).toBeInTheDocument()
    })

    it('should show loading skeleton during fetch', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      // Should show multiple skeleton cards
      const skeletonCards = screen.getAllByTestId('property-skeleton')
      expect(skeletonCards).toHaveLength(6) // Default skeleton count
    })
  })

  describe('Data Rendering', () => {
    it('should render properties correctly when data is loaded', () => {
      const mockProperties = fixtures.properties.validList()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      // Check if properties are rendered
      expect(screen.getByText(mockProperties[0].name)).toBeInTheDocument()
      expect(screen.getByText(mockProperties[1].name)).toBeInTheDocument()

      // Check if property details are shown
      expect(screen.getByText(`€${mockProperties[0].cleaningCost}`)).toBeInTheDocument()
      expect(screen.getByText(`€${mockProperties[0].checkInFee}`)).toBeInTheDocument()
    })

    it('should display property status badges correctly', () => {
      const activeProperty = fixtures.properties.active()
      const inactiveProperty = fixtures.properties.inactive()

      mockUseQuery.mockReturnValue({
        data: [activeProperty, inactiveProperty],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      expect(screen.getByText('Ativa')).toBeInTheDocument()
      expect(screen.getByText('Inativa')).toBeInTheDocument()
    })

    it('should show property owner information', () => {
      const mockProperties = fixtures.properties.withOwners()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      expect(screen.getByText(mockProperties[0].owner.name)).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no properties exist', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      expect(screen.getByText('Nenhuma propriedade encontrada')).toBeInTheDocument()
      expect(screen.getByText('Adicione sua primeira propriedade para começar')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Adicionar Propriedade' })).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('should handle network errors gracefully', () => {
      const mockError = new Error('Network error')

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      expect(screen.getByText('Erro ao carregar propriedades')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Tentar Novamente' })).toBeInTheDocument()
    })

    it('should allow retry after error', async () => {
      const mockRefetch = vi.fn()

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch
      })

      renderWithQuery(<PropertyList />)

      const retryButton = screen.getByRole('button', { name: 'Tentar Novamente' })
      fireEvent.click(retryButton)

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Interactions', () => {
    it('should navigate to property details when property card is clicked', () => {
      const mockProperties = fixtures.properties.validList()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      const propertyCard = screen.getByTestId(`property-card-${mockProperties[0].id}`)
      expect(propertyCard).toHaveAttribute('href', `/propriedades/${mockProperties[0].id}`)
    })

    it('should navigate to add new property when add button is clicked', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      const addButton = screen.getByRole('button', { name: 'Adicionar Propriedade' })
      expect(addButton.closest('a')).toHaveAttribute('href', '/propriedades/editar')
    })

    it('should handle property search functionality', async () => {
      const mockProperties = fixtures.properties.validList()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      const searchInput = screen.getByPlaceholderText('Pesquisar propriedades...')
      fireEvent.change(searchInput, { target: { value: mockProperties[0].name } })

      await waitFor(() => {
        expect(screen.getByDisplayValue(mockProperties[0].name)).toBeInTheDocument()
      })
    })

    it('should filter properties by status', async () => {
      const mockProperties = fixtures.properties.mixedStatus()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      const statusFilter = screen.getByLabelText('Filtrar por status')
      fireEvent.change(statusFilter, { target: { value: 'active' } })

      await waitFor(() => {
        // Should only show active properties
        const activeProperties = mockProperties.filter(p => p.active)
        expect(screen.getAllByTestId(/property-card-/)).toHaveLength(activeProperties.length)
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should display grid layout on desktop', () => {
      const mockProperties = fixtures.properties.validList()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      const grid = screen.getByTestId('properties-grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('should show compact view on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const mockProperties = fixtures.properties.validList()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      // Should show mobile-optimized layout
      expect(screen.getByTestId('properties-grid')).toHaveClass('grid-cols-1')
    })
  })

  describe('Performance', () => {
    it('should handle large property lists efficiently', () => {
      const largePropertyList = fixtures.properties.largeList(100)

      mockUseQuery.mockReturnValue({
        data: largePropertyList,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      const startTime = performance.now()
      renderWithQuery(<PropertyList />)
      const endTime = performance.now()

      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should implement virtual scrolling for large lists', () => {
      const largePropertyList = fixtures.properties.largeList(1000)

      mockUseQuery.mockReturnValue({
        data: largePropertyList,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      // Should only render visible items (virtualization)
      const renderedCards = screen.getAllByTestId(/property-card-/)
      expect(renderedCards.length).toBeLessThan(100) // Should not render all 1000 items
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const mockProperties = fixtures.properties.validList()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Lista de propriedades')
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Pesquisar propriedades')
    })

    it('should support keyboard navigation', () => {
      const mockProperties = fixtures.properties.validList()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      const firstCard = screen.getByTestId(`property-card-${mockProperties[0].id}`)

      // Should be focusable
      firstCard.focus()
      expect(document.activeElement).toBe(firstCard)

      // Should support Enter key activation
      fireEvent.keyDown(firstCard, { key: 'Enter', code: 'Enter' })
      // Navigation should occur (tested through href attribute)
    })

    it('should provide screen reader friendly content', () => {
      const mockProperties = fixtures.properties.validList()

      mockUseQuery.mockReturnValue({
        data: mockProperties,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      // Should have descriptive text for screen readers
      expect(screen.getByText(`${mockProperties.length} propriedades encontradas`)).toBeInTheDocument()
    })
  })

  describe('Data Validation', () => {
    it('should handle properties with missing optional fields', () => {
      const incompleteProperty = fixtures.properties.incomplete()

      mockUseQuery.mockReturnValue({
        data: [incompleteProperty],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      // Should render without errors even with missing data
      expect(screen.getByText(incompleteProperty.name)).toBeInTheDocument()
      expect(screen.getByText('N/A')).toBeInTheDocument() // Fallback for missing owner
    })

    it('should validate property data types', () => {
      const invalidProperty = fixtures.properties.invalidTypes()

      mockUseQuery.mockReturnValue({
        data: [invalidProperty],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })

      renderWithQuery(<PropertyList />)

      // Should handle invalid data gracefully
      expect(screen.getByText('Dados inválidos')).toBeInTheDocument()
    })
  })
})