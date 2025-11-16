import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Baby,
  User,
  Bell
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { useProfileImage } from '../../hooks/useProfileImage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import HolidaysList from '../../components/HolidaysList';
import SimpleNotificationCenter from '../../components/dashboard/SimpleNotificationCenter';
import MyAppointmentsWidget from '../../components/widgets/MyAppointmentsWidget';
import RequestAppointmentModal from '../../components/modals/RequestAppointmentModal';
import RescheduleAppointmentModal from '../../components/modals/RescheduleAppointmentModal';
import SideMenu from '../../components/ui/SideMenu';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import toast from 'react-hot-toast';

const MySpacePage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { getImageUrl, hasImage } = useProfileImage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentKey, setAppointmentKey] = useState(0);

  useEffect(() => {
    loadChildren();
    loadUnreadCount();

    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement');
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


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* En-tête de bienvenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white relative">
            {/* Bouton notifications en haut à droite */}
            <button
              onClick={() => setShowNotifications(true)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {hasImage() ? (
                  <img
                    src={getImageUrl()}
                    alt="Photo de profil"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {isRTL ? `مرحباً ${user?.first_name}` : `Bienvenue ${user?.first_name}`}
                </h1>
                <p className="text-blue-100">
                  {isRTL ? 'مساحتك الشخصية لمتابعة أطفالك' : 'Votre espace personnel pour suivre vos enfants'}
                </p>
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

        {/* Liste des jours fériés et vacances */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <HolidaysList userRole="parent" />
        </motion.div>
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
          toast.success(isRTL ? 'تم إرسال طلب الموعد بنجاح' : 'Demande de rendez-vous envoyée avec succès');
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
  );
};

export default MySpacePage;
