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
import CreatePasswordPage from './pages/public/CreatePasswordPage'
import UploadDocumentsPage from './pages/public/UploadDocumentsPage'

// Pages d'authentification
import RegisterPage from './pages/auth/RegisterPage'

// Pages parent
import MySpacePage from './pages/parent/MySpacePage'
import AttendanceParentPage from './pages/parent/AttendanceParentPage'
import AbsenceRequestPage from './pages/parent/AbsenceRequestPage'
import AnnouncementsPage from './pages/parent/AnnouncementsPage'
import ParentCalendarPage from './pages/parent/ParentCalendarPage'

// Pages staff
import AbsenceManagementPage from './pages/staff/AbsenceManagementPage'
import StaffMemoForm from './pages/staff/StaffMemoForm'

// Pages messages
import MessagesPage from './pages/messages/MessagesPage'

// Pages tasks
import TasksPage from './pages/tasks/TasksPage'

// Pages événements
import EventsCalendar from './pages/events/EventsCalendar'
import EventDetails from './pages/events/EventDetails'

// Pages dashboard
import DashboardHome from './pages/dashboard/DashboardHome'
import UnifiedProfilePage from './pages/UnifiedProfilePage'
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
import StaffSettingsPage from './pages/dashboard/StaffSettingsPage'

// Page Activités
import ActivitiesPage from './pages/activities/ActivitiesPage'

// Composants
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'



function App() {
  return (
    <Routes>
      {/* Routes d'authentification */}
      <Route path="/register" element={<RegisterPage />} />

      {/* Routes workflow inscription */}
      <Route path="/create-password" element={<CreatePasswordPage />} />
      <Route path="/upload-documents" element={<UploadDocumentsPage />} />

      {/* Routes publiques */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/:id" element={<ArticleDetailPage />} />
        <Route path="inscription" element={<EnrollmentPage />} />
        <Route path="contact" element={<ContactPageDynamic />} />
        <Route path="visite-virtuelle" element={<VirtualTourPage />} />

        {/* Activités (accessible à tous les utilisateurs connectés) */}
        <Route path="activites" element={<ActivitiesPage />} />

        {/* Mon Espace (protégé - parents + admin/staff avec enfants) */}
        <Route
          path="mon-espace"
          element={
            <ProtectedRoute roles={['parent', 'admin', 'staff']}>
              <MySpacePage />
            </ProtectedRoute>
          }
        />

        {/* Routes Mon Espace - Messages et Annonces pour parents */}
        <Route
          path="mon-espace/messages"
          element={
            <ProtectedRoute roles={['parent']}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="mon-espace/announcements"
          element={
            <ProtectedRoute roles={['parent']}>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="mon-espace/calendar"
          element={
            <ProtectedRoute roles={['parent']}>
              <ParentCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="mon-espace/attendance-report"
          element={
            <ProtectedRoute roles={['parent']}>
              <AttendanceParentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="mon-espace/events/:id"
          element={
            <ProtectedRoute roles={['parent']}>
              <EventDetails />
            </ProtectedRoute>
          }
        />

        {/* Page profil unifiée (tous les utilisateurs connectés) */}
        <Route
          path="profile"
          element={
            <ProtectedRoute roles={['admin', 'staff', 'parent']}>
              <UnifiedProfilePage />
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
          path="mon-espace/absence-request"
          element={
            <ProtectedRoute roles={['parent']}>
              <AbsenceRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="mon-espace/activities"
          element={
            <ProtectedRoute roles={['parent']}>
              <ActivitiesPage />
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
        <Route path="absence-management" element={<AbsenceManagementPage />} />

        {/* Routes événements */}
        <Route path="events/calendar" element={<EventsCalendar />} />
        <Route path="events/:id" element={<EventDetails />} />

        {/* Route staff pour envoyer mémo/tâche */}
        <Route path="staff/send-message" element={<StaffMemoForm />} />

        {/* Route messages (parent/staff/admin) */}
        <Route path="messages" element={<MessagesPage />} />

        {/* Route annonces (parent) */}
        <Route path="announcements" element={<AnnouncementsPage />} />

        {/* Route tâches (staff/admin) */}
        <Route path="tasks" element={<TasksPage />} />

        {/* Route activités (tous les rôles) */}
        <Route path="activities" element={<ActivitiesPage />} />

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
        <Route path="staff-settings" element={
          <ErrorBoundary>
            <StaffSettingsPage />
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
