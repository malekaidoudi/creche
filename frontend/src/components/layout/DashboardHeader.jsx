import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageToggle from '../ui/LanguageToggle';
import API_CONFIG from '../../config/api';

const DashboardHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isRTL } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return isRTL ? 'مدير' : 'Administrateur';
      case 'staff':
        return isRTL ? 'موظف' : 'Personnel';
      case 'parent':
        return isRTL ? 'ولي أمر' : 'Parent';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'parent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Menu mobile */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Logo/Titre pour desktop */}
          <div className="hidden lg:flex lg:items-center">
            <Link to="/dashboard" className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </h1>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative">
              <Bell className="w-6 h-6" />
              {/* Badge de notification */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Toggles */}
            <ThemeToggle />
            <LanguageToggle />

            {/* Menu utilisateur */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                  {user?.profile_image ? (
                    <img
                      src={`${API_CONFIG.BASE_URL}${user.profile_image}?t=${Date.now()}`}
                      alt="Profile"
                      className="w-8 h-8 object-cover object-center"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${user?.profile_image ? 'hidden' : ''}`}>
                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="hidden md:block text-left rtl:text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                      {getRoleLabel(user?.role)}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* Informations utilisateur */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                          {user?.profile_image ? (
                            <img
                              src={`${API_CONFIG.BASE_URL}${user.profile_image}?t=${Date.now()}`}
                              alt="Profile"
                              className="w-10 h-10 object-cover object-center"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${user?.profile_image ? 'hidden' : ''}`}>
                            <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.first_name} {user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                      {isRTL ? 'الملف الشخصي' : 'Profil'}
                    </Link>

                    <Link
                      to="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="w-4 h-4 mr-3 rtl:mr-0 rtl:ml-3" />
                      {isRTL ? 'الإعدادات' : 'Paramètres'}
                    </Link>

                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
