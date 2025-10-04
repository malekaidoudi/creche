import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Search, User, LogOut, Settings, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import LanguageToggle from '../ui/LanguageToggle'
import UserMenu from '../ui/UserMenu'
import { ImageWithFallback, defaultImages } from '../../utils/imageUtils.jsx'

const DashboardHeader = () => {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { isRTL } = useLanguage()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsProfileMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
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
                  {t('nav.dashboard')}
                </div>
              </div>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Toggle de langue */}
            <LanguageToggle />

            {/* Notifications */}
            <NotificationCenter />

            {/* Menu profil */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-3 rtl:space-x-reverse p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt="Photo de profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary-600" />
                  )}
                </div>
                <div className="hidden md:block text-left rtl:text-right">
                  <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-gray-500">{t(`roles.${user?.role}`)}</p>
                </div>
              </button>

              {/* Menu déroulant */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    to="/"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Home className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                    {isRTL ? 'الموقع العام' : 'Site public'}
                  </Link>
                  
                  <div className="border-t border-gray-100"></div>
                  
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                    {t('common.profile')}
                  </Link>
                  
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                    {t('common.settings')}
                  </Link>
                  
                  <div className="border-t border-gray-100"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-error-600 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                    {t('common.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay pour fermer le menu */}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}
    </header>
  )
}

export default DashboardHeader
