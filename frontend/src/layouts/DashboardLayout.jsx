import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../hooks/useLanguage'
import PublicHeader from '../components/layout/PublicHeader'
import DashboardSidebar from '../components/layout/DashboardSidebar'

const DashboardLayout = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'font-arabic' : 'font-sans'}`}>
      <PublicHeader />

      {/* Mobile top bar with menu button */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Open sidebar"
            className="inline-flex items-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-sm text-gray-600">
            {isRTL ? 'لوحة القيادة' : 'Tableau de bord'}
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Static sidebar on desktop */}
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        {/* Mobile overlay sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)}></div>
            <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-72 bg-white shadow-xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <DashboardSidebar />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
