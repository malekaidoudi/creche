import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Baby,
  User,
  Bell,
  Home,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  MessageCircle,
  Stethoscope,
  Phone,
  ClipboardList,
  Pill,
  X,
  Receipt,
  Wallet,
  CheckCircle2,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import api from '../../services/api';
import { useProfileImage } from '../../hooks/useProfileImage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import WidgetCard, { WidgetEmptyState } from '../../components/ui/WidgetCard';
import SimpleNotificationCenter from '../../components/dashboard/SimpleNotificationCenter';
import MyAppointmentsWidget from '../../components/widgets/MyAppointmentsWidget';
import RequestAppointmentModal from '../../components/modals/RequestAppointmentModal';
import RescheduleAppointmentModal from '../../components/modals/RescheduleAppointmentModal';
import SideMenu from '../../components/ui/SideMenu';
import MobileParentSpace from '../../components/mobile/MobileParentSpace';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import { useDialogContext } from '../../contexts/DialogContext';
import NewsWidget from '../../components/NewsWidget';
import HolidaysList from '../../components/HolidaysList';
import TestimonialForm from '../../components/testimonials/TestimonialForm';
import ParentBirthdayBanner from '../../components/widgets/ParentBirthdayBanner';
import { getEmergencyContactDisplay } from '../../utils/emergencyContacts';
import PreInterviewPreparationModal from '../../components/modals/PreInterviewPreparationModal';
import enrollmentsService from '../../services/enrollmentsService';

// Cache mémoire pour affichage instantané lors du retour à l'espace parent
let cachedParentChildren = null;
let cachedParentAppointments = null;
let cachedParentUnreadCount = 0;
let cachedCanAddChild = true;

const MySpacePage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const dialog = useDialogContext();
  const { getImageUrl, hasImage } = useProfileImage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(() => cachedParentChildren === null);
  const [children, setChildren] = useState(() => cachedParentChildren || []);
  const [appointments, setAppointments] = useState(() => cachedParentAppointments || []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => cachedParentUnreadCount);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentKey, setAppointmentKey] = useState(0);
  const [canAddChild, setCanAddChild] = useState(() => cachedCanAddChild);

  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [selectedChildForModal, setSelectedChildForModal] = useState(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [myInvoices, setMyInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const [showPreparationModal, setShowPreparationModal] = useState(false);

  useEffect(() => {
    loadChildren();
    loadUnreadCount();
    loadAppointments();
    loadChildrenCount();
    loadParentInvoices();
    loadMyApplication();

    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMyApplication = async () => {
    try {
      const res = await enrollmentsService.getMyApplication();
      if (res?.success) {
        setMyApplication(res.application);
      }
    } catch (err) {
      console.log('Info candidature parent:', err.message);
    }
  };

  const loadParentInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const res = await api.get('/api/billing/my-invoices');
      if (res.data?.success) {
        setMyInvoices(res.data.invoices || []);
      }
    } catch (err) {
      console.log('Factures non disponibles pour le parent:', err.message);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleOpenReceipt = async (inv) => {
    try {
      const res = await api.get(`/api/billing/invoices/${inv.id}/receipt`, {
        responseType: 'blob'
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Erreur ouverture reçu:', err);
      dialog.error(isRTL ? 'تعذر فتح وصل الخلاص' : 'Impossible de consulter le reçu PDF');
    }
  };

  const loadChildrenCount = async () => {
    try {
      const response = await api.get('/api/children/my-count');
      if (response.data?.success) {
        cachedCanAddChild = response.data.canAddChild;
        setCanAddChild(response.data.canAddChild);
      }
    } catch (error) {
      console.error('Erreur chargement compteur enfants:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await api.get('/api/appointments/my');
      if (response.data?.success) {
        const list = response.data.appointments || [];
        cachedParentAppointments = list;
        setAppointments(list);
      }
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    }
  };

  const loadChildren = async () => {
    try {
      if (cachedParentChildren === null) {
        setLoading(true);
      }
      const response = await api.get('/api/user/children-summary');
      const result = response.data;
      if (result.success) {
        const list = result.children || [];
        cachedParentChildren = list;
        setChildren(list);
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
        const count = response.data.notifications?.length || 0;
        cachedParentUnreadCount = count;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Erreur chargement compteur notifications:', error);
    }
  };

  // Coordonnées résolues du contact d'urgence (father/mother → father_*/mother_*)
  const emergencyContactInfo = getEmergencyContactDisplay(selectedChildForModal);


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
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:hidden pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
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


          {/* Bandeau Anniversaires & Souvenirs (Parent Desktop) */}
          <ParentBirthdayBanner />

          {/* Bandeau Candidature & Préparation RDV Admission */}
          {myApplication && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 }}
              className="mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 text-white shadow-xl relative overflow-hidden"
            >
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>
                      {myApplication.proposed_date
                        ? (isRTL ? 'موعد القبول المحدد : ' : 'Votre rendez-vous d\'admission : ') +
                          new Date(myApplication.proposed_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : (isRTL ? 'طلب تسجيل قيد المتابعة' : 'Dossier d\'inscription en cours d\'examen')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">
                    {isRTL
                      ? `مرحباً بكم ! لنُحضّر معاً ملف ${myApplication.child_first_name}`
                      : `Bienvenue ! Préparons l'accueil de ${myApplication.child_first_name}`}
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                    {isRTL
                      ? 'لربح الوقت يوم الموعد : املأ معلومات الطبيب والأشخاص الموثوقين وصوّر الوثائق مباشرة من هاتفك.'
                      : 'Gagnez du temps le jour de votre rendez-vous : renseignez dès maintenant le pédiatre, vos personnes de confiance et les photos des documents.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
                  <Link
                    to="/mon-espace/activities"
                    className="flex-1 md:flex-none justify-center px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5"
                  >
                    <span>{isRTL ? 'أنشطة الروضة 🎨' : 'Découvrir la crèche 🎨'}</span>
                  </Link>
                  <button
                    onClick={() => setShowPreparationModal(true)}
                    className="flex-1 md:flex-none justify-center px-5 py-2.5 rounded-xl bg-white text-primary-700 hover:bg-blue-50 text-xs font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{isRTL ? 'تحضير الملف الآن' : 'Préparer mon rendez-vous'}</span>
                    <ChevronLeft className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bannière persistante: Contacts d'urgence & 2ème parent à compléter */}
          {user?.has_incomplete_contacts && (() => {
            const isMother = user?.gender === 'female';
            const incompleteChild = (children || []).find((c) => {
              const hasEmergency =
                ['father', 'mother'].includes(c.emergency_contact_choice) ||
                Boolean(c.emergency_contact_phone && String(c.emergency_contact_phone).trim() !== '');
              const hasSecondParent = isMother
                ? Boolean(c.father_name && String(c.father_name).trim() !== '')
                : Boolean(c.mother_name && String(c.mother_name).trim() !== '');
              return !hasEmergency || !hasSecondParent;
            });
            const targetChild = incompleteChild || (children && children.length > 0 ? children[0] : null);

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl text-white shadow-lg flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base leading-tight">
                      {isRTL
                        ? `إكمال بيانات الحماية والأمان${incompleteChild ? ` (${incompleteChild.first_name})` : ''}`
                        : `Contacts de sécurité à compléter${incompleteChild ? ` (${incompleteChild.first_name})` : ''}`}
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-100 mt-0.5">
                      {isRTL
                        ? 'لحماية طفلك، يرجى إدخال بيانات الوالد الثاني وجهة اتصال الطوارئ.'
                        : `Pour la sécurité de ${incompleteChild ? incompleteChild.first_name : 'votre enfant'}, veuillez renseigner le 2ème parent et le contact d'urgence.`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (targetChild) {
                      navigate(`/mon-espace/child/${targetChild.id}/emergency-contacts`);
                    } else {
                      navigate('/mon-espace/profile');
                    }
                  }}
                  className="px-4 py-2 bg-white text-orange-600 hover:bg-orange-50 active:scale-95 rounded-xl text-xs sm:text-sm font-bold shadow transition-all shrink-0"
                >
                  {isRTL ? 'إكمال الآن' : 'Compléter'}
                </button>
              </motion.div>
            );
          })()}

          {/* Bouton Témoignage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4"
          >
            <button
              onClick={() => setShowTestimonialForm(true)}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-lg">
                  {isRTL ? 'شاركنا رأيك' : 'Partagez votre avis'}
                </h3>
                <p className="text-purple-100 text-sm">
                  {isRTL ? 'ساعدنا على التحسين بتقييمك' : 'Aidez-nous à nous améliorer avec votre témoignage'}
                </p>
              </div>
              <ChevronLeft className={`w-6 h-6 ${isRTL ? '' : 'rotate-180'}`} />
            </button>
          </motion.div>

          {/* Liens rapides vers les rapports journaliers et traitements médicaux */}
          {children.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Link
                  to="/mon-espace/daily-reports"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl h-full"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">
                      {isRTL ? 'التقارير اليومية' : 'Rapports Journaliers'}
                    </h3>
                    <p className="text-green-100 text-sm">
                      {isRTL ? 'تابع يوم طفلك في الحضانة' : 'Suivez la journée de votre enfant à la crèche'}
                    </p>
                  </div>
                  <ChevronLeft className={`w-6 h-6 shrink-0 ${isRTL ? '' : 'rotate-180'}`} />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <Link
                  to="/mon-espace/treatments"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl h-full"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">
                      {isRTL ? 'العلاجات الطبية' : 'Traitements Médicaux'}
                    </h3>
                    <p className="text-purple-100 text-sm">
                      {isRTL ? 'إدارة الأدوية والعلاجات الموصوفة' : 'Gestion des médicaments et soins prescrits'}
                    </p>
                  </div>
                  <ChevronLeft className={`w-6 h-6 shrink-0 ${isRTL ? '' : 'rotate-180'}`} />
                </Link>
              </motion.div>
            </div>
          )}

          {/* Grille principale: Enfants + Rendez-vous */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Widget Enfants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-[400px]"
            >
              <WidgetCard
                icon={Baby}
                title={isRTL ? 'أطفالي' : 'Mes Enfants'}
                badge={children.length || null}
                iconColor="blue"
                loading={loading}
              >
                {children.length === 0 ? (
                  myApplication ? (
                    <div
                      onClick={() => setShowPreparationModal(true)}
                      className="p-3.5 rounded-xl bg-primary-50/70 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 flex items-center justify-between cursor-pointer hover:bg-primary-100/70 dark:hover:bg-primary-900/40 transition-all group"
                      title={isRTL ? 'إكمال تفاصيل الملف والمقابلة' : 'Compléter la fiche préparatoire'}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800/60 text-primary-600 dark:text-primary-300 flex items-center justify-center font-bold shrink-0">
                          {myApplication.child_first_name?.charAt(0) || '👶'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {myApplication.child_first_name} {myApplication.child_last_name}
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-xs text-primary-700 dark:text-primary-300 font-medium">
                            <span className="w-2 h-2 rounded-full bg-primary-600 animate-ping"></span>
                            {isRTL ? 'ملف قيد التحضير (موعد القبول)' : 'Dossier d\'inscription (RDV prévu)'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-primary-200 dark:border-primary-800 shadow-sm shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                        {isRTL ? 'إكمال الملف' : 'Préparer'}
                      </span>
                    </div>
                  ) : (
                    <WidgetEmptyState
                      icon={Baby}
                      message={isRTL ? 'لا يوجد أطفال مسجلين' : 'Aucun enfant enregistré'}
                    />
                  )
                ) : (
                  <div className="space-y-3">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => {
                          setSelectedChildForModal(child);
                          setShowChildModal(true);
                        }}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50/70 dark:hover:bg-gray-700 hover:border-primary-300 dark:hover:border-primary-600 border border-transparent transition-all cursor-pointer group flex items-center justify-between"
                        title={isRTL ? 'اضغط لعرض الخيارات' : 'Cliquer pour gérer la fiche et la santé'}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                              ['female', 'f', 'fille', 'girl'].includes(
                                String(child.gender || '').trim().toLowerCase()
                              )
                                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-500 dark:text-pink-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            <Baby className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {child.first_name} {child.last_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {child.age_display || (
                                child.enrollment_status === 'approved'
                                  ? (isRTL ? 'مقبول' : 'Inscrit')
                                  : child.enrollment_status === 'pending'
                                    ? (isRTL ? 'في الانتظار' : 'En attente')
                                    : (isRTL ? 'مسجل' : 'Inscrit')
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                          <span className="hidden sm:inline">{isRTL ? 'خيارات' : 'Gérer'}</span>
                          <ChevronLeft className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                        </div>
                      </div>
                    ))}
                    {/* Bouton Ajouter un enfant - caché si 3 enfants atteints */}
                    {canAddChild ? (
                      <Link
                        to="/mon-espace/ajouter-enfant"
                        className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">
                          {isRTL ? 'إضافة طفل جديد' : 'Ajouter un enfant'}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                        <span className="text-sm text-center">
                          {isRTL ? 'لقد وصلت إلى الحد الأقصى (3 أطفال)' : 'Limite atteinte (3 enfants max)'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </WidgetCard>
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

          {/* Widgets Nouveautés et Jours Fériés côte à côte */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Widget Nouveautés */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              id="news-widget"
              className="h-[400px]"
            >
              <NewsWidget />
            </motion.div>

            {/* Widget Jours Fériés à venir */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="h-[400px]"
            >
              <HolidaysList userRole="parent" />
            </motion.div>
          </div>

          {/* Section Cotisations & Reçus (si facturation active) */}
          {myInvoices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {isRTL ? 'اشتراكات أطفالي وإيصالات الدفع' : 'Mes Cotisations & Reçus de Paiement'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isRTL ? 'متابعة الدفع نقداً والإيصالات الرسمية المستلمة' : 'Suivi des mensualités et encaissements en espèces'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                    {myInvoices.length} {myInvoices.length > 1 ? (isRTL ? 'اشتراكات' : 'cotisations') : (isRTL ? 'اشتراك' : 'cotisation')}
                  </span>
                </div>

                {/* Cartes de cotisations (Regroupées par reçu / fratrie si applicable) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(() => {
                    const groups = [];
                    const processedIds = new Set();

                    myInvoices.forEach(inv => {
                      if (processedIds.has(inv.id)) return;

                      // Détecter si d'autres factures partagent le même reçu ou la même période
                      const siblings = myInvoices.filter(other => 
                        other.id !== inv.id &&
                        !processedIds.has(other.id) &&
                        (
                          (inv.receipt_number && other.receipt_number && other.receipt_number === inv.receipt_number) ||
                          (parseInt(other.period_month, 10) === parseInt(inv.period_month, 10) && parseInt(other.period_year, 10) === parseInt(inv.period_year, 10))
                        )
                      );

                      if (siblings.length > 0) {
                        const allFamily = [inv, ...siblings];
                        allFamily.forEach(f => processedIds.add(f.id));

                        const totalDueFamily = allFamily.reduce((sum, f) => sum + (parseFloat(f.amount_due ?? f.total_due ?? f.amount ?? 0) || 0), 0);
                        const totalPaidFamily = allFamily.reduce((sum, f) => sum + (parseFloat(f.amount_paid || 0) || 0), 0);
                        const isFamilyPaid = allFamily.every(f => f.status === 'paid' || (parseFloat(f.amount_paid || 0) >= parseFloat(f.total_due || 0) && parseFloat(f.total_due || 0) > 0));
                        const sharedReceipt = allFamily.find(f => f.receipt_number)?.receipt_number || inv.receipt_number;

                        groups.push({
                          type: 'family',
                          id: `family-${inv.period_year}-${inv.period_month}`,
                          period_month: inv.period_month,
                          period_year: inv.period_year,
                          receipt_number: sharedReceipt,
                          isPaid: isFamilyPaid,
                          totalDue: totalDueFamily,
                          totalPaid: totalPaidFamily,
                          invoices: allFamily,
                          primaryInvoice: inv
                        });
                      } else {
                        processedIds.add(inv.id);
                        const invDue = parseFloat(inv.amount_due ?? inv.total_due ?? inv.amount ?? 0) || 0;
                        const invPaid = parseFloat(inv.amount_paid || 0) || 0;
                        const isPaid = inv.status === 'paid' || (invPaid >= invDue && invDue > 0);

                        groups.push({
                          type: 'single',
                          id: inv.id,
                          period_month: inv.period_month,
                          period_year: inv.period_year,
                          receipt_number: inv.receipt_number,
                          isPaid,
                          totalDue: invDue,
                          totalPaid: invPaid,
                          invoices: [inv],
                          primaryInvoice: inv
                        });
                      }
                    });

                    return groups.map((group) => {
                      if (group.type === 'family') {
                        return (
                          <div
                            key={group.id}
                            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-800 flex flex-col justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                                    {isRTL ? 'اشتراك العائلة (إخوة)' : 'Cotisation Famille (Fratrie)'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                    👨‍👩‍👧‍👦 {group.invoices.length} {isRTL ? 'أطفال' : 'enfants'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {isRTL ? 'شهر' : 'Mois'} {group.period_month}/{group.period_year}
                                </p>
                              </div>
                              {group.isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {isRTL ? 'مدفوع' : 'Payé'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  <Wallet className="w-3.5 h-3.5" />
                                  {isRTL ? 'في انتظار الدفع' : 'À régler'}
                                </span>
                              )}
                            </div>

                            {/* Liste détaillée des enfants */}
                            <div className="space-y-1.5 py-2 border-y border-gray-200/60 dark:border-gray-700 text-xs">
                              {group.invoices.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                                  <span>
                                    • <strong className="text-gray-900 dark:text-white">{item.child_first_name} {item.child_last_name}</strong> ({item.care_schedule === 'half_day' ? (isRTL ? 'نصف يوم' : 'Demi-journée') : (isRTL ? 'Journée complète' : 'Journée complète')})
                                  </span>
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {(parseFloat(item.amount_due ?? item.total_due ?? item.amount ?? 0) || 0).toFixed(0)} DT
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Bas de carte : Un seul reçu familial, un seul bouton, total combiné */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1">
                              <div>
                                {group.receipt_number || group.isPaid ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {group.receipt_number && (
                                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                        N° Reçu: {group.receipt_number}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReceipt(group.primaryInvoice)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                                      title={isRTL ? 'معاينة وتنزيل الوصل العائلي الموحد' : 'Consulter et télécharger le reçu familial officiel'}
                                    >
                                      <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>{isRTL ? 'وصل الخلاص العائلي PDF' : 'Consulter le reçu PDF'}</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">
                                    {isRTL ? 'الدفع نقداً في مقر الروضة' : 'Paiement en espèces à la crèche'}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white sm:text-right">
                                <span className="text-xs font-normal text-gray-500 mr-1">{isRTL ? 'المجموع :' : 'Total :'}</span>
                                {group.totalDue.toFixed(0)} <span className="text-xs text-gray-400 font-normal">DT</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Enfant individuel
                      const inv = group.primaryInvoice;
                      return (
                        <div
                          key={inv.id}
                          className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/80 bg-gray-50/60 dark:bg-gray-750 flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {inv.child_first_name} {inv.child_last_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isRTL ? 'شهر' : 'Mois'} {inv.period_month}/{inv.period_year} • {inv.care_schedule === 'half_day' ? '🌤️ Demi-journée 13h' : '☀️ Journée complète'}
                              </p>
                            </div>
                            {group.isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isRTL ? 'مدفوع' : 'Payé'}
                              </span>
                            ) : inv.status === 'partial' || parseFloat(inv.amount_paid || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                <Clock className="w-3.5 h-3.5" />
                                {isRTL ? 'دفع جزئي' : 'Partiel'} ({parseFloat(inv.amount_paid).toFixed(0)}/{parseFloat(inv.total_due).toFixed(0)} DT)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                <Wallet className="w-3.5 h-3.5" />
                                {isRTL ? 'في انتظار الدفع' : 'À régler'}
                              </span>
                            )}
                          </div>

                          {parseFloat(inv.previous_arrears || 0) > 0 && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded flex justify-between">
                              <span>{isRTL ? 'يتضمن متخلدات من شهر سابق:' : 'Inclut report mois précédent :'}</span>
                              <span className="font-semibold">+{parseFloat(inv.previous_arrears).toFixed(0)} DT</span>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-gray-200/60 dark:border-gray-700 text-xs gap-2">
                            <div>
                              {inv.receipt_number || group.isPaid ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {inv.receipt_number && (
                                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                      N° Reçu: {inv.receipt_number}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReceipt(inv)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                                    title={isRTL ? 'معاينة وتنزيل الوصل الرسمي بصيغة PDF' : 'Consulter et télécharger le reçu officiel en PDF'}
                                  >
                                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>{isRTL ? 'وصل الخلاص PDF' : 'Consulter le reçu PDF'}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-500">
                                  {isRTL ? 'الدفع نقداً في مقر الروضة' : 'Paiement en espèces à la crèche'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white sm:text-right">
                              {group.totalDue.toFixed(0)} <span className="text-xs text-gray-400 font-normal">DT</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </motion.div>
          )}

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

        {/* Modal témoignage */}
        <TestimonialForm
          isOpen={showTestimonialForm}
          onClose={() => setShowTestimonialForm(false)}
          onSuccess={() => {
            dialog.success(isRTL ? 'تم إرسال تقييمك بنجاح!' : 'Votre témoignage a été envoyé avec succès !');
          }}
          userName={`${user?.first_name || ''} ${user?.last_name || ''}`}
        />

        {/* Modal Actions Enfant (Desktop) */}
        <AnimatePresence>
          {showChildModal && selectedChildForModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowChildModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <Baby className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {selectedChildForModal.first_name} {selectedChildForModal.last_name}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedChildForModal.age_display || (isRTL ? 'طفل مسجل' : 'Enfant inscrit')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChildModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 space-y-2">
                  {/* Fiche enfant */}
                  <button
                    onClick={() => {
                      setShowChildModal(false);
                      navigate(`/mon-espace/child/${selectedChildForModal.id}/details`);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors text-left rtl:text-right group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'بطاقة الطفل' : 'Fiche enfant'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? 'معلومات الطفل الكاملة' : 'Informations complètes de l\'enfant'}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Données médicales */}
                  <button
                    onClick={() => {
                      setShowChildModal(false);
                      navigate(`/mon-espace/child/${selectedChildForModal.id}/medical`);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 dark:hover:bg-gray-700/50 transition-colors text-left rtl:text-right group"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'البيانات الطبية' : 'Données médicales'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? 'الحساسية، الأدوية، والملف الصحي' : 'Allergies, médicaments et historique de santé'}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Contacts d'urgence */}
                  <button
                    onClick={() => {
                      setShowChildModal(false);
                      setShowEmergencyModal(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-orange-50 dark:hover:bg-gray-700/50 transition-colors text-left rtl:text-right group"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'جهات الاتصال في حالات الطوارئ' : 'Contacts d\'urgence'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? 'عرض جهات الاتصال والأطباء' : 'Voir les contacts et médecins'}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Rapports journaliers */}
                  <button
                    onClick={() => {
                      setShowChildModal(false);
                      navigate(`/mon-espace/daily-reports?child=${selectedChildForModal.id}`);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-teal-50 dark:hover:bg-gray-700/50 transition-colors text-left rtl:text-right group"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ClipboardList className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'التقارير اليومية' : 'Rapports journaliers'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? 'الوجبات، النوم، الحفاضات والملاحظات' : 'Repas, sommeil, activités et observations'}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowChildModal(false)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                  >
                    {isRTL ? 'إغلاق' : 'Fermer'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Contacts d'urgence (Desktop) */}
        <AnimatePresence>
          {showEmergencyModal && selectedChildForModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowEmergencyModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {isRTL ? 'جهات الاتصال في حالات الطوارئ' : 'Contacts d\'urgence'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChildForModal.first_name} {selectedChildForModal.last_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEmergencyModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Contenu */}
                <div className="p-5 space-y-4">
                  {/* Contact d'urgence principal */}
                  {(selectedChildForModal.emergency_contact_name || selectedChildForModal.emergency_contact_phone || ['father', 'mother'].includes(selectedChildForModal.emergency_contact_choice)) ? (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {isRTL ? 'جهة الاتصال الرئيسية' : 'Contact principal'}
                          </p>
                        </div>
                      </div>
                      {['father', 'mother'].includes(selectedChildForModal.emergency_contact_choice) && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                          <span className="font-medium">{isRTL ? 'جهة الاتصال:' : 'Contact :'}</span>{' '}
                          {selectedChildForModal.emergency_contact_choice === 'father'
                            ? (isRTL ? 'الأب' : 'Le Père')
                            : (isRTL ? 'الأم' : 'La Mère')}
                        </p>
                      )}
                      {emergencyContactInfo.name && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                          <span className="font-medium">{isRTL ? 'الاسم:' : 'Nom:'}</span> {emergencyContactInfo.name}
                        </p>
                      )}
                      {emergencyContactInfo.phone ? (
                        <a
                          href={`tel:${emergencyContactInfo.phone}`}
                          className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold text-sm hover:underline mt-1"
                        >
                          <Phone className="w-4 h-4" />
                          {emergencyContactInfo.phone}
                        </a>
                      ) : (
                        <p className="text-xs text-orange-500 dark:text-orange-400 italic mt-1">
                          {isRTL ? 'لم يتم إدخال رقم الهاتف بعد' : 'Numéro non renseigné — complétez-le depuis « Gérer les contacts »'}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Médecin traitant */}
                  {(selectedChildForModal.doctor_name || selectedChildForModal.doctor_phone) ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {isRTL ? 'الطبيب المعالج' : 'Médecin traitant'}
                          </p>
                        </div>
                      </div>
                      {selectedChildForModal.doctor_name && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                          <span className="font-medium">{isRTL ? 'الاسم:' : 'Nom:'}</span> {selectedChildForModal.doctor_name}
                        </p>
                      )}
                      {selectedChildForModal.doctor_phone && (
                        <a
                          href={`tel:${selectedChildForModal.doctor_phone}`}
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline mt-1"
                        >
                          <Phone className="w-4 h-4" />
                          {selectedChildForModal.doctor_phone}
                        </a>
                      )}
                    </div>
                  ) : null}

                  {/* Aucun contact si les deux sont vides */}
                  {!selectedChildForModal.emergency_contact_name && !selectedChildForModal.emergency_contact_phone && !['father', 'mother'].includes(selectedChildForModal.emergency_contact_choice) && !selectedChildForModal.doctor_name && !selectedChildForModal.doctor_phone && (
                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                      <Phone className="w-10 h-10 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        {isRTL ? 'لم يتم تسجيل جهات اتصال للطوارئ بعد.' : 'Aucun contact d\'urgence renseigné pour cet enfant.'}
                      </p>
                      <button
                        onClick={() => {
                          setShowEmergencyModal(false);
                          navigate(`/mon-espace/child/${selectedChildForModal.id}/emergency-contacts`);
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm transition-colors"
                      >
                        {isRTL ? 'إضافة جهة اتصال' : 'Ajouter un contact'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => {
                      setShowEmergencyModal(false);
                      navigate(`/mon-espace/child/${selectedChildForModal.id}/emergency-contacts`);
                    }}
                    className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors text-sm"
                  >
                    {isRTL ? 'إدارة جهات الاتصال' : 'Gérer les contacts'}
                  </button>
                  <button
                    onClick={() => setShowEmergencyModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors text-sm"
                  >
                    {isRTL ? 'إغلاق' : 'Fermer'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Modal de préparation du RDV pour le parent */}
          {myApplication && (
            <PreInterviewPreparationModal
              isOpen={showPreparationModal}
              onClose={() => setShowPreparationModal(false)}
              application={myApplication}
              onUpdated={loadMyApplication}
            />
          )}
        </AnimatePresence>

        {/* Menu latéral sur grand écran */}
        <div className="hidden lg:block">
          <SideMenu />
        </div>
      </div>
    </div>
  );
};

export default MySpacePage;
