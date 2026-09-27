import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layouts (chargés immédiatement, nécessaires à la structure de toute page)
import PublicLayout from '../layouts/PublicLayout'
import DashboardLayout from '../layouts/DashboardLayout'

// Composants (légers, toujours nécessaires)
import ProtectedRoute from '../components/auth/ProtectedRoute'
import ErrorBoundary from '../components/ErrorBoundary'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// Pages publiques
const HomePage = lazy(() => import('../pages/public/HomePage'))
const HomePageV2 = lazy(() => import('../pages/public/HomePageV2'))
const EnrollmentPage = lazy(() => import('../pages/public/EnrollmentPage'))
const ContactPageDynamic = lazy(() => import('../pages/public/ContactPageDynamic'))
const VirtualTourPage = lazy(() => import('../pages/public/VirtualTourPage'))
const CreatePasswordPage = lazy(() => import('../pages/public/CreatePasswordPage'))
const UploadDocumentsPage = lazy(() => import('../pages/public/UploadDocumentsPage'))

// Pages d'authentification
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))

// Pages parent
const MySpacePage = lazy(() => import('../pages/parent/MySpacePage'))
const AttendanceParentPage = lazy(() => import('../pages/parent/AttendanceParentPage'))
const AbsenceRequestPage = lazy(() => import('../pages/parent/AbsenceRequestPage'))
const AnnouncementsPage = lazy(() => import('../pages/parent/AnnouncementsPage'))
const ParentCalendarPage = lazy(() => import('../pages/parent/ParentCalendarPage'))
const ChildDetailsPage = lazy(() => import('../pages/parent/ChildDetailsPage'))
const ChildMedicalPage = lazy(() => import('../pages/parent/ChildMedicalPage'))
const ChildEmergencyContactsPage = lazy(() => import('../pages/parent/ChildEmergencyContactsPage'))
const ChildDailyReportsPage = lazy(() => import('../pages/parent/ChildDailyReportsPage'))
const AddChildPage = lazy(() => import('../pages/parent/AddChildPage'))
const ParentTreatmentsPage = lazy(() => import('../pages/parent/TreatmentsPage'))

// Pages staff
const AbsenceManagementPage = lazy(() => import('../pages/staff/AbsenceManagementPage'))
const StaffMemoForm = lazy(() => import('../pages/staff/StaffMemoForm'))

// Pages messages
const MessagesPage = lazy(() => import('../pages/messages/MessagesPage'))

// Pages tasks
const TasksPage = lazy(() => import('../pages/tasks/TasksPage'))

// Pages planning
const MonthlyPlanningPage = lazy(() => import('../pages/dashboard/MonthlyPlanningPage'))

// Pages dashboard
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome'))
const UnifiedProfilePage = lazy(() => import('../pages/UnifiedProfilePage'))
const ChildrenPage = lazy(() => import('../pages/dashboard/ChildrenPage'))
const DashboardAddChildPage = lazy(() => import('../pages/dashboard/AddChildPage'))
const EnrollmentsPage = lazy(() => import('../pages/dashboard/EnrollmentsPage'))
const AttendancePage = lazy(() => import('../pages/dashboard/AttendancePage'))
const DocumentsPage = lazy(() => import('../pages/dashboard/DocumentsPage'))
const PendingEnrollmentsPage = lazy(() => import('../pages/dashboard/PendingEnrollmentsPage'))

// Pages placeholder
const ParentsPage = lazy(() => import('../pages/dashboard/ParentsPage'))
const StaffPage = lazy(() => import('../pages/dashboard/StaffPage'))
const AddUserPage = lazy(() => import('../pages/dashboard/AddUserPage'))
const GeneralStatsPage = lazy(() => import('../pages/dashboard/GeneralStatsPage'))
const AttendanceReportPage = lazy(() => import('../pages/dashboard/AttendanceReportPage'))
const DashboardSettingsPage = lazy(() => import('../pages/dashboard/DashboardSettingsPage'))
const StaffSettingsPage = lazy(() => import('../pages/dashboard/StaffSettingsPage'))
const WeeklyPlanningPage = lazy(() => import('../pages/dashboard/WeeklyPlanningPage'))

// Page Activités
const ActivitiesPage = lazy(() => import('../pages/activities/ActivitiesPage'))

// Journal d'activité (direction)
const ActivityLogPage = lazy(() => import('../pages/dashboard/ActivityLogPage'))
const ActivityFeedPage = lazy(() => import('../pages/dashboard/ActivityFeedPage'))
const DailyReportsPage = lazy(() => import('../pages/dashboard/DailyReportsPage'))
const MailboxPage = lazy(() => import('../pages/dashboard/MailboxPage'))
const CloudinaryExplorerPage = lazy(() => import('../pages/dashboard/CloudinaryExplorerPage'))
const TestimonialsManagementPage = lazy(() => import('../pages/dashboard/TestimonialsManagementPage'))
const DashboardTreatmentsPage = lazy(() => import('../pages/dashboard/TreatmentsPage'))

// Page de récupération d'urgence
const RecoveryPage = lazy(() => import('../pages/RecoveryPage'))

// Pages d'erreur
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'))
const ForbiddenPage = lazy(() => import('../pages/errors/ForbiddenPage'))
const ServerErrorPage = lazy(() => import('../pages/errors/ServerErrorPage'))

// Fallback affiché pendant le téléchargement du code d'une page (lazy chunk)
const RouteFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
    </div>
)

const AppRoutes = () => {
    return (
        <>
            <Toaster position="top-right" />
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    {/* Route de récupération d'urgence (sans authentification) */}
                    <Route path="/recovery" element={<RecoveryPage />} />

                    {/* Aperçu de la refonte premium de la homepage (comparaison, ne remplace pas "/") */}
                    <Route path="/accueil-premium" element={<HomePageV2 />} />

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
            </Suspense>
        </>
    )
}

export default AppRoutes
