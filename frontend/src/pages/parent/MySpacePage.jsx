import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Baby,
  User,
  Bell,
  Home,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import api from '../../services/api';
import { useProfileImage } from '../../hooks/useProfileImage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SimpleNotificationCenter from '../../components/dashboard/SimpleNotificationCenter';
import MyAppointmentsWidget from '../../components/widgets/MyAppointmentsWidget';
import RequestAppointmentModal from '../../components/modals/RequestAppointmentModal';
import RescheduleAppointmentModal from '../../components/modals/RescheduleAppointmentModal';
import SideMenu from '../../components/ui/SideMenu';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import MobileParentSpace from '../../components/mobile/MobileParentSpace';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import { useDialogContext } from '../../contexts/DialogContext';

const MySpacePage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const dialog = useDialogContext();
  const { getImageUrl, hasImage } = useProfileImage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentKey, setAppointmentKey] = useState(0);

  useEffect(() => {
    loadChildren();
    loadUnreadCount();
    loadAppointments();

    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await api.get('/api/appointments/my');
      if (response.data?.success) {
        setAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    }
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/children-summary');
      const result = response.data;
      if (result.success) {
        setChildren(result.children || []);
      }
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
      dialog.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications?is_read=false');
      if (response.data && response.data.success) {
        setUnreadCount(response.data.notifications?.length || 0);
      }
    } catch (error) {
      console.error('Erreur chargement compteur notifications:', error);
    }
  };


  // Version Mobile
  if (isMobile) {
    return (
      <>
        <MobileParentSpace
          children={children}
          appointments={appointments}
          unreadCount={unreadCount}
          loading={loading}
          onShowNotifications={() => setShowNotifications(true)}
          onRequestAppointment={() => setShowAppointmentModal(true)}
          onRescheduleAppointment={(appointment) => {
            setSelectedAppointment(appointment);
            setShowRescheduleModal(true);
          }}
        />

        {/* Modals */}
        <SimpleNotificationCenter
          isOpen={showNotifications}
          onClose={() => {
            setShowNotifications(false);
            loadUnreadCount();
          }}
        />
        <RequestAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={() => {
            dialog.success(isRTL ? 'تم إرسال طلب الموعد بنجاح' : 'Demande de rendez-vous envoyée');
            loadAppointments();
          }}
        />
        <RescheduleAppointmentModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSuccess={() => loadAppointments()}
        />

        <MobileNavigation />
      </>
    );
  }

  // Version Desktop
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barre de navigation mobile */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:hidden">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">{isRTL ? 'الموقع' : 'Accueil'}</span>
          </Link>

          <div className="flex items-center gap-2">
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <Link
                to="/dashboard"
                className="px-3 py-1.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
              >
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
            )}
            <Link
              to="/profile"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* En-tête de bienvenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 sm:p-8 text-white relative">
              {/* Bouton notifications - Desktop uniquement en haut à droite */}
              <button
                onClick={() => setShowNotifications(true)}
                className="hidden sm:flex absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                  {hasImage() ? (
                    <img
                      src={getImageUrl()}
                      alt="Photo de profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 sm:w-8 sm:h-8" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
                    {isRTL ? `مرحباً ${user?.first_name}` : `Bienvenue ${user?.first_name}`}
                  </h1>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-100 text-sm sm:text-base flex-1">
                      {isRTL ? 'مساحتك الشخصية لمتابعة أطفالك' : 'Votre espace personnel pour suivre vos enfants'}
                    </p>
                    {/* Bouton notifications - Mobile uniquement */}
                    <button
                      onClick={() => setShowNotifications(true)}
                      className="sm:hidden p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors shrink-0 relative"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Grille principale: Enfants + Rendez-vous */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Widget Enfants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-[400px]"
            >
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Baby className="w-5 h-5" />
                    {isRTL ? 'أطفالي' : 'Mes Enfants'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : children.length === 0 ? (
                    <div className="text-center py-8">
                      <Baby className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {isRTL ? 'لا يوجد أطفال مسجلين' : 'Aucun enfant enregistré'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Baby className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {child.first_name} {child.last_name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {child.enrollment_status === 'approved'
                                  ? (isRTL ? 'مقبول' : 'Approuvé')
                                  : child.enrollment_status === 'pending'
                                    ? (isRTL ? 'في الانتظار' : 'En attente')
                                    : (isRTL ? 'غير محدد' : 'Non défini')
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Widget Rendez-vous */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="h-[400px]"
            >
              <MyAppointmentsWidget
                key={appointmentKey}
                onRequestAppointment={() => setShowAppointmentModal(true)}
                onRescheduleAppointment={(appointment) => {
                  setSelectedAppointment(appointment);
                  setShowRescheduleModal(true);
                }}
              />
            </motion.div>
          </div>

        </div>

        {/* Centre de notifications */}
        <SimpleNotificationCenter
          isOpen={showNotifications}
          onClose={() => {
            setShowNotifications(false);
            loadUnreadCount(); // Rafraîchir le compteur après fermeture
          }}
        />

        {/* Modal demande rendez-vous */}
        <RequestAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={() => {
            dialog.success(isRTL ? 'تم إرسال طلب الموعد بنجاح' : 'Demande de rendez-vous envoyée avec succès');
            setAppointmentKey(prev => prev + 1); // Recharger le widget
          }}
        />

        {/* Modal replanification */}
        <RescheduleAppointmentModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSuccess={() => {
            setAppointmentKey(prev => prev + 1); // Recharger le widget
          }}
        />

        {/* Menu latéral sur grand écran, bouton flottant sur petit écran */}
        <div className="hidden lg:block">
          <SideMenu />
        </div>
        <div className="block lg:hidden">
          <FloatingActionButton />
        </div>
      </div>
    </div>
  );
};

export default MySpacePage;
