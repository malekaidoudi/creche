import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import useIsMobile from '../hooks/useIsMobile';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import SideMenu from '../components/ui/SideMenu';
import MobileNavigation from '../components/mobile/MobileNavigation';

const DashboardLayout = () => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuType, setMenuType] = useState(() => {
    return localStorage.getItem('menuType') || 'side';
  });

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'font-arabic' : 'font-sans'}`}>
      {/* Sidebar - Desktop only */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content */}
      <div className={`${isRTL ? (sidebarCollapsed ? 'lg:pr-20' : 'lg:pr-64') : (sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')} transition-all duration-300`}>
        {/* Header - Desktop only, Mobile uses MobileHeader in pages */}
        <div className="hidden lg:block">
          <DashboardHeader
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        {/* Page content - With bottom padding for mobile nav */}
        <main className={`py-4 lg:py-6 ${isMobile ? 'pb-20' : ''}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay pour mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile: Bottom Navigation */}
      {isMobile && <MobileNavigation />}

      {/* Desktop: Menu latéral OU Floating Action Button selon la préférence */}
      {!isMobile && (
        <div className="hidden lg:block">
          {menuType === 'side' ? <SideMenu /> : <FloatingActionButton />}
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
