import { Routes, Route } from 'react-router-dom'
import { useLanguage } from './hooks/useLanguage'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages publiques
import HomePage from './pages/public/HomePage'
import ArticlesPage from './pages/public/ArticlesPage'
import ArticleDetailPage from './pages/public/ArticleDetailPage'
import EnrollmentPage from './pages/public/EnrollmentPage'
import ContactPage from './pages/public/ContactPage'
import VirtualTourPage from './pages/public/VirtualTourPage'

// Pages d'authentification
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Pages parent
import ParentSpacePage from './pages/parent/ParentSpacePage'

// Pages dashboard
import DashboardHome from './pages/dashboard/DashboardHome'
import ProfilePage from './pages/dashboard/ProfilePage'
import ChildrenPage from './pages/dashboard/ChildrenPage'
import AddChildPage from './pages/dashboard/AddChildPage'
import EnrollmentsPage from './pages/dashboard/EnrollmentsPage'
import AttendancePage from './pages/dashboard/AttendancePage'
import DocumentsPage from './pages/dashboard/DocumentsPage'
import MySpacePage from './pages/dashboard/MySpacePage'

// Composants
import ProtectedRoute from './components/auth/ProtectedRoute'



function App() {
  const { language, direction } = useLanguage()

  document.documentElement.lang = language
  document.documentElement.dir = direction

  return (
    <Routes>
      {/* Routes d'authentification */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Routes publiques */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/:id" element={<ArticleDetailPage />} />
        <Route path="inscription" element={<EnrollmentPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="visite-virtuelle" element={<VirtualTourPage />} />
        
        {/* Espace parent (protégé) */}
        <Route 
          path="mon-espace" 
          element={
            <ProtectedRoute roles={['parent']}>
              <ParentSpacePage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Routes dashboard (protégées) */}
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
        <Route path="children" element={<ChildrenPage />} />
        <Route path="children/add" element={<AddChildPage />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="attendance/today" element={<AttendancePage />} />
        <Route path="attendance/history" element={<AttendancePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/download" element={<DocumentsPage />} />
        <Route path="documents/uploaded" element={<DocumentsPage />} />
        <Route path="my-space" element={<MySpacePage />} />
        {/* TODO: Ajouter d'autres routes dashboard */}
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
