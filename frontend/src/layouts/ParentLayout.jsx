import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Home, 
  User, 
  LogOut,
  Baby,
  Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/ui/Button';

const ParentLayout = ({ children, title, showBackButton = false, backTo = "/mon-espace" }) => {
  const { user, logout } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(backTo)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isRTL ? 'رجوع' : 'Retour'}
                </Button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Baby className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {title || (isRTL ? 'مساحتي' : 'Mon Espace')}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isRTL ? 'حضانة ميما الغالية' : 'Crèche Mima Elghalia'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Navigation rapide */}
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  to="/mon-espace"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  {isRTL ? 'الرئيسية' : 'Accueil'}
                </Link>
                <Link
                  to="/parent/profile"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 inline mr-2" />
                  {isRTL ? 'الملف الشخصي' : 'Profil'}
                </Link>
              </nav>

              {/* User info */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isRTL ? 'ولي أمر' : 'Parent'}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex items-center justify-around py-2">
          <Link
            to="/mon-espace"
            className="flex flex-col items-center p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">{isRTL ? 'الرئيسية' : 'Accueil'}</span>
          </Link>
          
          <Link
            to="/parent/profile"
            className="flex flex-col items-center p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">{isRTL ? 'الملف' : 'Profil'}</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs mt-1">{isRTL ? 'خروج' : 'Sortir'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ParentLayout;
