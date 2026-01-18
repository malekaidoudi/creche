/**
 * MobileParentSpace - Espace parent optimisé mobile
 * 
 * Version mobile-first de la page "Mon Espace" pour les parents
 * avec accès rapide aux enfants, rendez-vous et notifications.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Baby,
    Bell,
    Calendar,
    Clock,
    ChevronRight,
    User,
    FileText,
    MessageCircle,
    AlertCircle,
    CheckCircle,
    Plus,
    CalendarPlus,
    X,
    Activity,
    Eye,
    Heart,
    Phone,
    Stethoscope,
    Pill,
    ClipboardList,
    PhoneCall,
    Image,
    CalendarX,
    UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useProfileImage } from '../../hooks/useProfileImage';
import MobileHeader from './MobileHeader';
import MobileCard from './MobileCard';
import MobileStatCard from './MobileStatCard';
import api from '../../services/api';
import API_CONFIG from '../../config/api';

// Fonction pour construire l'URL complète de la photo
const getChildPhotoUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    if (photoUrl.startsWith('blob:')) return photoUrl;
    if (photoUrl.startsWith('data:')) return photoUrl;
    return `${API_CONFIG.BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

const MobileParentSpace = ({
    children = [],
    appointments = [],
    unreadCount = 0,
    loading = false,
    onShowNotifications,
    onRequestAppointment,
    onRescheduleAppointment
}) => {
    const { user } = useAuth();
    const { isRTL } = useLanguage();
    const { getImageUrl, hasImage } = useProfileImage();
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [showChildModal, setShowChildModal] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [showHolidaysModal, setShowHolidaysModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [nurseryPhone, setNurseryPhone] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [news, setNews] = useState([]);
    const [feedbackForm, setFeedbackForm] = useState({ name: '', message: '', rating: 5 });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Charger le numéro de téléphone de la crèche et les jours fériés
    useEffect(() => {
        const loadNurseryPhone = async () => {
            try {
                const res = await api.get('/api/nursery-settings');
                if (res.data?.success && res.data.settings) {
                    const phone = res.data.settings.phone || res.data.settings.nursery_phone;
                    if (phone) setNurseryPhone(phone);
                }
            } catch (e) {
                // Ignorer les erreurs
            }
        };

        const loadHolidays = async () => {
            try {
                const res = await api.get('/api/holidays?effective=true');
                if (res.data?.holidays) {
                    // Filtrer pour ne garder que les jours fériés futurs
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const futureHolidays = res.data.holidays.filter(h => new Date(h.date) >= today);
                    setHolidays(futureHolidays);
                }
            } catch (e) {
                console.error('Erreur chargement jours fériés:', e);
            }
        };

        const loadNews = async () => {
            try {
                const res = await api.get('/api/announcements?limit=5');
                if (res.data?.announcements) {
                    setNews(res.data.announcements);
                }
            } catch (e) {
                // Ignorer les erreurs
            }
        };
        loadNurseryPhone();
        loadHolidays();
        loadNews();
    }, []);

    // Soumettre un témoignage
    const handleSubmitFeedback = async () => {
        if (!feedbackForm.message.trim()) return;

        setSubmittingFeedback(true);
        try {
            await api.post('/api/testimonials', {
                name: feedbackForm.name || user?.first_name || 'Parent',
                message: feedbackForm.message,
                rating: feedbackForm.rating
            });
            setShowFeedbackModal(false);
            setFeedbackForm({ name: '', message: '', rating: 5 });
            // Toast de succès si disponible
        } catch (e) {
            console.error('Erreur soumission témoignage:', e);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    // Scroll vers le haut au chargement
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Gérer le clic sur un RDV
    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
        if (appointment.status === 'confirmed' || appointment.status === 'completed') {
            setShowDetailModal(true);
        } else {
            // pending, proposed, rescheduled -> proposer autre date
            setShowRescheduleModal(true);
        }
    };

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting(isRTL ? 'صباح الخير' : 'Bonjour');
        } else if (hour < 18) {
            setGreeting(isRTL ? 'مساء الخير' : 'Bon après-midi');
        } else {
            setGreeting(isRTL ? 'مساء الخير' : 'Bonsoir');
        }
    }, [isRTL]);

    // Actions rapides pour parent (alignées avec l'app mobile)
    const quickActions = [
        {
            icon: Image,
            label: isRTL ? 'الأنشطة' : 'Activités',
            path: '/mon-espace/activities',
            color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
        },
        {
            icon: UserCheck,
            label: isRTL ? 'الحضور' : 'Présence',
            path: '/mon-espace/attendance',
            color: 'bg-green-100 dark:bg-green-900/30 text-green-600'
        },
        {
            icon: MessageCircle,
            label: isRTL ? 'رسائل' : 'Messages',
            path: '/mon-espace/messages',
            color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
        },
        {
            icon: Pill,
            label: isRTL ? 'العلاجات' : 'Médicament',
            path: '/mon-espace/treatments',
            color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
        }
    ];

    // Fonction pour appeler la crèche
    const handleCallNursery = () => {
        if (nurseryPhone) {
            window.location.href = `tel:${nurseryPhone.replace(/\s/g, '')}`;
        }
    };

    // Obtenir le statut de présence d'un enfant
    const getPresenceStatus = (child) => {
        if (child.status === 'present' || child.is_present) {
            return { text: isRTL ? 'حاضر' : 'Présent', color: 'green', icon: CheckCircle };
        }
        if (child.status === 'absent' || child.is_absent) {
            return { text: isRTL ? 'غائب' : 'Absent', color: 'red', icon: AlertCircle };
        }
        return { text: isRTL ? 'في الانتظار' : 'En attente', color: 'orange', icon: Clock };
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
            case 'enrolled':
                return { text: isRTL ? 'مسجل' : 'Inscrit', color: 'green' };
            case 'pending':
                return { text: isRTL ? 'في الانتظار' : 'En attente', color: 'orange' };
            default:
                return { text: status, color: 'gray' };
        }
    };

    const getAppointmentStatus = (appointment) => {
        if (appointment.status === 'pending') {
            return { text: isRTL ? 'في الانتظار' : 'En attente', color: 'orange' };
        }
        if (appointment.status === 'confirmed') {
            return { text: isRTL ? 'مؤكد' : 'Confirmé', color: 'green' };
        }
        return { text: appointment.status, color: 'gray' };
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header avec photo profil */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 pt-safe-top">
                <div className="px-4 pt-4 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden flex items-center justify-center">
                                {hasImage() ? (
                                    <img
                                        src={getImageUrl()}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-6 h-6 text-white" />
                                )}
                            </div>
                            <div>
                                <p className="text-blue-100 text-sm">{greeting}</p>
                                <h1 className="text-xl font-bold text-white">
                                    {user?.first_name}
                                </h1>
                            </div>
                        </div>

                        {/* Notification button */}
                        <button
                            onClick={onShowNotifications}
                            className="relative p-2.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        >
                            <Bell className="w-5 h-5 text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Date du jour */}
                    <p className="text-blue-100 text-sm">
                        {new Date().toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            <motion.div
                className="px-4 -mt-4 space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Actions rapides */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg"
                >
                    <div className="grid grid-cols-4 gap-3">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => navigate(action.path)}
                                    className="flex flex-col items-center gap-2 p-2 rounded-xl active:scale-95 transition-transform"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium text-center">
                                        {action.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Bouton Appeler la crèche */}
                {nurseryPhone && (
                    <motion.div variants={itemVariants}>
                        <button
                            onClick={handleCallNursery}
                            className="w-full flex items-center gap-4 p-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl shadow-lg active:scale-[0.98] transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <PhoneCall className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-white font-semibold">
                                    {isRTL ? 'اتصل بالحضانة' : 'Appeler la crèche'}
                                </p>
                                <p className="text-emerald-100 text-sm">{nurseryPhone}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/70" />
                        </button>
                    </motion.div>
                )}

                {/* Lien Rapports Journaliers */}
                {children.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <button
                            onClick={() => navigate('/mon-espace/daily-reports')}
                            className="w-full flex items-center gap-4 p-4 bg-teal-500 hover:bg-teal-600 rounded-2xl shadow-lg active:scale-[0.98] transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-white font-semibold">
                                    {isRTL ? 'التقارير اليومية' : 'Rapports Journaliers'}
                                </p>
                                <p className="text-teal-100 text-sm">
                                    {isRTL ? 'تابع يوم طفلك' : 'Suivez la journée de votre enfant'}
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/70" />
                        </button>
                    </motion.div>
                )}

                {/* Mes Enfants */}
                <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Baby className="w-5 h-5 text-blue-600" />
                            {isRTL ? 'أطفالي' : 'Mes enfants'}
                        </h2>
                        <button
                            onClick={() => navigate('/mon-espace/children')}
                            className="text-sm text-primary-600 dark:text-primary-400 font-medium"
                        >
                            {isRTL ? 'عرض الكل' : 'Voir tout'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : children.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                            <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">
                                {isRTL ? 'لا يوجد أطفال مسجلين' : 'Aucun enfant inscrit'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {children.map((child) => {
                                const presenceStatus = getPresenceStatus(child);
                                const PresenceIcon = presenceStatus.icon;
                                const presenceColors = {
                                    green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
                                    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
                                    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
                                };
                                return (
                                    <div
                                        key={child.id}
                                        onClick={() => {
                                            setSelectedChild(child);
                                            setShowChildModal(true);
                                        }}
                                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                                    >
                                        {/* Photo ou initiales */}
                                        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {getChildPhotoUrl(child.photo_url) ? (
                                                <img src={getChildPhotoUrl(child.photo_url)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                {child.first_name} {child.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {child.group_name || child.age_display || (isRTL ? 'مسجل' : 'Inscrit')}
                                            </p>
                                        </div>
                                        {/* Badge statut présence */}
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${presenceColors[presenceStatus.color]}`}>
                                            <PresenceIcon className="w-4 h-4" />
                                            <span className="text-xs font-medium">{presenceStatus.text}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Mes Rendez-vous */}
                <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            {isRTL ? 'مواعيدي' : 'Mes rendez-vous'}
                        </h2>
                        <button
                            onClick={onRequestAppointment}
                            className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            {isRTL ? 'طلب' : 'Demander'}
                        </button>
                    </div>

                    {(() => {
                        // Filtrer les RDV à venir uniquement
                        const upcomingAppointments = appointments.filter(apt => {
                            const dateStr = apt.confirmed_date || apt.proposed_date;
                            if (!dateStr) return false;
                            return new Date(dateStr) >= new Date();
                        });

                        if (upcomingAppointments.length === 0) {
                            return (
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
                                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                        {isRTL ? 'لا توجد مواعيد قادمة' : 'Aucun rendez-vous à venir'}
                                    </p>
                                    <button
                                        onClick={onRequestAppointment}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                                    >
                                        <CalendarPlus className="w-4 h-4" />
                                        {isRTL ? 'طلب موعد' : 'Demander un rendez-vous'}
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-3">
                                {upcomingAppointments.slice(0, 3).map((appointment) => (
                                    <MobileCard
                                        key={appointment.id}
                                        title={appointment.subject || appointment.title || appointment.purpose || (isRTL ? 'موعد' : 'Rendez-vous')}
                                        subtitle={(() => {
                                            const dateStr = appointment.confirmed_date || appointment.proposed_date;
                                            if (!dateStr) return isRTL ? 'غير محدد' : 'Date non définie';
                                            try {
                                                return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });
                                            } catch (e) {
                                                return isRTL ? 'غير محدد' : 'Date non définie';
                                            }
                                        })()}
                                        icon={Calendar}
                                        iconColor="purple"
                                        badge={getAppointmentStatus(appointment)}
                                        onClick={() => handleAppointmentClick(appointment)}
                                    />
                                ))}
                                {upcomingAppointments.length > 3 && (
                                    <button
                                        onClick={() => navigate('/mon-espace/calendar')}
                                        className="w-full py-3 text-center text-sm text-primary-600 dark:text-primary-400 font-medium"
                                    >
                                        {isRTL ? `عرض الكل (${upcomingAppointments.length})` : `Voir tout (${upcomingAppointments.length})`}
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                </motion.div>

                {/* Section Autres - Liens rapides */}
                <motion.div variants={itemVariants}>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {isRTL ? 'آخر' : 'Autres'}
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                        {/* Jours de fermeture */}
                        <button
                            onClick={() => setShowHolidaysModal(true)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                                <CalendarX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                                {isRTL ? 'أيام الإغلاق' : 'Jours de fermeture'}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

                        {/* Partagez votre avis */}
                        <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                                {isRTL ? 'شارك رأيك' : 'Partagez votre avis'}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

                        {/* Nouveauté */}
                        <button
                            onClick={() => setShowNewsModal(true)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                                {isRTL ? 'الجديد' : 'Nouveauté'}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </motion.div>

            </motion.div>

            {/* Modal Détails RDV (confirmé) */}
            <AnimatePresence>
                {showDetailModal && selectedAppointment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowDetailModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">
                                                {isRTL ? 'تفاصيل الموعد' : 'Détails du rendez-vous'}
                                            </h3>
                                            <span className="text-xs text-green-600 font-medium">
                                                {isRTL ? 'مؤكد' : 'Confirmé'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenu */}
                            <div className="p-5 space-y-4">
                                {/* Objet */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {isRTL ? 'الموضوع' : 'Objet'}
                                    </label>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                        {selectedAppointment.subject || selectedAppointment.title || selectedAppointment.purpose || (isRTL ? 'موعد' : 'Rendez-vous')}
                                    </p>
                                </div>

                                {/* Date et heure */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {isRTL ? 'التاريخ والوقت' : 'Date et heure'}
                                    </label>
                                    <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {(() => {
                                            const dateStr = selectedAppointment.confirmed_date || selectedAppointment.proposed_date;
                                            if (!dateStr) return isRTL ? 'غير محدد' : 'Non défini';
                                            return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                        })()}
                                    </p>
                                </div>

                                {/* Notes */}
                                {selectedAppointment.notes && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            {isRTL ? 'ملاحظات' : 'Notes'}
                                        </label>
                                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                                            {selectedAppointment.notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Proposer autre date (non confirmé) */}
            <AnimatePresence>
                {showRescheduleModal && selectedAppointment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowRescheduleModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">
                                                {isRTL ? 'موعد في الانتظار' : 'Rendez-vous en attente'}
                                            </h3>
                                            <span className="text-xs text-orange-600 font-medium">
                                                {isRTL ? 'في انتظار التأكيد' : 'En attente de confirmation'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowRescheduleModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenu */}
                            <div className="p-5 space-y-4">
                                {/* Objet */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {isRTL ? 'الموضوع' : 'Objet'}
                                    </label>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                        {selectedAppointment.subject || selectedAppointment.title || selectedAppointment.purpose || (isRTL ? 'موعد' : 'Rendez-vous')}
                                    </p>
                                </div>

                                {/* Date proposée */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {isRTL ? 'التاريخ المقترح' : 'Date proposée'}
                                    </label>
                                    <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {(() => {
                                            const dateStr = selectedAppointment.proposed_date;
                                            if (!dateStr) return isRTL ? 'غير محدد' : 'Non défini';
                                            return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                        })()}
                                    </p>
                                </div>

                                {/* Message info */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        {isRTL
                                            ? 'يمكنك تأكيد هذا الموعد أو اقتراح تاريخ آخر يناسبك.'
                                            : 'Vous pouvez confirmer ce rendez-vous ou proposer une autre date qui vous convient.'}
                                    </p>
                                </div>
                            </div>

                            {/* Footer avec boutons */}
                            <div className="p-5 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                <button
                                    onClick={() => {
                                        setShowRescheduleModal(false);
                                        onRescheduleAppointment?.(selectedAppointment);
                                    }}
                                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'اقتراح تاريخ آخر' : 'Proposer une autre date'}
                                </button>
                                <button
                                    onClick={() => setShowRescheduleModal(false)}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Actions Enfant */}
            <AnimatePresence>
                {showChildModal && selectedChild && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
                        onClick={() => setShowChildModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                            <Baby className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">
                                                {selectedChild.first_name} {selectedChild.last_name}
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                {selectedChild.parent_name || selectedChild.age_display || (isRTL ? 'طفل' : 'Enfant')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowChildModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 space-y-2">
                                {/* Fiche enfant */}
                                <button
                                    onClick={() => {
                                        setShowChildModal(false);
                                        navigate(`/mon-espace/child/${selectedChild.id}/details`);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {isRTL ? 'بطاقة الطفل' : 'Fiche enfant'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {isRTL ? 'معلومات الطفل الكاملة' : 'Informations complètes de l\'enfant'}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>

                                {/* Données médicales */}
                                <button
                                    onClick={() => {
                                        setShowChildModal(false);
                                        navigate(`/mon-espace/child/${selectedChild.id}/medical`);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <Stethoscope className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {isRTL ? 'البيانات الطبية' : 'Données médicales'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {isRTL ? 'الحساسية والأدوية' : 'Allergies, médicaments, etc.'}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>

                                {/* Contacts d'urgence */}
                                <button
                                    onClick={() => {
                                        setShowChildModal(false);
                                        setShowEmergencyModal(true);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {isRTL ? 'جهات الاتصال في حالات الطوارئ' : 'Contacts d\'urgence'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {isRTL ? 'عرض جهات الاتصال' : 'Voir les contacts'}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>

                                {/* Rapports journaliers */}
                                <button
                                    onClick={() => {
                                        setShowChildModal(false);
                                        navigate(`/mon-espace/daily-reports?child=${selectedChild.id}`);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                        <ClipboardList className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {isRTL ? 'التقارير اليومية' : 'Rapports journaliers'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {isRTL ? 'الوجبات، النوم، الحفاضات...' : 'Repas, sieste, couches...'}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Fermer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowChildModal(false)}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Contacts d'urgence */}
            <AnimatePresence>
                {showEmergencyModal && selectedChild && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
                        onClick={() => setShowEmergencyModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[80vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {isRTL ? 'جهات الاتصال في حالات الطوارئ' : 'Contacts d\'urgence'}
                                    </h3>
                                    <button
                                        onClick={() => setShowEmergencyModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedChild.first_name} {selectedChild.last_name}
                                </p>
                            </div>

                            {/* Contenu */}
                            <div className="p-4 space-y-4">
                                {/* Contact d'urgence principal */}
                                {(selectedChild.emergency_contact_name || selectedChild.emergency_contact_phone) && (
                                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                                                <Phone className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {isRTL ? 'جهة الاتصال الرئيسية' : 'Contact principal'}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedChild.emergency_contact_name && (
                                            <p className="text-gray-700 dark:text-gray-300 mb-1">
                                                <span className="font-medium">{isRTL ? 'الاسم:' : 'Nom:'}</span> {selectedChild.emergency_contact_name}
                                            </p>
                                        )}
                                        {selectedChild.emergency_contact_phone && (
                                            <a
                                                href={`tel:${selectedChild.emergency_contact_phone}`}
                                                className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium"
                                            >
                                                <Phone className="w-4 h-4" />
                                                {selectedChild.emergency_contact_phone}
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Médecin traitant */}
                                {(selectedChild.doctor_name || selectedChild.doctor_phone) && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                <Stethoscope className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {isRTL ? 'الطبيب المعالج' : 'Médecin traitant'}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedChild.doctor_name && (
                                            <p className="text-gray-700 dark:text-gray-300 mb-1">
                                                <span className="font-medium">{isRTL ? 'الاسم:' : 'Nom:'}</span> {selectedChild.doctor_name}
                                            </p>
                                        )}
                                        {selectedChild.doctor_phone && (
                                            <a
                                                href={`tel:${selectedChild.doctor_phone}`}
                                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium"
                                            >
                                                <Phone className="w-4 h-4" />
                                                {selectedChild.doctor_phone}
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Message si aucun contact */}
                                {!selectedChild.emergency_contact_name && !selectedChild.emergency_contact_phone && !selectedChild.doctor_name && !selectedChild.doctor_phone && (
                                    <div className="text-center py-8">
                                        <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {isRTL ? 'لا توجد جهات اتصال مسجلة' : 'Aucun contact d\'urgence enregistré'}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setShowEmergencyModal(false);
                                                navigate(`/mon-espace/child/${selectedChild.id}/emergency-contacts`);
                                            }}
                                            className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                                        >
                                            {isRTL ? 'إضافة جهة اتصال' : 'Ajouter un contact'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Bouton fermer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowEmergencyModal(false)}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Jours de fermeture */}
            <AnimatePresence>
                {showHolidaysModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
                        onClick={() => setShowHolidaysModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[80vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                                            <CalendarX className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {isRTL ? 'أيام الإغلاق' : 'Jours de fermeture'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowHolidaysModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Liste des jours fériés */}
                            <div className="p-4 overflow-y-auto max-h-[60vh]">
                                {holidays.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CalendarX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {isRTL ? 'لا توجد أيام إغلاق مسجلة' : 'Aucun jour de fermeture enregistré'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {holidays.map((holiday, index) => (
                                            <div
                                                key={holiday.id || index}
                                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex flex-col items-center justify-center">
                                                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                        {new Date(holiday.date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { month: 'short' })}
                                                    </span>
                                                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                        {new Date(holiday.date).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {holiday.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(holiday.date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bouton fermer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowHolidaysModal(false)}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Partagez votre avis (Témoignages) */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
                        onClick={() => setShowFeedbackModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                                            <MessageCircle className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {isRTL ? 'شارك رأيك' : 'Partagez votre avis'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowFeedbackModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Formulaire */}
                            <div className="p-4 space-y-4">
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {isRTL ? 'نحن نقدر رأيك! شاركنا تجربتك مع حضانتنا.' : 'Nous apprécions votre avis ! Partagez votre expérience avec notre crèche.'}
                                </p>

                                {/* Nom */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'الاسم (اختياري)' : 'Nom (optionnel)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={feedbackForm.name}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                                        placeholder={user?.first_name || (isRTL ? 'اسمك' : 'Votre nom')}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                    />
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'التقييم' : 'Note'}
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                                                className={`text-2xl transition-colors ${star <= feedbackForm.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'رسالتك' : 'Votre message'}
                                    </label>
                                    <textarea
                                        value={feedbackForm.message}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                                        placeholder={isRTL ? 'شاركنا تجربتك...' : 'Partagez votre expérience...'}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Boutons */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                                <button
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                </button>
                                <button
                                    onClick={handleSubmitFeedback}
                                    disabled={!feedbackForm.message.trim() || submittingFeedback}
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                                >
                                    {submittingFeedback ? (isRTL ? 'جاري الإرسال...' : 'Envoi...') : (isRTL ? 'إرسال' : 'Envoyer')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Nouveauté */}
            <AnimatePresence>
                {showNewsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
                        onClick={() => setShowNewsModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[80vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {isRTL ? 'الجديد' : 'Nouveautés'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowNewsModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Liste des nouveautés */}
                            <div className="p-4 overflow-y-auto max-h-[60vh]">
                                {news.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {isRTL ? 'لا توجد أخبار جديدة' : 'Aucune nouveauté pour le moment'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {news.map((item, index) => (
                                            <div
                                                key={item.id || index}
                                                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                            {item.content || item.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                            {new Date(item.created_at).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bouton fermer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowNewsModal(false)}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileParentSpace;
