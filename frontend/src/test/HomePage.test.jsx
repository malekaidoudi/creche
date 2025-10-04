import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import HomePage from '../pages/public/HomePage'
import i18n from '../i18n/config'

// Mock des hooks
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    isRTL: false,
    getLocalizedText: (text) => text
  })
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
    expect(screen.getByText(/L'avenir/i)).toBeInTheDocument()
    expect(screen.getByText(/de vos enfants/i)).toBeInTheDocument()
    expect(screen.getByText(/commence ici/i)).toBeInTheDocument()
  })

  test('renders CTA buttons', () => {
    renderWithProviders(<HomePage />)
    
    // Vérifier les boutons d'action
    expect(screen.getByRole('link', { name: /inscription gratuite/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /visite virtuelle/i })).toBeInTheDocument()
  })

  test('renders statistics section', () => {
    renderWithProviders(<HomePage />)
    
    // Vérifier les statistiques
    expect(screen.getByText('150+')).toBeInTheDocument()
    expect(screen.getByText('15+')).toBeInTheDocument()
    expect(screen.getByText('98%')).toBeInTheDocument()
  })

  test('renders features section', () => {
    renderWithProviders(<HomePage />)
    
    // Vérifier que la section des caractéristiques est présente
    expect(screen.getByText(/Environnement 100% sécurisé/i)).toBeInTheDocument()
    expect(screen.getByText(/Soins personnalisés/i)).toBeInTheDocument()
    expect(screen.getByText(/Éducation précoce/i)).toBeInTheDocument()
  })

  test('renders testimonials section', () => {
    renderWithProviders(<HomePage />)
    
    // Vérifier la section témoignages
    expect(screen.getByText(/Ce que disent les parents/i)).toBeInTheDocument()
  })
})
