import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, ChevronDown, Globe, User, LogOut } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import LanguageToggle from '../ui/LanguageToggle'
import { ImageWithFallback, defaultImages } from '../../utils/imageUtils.jsx'
import { useAuth } from '../../hooks/useAuth'

const PublicHeader = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: t('nav.home'), href: '/' },
  ]

  // Articles et actualités uniquement pour les utilisateurs connectés
  const authenticatedNavigation = []
  if (isAuthenticated) {
    authenticatedNavigation.push(
      { name: t('nav.articles'), href: '/articles' },
      { name: t('nav.news'), href: '/actualites' }
    )
  }

  // Ajouter les liens conditionnels selon l'authentification et le rôle
  const conditionalNavigation = []
  
  // Inscription uniquement pour les non-connectés
  if (!isAuthenticated) {
    conditionalNavigation.push({ name: t('nav.enrollment'), href: '/inscription' })
  }
  
  // Contact uniquement pour les non-connectés ou les parents
  if (!isAuthenticated || user?.role === 'parent') {
    conditionalNavigation.push({ name: t('nav.contact'), href: '/contact' })
  }

  // Si l'utilisateur est connecté, ajouter le lien approprié selon le rôle
  if (isAuthenticated) {
    if (user?.role === 'parent') {
      conditionalNavigation.unshift({
        name: isRTL ? 'مساحتي' : 'Mon Espace',
        href: '/parent-dashboard'
      })
    } else if (user?.role === 'admin' || user?.role === 'staff') {
      conditionalNavigation.unshift({
        name: t('nav.dashboard'),
        href: '/dashboard'
      })
    }
  }

  const allNavigation = [...navigation, ...authenticatedNavigation, ...conditionalNavigation]

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
                <ImageWithFallback
                  src="images/logo_creche.jpg"
                  alt="Mima Elghalia"
                  fallback={defaultImages.logo}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <div className="text-lg font-bold text-gray-900">
                  {isRTL ? 'ميما الغالية' : 'Mima Elghalia'}
                </div>
                <div className="text-xs text-gray-500">
                  {isRTL ? 'حضانة' : 'Crèche'}
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex space-x-8 rtl:space-x-reverse">
            {allNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            <LanguageToggle />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Link
                  to={user?.role === 'parent' ? '/parent-dashboard' : '/dashboard/profile'}
                  className="flex items-center space-x-2 rtl:space-x-reverse text-gray-700 hover:text-primary-600"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user?.first_name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 rtl:space-x-reverse text-gray-700 hover:text-error-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t('common.logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary"
              >
                {t('auth.login')}
              </Link>
            )}
          </div>

          {/* Menu mobile button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {allNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="px-3 py-2">
                <LanguageToggle />
              </div>
              
              {isAuthenticated ? (
                <div className="space-y-1">
                  <Link
                    to={user?.role === 'parent' ? '/parent-dashboard' : '/dashboard/profile'}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  >
                    <User className="w-5 h-5 mr-3 rtl:mr-0 rtl:ml-3" />
                    {user?.first_name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-error-600 hover:bg-gray-50"
                  >
                    <LogOut className="w-5 h-5 mr-3 rtl:mr-0 rtl:ml-3" />
                    {t('common.logout')}
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    {t('auth.login')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default PublicHeader
