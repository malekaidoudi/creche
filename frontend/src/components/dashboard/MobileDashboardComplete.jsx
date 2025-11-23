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
    CalendarCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useNotifications } from '../../hooks/useNotifications';
import TodayTasksWidget from '../widgets/TodayTasksWidget';
import TodayTasksWidgetMobile from '../widgets/TodayTasksWidgetMobile';
import MessagesWidget from '../widgets/MessagesWidget';
import UpcomingEventsWidget from '../widgets/UpcomingEventsWidget';
import BirthdaysWidget from '../widgets/BirthdaysWidget';
import TodayAbsences from './TodayAbsences';
import HolidaysList from '../HolidaysList';
import SimpleNotificationCenter from './SimpleNotificationCenter';

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

    // États pour les sections collapsibles
    const [expandedSections, setExpandedSections] = useState({
        tasks: true, // Ouvert par défaut
        messages: false,
        events: false,
        birthdays: false,
        activities: false,
        absences: false,
        holidays: false
    });

    // État pour le mode focus (modal plein écran)
    const [focusMode, setFocusMode] = useState(null);

    // État pour le nombre de messages non lus
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

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

    // Toggle collapse
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Ouvrir en mode focus
    const openFocusMode = (section) => {
        setFocusMode(section);
    };

    // Fermer le mode focus
    const closeFocusMode = () => {
        setFocusMode(null);
    };

    // Résumé rapide - Hero Section avec navigation
    const quickSummary = [
        {
            id: 'present',
            label: isRTL ? 'حاضر' : 'Présents',
            value: stats?.presentToday || 0,
            icon: UserCheck,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgLight: 'bg-green-50',
            link: '/dashboard/attendance/today'
        },
        {
            id: 'messages',
            label: isRTL ? 'رسائل' : 'Messages',
            value: unreadMessagesCount || 0,
            icon: MessageSquare,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgLight: 'bg-blue-50',
            link: '/dashboard/messages'
        },
        {
            id: 'tasks',
            label: isRTL ? 'مهام' : 'Tâches',
            value: stats?.pendingTasks || 0,
            icon: CheckCircle,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgLight: 'bg-purple-50',
            link: '/dashboard/events/calendar?filter=tasks'
        },
        {
            id: 'pending',
            label: isRTL ? 'طلبات' : 'Demandes',
            value: stats?.pendingEnrollments || 0,
            icon: ClipboardList,
            color: 'bg-orange-500',
            textColor: 'text-orange-600',
            bgLight: 'bg-orange-50',
            link: '/dashboard/enrollments'
        }
    ];

    return (
        <>
            {/* Hero Section - Résumé Rapide */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-4 mb-4 shadow-lg"
            >
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-white text-lg font-bold">
                            {isRTL ? `مرحباً ${user?.first_name}` : `Bonjour ${user?.first_name}`}
                        </h2>
                        <p className="text-primary-100 text-sm">
                            {isRTL ? 'ملخص سريع' : 'Résumé rapide'}
                        </p>
                    </div>
                    {/* Cloche de notifications fonctionnelle (mobile uniquement) */}
                    {(user?.role === 'admin' || user?.role === 'staff') && (
                        <button
                            onClick={() => setNotificationOpen(true)}
                            className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Bell className="w-6 h-6 text-white" />
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
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                // Navigation vers la page correspondante
                                if (item.link) {
                                    navigate(item.link);
                                }
                            }}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 cursor-pointer active:bg-white/20 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-xs mb-1">{item.label}</p>
                                    <p className="text-white text-2xl font-bold">{item.value}</p>
                                </div>
                                <div className={`${item.color} p-2 rounded-lg`}>
                                    <item.icon className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

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

                {/* Messages */}
                {(isStaff() || isAdmin()) && (
                    <CollapsibleCard
                        id="messages"
                        title={isRTL ? 'الرسائل' : 'Messages'}
                        icon={MessageSquare}
                        isExpanded={expandedSections.messages}
                        onToggle={() => toggleSection('messages')}
                        onFocus={() => openFocusMode('messages')}
                        badge={unreadMessagesCount}
                    >
                        <div className="mobile-widget-wrapper">
                            <MessagesWidget isMobileView={true} />
                        </div>
                    </CollapsibleCard>
                )}

                {/* Événements - Scroll horizontal */}
                <CollapsibleCard
                    id="events"
                    title={isRTL ? 'الأحداث القادمة' : 'Événements à venir'}
                    icon={Calendar}
                    isExpanded={expandedSections.events}
                    onToggle={() => toggleSection('events')}
                    onFocus={() => openFocusMode('events')}
                    scrollable
                    hasActionBar
                    onOpenEventModal={onOpenEventModal}
                >
                    <div className="mobile-widget-wrapper">
                        <UpcomingEventsWidget onOpenEventModal={onOpenEventModal} isMobileView={true} />
                    </div>
                </CollapsibleCard>

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
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </motion.div>
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

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={scrollable ? 'overflow-x-auto' : ''}
                    >
                        <div className="border-t border-gray-100 dark:border-gray-700">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
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
        messages: isRTL ? 'الرسائل' : 'Messages',
        events: isRTL ? 'الأحداث' : 'Événements',
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
                        {section === 'messages' && (
                            <div className="p-4">
                                <MessagesWidget />
                            </div>
                        )}
                        {section === 'events' && (
                            <div className="p-4">
                                <UpcomingEventsWidget onOpenEventModal={onOpenEventModal} />
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
