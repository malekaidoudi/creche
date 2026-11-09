import { Outlet, useLocation } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import PublicHeader from '../components/layout/PublicHeader'
import PublicFooter from '../components/layout/PublicFooter'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import HelpSystem from '../components/help/HelpSystem'

const PublicLayout = () => {
  const { isRTL } = useLanguage()
  const location = useLocation()
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
  const showFooter = normalizedPath === '/' || normalizedPath === '/contact'
  const isMessagesRoute = normalizedPath.startsWith('/mon-espace/messages')

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'font-arabic' : 'font-sans'}`}>
      <div className={isMessagesRoute ? 'hidden lg:block' : ''}>
        <PublicHeader />
      </div>

      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {showFooter && (
        <ErrorBoundary>
          <PublicFooter />
        </ErrorBoundary>
      )}

      <HelpSystem />
    </div>
  )
}

export default PublicLayout
