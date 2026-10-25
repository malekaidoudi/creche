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
    Users,
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
import api from '../../services/api';
import TodayTasksWidget from '../widgets/TodayTasksWidget';
import TodayTasksWidgetMobile from '../widgets/TodayTasksWidgetMobile';
import TodayAppointmentsWidget from '../widgets/TodayAppointmentsWidget';
import OverdueTasksWidget from '../widgets/OverdueTasksWidget';
import BirthdaysWidget from '../widgets/BirthdaysWidget';
import TodayAbsences from './TodayAbsences';
import HolidaysList from '../HolidaysList';
import SimpleNotificationCenter from './SimpleNotificationCenter';

// Programme dynamique officiel de la crèche
const NURSERY_SCHEDULE = [
    { start: '07:00', end: '08:00', labelFr: 'Accueil des enfants', labelAr: 'استقبال الأطفال', icon: UserCheck },
    { start: '08:00', end: '08:30', labelFr: 'Petit déjeuner', labelAr: 'فطور الصباح', icon: Utensils },
    { start: '08:30', end: '09:00', labelFr: 'Petite pause & changement de couche', labelAr: 'استراحة وتغيير الحفاضات', icon: Sparkles },
    { start: '09:00', end: '10:30', labelFr: 'Activités éducatives', labelAr: 'أنشطة تعليمية', icon: Sparkles },
    { start: '10:30', end: '11:30', labelFr: 'Activités motrices collectives', labelAr: 'أنشطة حركية جماعية', icon: Zap },
    { start: '11:30', end: '12:00', labelFr: 'Repas de midi', labelAr: 'وجبة الغداء', icon: Utensils },
    { start: '12:00', end: '14:00', labelFr: 'Sieste', labelAr: 'القيلولة والراحة', icon: Moon },
    { start: '14:00', end: '15:00', labelFr: 'Jeux libres', labelAr: 'ألعاب حرة', icon: Sparkles },
    { start: '15:00', end: '16:30', labelFr: 'Jeux sensorimoteurs', labelAr: 'ألعاب حسية حركية', icon: Sparkles },
    { start: '16:30', end: '18:00', labelFr: 'Préparation pour la rentrée / départs', labelAr: 'التحضير للعودة إلى المنزل', icon: UserCheck }
];

const getActiveScheduleSlot = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const parseToMins = (str) => {
        const [h, m] = str.split(':').map(Number);
        return h * 60 + m;
    };

    const current = NURSERY_SCHEDULE.find(slot => {
        const start = parseToMins(slot.start);
        const end = parseToMins(slot.end);
        return currentMins >= start && currentMins < end;
    });

    if (current) {
        return { ...current, isLive: true };
    }

    if (currentMins < parseToMins('07:00')) {
        return {
            start: '07:00',
            end: '08:00',
            labelFr: 'Accueil des enfants (bientôt)',
            labelAr: 'قريباً: استقبال الأطفال',
            icon: UserCheck,
            isLive: false
        };
    }

    return {
        start: '18:00',
        end: '07:00',
        labelFr: 'Crèche fermée (Horaires terminés)',
        labelAr: 'الحضانة مغلقة',
        icon: Moon,
        isLive: false
    };
};

// Cache mémoire pour données et sections (évite tout scintillement au retour sur le dashboard)
let cachedUnreadMessagesCount = 0;
let cachedExpandedSections = {
    tasks: true,
    appointments: false,
    overdue: false,
    birthdays: false,
    activities: false,
    absences: false,
    holidays: false,
    onlineUsers: false // Fermé par défaut
};

let cachedWidgetData = {
    appointments: [],
    overdue: [],
    birthdays: [],
    absences: [],
    holidays: [],
    onlineUsers: [],
    isLoaded: false
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
    const { unreadCount } = (user?.role === 'admin' || user?.role === 'staff' || user?.role === 'developer') ? notificationsHook : { unreadCount: 0 };

    // États pour les sections collapsibles
    const [expandedSections, setExpandedSections] = useState(() => ({ ...cachedExpandedSections }));

    // État pour le mode focus (modal plein écran)
    const [focusMode, setFocusMode] = useState(null);

    // État pour le nombre de messages non lus
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(() => cachedUnreadMessagesCount);

    // État pour le centre de notifications
    const [notificationOpen, setNotificationOpen] = useState(false);

    // État de l'horaire en direct
    const [currentSchedule, setCurrentSchedule] = useState(getActiveScheduleSlot);

    // Données pour le filtrage strict des widgets (plus de widgets vides)
    const [widgetData, setWidgetData] = useState(() => ({ ...cachedWidgetData }));

    // Mise à jour de l'horaire dynamique en direct toutes les 30s
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSchedule(getActiveScheduleSlot());
        }, 30000);
        return () => clearInterval(timer);
    }, []);

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

        if (user?.role === 'admin' || user?.role === 'staff' || user?.role === 'developer') {
            loadUnreadCount();
            const interval = setInterval(loadUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Charger les données pour valider la présence de contenu dans chaque widget
    useEffect(() => {
        const loadWidgetsData = async () => {
            try {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];

                const [
                    apptsRes,
                    overdueRes,
                    birthdaysRes,
                    absencesRes,
                    holidaysRes,
                    onlineRes
                ] = await Promise.allSettled([
                    api.get('/api/appointments/today'),
                    api.get('/api/tasks/overdue'),
                    api.get('/api/children/birthdays/month'),
                    api.get(`/api/absence-requests/today?date=${todayStr}`),
                    api.get('/api/holidays?effective=true'),
                    (isAdmin() || user?.role === 'developer') ? api.get('/api/users/online') : Promise.resolve({ data: { users: [] } })
                ]);

                const appointments = apptsRes.status === 'fulfilled' && apptsRes.value.data?.success
                    ? (apptsRes.value.data.appointments || []).filter(a => {
                        const d = new Date(a.confirmed_date || a.proposed_date);
                        return d.toDateString() === today.toDateString();
                    })
                    : cachedWidgetData.appointments;

                const overdue = overdueRes.status === 'fulfilled' && overdueRes.value.data?.success
                    ? (overdueRes.value.data.tasks || [])
                    : cachedWidgetData.overdue;

                const birthdays = birthdaysRes.status === 'fulfilled' && birthdaysRes.value.data?.success
                    ? (birthdaysRes.value.data.children || [])
                    : cachedWidgetData.birthdays;

                const absences = absencesRes.status === 'fulfilled' && absencesRes.value.data?.success
                    ? (absencesRes.value.data.absences || [])
                    : cachedWidgetData.absences;

                const holidays = holidaysRes.status === 'fulfilled' && holidaysRes.value.data?.success
                    ? (holidaysRes.value.data.holidays || []).filter(h => {
                        const diffDays = (new Date(h.date) - today) / (1000 * 60 * 60 * 24);
                        return diffDays >= -1 && diffDays <= 30; // Prochains 30 jours
                    })
                    : cachedWidgetData.holidays;

                const onlineUsers = onlineRes.status === 'fulfilled' && onlineRes.value.data?.success
                    ? (onlineRes.value.data.users || [])
                    : cachedWidgetData.onlineUsers;

                const newData = {
                    appointments,
                    overdue,
                    birthdays,
                    absences,
                    holidays,
                    onlineUsers,
                    isLoaded: true
                };

                cachedWidgetData = newData;
                setWidgetData(newData);
            } catch (error) {
                console.error('Erreur chargement données widgets mobile:', error);
            }
        };

        loadWidgetsData();
        const interval = setInterval(loadWidgetsData, 60000);
        return () => clearInterval(interval);
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

    const openFocusMode = (section) => {
        setFocusMode(section);
    };

    const closeFocusMode = () => {
        setFocusMode(null);
    };

    // Calcul du message d'information contextuel dynamique
    const getInformativeMessage = () => {
        // 1. Absences du jour
        if (widgetData.absences.length > 0) {
            const firstAbsent = widgetData.absences[0];
            const name = firstAbsent.child_name || firstAbsent.first_name || 'Un enfant';
            const more = widgetData.absences.length > 1 ? ` (+${widgetData.absences.length - 1})` : '';
            return {
                text: isRTL ? `${name} غائب(ة) اليوم عن الحضانة${more}` : `${name} est absent(e) aujourd'hui${more}`,
                icon: AlertCircle,
                style: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200',
                onClick: () => navigate('/dashboard/absence-management')
            };
        }

        // 2. Anniversaire aujourd'hui
        const today = new Date();
        const todayBirthday = widgetData.birthdays.find(b => {
            const bDate = new Date(b.birth_date || b.start_date);
            return bDate.getDate() === today.getDate() && bDate.getMonth() === today.getMonth();
        });
        if (todayBirthday) {
            const name = todayBirthday.first_name || todayBirthday.child_name || 'un enfant';
            return {
                text: isRTL ? `اليوم عيد ميلاد ${name} ! 🎉🎂` : `Aujourd'hui c'est l'anniversaire de ${name} ! 🎂`,
                icon: Cake,
                style: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200',
                onClick: () => navigate('/dashboard/children')
            };
        }

        // 3. Tâches en retard
        if (widgetData.overdue.length > 0) {
            const count = widgetData.overdue.length;
            return {
                text: isRTL ? `لديك ${count} مهمة متأخرة تحتاج للمتابعة` : (count === 1 ? 'Vous avez 1 tâche en retard' : `Vous avez ${count} tâches en retard`),
                icon: AlertCircle,
                style: 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-200',
                onClick: () => navigate('/dashboard/events/calendar?filter=tasks')
            };
        }

        // 4. Jour férié demain ou aujourd'hui
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const holidayTomorrow = widgetData.holidays.find(h => {
            const hDate = new Date(h.date);
            return hDate.getDate() === tomorrow.getDate() && hDate.getMonth() === tomorrow.getMonth();
        });
        if (holidayTomorrow) {
            return {
                text: isRTL ? `غداً يوم عطلة رسمية (${holidayTomorrow.name})` : `Demain est un jour férié (${holidayTomorrow.name})`,
                icon: MapPin,
                style: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200',
                onClick: () => navigate('/dashboard/events/calendar')
            };
        }

        const holidayToday = widgetData.holidays.find(h => {
            const hDate = new Date(h.date);
            return hDate.getDate() === today.getDate() && hDate.getMonth() === today.getMonth();
        });
        if (holidayToday) {
            return {
                text: isRTL ? `اليوم عطلة رسمية (${holidayToday.name})` : `Aujourd'hui est un jour férié (${holidayToday.name})`,
                icon: MapPin,
                style: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200',
                onClick: () => navigate('/dashboard/events/calendar')
            };
        }

        // 5. RDV Aujourd'hui
        if (widgetData.appointments.length > 0) {
            const count = widgetData.appointments.length;
            return {
                text: isRTL ? `لديك ${count} موعد مبرمج لليوم` : (count === 1 ? '1 rendez-vous planifié aujourd\'hui' : `${count} rendez-vous planifiés aujourd'hui`),
                icon: CalendarCheck,
                style: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-200',
                onClick: () => navigate('/dashboard/events/calendar?filter=appointments')
            };
        }

        // 6. Tâches du jour
        if (stats?.pendingTasks > 0) {
            return {
                text: isRTL ? `لديك ${stats.pendingTasks} مهام لليوم` : `${stats.pendingTasks} tâche(s) du jour à accomplir`,
                icon: CheckCircle,
                style: 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-200',
                onClick: () => navigate('/dashboard/events/calendar?filter=tasks')
            };
        }

        return null;
    };

    const informativeMessage = getInformativeMessage();

    // Résumé Hero Section
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

    // Vérification de données pour affichage conditionnel strict (aucun widget vide)
    const hasTasks = stats?.pendingTasks > 0;
    const hasAppointments = widgetData.appointments.length > 0;
    const hasOverdue = widgetData.overdue.length > 0;
    const hasBirthdays = widgetData.birthdays.length > 0;
    const hasAbsences = widgetData.absences.length > 0;
    const hasHolidays = widgetData.holidays.length > 0;
    const hasActivities = recentActivities && recentActivities.length > 0;

    const ScheduleIcon = currentSchedule.icon || Clock;

    return (
        <>
            {/* Hero Section - Résumé Rapide + Badge d'Horaires Dynamique en direct */}
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
                    {(user?.role === 'admin' || user?.role === 'staff' || user?.role === 'developer') && (
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

                {/* Badge d'horaires dynamique en direct */}
                <div className="mb-3.5 bg-white/10 dark:bg-slate-900/60 backdrop-blur-md rounded-xl p-2.5 border border-cyan-400/30 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex items-center justify-center shrink-0">
                            {currentSchedule.isLive ? (
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                            ) : (
                                <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-400/30">
                                    {currentSchedule.isLive ? (isRTL ? 'مباشر الآن' : 'En direct') : (isRTL ? 'البرنامج' : 'Planning')}
                                </span>
                                <span className="text-xs font-bold text-white tracking-wide">
                                    {currentSchedule.start} - {currentSchedule.end}
                                </span>
                            </div>
                            <p className="text-xs text-cyan-100 font-semibold truncate mt-0.5">
                                {isRTL ? currentSchedule.labelAr : currentSchedule.labelFr}
                            </p>
                        </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-200 shrink-0">
                        <ScheduleIcon className="w-4 h-4" />
                    </div>
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

            {/* Actions Rapides du quotidien : STRICTEMENT 4 BOUTONS (Sans titre de section) */}
            {(isStaff() || isAdmin() || user?.role === 'developer') && (
                <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-xs border border-cyan-100/90 dark:border-cyan-900/40 mb-4 transition-all">
                    <div className="grid gap-2 grid-cols-4">
                        {/* 1. Pointage */}
                        <button
                            onClick={() => navigate('/dashboard/attendance/today')}
                            className="group relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/15 via-teal-500/15 to-blue-500/15 dark:from-cyan-400/20 dark:to-teal-500/20 border border-cyan-300/60 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center whitespace-nowrap">
                                {isRTL ? 'تسجيل الحضور' : 'Pointage'}
                            </span>
                        </button>

                        {/* 2. Message */}
                        <button
                            onClick={() => navigate('/dashboard/messages')}
                            className="group relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/15 via-sky-500/20 to-cyan-500/15 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200/70 dark:border-blue-700/50 text-blue-600 dark:text-cyan-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center whitespace-nowrap">
                                {isRTL ? 'الرسائل' : 'Message'}
                            </span>
                        </button>

                        {/* 3. Activité */}
                        <button
                            onClick={() => navigate('/dashboard/activities')}
                            className="group relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/15 via-orange-500/20 to-cyan-500/15 dark:from-amber-400/20 dark:to-cyan-500/20 border border-amber-200/70 dark:border-amber-700/50 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center whitespace-nowrap">
                                {isRTL ? 'الأنشطة' : 'Activité'}
                            </span>
                        </button>

                        {/* 4. Bilans */}
                        <button
                            onClick={() => navigate('/dashboard/daily-reports')}
                            className="group relative flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/40 active:scale-95 transition-all shadow-xs"
                        >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 via-blue-500/20 to-cyan-500/15 dark:from-indigo-400/20 dark:to-cyan-500/20 border border-indigo-200/70 dark:border-indigo-700/50 text-indigo-600 dark:text-sky-300 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 shadow-xs">
                                <ClipboardList className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center whitespace-nowrap">
                                {isRTL ? 'التقارير' : 'Bilans'}
                            </span>
                        </button>
                    </div>

                    {/* Message informatif contextuel en bas des actions rapides */}
                    {informativeMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={informativeMessage.onClick}
                            className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-xs ${informativeMessage.style}`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <informativeMessage.icon className="w-4 h-4 shrink-0" />
                                <p className="text-xs font-medium truncate">
                                    {informativeMessage.text}
                                </p>
                            </div>
                            <span className="text-[11px] font-bold shrink-0 opacity-80">
                                {isRTL ? 'عرض ←' : 'Voir →'}
                            </span>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Sections Collapsibles : Affichées UNIQUEMENT si elles ont des données */}
            <div className="mobile-dashboard-container space-y-3">
                {/* 1. Tâches du jour */}
                {(isStaff() || isAdmin() || user?.role === 'developer') && hasTasks && (
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

                {/* 2. RDV Aujourd'hui */}
                {(isStaff() || isAdmin() || user?.role === 'developer') && hasAppointments && (
                    <CollapsibleCard
                        id="appointments"
                        title={isRTL ? 'مواعيد اليوم' : 'RDV Aujourd\'hui'}
                        icon={CalendarCheck}
                        isExpanded={expandedSections.appointments}
                        onToggle={() => toggleSection('appointments')}
                        onFocus={() => openFocusMode('appointments')}
                        badge={widgetData.appointments.length}
                    >
                        <div className="mobile-widget-wrapper">
                            <TodayAppointmentsWidget />
                        </div>
                    </CollapsibleCard>
                )}

                {/* 3. Tâches en retard */}
                {(isStaff() || isAdmin() || user?.role === 'developer') && hasOverdue && (
                    <CollapsibleCard
                        id="overdue"
                        title={isRTL ? 'المهام المتأخرة' : 'Tâches en retard'}
                        icon={AlertCircle}
                        isExpanded={expandedSections.overdue}
                        onToggle={() => toggleSection('overdue')}
                        onFocus={() => openFocusMode('overdue')}
                        badge={widgetData.overdue.length}
                    >
                        <div className="mobile-widget-wrapper">
                            <OverdueTasksWidget />
                        </div>
                    </CollapsibleCard>
                )}

                {/* 4. Anniversaires */}
                {hasBirthdays && (
                    <CollapsibleCard
                        id="birthdays"
                        title={isRTL ? 'أعياد الميلاد' : 'Anniversaires'}
                        icon={Cake}
                        isExpanded={expandedSections.birthdays}
                        onToggle={() => toggleSection('birthdays')}
                        onFocus={() => openFocusMode('birthdays')}
                        badge={widgetData.birthdays.length}
                        scrollable
                    >
                        <div className="mobile-widget-wrapper">
                            <BirthdaysWidget isMobileView={true} />
                        </div>
                    </CollapsibleCard>
                )}

                {/* 5. Absences du jour */}
                {(isStaff() || isAdmin() || user?.role === 'developer') && hasAbsences && (
                    <CollapsibleCard
                        id="absences"
                        title={isRTL ? 'غيابات اليوم' : 'Absences du jour'}
                        icon={AlertCircle}
                        isExpanded={expandedSections.absences}
                        onToggle={() => toggleSection('absences')}
                        onFocus={() => openFocusMode('absences')}
                        badge={widgetData.absences.length}
                    >
                        <div className="mobile-widget-wrapper">
                            <TodayAbsences isMobileView={true} />
                        </div>
                    </CollapsibleCard>
                )}

                {/* 6. Jours fériés */}
                {hasHolidays && (
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
                )}

                {/* 7. Activités récentes */}
                {hasActivities && (
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
                )}

                {/* 8. UTILISATEURS CONNECTÉS (Toujours affiché tout en bas, fermé par défaut, pour admin & développeur) */}
                {(isAdmin() || user?.role === 'developer') && (
                    <CollapsibleCard
                        id="onlineUsers"
                        title={isRTL ? 'المستخدمون المتصلون' : 'Utilisateurs connectés'}
                        icon={Users}
                        isExpanded={expandedSections.onlineUsers}
                        onToggle={() => toggleSection('onlineUsers')}
                        onFocus={() => openFocusMode('onlineUsers')}
                        badge={widgetData.onlineUsers.length > 0 ? widgetData.onlineUsers.length : null}
                    >
                        <OnlineUsersContent
                            users={widgetData.onlineUsers}
                            currentUserId={user?.id || user?.userId}
                            isRTL={isRTL}
                        />
                    </CollapsibleCard>
                )}
            </div>

            {/* Modal Focus Mode */}
            <FocusModal
                isOpen={focusMode !== null}
                onClose={closeFocusMode}
                section={focusMode}
                stats={stats}
                recentActivities={recentActivities}
                onlineUsers={widgetData.onlineUsers}
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

// Composant Card Collapsible (Conforme au design de la capture)
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
    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700 overflow-hidden transition-all"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-3.5 cursor-pointer active:bg-gray-50 dark:active:bg-gray-750 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200/50 dark:border-cyan-700/50 flex items-center justify-center flex-shrink-0 text-cyan-600 dark:text-cyan-400">
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {title}
                    </h3>
                    {badge > 0 && (
                        <span className="bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 shadow-xs">
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
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                        title="Plein écran"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Barre d'actions (mobile uniquement) */}
            {hasActionBar && isExpanded && (
                <div className="lg:hidden border-t border-gray-100 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-center gap-2">
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

// Composant Utilisateurs Connectés
const OnlineUsersContent = ({ users, currentUserId, isRTL }) => {
    const otherUsers = (users || []).filter(u => u.id !== currentUserId);

    if (otherUsers.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-xs">
                <Users className="w-7 h-7 mx-auto mb-2 opacity-40 text-cyan-500" />
                <p>{isRTL ? 'لا يوجد مستخدمون آخرون متصلون حالياً' : 'Aucun autre utilisateur connecté actuellement'}</p>
            </div>
        );
    }

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
            case 'developer':
                return { label: isRTL ? 'إدارة' : 'Direction', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/25' };
            case 'staff':
                return { label: isRTL ? 'فريق' : 'Personnel', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/25' };
            default:
                return { label: isRTL ? 'ولي أمر' : 'Parent', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/25' };
        }
    };

    return (
        <div className="p-3 space-y-2">
            {otherUsers.map((u) => {
                const roleBadge = getRoleBadge(u.role);
                return (
                    <div
                        key={u.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                    {u.first_name?.[0] || 'U'}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800 shadow-[0_0_4px_rgba(16,185,129,0.9)]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                    {u.first_name} {u.last_name}
                                </p>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                    {isRTL ? 'نشط الآن' : 'En ligne'}
                                </span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.color} shrink-0`}>
                            {roleBadge.label}
                        </span>
                    </div>
                );
            })}
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
    onlineUsers,
    onOpenMemoModal,
    onOpenTaskModal,
    onOpenEventModal,
    onOpenAppointmentModal
}) => {
    const { isRTL } = useLanguage();
    const { user } = useAuth();

    if (!isOpen) return null;

    const sectionTitles = {
        tasks: isRTL ? 'مهام اليوم' : 'Tâches du jour',
        appointments: isRTL ? 'مواعيد اليوم' : 'RDV Aujourd\'hui',
        overdue: isRTL ? 'المهام المتأخرة' : 'Tâches en retard',
        birthdays: isRTL ? 'أعياد الميلاد' : 'Anniversaires',
        activities: isRTL ? 'الأنشطة' : 'Activités',
        absences: isRTL ? 'الغيابات' : 'Absences',
        holidays: isRTL ? 'الأعياد' : 'Jours fériés',
        onlineUsers: isRTL ? 'المستخدمون المتصلون' : 'Utilisateurs connectés'
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
                        {section === 'onlineUsers' && (
                            <OnlineUsersContent
                                users={onlineUsers}
                                currentUserId={user?.id || user?.userId}
                                isRTL={isRTL}
                            />
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MobileDashboardComplete;
