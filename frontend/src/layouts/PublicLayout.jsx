import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../hooks/useLanguage'
//import { useAuth } from '../hooks/useAuth'
import PublicHeader from '../components/layout/PublicHeader'
import PublicFooter from '../components/layout/PublicFooter'
import ErrorBoundary from '../components/ui/ErrorBoundary'

const PublicLayout = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  //const { isAuthenticated } = useAuth()

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'font-arabic' : 'font-sans'}`}>
      <PublicHeader />

      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <ErrorBoundary>
        <PublicFooter />
      </ErrorBoundary>
    </div>
  )
}

export default PublicLayout
