/**
 * MobileParentSpace - Espace parent optimisé mobile
 * 
 * Version mobile-first de la page "Mon Espace" pour les parents
 * avec accès rapide aux enfants, rendez-vous et notifications.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    Phone,
    Stethoscope,
    Pill,
    ClipboardList,
    PhoneCall,
    Image
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useProfileImage } from '../../hooks/useProfileImage';
import MobileHeader from './MobileHeader';
import MobileCard from './MobileCard';
import MobileStatCard from './MobileStatCard';
import api from '../../services/api';
import API_CONFIG from '../../config/api';
import { getEmergencyContactDisplay } from '../../utils/emergencyContacts';
import ParentBirthdayBanner from '../widgets/ParentBirthdayBanner';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const [greeting, setGreeting] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [showChildModal, setShowChildModal] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [nurseryPhone, setNurseryPhone] = useState(null);

    // Ouverture automatique du menu enfant si demandé dans l'URL (ex: retour depuis Fiche enfant, Médical, etc.)
    useEffect(() => {
        const openChildId = searchParams.get('openChild');
        if (openChildId && children && children.length > 0) {
            const found = children.find(c => String(c.id) === String(openChildId) || String(c.child_id) === String(openChildId));
            if (found) {
                setSelectedChild(found);
                setShowChildModal(true);
            }
        }
    }, [searchParams, children]);

    const handleCloseChildModal = () => {
        setShowChildModal(false);
        if (searchParams.get('openChild')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('openChild');
            setSearchParams(nextParams, { replace: true });
        }
    };

    // Charger le numéro de téléphone de la crèche
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
        loadNurseryPhone();
    }, []);

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

    // Actions rapides pour parent (Activité, Messages, Bilan, Médicament)
    const quickActions = [
        {
            icon: Image,
            label: isRTL ? 'الأنشطة' : 'Activité',
            path: '/mon-espace/activities',
            color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
        },
        {
            icon: MessageCircle,
            label: isRTL ? 'رسائل' : 'Messages',
            path: '/mon-espace/messages',
            color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
        },
        {
            icon: ClipboardList,
            label: isRTL ? 'التقارير' : 'Rapports',
            path: '/mon-espace/daily-reports',
            color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
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

    // Coordonnées résolues du contact d'urgence (father/mother → father_*/mother_*)
    const emergencyContactInfo = getEmergencyContactDisplay(selectedChild);

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
                {/* Bandeau Anniversaires & Souvenirs (Parent Mobile) */}
                <ParentBirthdayBanner compact />

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
                            variants={itemVariants}
                            className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg flex items-start gap-3.5"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm leading-tight">
                                    {isRTL
                                        ? `إكمال ملف الأمان والحماية${incompleteChild ? ` (${incompleteChild.first_name})` : ''}`
                                        : `Contacts de sécurité à compléter${incompleteChild ? ` (${incompleteChild.first_name})` : ''}`}
                                </h4>
                                <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                                    {isRTL
                                        ? 'لحماية طفلك، يرجى إدخال بيانات الوالد الثاني وجهة اتصال الطوارئ.'
                                        : `Pour la sécurité de ${incompleteChild ? incompleteChild.first_name : 'votre enfant'}, veuillez renseigner le 2ème parent et le contact d'urgence.`}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (targetChild) {
                                            navigate(`/mon-espace/child/${targetChild.id}/emergency-contacts`);
                                        } else {
                                            navigate('/mon-espace/profile');
                                        }
                                    }}
                                    className="mt-2.5 px-3.5 py-1.5 bg-white text-orange-600 rounded-xl text-xs font-bold shadow hover:bg-orange-50 transition-all inline-flex items-center gap-1.5 active:scale-95"
                                >
                                    <span>{isRTL ? 'إكمال الآن' : 'Compléter maintenant'}</span>
                                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })()}

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
                                        {/* Photo ou icône bébé (rose fille / bleu garçon) */}
                                        <div
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${['female', 'f', 'fille', 'girl'].includes(String(child.gender || '').trim().toLowerCase())
                                                    ? 'bg-pink-100 text-pink-500 dark:bg-pink-900/40 dark:text-pink-400'
                                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                                }`}
                                        >
                                            {getChildPhotoUrl(child.photo_url) ? (
                                                <img
                                                    src={getChildPhotoUrl(child.photo_url)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <Baby className="w-7 h-7" />
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

            </motion.div>

            {/* Modal Détails RDV (confirmé) */}
            <AnimatePresence>
                {showDetailModal && selectedAppointment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50"
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
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50"
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

            {/* Modal Actions Enfant (Monté sur document.body via Portal) */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showChildModal && selectedChild && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs"
                            onClick={handleCloseChildModal}
                        >
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[85vh] flex flex-col"
                                onClick={e => e.stopPropagation()}
                            >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
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
                                        onClick={handleCloseChildModal}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 space-y-2 overflow-y-auto flex-1">
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
                            <div className="p-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] border-t border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800">
                                <button
                                    onClick={handleCloseChildModal}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        )}

        {/* Modal Contacts d'urgence (Monté sur document.body via Portal) */}
        {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
                {showEmergencyModal && selectedChild && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs"
                        onClick={() => setShowEmergencyModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[85vh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800">
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
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {selectedChild.first_name} {selectedChild.last_name}
                                </p>
                            </div>

                            {/* Contenu */}
                            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                                {/* Contact d'urgence principal */}
                                {(selectedChild.emergency_contact_name || selectedChild.emergency_contact_phone || ['father', 'mother'].includes(selectedChild.emergency_contact_choice)) && (
                                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3.5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                                                <Phone className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {isRTL ? 'جهة الاتصال الرئيسية' : 'Contact principal'}
                                                </p>
                                            </div>
                                        </div>
                                        {['father', 'mother'].includes(selectedChild.emergency_contact_choice) && (
                                            <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                                                <span className="font-medium">{isRTL ? 'جهة الاتصال:' : 'Contact :'}</span>{' '}
                                                {selectedChild.emergency_contact_choice === 'father'
                                                    ? (isRTL ? 'الأب' : 'Le Père')
                                                    : (isRTL ? 'الأم' : 'La Mère')}
                                            </p>
                                        )}
                                        {emergencyContactInfo.name && (
                                            <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                                                <span className="font-medium">{isRTL ? 'الاسم:' : 'Nom:'}</span> {emergencyContactInfo.name}
                                            </p>
                                        )}
                                        {emergencyContactInfo.phone ? (
                                            <a
                                                href={`tel:${emergencyContactInfo.phone}`}
                                                className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold text-xs"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                                {emergencyContactInfo.phone}
                                            </a>
                                        ) : (
                                            <p className="text-[11px] text-orange-500 dark:text-orange-400 italic mt-1">
                                                {isRTL ? 'لم يتم إدخال رقم الهاتف بعد' : 'Numéro non renseigné — complétez-le depuis « Gérer les contacts »'}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Médecin traitant */}
                                {(selectedChild.doctor_name || selectedChild.doctor_phone) && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3.5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                                <Stethoscope className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {isRTL ? 'الطبيب المعالج' : 'Médecin traitant'}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedChild.doctor_name && (
                                            <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                                                <span className="font-medium">{isRTL ? 'الاسم:' : 'Nom:'}</span> {selectedChild.doctor_name}
                                            </p>
                                        )}
                                        {selectedChild.doctor_phone && (
                                            <a
                                                href={`tel:${selectedChild.doctor_phone}`}
                                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                                {selectedChild.doctor_phone}
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Message si aucun contact */}
                                {!selectedChild.emergency_contact_name && !selectedChild.emergency_contact_phone && !['father', 'mother'].includes(selectedChild.emergency_contact_choice) && !selectedChild.doctor_name && !selectedChild.doctor_phone && (
                                    <div className="text-center py-4">
                                        <Phone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                            {isRTL ? 'لا توجد جهات اتصال مسجلة' : 'Aucun contact d\'urgence enregistré'}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setShowEmergencyModal(false);
                                                navigate(`/mon-espace/child/${selectedChild.id}/emergency-contacts`);
                                            }}
                                            className="mt-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                                        >
                                            {isRTL ? 'إضافة جهة اتصال' : 'Ajouter un contact'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Boutons gérer / fermer */}
                            <div className="p-3.5 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] border-t border-gray-200 dark:border-gray-700 flex gap-2 shrink-0 bg-white dark:bg-gray-800">
                                <button
                                    onClick={() => {
                                        setShowEmergencyModal(false);
                                        navigate(`/mon-espace/child/${selectedChild.id}/emergency-contacts`);
                                    }}
                                    className="flex-1 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
                                >
                                    {isRTL ? 'إدارة جهات الاتصال' : 'Gérer les contacts'}
                                </button>
                                <button
                                    onClick={() => setShowEmergencyModal(false)}
                                    className="flex-1 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        )}
        </div>
    );
};

export default MobileParentSpace;
