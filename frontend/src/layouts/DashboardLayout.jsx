import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import SideMenu from '../components/ui/SideMenu';

const DashboardLayout = () => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuType, setMenuType] = useState(() => {
    return localStorage.getItem('menuType') || 'side';
  });

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'font-arabic' : 'font-sans'}`}>
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content */}
      <div className={`${isRTL ? (sidebarCollapsed ? 'lg:pr-20' : 'lg:pr-64') : (sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')} transition-all duration-300`}>
        {/* Header */}
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Menu latéral sur grand écran, bouton flottant sur petit écran */}
      <div className="hidden lg:block">
        <SideMenu />
      </div>
      <div className="block lg:hidden">
        <FloatingActionButton />
      </div>
    </div>
  );
};

export default DashboardLayout;
