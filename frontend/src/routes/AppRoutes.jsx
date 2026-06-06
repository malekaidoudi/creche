import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layouts
import PublicLayout from '../layouts/PublicLayout'
import DashboardLayout from '../layouts/DashboardLayout'

// Pages publiques
import HomePage from '../pages/public/HomePage'
import EnrollmentPage from '../pages/public/EnrollmentPage'
import ContactPageDynamic from '../pages/public/ContactPageDynamic'
import VirtualTourPage from '../pages/public/VirtualTourPage'
import CreatePasswordPage from '../pages/public/CreatePasswordPage'
import UploadDocumentsPage from '../pages/public/UploadDocumentsPage'

// Pages d'authentification
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'

// Pages parent
import MySpacePage from '../pages/parent/MySpacePage'
import AttendanceParentPage from '../pages/parent/AttendanceParentPage'
import AbsenceRequestPage from '../pages/parent/AbsenceRequestPage'
import AnnouncementsPage from '../pages/parent/AnnouncementsPage'
import ParentCalendarPage from '../pages/parent/ParentCalendarPage'
import ChildDetailsPage from '../pages/parent/ChildDetailsPage'
import ChildMedicalPage from '../pages/parent/ChildMedicalPage'
import ChildEmergencyContactsPage from '../pages/parent/ChildEmergencyContactsPage'
import ChildDailyReportsPage from '../pages/parent/ChildDailyReportsPage'
import AddChildPage from '../pages/parent/AddChildPage'
import ParentTreatmentsPage from '../pages/parent/TreatmentsPage'

// Pages staff
import AbsenceManagementPage from '../pages/staff/AbsenceManagementPage'
import StaffMemoForm from '../pages/staff/StaffMemoForm'

// Pages messages
import MessagesPage from '../pages/messages/MessagesPage'

// Pages tasks
import TasksPage from '../pages/tasks/TasksPage'

// Pages planning
import MonthlyPlanningPage from '../pages/dashboard/MonthlyPlanningPage'

// Pages dashboard
import DashboardHome from '../pages/dashboard/DashboardHome'
import UnifiedProfilePage from '../pages/UnifiedProfilePage'
import ChildrenPage from '../pages/dashboard/ChildrenPage'
import DashboardAddChildPage from '../pages/dashboard/AddChildPage'
import EnrollmentsPage from '../pages/dashboard/EnrollmentsPage'
import AttendancePage from '../pages/dashboard/AttendancePage'
import DocumentsPage from '../pages/dashboard/DocumentsPage'
import PendingEnrollmentsPage from '../pages/dashboard/PendingEnrollmentsPage'

// Pages placeholder
import ParentsPage from '../pages/dashboard/ParentsPage'
import StaffPage from '../pages/dashboard/StaffPage'
import AddUserPage from '../pages/dashboard/AddUserPage'
import GeneralStatsPage from '../pages/dashboard/GeneralStatsPage'
import AttendanceReportPage from '../pages/dashboard/AttendanceReportPage'
import DashboardSettingsPage from '../pages/dashboard/DashboardSettingsPage'
import StaffSettingsPage from '../pages/dashboard/StaffSettingsPage'
import WeeklyPlanningPage from '../pages/dashboard/WeeklyPlanningPage'

// Page Activités
import ActivitiesPage from '../pages/activities/ActivitiesPage'

// Journal d'activité (direction)
import ActivityLogPage from '../pages/dashboard/ActivityLogPage'
import ActivityFeedPage from '../pages/dashboard/ActivityFeedPage'
import DailyReportsPage from '../pages/dashboard/DailyReportsPage'
import MailboxPage from '../pages/dashboard/MailboxPage'
import CloudinaryExplorerPage from '../pages/dashboard/CloudinaryExplorerPage'
import TestimonialsManagementPage from '../pages/dashboard/TestimonialsManagementPage'
import DashboardTreatmentsPage from '../pages/dashboard/TreatmentsPage'

// Page de récupération d'urgence
import RecoveryPage from '../pages/RecoveryPage'

// Composants
import ProtectedRoute from '../components/auth/ProtectedRoute'
import ErrorBoundary from '../components/ErrorBoundary'

// Pages d'erreur
import NotFoundPage from '../pages/errors/NotFoundPage'
import ForbiddenPage from '../pages/errors/ForbiddenPage'
import ServerErrorPage from '../pages/errors/ServerErrorPage'

const AppRoutes = () => {
    return (
        <>
            <Toaster position="top-right" />
            <Routes>
                {/* Route de récupération d'urgence (sans authentification) */}
                <Route path="/recovery" element={<RecoveryPage />} />

                {/* Routes d'authentification */}
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Routes workflow inscription */}
                <Route path="/create-password" element={<CreatePasswordPage />} />
                <Route path="/upload-documents" element={<UploadDocumentsPage />} />
                <Route path="/inscription-parent" element={<Navigate to="/inscription?mode=parent" replace />} />

                {/* Routes publiques */}
                <Route path="/" element={<PublicLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="inscription" element={<EnrollmentPage />} />
                    <Route path="contact" element={<ContactPageDynamic />} />
                    <Route path="visite-virtuelle" element={<VirtualTourPage />} />

                    {/* Activités */}
                    <Route path="activites" element={<ActivitiesPage />} />

                    {/* Mon Espace */}
                    <Route
                        path="mon-espace"
                        element={
                            <ProtectedRoute roles={['parent', 'admin', 'staff']}>
                                <MySpacePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Routes Mon Espace - Messages et Annonces */}
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

                    {/* Page profil unifiée */}
                    <Route
                        path="profile"
                        element={
                            <ProtectedRoute roles={['admin', 'staff', 'parent', 'developer']}>
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
                    <Route
                        path="mon-espace/ajouter-enfant"
                        element={
                            <ProtectedRoute roles={['parent']}>
                                <AddChildPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Routes enfant */}
                    <Route
                        path="mon-espace/child/:id/details"
                        element={
                            <ProtectedRoute roles={['parent']}>
                                <ChildDetailsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="mon-espace/child/:id/medical"
                        element={
                            <ProtectedRoute roles={['parent']}>
                                <ChildMedicalPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="mon-espace/child/:id/emergency-contacts"
                        element={
                            <ProtectedRoute roles={['parent']}>
                                <ChildEmergencyContactsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="mon-espace/daily-reports"
                        element={
                            <ProtectedRoute roles={['parent', 'admin', 'staff']}>
                                <ChildDailyReportsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="mon-espace/treatments"
                        element={
                            <ProtectedRoute roles={['parent']}>
                                <ParentTreatmentsPage />
                            </ProtectedRoute>
                        }
                    />
                </Route>

                {/* Routes dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute roles={['admin', 'staff', 'developer']}>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardHome />} />
                    <Route path="children" element={<ChildrenPage />} />
                    <Route path="add-child" element={<DashboardAddChildPage />} />
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

                    <Route path="planning/calendar" element={<MonthlyPlanningPage />} />
                    <Route path="planning/weekly" element={<WeeklyPlanningPage />} />
                    <Route path="events/calendar" element={<MonthlyPlanningPage />} />

                    <Route path="staff/send-message" element={<StaffMemoForm />} />
                    <Route path="messages" element={<MessagesPage />} />
                    <Route path="announcements" element={<AnnouncementsPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="activities" element={<ActivitiesPage />} />
                    <Route path="planning" element={<WeeklyPlanningPage />} />
                    <Route path="treatments" element={<DashboardTreatmentsPage />} />

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

                    <Route path="activity-logs" element={
                        <ProtectedRoute roles={['developer']}>
                            <ActivityLogPage />
                        </ProtectedRoute>
                    } />
                    <Route path="activity-feed" element={<ActivityFeedPage />} />
                    <Route path="daily-reports" element={<DailyReportsPage />} />
                    <Route path="mailbox" element={<MailboxPage />} />
                    <Route path="storage" element={
                        <ProtectedRoute roles={['developer']}>
                            <CloudinaryExplorerPage />
                        </ProtectedRoute>
                    } />
                    <Route path="testimonials" element={
                        <ProtectedRoute roles={['admin', 'developer']}>
                            <TestimonialsManagementPage />
                        </ProtectedRoute>
                    } />
                </Route>

                {/* Pages d'erreur */}
                <Route path="/403" element={<ForbiddenPage />} />
                <Route path="/500" element={<ServerErrorPage />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </>
    )
}

export default AppRoutes
