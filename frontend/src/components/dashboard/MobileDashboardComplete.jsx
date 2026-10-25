import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronDown,
    Maximize2,
    X,
    Bell,
    CheckCircle,
    Calendar,
    MessageSquare,
    Clock,
    UserCheck,
    ClipboardList,
    Cake,
    MapPin,
    AlertCircle,
    StickyNote,
    FileText,
    CalendarCheck,
    CalendarPlus,
    CreditCard,
    Plus,
    UserPlus,
    Pill,
    Image,
    Utensils,
    Moon,
    Sparkles,
    Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useNotifications } from '../../hooks/useNotifications';
import { Can } from '../../access';
import TodayTasksWidget from '../widgets/TodayTasksWidget';
import TodayTasksWidgetMobile from '../widgets/TodayTasksWidgetMobile';
import TodayAppointmentsWidget from '../widgets/TodayAppointmentsWidget';
import OverdueTasksWidget from '../widgets/OverdueTasksWidget';
import BirthdaysWidget from '../widgets/BirthdaysWidget';
import TodayAbsences from './TodayAbsences';
import HolidaysList from '../HolidaysList';
import SimpleNotificationCenter from './SimpleNotificationCenter';

// Cache mémoire pour le nombre de messages et l'état des sections
let cachedUnreadMessagesCount = 0;
let cachedExpandedSections = {
    tasks: true, // Ouvert par défaut
    appointments: false,
    overdue: false,
    birthdays: false,
    activities: false,
    absences: false,
    holidays: false
};

const MobileDashboardComplete = ({
    stats,
    recentActivities,
    onOpenMemoModal,
    onOpenTaskModal,
    onOpenEventModal,
    onOpenAppointmentModal
}) => {
    const { user, isAdmin, isStaff } = useAuth();
    const { isRTL } = useLanguage();
    const navigate = useNavigate();

    // Hook notifications pour admin/staff
    const notificationsHook = useNotifications();
    const { unreadCount } = (user?.role === 'admin' || user?.role === 'staff') ? notificationsHook : { unreadCount: 0 };

    // États pour les sections collapsibles (mémorisés pour éviter le rechargement/fermeture-ouverture)
    const [expandedSections, setExpandedSections] = useState(() => ({ ...cachedExpandedSections }));

    // État pour le mode focus (modal plein écran)
    const [focusMode, setFocusMode] = useState(null);

    // État pour le nombre de messages non lus
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(() => cachedUnreadMessagesCount);

    // État pour le centre de notifications
    const [notificationOpen, setNotificationOpen] = useState(false);

    // Charger le nombre de messages non lus
    useEffect(() => {
        const loadUnreadCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
                const response = await fetch(`${API_URL}/staff-messages/unread`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && data.messages) {
                    cachedUnreadMessagesCount = data.messages.length;
                    setUnreadMessagesCount(data.messages.length);
                }
            } catch (error) {
                console.error('Erreur chargement count messages:', error);
            }
        };

        if (user?.role === 'admin' || user?.role === 'staff') {
            loadUnreadCount();
            // Recharger toutes les 30 secondes
            const interval = setInterval(loadUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Toggle collapse (sauvegardé en mémoire)
    const toggleSection = (section) => {
        setExpandedSections(prev => {
            const next = {
                ...prev,
                [section]: !prev[section]
            };
            cachedExpandedSections = next;
            return next;
        });
    };

    // Ouvrir en mode focus
    const openFocusMode = (section) => {
        setFocusMode(section);
    };

    // Fermer le mode focus
    const closeFocusMode = () => {
        setFocusMode(null);
    };

    // Résumé rapide - Hero Section avec navigation (Palette Centre d'Aide : Cyan, Saphir, Slate)
    const quickSummary = [
        {
            id: 'present',
            label: isRTL ? 'حاضر' : 'Présents',
            value: stats?.presentToday || 0,
            icon: UserCheck,
            iconBg: 'bg-cyan-500/25 border border-cyan-400/40 text-cyan-200',
            link: '/dashboard/attendance/today'
        },
        {
            id: 'messages',
            label: isRTL ? 'رسائل' : 'Messages',
            value: unreadMessagesCount || 0,
            icon: MessageSquare,
            iconBg: 'bg-sky-500/25 border border-sky-400/40 text-sky-200',
            link: '/dashboard/messages'
        },
        {
            id: 'tasks',
            label: isRTL ? 'مهام' : 'Tâches',
            value: stats?.pendingTasks || 0,
            icon: CheckCircle,
            iconBg: 'bg-blue-500/25 border border-blue-400/40 text-blue-200',
            link: '/dashboard/events/calendar?filter=tasks'
        },
        {
            id: 'pending',
            label: isRTL ? 'طلبات' : 'Demandes',
            value: stats?.pendingEnrollments || 0,
            icon: ClipboardList,
            iconBg: 'bg-indigo-500/25 border border-indigo-400/40 text-indigo-200',
            link: '/dashboard/enrollments'
        }
    ];

    return (
        <>
            {/* Hero Section - Résumé Rapide (Palette Centre d'Aide : Slate 950, Cyan 950, Blue 950) */}
            <div
                className="bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 text-white rounded-2xl p-4 mb-4 shadow-lg border border-cyan-500/30 relative overflow-hidden"
            >
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-white text-lg font-bold">
                            {isRTL ? `مرحباً ${user?.first_name}` : `Bonjour ${user?.first_name}`}
                        </h2>
                        <p className="text-cyan-200/80 text-xs font-medium">
                            {isRTL ? 'ملخص سريع لليوم' : 'Vue d\'ensemble de la journée'}
                        </p>
                    </div>
                    {/* Cloche de notifications fonctionnelle (mobile uniquement) */}
                    {(user?.role === 'admin' || user?.role === 'staff') && (
                        <button
                            onClick={() => setNotificationOpen(true)}
                            className="relative p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <Bell className="w-5 h-5 text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* Chips interactives avec navigation */}
                <div className="grid grid-cols-2 gap-2">
                    {quickSummary.map((item) => (
                        <motion.div
                            key={item.id}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                                if (item.link) {
                                    navigate(item.link);
                                }
                            }}
                            className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 cursor-pointer active:bg-white/20 hover:border-cyan-400/40 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-cyan-100/80 text-xs mb-0.5">{item.label}</p>
                                    <p className="text-white text-2xl font-bold">{item.value}</p>
                                </div>
                                <div className={`${item.iconBg} p-2 rounded-xl`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Actions Rapides du quotidien - Palette Centre d'Aide (Cyan, Saphir, Ardoise) */}
            {(isStaff() || isAdmin()) && (
                <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-xs border border-cyan-100/90 dark:border-cyan-900/40 mb-4 transition-all">
                    <div className="flex items-center justify-between mb-3 px-0.5">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
                                <Zap className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                                {isRTL ? 'الإجراءات اليومية' : 'Actions du quotidien'}
                            </h3>
                        </div>
                        <span className="text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-200/60 dark:border-cyan-800/40">
                            {isRTL ? 'مباشر' : 'Accès express'}
                        </span>
                    </div>

                    <div className="grid gap-2 grid-cols-4">
                        {/* 1. Pointage / Présences */}
                        <Can feature="ATTENDANCE_TODAY">
                            <button
                                onClick={() => navigate('/dashboard/attendance/today')}
                                className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/15 via-teal-500/15 to-blue-500/15 dark:from-cyan-400/20 dark:to-teal-500/20 border border-cyan-300/60 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                    {isRTL ? 'الحضور' : 'Pointage'}
                                </span>
                            </button>
                        </Can>

                        {/* 2. Repas & Biberons */}
                        <button
                            onClick={() => navigate('/dashboard/daily-reports?focus=meals')}
                            className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/15 via-sky-500/20 to-blue-600/15 dark:from-cyan-400/20 dark:to-sky-500/20 border border-cyan-200/70 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <Utensils className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                {isRTL ? 'الوجبات' : 'Repas'}
                            </span>
                        </button>

                        {/* 3. Sieste & Repos */}
                        <button
                            onClick={() => navigate('/dashboard/daily-reports?focus=sleep')}
                            className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 via-blue-500/20 to-cyan-500/15 dark:from-indigo-400/20 dark:to-cyan-500/20 border border-indigo-200/70 dark:border-indigo-700/50 text-indigo-600 dark:text-sky-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <Moon className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                {isRTL ? 'القيلولة' : 'Sieste'}
                            </span>
                        </button>

                        {/* 4. Soins & Médicaments */}
                        <button
                            onClick={() => navigate('/dashboard/treatments')}
                            className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500/15 via-blue-500/15 to-cyan-500/15 dark:from-rose-400/20 dark:to-cyan-500/20 border border-rose-200/70 dark:border-rose-800/50 text-rose-600 dark:text-rose-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <Pill className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                {isRTL ? 'العلاجات' : 'Traitements'}
                            </span>
                        </button>

                        {/* 5. Bilans Journaliers */}
                        <button
                            onClick={() => navigate('/dashboard/daily-reports')}
                            className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/15 via-sky-500/20 to-cyan-500/15 dark:from-blue-400/20 dark:to-cyan-500/20 border border-blue-200/70 dark:border-blue-700/50 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                {isRTL ? 'التقارير' : 'Bilans'}
                            </span>
                        </button>

                        {/* 6. Activités & Photos */}
                        <button
                            onClick={() => navigate('/dashboard/activities')}
                            className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400/20 via-cyan-500/20 to-blue-600/15 dark:from-sky-400/20 dark:to-blue-500/20 border border-sky-300/70 dark:border-sky-700/50 text-sky-600 dark:text-sky-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                {isRTL ? 'الأنشطة' : 'Activités'}
                            </span>
                        </button>

                        {/* 7. Absences du jour */}
                        <button
                            onClick={() => navigate('/dashboard/absence-management')}
                            className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500/15 via-cyan-500/15 to-blue-600/15 dark:from-slate-500/20 dark:to-cyan-500/20 border border-slate-200/70 dark:border-slate-750 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                {isRTL ? 'الغيابات' : 'Absences'}
                            </span>
                        </button>

                        {/* 8. Messages Parents */}
                        <button
                            onClick={() => navigate('/dashboard/messages')}
                            className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/15 via-sky-500/20 to-cyan-500/15 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200/70 dark:border-blue-700/50 text-blue-600 dark:text-cyan-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                {isRTL ? 'رسائل' : 'Messages'}
                            </span>
                        </button>

                        {/* 9. Inscriptions (Admin uniquement) */}
                        {isAdmin() && (
                            <button
                                onClick={() => navigate('/dashboard/enrollments')}
                                className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600/20 to-blue-700/20 dark:from-cyan-500/20 dark:to-blue-600/20 border border-cyan-300/70 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                    {isRTL ? 'التسجيل' : 'Inscription'}
                                </span>
                            </button>
                        )}

                        {/* 10. Événement (Admin uniquement) */}
                        {isAdmin() && (
                            <button
                                onClick={() => onOpenEventModal?.()}
                                className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 dark:from-indigo-400/20 dark:to-cyan-500/20 border border-indigo-200/70 dark:border-indigo-700/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                    <CalendarPlus className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 text-center truncate max-w-full">
                                    {isRTL ? 'حدث' : 'Événement'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Sections Collapsibles */}
            <div className="mobile-dashboard-container space-y-3">
                {/* Tâches du jour - Ouverte par défaut */}
                {(isStaff() || isAdmin()) && (
                    <CollapsibleCard
                        id="tasks"
                        title={isRTL ? 'مهام اليوم' : 'Tâches du jour'}
                        icon={CheckCircle}
                        isExpanded={expandedSections.tasks}
                        onToggle={() => toggleSection('tasks')}
                        onFocus={() => openFocusMode('tasks')}
                        badge={stats?.pendingTasks}
                        hasActionBar
                        onOpenMemoModal={onOpenMemoModal}
                        onOpenTaskModal={onOpenTaskModal}
                        onOpenAppointmentModal={onOpenAppointmentModal}
                    >
                        <div className="mobile-widget-wrapper">
                            <TodayTasksWidgetMobile />
                        </div>
                    </CollapsibleCard>
                )}

                {/* RDV Aujourd'hui */}
                {(isStaff() || isAdmin()) && (
                    <CollapsibleCard
                        id="appointments"
                        title={isRTL ? 'مواعيد اليوم' : 'RDV Aujourd\'hui'}
                        icon={CalendarCheck}
                        isExpanded={expandedSections.appointments}
                        onToggle={() => toggleSection('appointments')}
                        onFocus={() => openFocusMode('appointments')}
                    >
                        <div className="mobile-widget-wrapper">
                            <TodayAppointmentsWidget />
                        </div>
                    </CollapsibleCard>
                )}

                {/* Tâches en retard */}
                {(isStaff() || isAdmin()) && (
                    <CollapsibleCard
                        id="overdue"
                        title={isRTL ? 'المهام المتأخرة' : 'Tâches en retard'}
                        icon={AlertCircle}
                        isExpanded={expandedSections.overdue}
                        onToggle={() => toggleSection('overdue')}
                        onFocus={() => openFocusMode('overdue')}
                    >
                        <div className="mobile-widget-wrapper">
                            <OverdueTasksWidget />
                        </div>
                    </CollapsibleCard>
                )}

                {/* Anniversaires - Scroll horizontal */}
                <CollapsibleCard
                    id="birthdays"
                    title={isRTL ? 'أعياد الميلاد' : 'Anniversaires'}
                    icon={Cake}
                    isExpanded={expandedSections.birthdays}
                    onToggle={() => toggleSection('birthdays')}
                    onFocus={() => openFocusMode('birthdays')}
                    scrollable
                >
                    <div className="mobile-widget-wrapper">
                        <BirthdaysWidget isMobileView={true} />
                    </div>
                </CollapsibleCard>

                {/* Absences du jour */}
                {(isStaff() || isAdmin()) && (
                    <CollapsibleCard
                        id="absences"
                        title={isRTL ? 'غيابات اليوم' : 'Absences du jour'}
                        icon={AlertCircle}
                        isExpanded={expandedSections.absences}
                        onToggle={() => toggleSection('absences')}
                        onFocus={() => openFocusMode('absences')}
                    >
                        <div className="mobile-widget-wrapper">
                            <TodayAbsences isMobileView={true} />
                        </div>
                    </CollapsibleCard>
                )}

                {/* Jours fériés */}
                <CollapsibleCard
                    id="holidays"
                    title={isRTL ? 'الأعياد والعطل' : 'Jours fériés'}
                    icon={MapPin}
                    isExpanded={expandedSections.holidays}
                    onToggle={() => toggleSection('holidays')}
                    onFocus={() => openFocusMode('holidays')}
                >
                    <div className="mobile-widget-wrapper">
                        <HolidaysList userRole={user?.role} isMobileView={true} />
                    </div>
                </CollapsibleCard>

                {/* Activités récentes */}
                <CollapsibleCard
                    id="activities"
                    title={isRTL ? 'الأنشطة الأخيرة' : 'Activités récentes'}
                    icon={Clock}
                    isExpanded={expandedSections.activities}
                    onToggle={() => toggleSection('activities')}
                    onFocus={() => openFocusMode('activities')}
                >
                    <ActivitiesContent activities={recentActivities} />
                </CollapsibleCard>
            </div>

            {/* Modal Focus Mode */}
            <FocusModal
                isOpen={focusMode !== null}
                onClose={closeFocusMode}
                section={focusMode}
                stats={stats}
                recentActivities={recentActivities}
                onOpenMemoModal={onOpenMemoModal}
                onOpenTaskModal={onOpenTaskModal}
                onOpenEventModal={onOpenEventModal}
                onOpenAppointmentModal={onOpenAppointmentModal}
            />

            {/* Centre de notifications (mobile uniquement) */}
            <SimpleNotificationCenter
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
            />
        </>
    );
};

// Composant Card Collapsible
const CollapsibleCard = ({
    id,
    title,
    icon: Icon,
    isExpanded,
    onToggle,
    onFocus,
    badge,
    scrollable,
    hasActionBar,
    onOpenMemoModal,
    onOpenTaskModal,
    onOpenAppointmentModal,
    onOpenEventModal,
    children
}) => {
    const { isRTL } = useLanguage();

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1 min-w-0">
                    <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {title}
                    </h3>
                    {badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            {badge}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFocus();
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <ChevronDown className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Barre d'actions (mobile uniquement) */}
            {hasActionBar && isExpanded && (
                <div className="lg:hidden border-t border-gray-100 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-center gap-2">
                        {/* Actions pour Tâches du jour */}
                        {onOpenMemoModal && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenMemoModal();
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg transition-colors text-xs font-medium"
                            >
                                <StickyNote className="w-4 h-4" />
                                Mémo
                            </button>
                        )}
                        {onOpenTaskModal && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenTaskModal();
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors text-xs font-medium"
                            >
                                <FileText className="w-4 h-4" />
                                Tâche
                            </button>
                        )}
                        {onOpenAppointmentModal && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenAppointmentModal();
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors text-xs font-medium"
                            >
                                <CalendarCheck className="w-4 h-4" />
                                RDV
                            </button>
                        )}

                        {/* Action pour Événements à venir */}
                        {onOpenEventModal && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEventModal();
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors text-xs font-medium"
                            >
                                <Calendar className="w-4 h-4" />
                                Ajouter événement
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content - initial={false} empêche l'animation de fermeture/ouverture au montage initial */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={false}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={scrollable ? 'overflow-x-auto' : ''}
                    >
                        <div className="border-t border-gray-100 dark:border-gray-700">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Composant Activities Content
const ActivitiesContent = ({ activities }) => {
    const { isRTL } = useLanguage();

    return (
        <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
            {activities && activities.length > 0 ? (
                activities.slice(0, 8).map((activity, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start space-x-3 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                {activity.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {activity.time}
                            </p>
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">{isRTL ? 'لا توجد أنشطة حديثة' : 'Aucune activité récente'}</p>
                </div>
            )}
        </div>
    );
};

// Modal Focus Mode
const FocusModal = ({
    isOpen,
    onClose,
    section,
    stats,
    recentActivities,
    onOpenMemoModal,
    onOpenTaskModal,
    onOpenEventModal,
    onOpenAppointmentModal
}) => {
    const { isRTL } = useLanguage();
    const { user, isAdmin, isStaff } = useAuth();

    if (!isOpen) return null;

    const sectionTitles = {
        tasks: isRTL ? 'مهام اليوم' : 'Tâches du jour',
        appointments: isRTL ? 'مواعيد اليوم' : 'RDV Aujourd\'hui',
        overdue: isRTL ? 'المهام المتأخرة' : 'Tâches en retard',
        birthdays: isRTL ? 'أعياد الميلاد' : 'Anniversaires',
        activities: isRTL ? 'الأنشطة' : 'Activités',
        absences: isRTL ? 'الغيابات' : 'Absences',
        holidays: isRTL ? 'الأعياد' : 'Jours fériés'
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="bg-white dark:bg-gray-800 w-full max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {sectionTitles[section]}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(85vh-64px)]">
                        {section === 'tasks' && (
                            <div className="p-4">
                                <TodayTasksWidget
                                    onOpenMemoModal={onOpenMemoModal}
                                    onOpenTaskModal={onOpenTaskModal}
                                    onOpenAppointmentModal={onOpenAppointmentModal}
                                />
                            </div>
                        )}
                        {section === 'appointments' && (
                            <div className="p-4">
                                <TodayAppointmentsWidget />
                            </div>
                        )}
                        {section === 'overdue' && (
                            <div className="p-4">
                                <OverdueTasksWidget />
                            </div>
                        )}
                        {section === 'birthdays' && (
                            <div className="p-4">
                                <BirthdaysWidget />
                            </div>
                        )}
                        {section === 'absences' && (
                            <div className="p-4">
                                <TodayAbsences />
                            </div>
                        )}
                        {section === 'holidays' && (
                            <div className="p-4">
                                <HolidaysList userRole={user?.role} />
                            </div>
                        )}
                        {section === 'activities' && (
                            <ActivitiesContent activities={recentActivities} />
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MobileDashboardComplete;
