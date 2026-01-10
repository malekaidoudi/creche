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
    Stethoscope
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useProfileImage } from '../../hooks/useProfileImage';
import MobileHeader from './MobileHeader';
import MobileCard from './MobileCard';
import MobileStatCard from './MobileStatCard';
import api from '../../services/api';

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

    // Actions rapides pour parent (Activité, Calendrier, Message, Absence)
    const quickActions = [
        {
            icon: FileText,
            label: isRTL ? 'الأنشطة' : 'Activités',
            path: '/mon-espace/activities',
            color: 'bg-green-100 dark:bg-green-900/30 text-green-600'
        },
        {
            icon: Calendar,
            label: isRTL ? 'التقويم' : 'Calendrier',
            path: '/mon-espace/calendar',
            color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
        },
        {
            icon: MessageCircle,
            label: isRTL ? 'رسائل' : 'Messages',
            path: '/mon-espace/messages',
            color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
        },
        {
            icon: Clock,
            label: isRTL ? 'غياب' : 'Absence',
            path: '/mon-espace/absence-request',
            color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
        }
    ];

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

                {/* Mes Enfants */}
                <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Baby className="w-5 h-5 text-blue-600" />
                            {isRTL ? 'أطفالي' : 'Mes enfants'}
                        </h2>
                        <span className="text-sm text-gray-500">
                            {children.length} {isRTL ? 'طفل' : 'enfant(s)'}
                        </span>
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
                            {children.map((child) => (
                                <MobileCard
                                    key={child.id}
                                    title={`${child.first_name} ${child.last_name}`}
                                    subtitle={child.age_display || (isRTL ? 'مسجل' : 'Inscrit')}
                                    icon={Baby}
                                    iconColor="blue"
                                    badge={getStatusBadge(child.enrollment_status)}
                                    onClick={() => {
                                        setSelectedChild(child);
                                        setShowChildModal(true);
                                    }}
                                    showChevron
                                >
                                    {child.last_attendance && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {isRTL ? 'آخر حضور:' : 'Dernier pointage:'} {child.last_attendance}
                                            </span>
                                        </div>
                                    )}
                                </MobileCard>
                            ))}
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

                {/* Informations utiles */}
                <motion.div variants={itemVariants}>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {isRTL ? 'معلومات مفيدة' : 'Informations utiles'}
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                        <MobileStatCard
                            title={isRTL ? 'الحضور هذا الشهر' : 'Présence ce mois'}
                            value="85%"
                            trend="up"
                            color="green"
                        />
                        <MobileStatCard
                            title={isRTL ? 'أيام الغياب' : 'Jours d\'absence'}
                            value="2"
                            color="orange"
                        />
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
                                {/* Voir les détails */}
                                <button
                                    onClick={() => {
                                        setShowChildModal(false);
                                        navigate(`/mon-espace/child/${selectedChild.id}/details`);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {isRTL ? 'عرض التفاصيل' : 'Voir les détails'}
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
                                        navigate(`/mon-espace/child/${selectedChild.id}/emergency-contacts`);
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
                                            {isRTL ? 'إضافة أو تعديل جهات الاتصال' : 'Ajouter ou modifier les contacts'}
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
        </div>
    );
};

export default MobileParentSpace;
