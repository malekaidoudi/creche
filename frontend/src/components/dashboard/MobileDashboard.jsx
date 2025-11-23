import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronUp,
    Maximize2,
    X,
    Bell,
    CheckCircle,
    Calendar,
    MessageSquare,
    Clock,
    Baby,
    Users,
    ClipboardList,
    UserCheck,
    TrendingUp,
    Cake,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const MobileDashboard = ({
    stats,
    recentActivities,
    onOpenMemoModal,
    onOpenTaskModal,
    onOpenEventModal,
    onOpenAppointmentModal
}) => {
    const { user, isAdmin, isStaff } = useAuth();
    const { isRTL } = useLanguage();

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

    // Résumé rapide - Hero Section
    const quickSummary = [
        {
            id: 'present',
            label: isRTL ? 'حاضر' : 'Présents',
            value: stats?.presentToday || 0,
            icon: UserCheck,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgLight: 'bg-green-50'
        },
        {
            id: 'messages',
            label: isRTL ? 'رسائل' : 'Messages',
            value: stats?.unreadMessages || 0,
            icon: MessageSquare,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgLight: 'bg-blue-50'
        },
        {
            id: 'tasks',
            label: isRTL ? 'مهام' : 'Tâches',
            value: stats?.pendingTasks || 0,
            icon: CheckCircle,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgLight: 'bg-purple-50'
        },
        {
            id: 'pending',
            label: isRTL ? 'طلبات' : 'Demandes',
            value: stats?.pendingEnrollments || 0,
            icon: ClipboardList,
            color: 'bg-orange-500',
            textColor: 'text-orange-600',
            bgLight: 'bg-orange-50'
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
                    <Bell className="w-6 h-6 text-white" />
                </div>

                {/* Chips interactives */}
                <div className="grid grid-cols-2 gap-2">
                    {quickSummary.map((item) => (
                        <motion.div
                            key={item.id}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20"
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
            <div className="space-y-3">
                {/* Tâches du jour - Ouverte par défaut */}
                <CollapsibleCard
                    id="tasks"
                    title={isRTL ? 'مهام اليوم' : 'Tâches du jour'}
                    icon={CheckCircle}
                    isExpanded={expandedSections.tasks}
                    onToggle={() => toggleSection('tasks')}
                    onFocus={() => openFocusMode('tasks')}
                    badge={stats?.pendingTasks}
                >
                    <TasksContent
                        onOpenMemoModal={onOpenMemoModal}
                        onOpenTaskModal={onOpenTaskModal}
                        onOpenAppointmentModal={onOpenAppointmentModal}
                    />
                </CollapsibleCard>

                {/* Messages */}
                <CollapsibleCard
                    id="messages"
                    title={isRTL ? 'الرسائل' : 'Messages'}
                    icon={MessageSquare}
                    isExpanded={expandedSections.messages}
                    onToggle={() => toggleSection('messages')}
                    onFocus={() => openFocusMode('messages')}
                    badge={stats?.unreadMessages}
                >
                    <MessagesContent />
                </CollapsibleCard>

                {/* Événements - Scroll horizontal */}
                <CollapsibleCard
                    id="events"
                    title={isRTL ? 'الأحداث القادمة' : 'Événements à venir'}
                    icon={Calendar}
                    isExpanded={expandedSections.events}
                    onToggle={() => toggleSection('events')}
                    onFocus={() => openFocusMode('events')}
                    scrollable
                >
                    <EventsCarousel onOpenEventModal={onOpenEventModal} />
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
                    <BirthdaysCarousel />
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
                className="flex items-center justify-between p-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                    <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                        {title}
                    </h3>
                    {badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse">
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
                        <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Composant Tasks Content (placeholder - à remplacer par TodayTasksWidget)
const TasksContent = ({ onOpenMemoModal, onOpenTaskModal, onOpenAppointmentModal }) => {
    const { isRTL } = useLanguage();

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRTL ? 'محتوى المهام سيتم تحميله هنا' : 'Contenu des tâches chargé ici'}
            </p>
            {/* Intégrer TodayTasksWidget ici */}
        </div>
    );
};

// Composant Messages Content (placeholder - à remplacer par MessagesWidget)
const MessagesContent = () => {
    const { isRTL } = useLanguage();

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRTL ? 'محتوى الرسائل سيتم تحميله هنا' : 'Contenu des messages chargé ici'}
            </p>
            {/* Intégrer MessagesWidget ici */}
        </div>
    );
};

// Composant Events Carousel
const EventsCarousel = ({ onOpenEventModal }) => {
    const { isRTL } = useLanguage();

    return (
        <div className="flex space-x-3 rtl:space-x-reverse overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4">
            {[1, 2, 3].map((event) => (
                <motion.div
                    key={event}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 w-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 snap-start border border-blue-200 dark:border-blue-800"
                >
                    <div className="flex items-start justify-between mb-2">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {isRTL ? 'غداً' : 'Demain'}
                        </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {isRTL ? 'حدث تجريبي' : 'Événement test'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isRTL ? 'وصف الحدث' : 'Description de l\'événement'}
                    </p>
                </motion.div>
            ))}
        </div>
    );
};

// Composant Birthdays Carousel
const BirthdaysCarousel = () => {
    const { isRTL } = useLanguage();

    return (
        <div className="flex space-x-3 rtl:space-x-reverse overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4">
            {[1, 2, 3].map((birthday) => (
                <motion.div
                    key={birthday}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 w-48 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl p-4 snap-start border border-pink-200 dark:border-pink-800"
                >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-12 h-12 bg-pink-200 dark:bg-pink-800 rounded-full flex items-center justify-center">
                            <Cake className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {isRTL ? 'اسم الطفل' : 'Nom enfant'}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {isRTL ? 'اليوم' : 'Aujourd\'hui'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// Composant Activities Content
const ActivitiesContent = ({ activities }) => {
    const { isRTL } = useLanguage();

    return (
        <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities && activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">
                                {activity.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {activity.time}
                            </p>
                        </div>
                    </div>
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

    if (!isOpen) return null;

    const sectionTitles = {
        tasks: isRTL ? 'مهام اليوم' : 'Tâches du jour',
        messages: isRTL ? 'الرسائل' : 'Messages',
        events: isRTL ? 'الأحداث' : 'Événements',
        birthdays: isRTL ? 'أعياد الميلاد' : 'Anniversaires',
        activities: isRTL ? 'الأنشطة' : 'Activités'
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center lg:justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="bg-white dark:bg-gray-800 w-full lg:w-[600px] lg:max-h-[80vh] rounded-t-3xl lg:rounded-3xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {sectionTitles[section]}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[70vh]">
                        {section === 'tasks' && (
                            <TasksContent
                                onOpenMemoModal={onOpenMemoModal}
                                onOpenTaskModal={onOpenTaskModal}
                                onOpenAppointmentModal={onOpenAppointmentModal}
                            />
                        )}
                        {section === 'messages' && <MessagesContent />}
                        {section === 'events' && <EventsCarousel onOpenEventModal={onOpenEventModal} />}
                        {section === 'birthdays' && <BirthdaysCarousel />}
                        {section === 'activities' && <ActivitiesContent activities={recentActivities} />}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MobileDashboard;
