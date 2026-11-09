import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { vi } from 'vitest'
import HomePage from '../pages/public/HomePage'
import i18n from '../i18n/config'

// Mock des hooks
vi.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    isRTL: false,
    getLocalizedText: (text) => text
  })
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false
  })
}))

vi.mock('../contexts/DialogContext', () => ({
  useDialogContext: () => ({
    success: vi.fn(),
    error: vi.fn(),
    confirm: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }),
  DialogProvider: ({ children }) => children
}))

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, testimonials: [], stats: {} } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}))

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  )
}

describe('HomePage', () => {
  test('renders hero section', () => {
    renderWithProviders(<HomePage />)
    
    // Vérifier que le titre principal est présent
    expect(screen.getAllByText(/L'avenir/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/de vos enfants/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/commence ici/i).length).toBeGreaterThan(0)
  })

  test('renders CTA buttons', () => {
    renderWithProviders(<HomePage />)
    
    // Vérifier le bouton de visite virtuelle
    expect(screen.getByRole('link', { name: /visite virtuelle/i })).toBeInTheDocument()
  })

  test('renders features section', () => {
    renderWithProviders(<HomePage />)
    
    // Vérifier que la section des caractéristiques est présente
    expect(screen.getAllByText(/Environnement 100% sécurisé/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Soins personnalisés/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Éducation précoce/i).length).toBeGreaterThan(0)
  })

  test('renders testimonials section', () => {
    renderWithProviders(<HomePage />)
    
    // Vérifier la section témoignages
    expect(screen.getByText(/Ce que disent les parents/i)).toBeInTheDocument()
  })
})
