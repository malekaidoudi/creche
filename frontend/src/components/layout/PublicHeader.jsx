import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, User, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import LanguageToggle from '../ui/LanguageToggle'
import ThemeToggle from '../ui/ThemeToggle'
import { ImageWithFallback, defaultImages } from '../../utils/imageUtils.jsx'
import { Button } from '../ui/Button'

const PublicHeader = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const { isAuthenticated, user, logout, isStaff } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Informations par défaut de la crèche
  const nurseryInfo = {
    name: 'Mima Elghalia',
    nameAr: 'ميما الغالية',
    logo: '/images/logo.jpg'
  }

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
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive(item.href)
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
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.first_name}
                  </span>
                </button>

                {/* Menu utilisateur */}
                {userMenuOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      {user?.role === 'parent' && (
                        <Link
                          to="/mon-espace"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <User className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                          {isRTL ? 'مساحتي' : 'Mon espace'}
                        </Link>
                      )}
                      
                      {isStaff() && (
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                          {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                          {isRTL ? 'تسجيل الخروج' : 'Déconnexion'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button variant="outline" asChild>
                  <Link to="/login">
                    {isRTL ? 'تسجيل الدخول' : 'Connexion'}
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/inscription">
                    {isRTL ? 'سجل الآن' : 'S\'inscrire'}
                  </Link>
                </Button>
              </div>
            )}
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
                className={`block px-3 py-2 text-base font-medium transition-colors duration-200 rounded-lg ${isActive(item.href)
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
              
              {isAuthenticated ? (
                <div className="px-3 space-y-3">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.role === 'admin' ? (isRTL ? 'مدير' : 'Admin') :
                         user?.role === 'staff' ? (isRTL ? 'موظف' : 'Staff') :
                         (isRTL ? 'ولي أمر' : 'Parent')}
                      </p>
                    </div>
                  </div>
                  
                  {user?.role === 'parent' && (
                    <Link
                      to="/mon-espace"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <User className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                      {isRTL ? 'مساحتي' : 'Mon espace'}
                    </Link>
                  )}
                  
                  {isStaff() && (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                      {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                    {isRTL ? 'تسجيل الخروج' : 'Déconnexion'}
                  </button>
                </div>
              ) : (
                <div className="px-3 space-y-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      {isRTL ? 'تسجيل الدخول' : 'Connexion'}
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/inscription" onClick={() => setIsMenuOpen(false)}>
                      {isRTL ? 'سجل الآن' : 'S\'inscrire'}
                    </Link>
                  </Button>
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
