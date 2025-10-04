import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useLanguage } from './hooks/useLanguage'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages publiques
import HomePage from './pages/public/HomePage'
import ArticlesPage from './pages/public/ArticlesPage'
import ArticleDetailPage from './pages/public/ArticleDetailPage'
import NewsPage from './pages/public/NewsPage'
import EnrollmentPage from './pages/public/EnrollmentPage'
import ContactPage from './pages/public/ContactPage'
import VirtualTourPage from './pages/public/VirtualTourPage'
import LoginPage from './pages/auth/LoginPage'

// Pages dashboard
import DashboardHome from './pages/dashboard/DashboardHome'
import UsersPage from './pages/dashboard/UsersPage'
import ChildrenPage from './pages/dashboard/ChildrenPage'
import EnrollmentsPage from './pages/dashboard/EnrollmentsPage'
import AttendancePage from './pages/dashboard/AttendancePage'
import ArticlesManagementPage from './pages/dashboard/ArticlesManagementPage'
import NewsManagementPage from './pages/dashboard/NewsManagementPage'
import ContactsPage from './pages/dashboard/ContactsPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import ReportsPage from './pages/dashboard/ReportsPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import MediaPage from './pages/dashboard/MediaPage'

// Pages parent
import ParentDashboard from './pages/parent/ParentDashboard'

// Composants
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()
  const { language, direction } = useLanguage()

  // Appliquer la direction et la langue au document
  document.documentElement.lang = language
  document.documentElement.dir = direction

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route 
          path="articles" 
          element={
            <ProtectedRoute>
              <ArticlesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="articles/:id" 
          element={
            <ProtectedRoute>
              <ArticleDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="actualites" 
          element={
            <ProtectedRoute>
              <NewsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="inscription" element={<EnrollmentPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="visite-virtuelle" element={<VirtualTourPage />} />
        
        {/* Route dashboard parent avec header du site */}
        <Route 
          path="parent-dashboard" 
          element={
            <ProtectedRoute roles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Route de connexion */}
      <Route 
        path="/login" 
        element={
          user ? (
            user.role === 'parent' ? <Navigate to="/parent-dashboard" replace /> : <Navigate to="/dashboard" replace />
          ) : <LoginPage />
        } 
      />

      {/* Routes du dashboard (protégées) avec header du site */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute roles={['admin', 'staff']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Routes pour admin et staff */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="children" 
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <ChildrenPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="enrollments" 
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <EnrollmentsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="attendance" 
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <AttendancePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="articles" 
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <ArticlesManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="news" 
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <NewsManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="reports" 
          element={
            <ProtectedRoute roles={['admin']}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="media" 
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <MediaPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="settings" 
          element={
            <ProtectedRoute roles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Route 404 */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Page non trouvée</p>
              <a 
                href="/" 
                className="btn-primary"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        } 
      />
    </Routes>
  )
}

export default App
