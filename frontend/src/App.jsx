import { Routes, Route } from 'react-router-dom'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages publiques
import HomePage from './pages/public/HomePage'
import ArticlesPage from './pages/public/ArticlesPage'
import ArticleDetailPage from './pages/public/ArticleDetailPage'
import EnrollmentPage from './pages/public/EnrollmentPage'
import ContactPageDynamic from './pages/public/ContactPageDynamic'
import VirtualTourPage from './pages/public/VirtualTourPage'

// Pages d'authentification
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Pages parent
import MySpacePage from './pages/parent/MySpacePage'
import AttendanceParentPage from './pages/parent/AttendanceParentPage'
import AbsenceRequestPage from './pages/parent/AbsenceRequestPage'

// Pages dashboard
import DashboardHome from './pages/dashboard/DashboardHome'
import DashboardProfilePage from './pages/dashboard/ProfilePage'
import ChildrenPage from './pages/dashboard/ChildrenPage'
import AddChildPage from './pages/dashboard/AddChildPage'
import EnrollmentsPage from './pages/dashboard/EnrollmentsPage'
import AttendancePage from './pages/dashboard/AttendancePage'
import DocumentsPage from './pages/dashboard/DocumentsPage'
import PendingEnrollmentsPage from './pages/dashboard/PendingEnrollmentsPage'

// Pages placeholder pour fonctionnalités non implémentées
import ParentsPage from './pages/dashboard/ParentsPage'
import StaffPage from './pages/dashboard/StaffPage'
import AddUserPage from './pages/dashboard/AddUserPage'
import GeneralStatsPage from './pages/dashboard/GeneralStatsPage'
import AttendanceReportPage from './pages/dashboard/AttendanceReportPage'
import DashboardSettingsPage from './pages/dashboard/DashboardSettingsPage'

// Composants
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'



function App() {
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
        <Route path="contact" element={<ContactPageDynamic />} />
        <Route path="visite-virtuelle" element={<VirtualTourPage />} />
        
        {/* Mon Espace (protégé - parents + admin/staff avec enfants) */}
        <Route 
          path="mon-espace" 
          element={
            <ProtectedRoute roles={['parent', 'admin', 'staff']}>
              <MySpacePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Page profil unifiée (tous les utilisateurs connectés) */}
        <Route 
          path="profile" 
          element={
            <ProtectedRoute roles={['admin', 'staff', 'parent']}>
              <DashboardProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="attendance-parent" 
          element={
            <ProtectedRoute roles={['parent']}>
              <AttendanceParentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="absence-request" 
          element={
            <ProtectedRoute roles={['parent']}>
              <AbsenceRequestPage />
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
        <Route path="profile" element={<DashboardProfilePage />} />
        <Route path="children" element={<ChildrenPage />} />
        <Route path="children/add" element={<AddChildPage />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="pending-enrollments" element={<PendingEnrollmentsPage />} />
        <Route path="enrollments/today" element={<EnrollmentsPage />} />
        <Route path="enrollments/history" element={<EnrollmentsPage />} />
        <Route path="enrollments/stats" element={<EnrollmentsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="attendance/today" element={<AttendancePage />} />
        <Route path="attendance/history" element={<AttendancePage />} />
        <Route path="attendance/stats" element={<AttendancePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/download" element={<DocumentsPage />} />
        <Route path="documents/uploaded" element={<DocumentsPage />} />
        
        {/* Pages placeholder pour fonctionnalités non implémentées */}
        <Route path="parents" element={<ParentsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="add-user" element={<AddUserPage />} />
        <Route path="general-stats" element={<GeneralStatsPage />} />
        <Route path="attendance-report" element={<AttendanceReportPage />} />
        <Route path="settings" element={
          <ErrorBoundary>
            <DashboardSettingsPage />
          </ErrorBoundary>
        } />
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
