import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useSettings } from '../../contexts/SettingsContext'
import LanguageToggle from '../ui/LanguageToggle'
import ThemeToggle from '../ui/ThemeToggle'
import { ImageWithFallback, defaultImages } from '../../utils/imageUtils.jsx'
import { Button } from '../ui/Button'

const PublicHeader = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const { getNurseryInfo } = useSettings()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const nurseryInfo = getNurseryInfo()

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.articles'), href: '/articles' },
    { name: t('nav.enrollment'), href: '/inscription' },
    { name: t('nav.contact'), href: '/contact' }
  ]

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
                <ImageWithFallback
                  src={nurseryInfo.logo}
                  alt={nurseryInfo.name}
                  fallback={defaultImages.logo}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {isRTL ? (nurseryInfo.nameAr || nurseryInfo.name) : nurseryInfo.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isRTL ? 'حضانة' : 'Crèche'}
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex space-x-8 rtl:space-x-reverse">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            <LanguageToggle />
            <ThemeToggle />
            <Button asChild>
              <Link to="/inscription">
                {isRTL ? 'سجل الآن' : 'S\'inscrire'}
              </Link>
            </Button>
          </div>

          {/* Menu mobile button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium transition-colors duration-200 rounded-lg ${
                  isActive(item.href)
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between px-3">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <div className="px-3">
                <Button asChild className="w-full">
                  <Link to="/inscription" onClick={() => setIsMenuOpen(false)}>
                    {isRTL ? 'سجل الآن' : 'S\'inscrire'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default PublicHeader
