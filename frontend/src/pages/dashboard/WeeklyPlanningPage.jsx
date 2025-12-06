import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    CalendarDays,
    Clock,
    CalendarCheck,
    FileText,
    StickyNote,
    Cake,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle,
    AlertCircle,
    User,
    Megaphone,
    MapPin,
    Plus
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EventModal from '../../components/modals/EventModal';
import TaskModal from '../../components/modals/TaskModal';
import CreateAppointmentModal from '../../components/modals/CreateAppointmentModal';

/**
 * Page Planning Hebdomadaire
 * Affiche un tableau avec les jours de la semaine et les activités planifiées
 */
const WeeklyPlanningPage = () => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [weekData, setWeekData] = useState({});
    const [selectedDay, setSelectedDay] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Modals de création
    const [showEventModal, setShowEventModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    // Modal de détails d'événement
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventLoading, setEventLoading] = useState(false);

    // Détecter le changement de taille d'écran
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Jours de la semaine (Lundi à Vendredi)
    const weekDays = [
        { key: 'monday', label: isRTL ? 'الإثنين' : 'Lundi', short: isRTL ? 'إث' : 'Lun' },
        { key: 'tuesday', label: isRTL ? 'الثلاثاء' : 'Mardi', short: isRTL ? 'ثل' : 'Mar' },
        { key: 'wednesday', label: isRTL ? 'الأربعاء' : 'Mercredi', short: isRTL ? 'أر' : 'Mer' },
        { key: 'thursday', label: isRTL ? 'الخميس' : 'Jeudi', short: isRTL ? 'خم' : 'Jeu' },
        { key: 'friday', label: isRTL ? 'الجمعة' : 'Vendredi', short: isRTL ? 'جم' : 'Ven' }
    ];

    // Obtenir les dates de la semaine (Lundi à Vendredi)
    const getWeekDates = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster si dimanche
        const monday = new Date(d.setDate(diff));

        return weekDays.map((_, index) => {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + index);
            return dayDate;
        });
    };

    const weekDates = getWeekDates(currentWeek);

    // Charger les données de la semaine
    useEffect(() => {
        loadWeekData();
    }, [currentWeek]);

    const loadWeekData = async () => {
        try {
            setLoading(true);
            const startDate = weekDates[0].toISOString().split('T')[0];
            const endDate = weekDates[4].toISOString().split('T')[0];

            // Charger tous les événements de la semaine
            const [eventsRes, appointmentsRes, childrenRes] = await Promise.all([
                api.get('/api/events', { params: { limit: 100 } }),
                api.get('/api/appointments').catch(() => ({ data: { appointments: [] } })),
                api.get('/api/children').catch(() => ({ data: { children: [] } }))
            ]);

            const events = eventsRes.data.events || [];
            const appointments = appointmentsRes.data?.appointments || [];
            const children = childrenRes.data?.children || [];

            // Organiser par jour
            const data = {};
            weekDates.forEach((date, index) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayKey = weekDays[index].key;

                data[dayKey] = {
                    date: date,
                    dateStr: dateStr,
                    items: []
                };

                // Filtrer les événements du jour
                events.forEach(event => {
                    if (!event.start_date) return;
                    const eventDate = new Date(event.start_date).toISOString().split('T')[0];
                    if (eventDate === dateStr && event.status !== 'completed' && event.status !== 'cancelled') {
                        data[dayKey].items.push({
                            ...event,
                            itemType: event.type || 'event'
                        });
                    }
                });

                // Filtrer les RDV du jour
                appointments.forEach(appt => {
                    const apptDate = new Date(appt.confirmed_date || appt.proposed_date).toISOString().split('T')[0];
                    if (apptDate === dateStr && appt.status !== 'cancelled' && appt.status !== 'completed') {
                        data[dayKey].items.push({
                            id: `appt-${appt.id}`,
                            title: appt.subject || (isRTL ? 'موعد' : 'Rendez-vous'),
                            description: appt.description,
                            start_date: appt.confirmed_date || appt.proposed_date,
                            itemType: 'appointment',
                            metadata: { parent_name: appt.parent_name, appointment_id: appt.id }
                        });
                    }
                });

                // Ajouter les anniversaires
                const month = date.getMonth() + 1;
                const day = date.getDate();
                children.forEach(child => {
                    if (!child.date_of_birth) return;
                    const birthDate = new Date(child.date_of_birth);
                    if (birthDate.getMonth() + 1 === month && birthDate.getDate() === day) {
                        data[dayKey].items.push({
                            id: `birthday-${child.id}`,
                            title: `🎂 ${child.first_name} ${child.last_name}`,
                            description: isRTL ? `عيد ميلاد ${child.first_name}` : `Anniversaire de ${child.first_name}`,
                            start_date: dateStr,
                            itemType: 'birthday',
                            metadata: { child_name: `${child.first_name} ${child.last_name}` }
                        });
                    }
                });

                // Trier par heure
                data[dayKey].items.sort((a, b) => {
                    return new Date(a.start_date) - new Date(b.start_date);
                });
            });

            setWeekData(data);
        } catch (error) {
            console.error('Erreur chargement planning:', error);
            dialog.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    // Navigation semaines
    const goToPreviousWeek = () => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeek(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeek(newDate);
    };

    const goToCurrentWeek = () => {
        setCurrentWeek(new Date());
    };

    // Ouvrir le modal du jour
    const openDayModal = (dayKey) => {
        setSelectedDay(dayKey);
        setShowDayModal(true);
    };

    // Obtenir l'icône selon le type
    const getTypeIcon = (type) => {
        switch (type) {
            case 'appointment':
                return <CalendarCheck className="w-4 h-4 text-green-500" />;
            case 'birthday':
                return <Cake className="w-4 h-4 text-pink-500" />;
            case 'event':
            case 'meeting':
                return <Megaphone className="w-4 h-4 text-orange-500" />;
            case 'memo':
                return <StickyNote className="w-4 h-4 text-purple-500" />;
            case 'task':
                return <FileText className="w-4 h-4 text-blue-500" />;
            default:
                return <Calendar className="w-4 h-4 text-gray-500" />;
        }
    };

    // Obtenir la couleur de fond selon le type
    const getTypeBgColor = (type) => {
        switch (type) {
            case 'appointment':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'birthday':
                return 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800';
            case 'event':
            case 'meeting':
                return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
            case 'memo':
                return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
            case 'task':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            default:
                return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
        }
    };

    // Vérifier si c'est aujourd'hui
    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Formater la date
    const formatDate = (date) => {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    // Ouvrir le modal du jour avec la date
    const openDayModalWithDate = (dayKey, date) => {
        setSelectedDay(dayKey);
        setSelectedDate(date.toISOString().split('T')[0]);
        setShowDayModal(true);
    };

    // Charger les détails d'un événement
    const loadEventDetails = async (eventId) => {
        // Ne pas charger pour les anniversaires ou items spéciaux
        if (String(eventId).startsWith('birthday-') || String(eventId).startsWith('appt-')) {
            return null;
        }

        try {
            setEventLoading(true);
            const response = await api.get(`/api/events/${eventId}`);
            if (response.data.success) {
                return response.data.event;
            }
        } catch (error) {
            console.error('Erreur chargement détails:', error);
        } finally {
            setEventLoading(false);
        }
        return null;
    };

    // Ouvrir le modal de détails
    const openEventDetail = async (item) => {
        // Pour les anniversaires, afficher directement
        if (item.itemType === 'birthday') {
            setSelectedEvent({
                ...item,
                type: 'birthday',
                title: item.title,
                description: item.description
            });
            setShowDetailModal(true);
            return;
        }

        // Pour les RDV, afficher les infos disponibles
        if (item.itemType === 'appointment') {
            setSelectedEvent({
                ...item,
                type: 'rdv',
                title: item.title,
                description: item.description,
                start_date: item.start_date,
                parent_name: item.metadata?.parent_name
            });
            setShowDetailModal(true);
            return;
        }

        // Pour les autres événements, charger les détails complets
        const eventDetails = await loadEventDetails(item.id);
        if (eventDetails) {
            setSelectedEvent(eventDetails);
            setShowDetailModal(true);
        } else {
            // Fallback avec les données locales
            setSelectedEvent(item);
            setShowDetailModal(true);
        }
    };

    // Changer le statut d'un événement
    const handleStatusChange = async (newStatus) => {
        if (!selectedEvent?.id || String(selectedEvent.id).startsWith('birthday-') || String(selectedEvent.id).startsWith('appt-')) {
            return;
        }

        try {
            const response = await api.patch(`/api/events/${selectedEvent.id}/status`, {
                status: newStatus
            });

            if (response.data.success) {
                setSelectedEvent(prev => ({ ...prev, status: newStatus }));
                dialog.success(isRTL ? 'تم تحديث الحالة' : 'Statut mis à jour');
                loadWeekData(); // Recharger les données
            }
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            dialog.error(isRTL ? 'خطأ في تحديث الحالة' : 'Erreur lors de la mise à jour');
        }
    };

    // Succès création
    const handleModalSuccess = () => {
        loadWeekData();
    };

    // Labels et couleurs
    const getStatusLabel = (status) => {
        const labels = {
            pending: isRTL ? 'قيد الانتظار' : 'En attente',
            in_progress: isRTL ? 'قيد التنفيذ' : 'En cours',
            completed: isRTL ? 'مكتمل' : 'Complété',
            cancelled: isRTL ? 'ملغى' : 'Annulé'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
        };
        return colors[status] || colors.pending;
    };

    const getTypeLabel = (type) => {
        const labels = {
            memo: isRTL ? 'مذكرة' : 'Mémo',
            task: isRTL ? 'مهمة' : 'Tâche',
            rdv: isRTL ? 'موعد' : 'RDV',
            birthday: isRTL ? 'عيد ميلاد' : 'Anniversaire',
            event: isRTL ? 'حدث' : 'Événement',
            meeting: isRTL ? 'اجتماع' : 'Réunion',
            appointment: isRTL ? 'موعد' : 'RDV'
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-6 text-white">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <CalendarDays className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold">
                                        {isRTL ? 'التخطيط الأسبوعي' : 'Planning Hebdomadaire'}
                                    </h1>
                                    <p className="text-white/80 mt-1">
                                        {isRTL ? 'إدارة المواعيد والأنشطة' : 'Gérez vos rendez-vous et activités'}
                                    </p>
                                </div>
                            </div>

                            {/* Navigation semaine */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPreviousWeek}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={goToCurrentWeek}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {isRTL ? 'هذا الأسبوع' : 'Cette semaine'}
                                </button>
                                <button
                                    onClick={goToNextWeek}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Vue Mobile - Liste verticale des jours */}
                {isMobile ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-3"
                    >
                        {weekDays.map((day, index) => {
                            const date = weekDates[index];
                            const today = isToday(date);
                            const dayData = weekData[day.key];
                            const items = dayData?.items || [];

                            return (
                                <div
                                    key={day.key}
                                    onClick={() => openDayModalWithDate(day.key, date)}
                                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${today ? 'ring-2 ring-primary-500' : ''
                                        }`}
                                >
                                    {/* Header du jour */}
                                    <div className={`px-4 py-3 flex items-center justify-between ${today
                                        ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white'
                                        : 'bg-gray-50 dark:bg-gray-700/50'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${today
                                                ? 'bg-white/20 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                                                }`}>
                                                {date.getDate()}
                                            </div>
                                            <div>
                                                <p className={`font-semibold ${today ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                    {day.label}
                                                </p>
                                                <p className={`text-xs ${today ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {date.toLocaleDateString('fr-FR', { month: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                        {items.length > 0 && (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${today
                                                ? 'bg-white/20 text-white'
                                                : 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                                                }`}>
                                                {items.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Contenu - Aperçu des items */}
                                    <div className="p-3">
                                        {items.length === 0 ? (
                                            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-2">
                                                {isRTL ? 'لا يوجد برنامج' : 'Aucun programme'}
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {items.slice(0, 3).map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-center gap-2 p-2 rounded-lg ${getTypeBgColor(item.itemType)}`}
                                                    >
                                                        {getTypeIcon(item.itemType)}
                                                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {item.title}
                                                        </span>
                                                        {item.start_date && item.itemType !== 'birthday' && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(item.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                                {items.length > 3 && (
                                                    <p className="text-center text-xs text-primary-600 dark:text-primary-400 font-medium pt-1">
                                                        +{items.length - 3} {isRTL ? 'المزيد' : 'autres'}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                ) : (
                    /* Vue Desktop - Tableau */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                    >
                        {/* En-têtes des jours */}
                        <div className="grid grid-cols-5 border-b border-gray-200 dark:border-gray-700">
                            {weekDays.map((day, index) => {
                                const date = weekDates[index];
                                const today = isToday(date);
                                const dayData = weekData[day.key];
                                const itemCount = dayData?.items?.length || 0;

                                return (
                                    <div
                                        key={day.key}
                                        className={`p-4 text-center border-r last:border-r-0 border-gray-200 dark:border-gray-700 ${today ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                    >
                                        <div className={`text-sm font-semibold ${today ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {day.label}
                                        </div>
                                        <div className={`text-lg font-bold mt-1 ${today ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                                            {date.getDate()}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(date).split(' ')[1]}
                                        </div>
                                        {itemCount > 0 && (
                                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${today
                                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {itemCount} {isRTL ? 'عناصر' : 'élém.'}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Contenu des jours */}
                        <div className="grid grid-cols-5 min-h-[400px]">
                            {weekDays.map((day, index) => {
                                const date = weekDates[index];
                                const today = isToday(date);
                                const dayData = weekData[day.key];
                                const items = dayData?.items || [];

                                return (
                                    <div
                                        key={day.key}
                                        onClick={() => openDayModalWithDate(day.key, date)}
                                        className={`p-2 border-r last:border-r-0 border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${today ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                                    >
                                        <div className="space-y-2">
                                            {items.slice(0, 4).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`p-2 rounded-lg border text-xs ${getTypeBgColor(item.itemType)}`}
                                                >
                                                    <div className="flex items-start gap-1.5">
                                                        {getTypeIcon(item.itemType)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                {item.title}
                                                            </p>
                                                            {item.start_date && item.itemType !== 'birthday' && (
                                                                <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                                                                    {new Date(item.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {items.length > 4 && (
                                                <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
                                                    +{items.length - 4} {isRTL ? 'المزيد' : 'autres'}
                                                </div>
                                            )}
                                            {items.length === 0 && (
                                                <div className="h-full flex items-center justify-center py-8">
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        {isRTL ? 'لا شيء' : 'Rien'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Légende */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm"
                >
                    <div className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'موعد' : 'RDV'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'حدث' : 'Événement'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'مهمة' : 'Tâche'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Cake className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'عيد ميلاد' : 'Anniversaire'}</span>
                    </div>
                </motion.div>
            </div>

            {/* Modal du jour - Tâches + Actions de création */}
            <AnimatePresence>
                {showDayModal && selectedDay && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowDayModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold">
                                                {weekDays.find(d => d.key === selectedDay)?.label} {weekData[selectedDay]?.date?.getDate()}
                                            </h2>
                                            <p className="text-white/80 text-sm">
                                                {weekData[selectedDay]?.date?.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowDayModal(false)}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Boutons de création rapide */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                                        {isRTL ? 'إضافة جديد' : 'Ajouter'}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => {
                                                setShowDayModal(false);
                                                setShowEventModal(true);
                                            }}
                                            className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                                        >
                                            <span className="text-xl">📅</span>
                                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{isRTL ? 'حدث' : 'Événement'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDayModal(false);
                                                setShowTaskModal(true);
                                            }}
                                            className="flex flex-col items-center gap-1.5 p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors border border-green-200 dark:border-green-800"
                                        >
                                            <span className="text-xl">✅</span>
                                            <span className="text-xs font-medium text-green-700 dark:text-green-300">{isRTL ? 'مهمة' : 'Tâche'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDayModal(false);
                                                setShowAppointmentModal(true);
                                            }}
                                            className="flex flex-col items-center gap-1.5 p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
                                        >
                                            <span className="text-xl">📋</span>
                                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{isRTL ? 'موعد' : 'RDV'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Liste des événements du jour */}
                                <div className="p-4 overflow-y-auto max-h-[calc(85vh-220px)]">
                                    {weekData[selectedDay]?.items?.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {isRTL ? 'لا يوجد برنامج لهذا اليوم' : 'Aucun programme ce jour'}
                                            </p>
                                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                {isRTL ? 'استخدم الأزرار أعلاه للإضافة' : 'Utilisez les boutons ci-dessus pour en créer'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                                                {isRTL ? 'البرنامج' : 'Programme'}
                                            </p>
                                            {weekData[selectedDay]?.items?.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => openEventDetail(item)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getTypeBgColor(item.itemType)}`}
                                                >
                                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                        {getTypeIcon(item.itemType)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                            {item.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {item.start_date && item.itemType !== 'birthday' && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(item.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                            {item.metadata?.parent_name && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    {item.metadata.parent_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modal de détails d'événement */}
            <AnimatePresence>
                {showDetailModal && selectedEvent && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                            onClick={() => setShowDetailModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        >
                            <div
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header avec type */}
                                <div className={`p-4 ${selectedEvent.type === 'birthday' || selectedEvent.itemType === 'birthday'
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                                        : selectedEvent.type === 'rdv' || selectedEvent.itemType === 'appointment'
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                            : selectedEvent.type === 'task' || selectedEvent.itemType === 'task'
                                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                : 'bg-gradient-to-r from-orange-500 to-amber-500'
                                    } text-white`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">
                                                {selectedEvent.type === 'birthday' || selectedEvent.itemType === 'birthday' ? '🎂' :
                                                    selectedEvent.type === 'rdv' || selectedEvent.itemType === 'appointment' ? '📅' :
                                                        selectedEvent.type === 'task' || selectedEvent.itemType === 'task' ? '✅' :
                                                            selectedEvent.type === 'memo' || selectedEvent.itemType === 'memo' ? '📝' : '📌'}
                                            </span>
                                            <div>
                                                <p className="text-xs text-white/80 uppercase tracking-wide">
                                                    {getTypeLabel(selectedEvent.type || selectedEvent.itemType)}
                                                </p>
                                                <h2 className="text-lg font-bold">{selectedEvent.title}</h2>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowDetailModal(false)}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Contenu */}
                                <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
                                    {/* Statut et priorité */}
                                    {selectedEvent.status && (
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEvent.status)}`}>
                                                {getStatusLabel(selectedEvent.status)}
                                            </span>
                                            {selectedEvent.priority && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedEvent.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                                        selectedEvent.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {selectedEvent.priority === 'urgent' ? (isRTL ? 'عاجل' : 'Urgent') :
                                                        selectedEvent.priority === 'high' ? (isRTL ? 'مهم' : 'Important') :
                                                            selectedEvent.priority === 'medium' ? (isRTL ? 'متوسط' : 'Moyen') : (isRTL ? 'عادي' : 'Normal')}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Description */}
                                    {selectedEvent.description && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">
                                                {isRTL ? 'الوصف' : 'Description'}
                                            </p>
                                            <p className="text-gray-900 dark:text-white text-sm">
                                                {selectedEvent.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Détails */}
                                    <div className="space-y-3">
                                        {/* Date/Heure */}
                                        {selectedEvent.start_date && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900 dark:text-white">
                                                    {new Date(selectedEvent.start_date).toLocaleDateString('fr-FR', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long'
                                                    })}
                                                    {selectedEvent.itemType !== 'birthday' && (
                                                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                                                            {new Date(selectedEvent.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {/* Parent (pour RDV) */}
                                        {(selectedEvent.parent_name || selectedEvent.metadata?.parent_name) && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900 dark:text-white">
                                                    {selectedEvent.parent_name || selectedEvent.metadata?.parent_name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Lieu */}
                                        {selectedEvent.location && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900 dark:text-white">
                                                    {selectedEvent.location}
                                                </span>
                                            </div>
                                        )}

                                        {/* Enfant */}
                                        {(selectedEvent.child_name || selectedEvent.metadata?.child_name) && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="text-lg">👶</span>
                                                <span className="text-gray-900 dark:text-white">
                                                    {selectedEvent.child_name || selectedEvent.metadata?.child_name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Assigné à */}
                                        {selectedEvent.assigned_to_name && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'مسند إلى' : 'Assigné à'}</span>
                                                    <p className="text-gray-900 dark:text-white">{selectedEvent.assigned_to_name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions de statut */}
                                    {selectedEvent.status && selectedEvent.status !== 'completed' && selectedEvent.status !== 'cancelled' &&
                                        !String(selectedEvent.id).startsWith('birthday-') && !String(selectedEvent.id).startsWith('appt-') && (
                                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase">
                                                    {isRTL ? 'تغيير الحالة' : 'Changer le statut'}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedEvent.status !== 'in_progress' && (
                                                        <button
                                                            onClick={() => handleStatusChange('in_progress')}
                                                            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            {isRTL ? 'قيد التنفيذ' : 'En cours'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleStatusChange('completed')}
                                                        className="px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        {isRTL ? 'مكتمل' : 'Terminé'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange('cancelled')}
                                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        {isRTL ? 'إلغاء' : 'Annuler'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modals de création */}
            <EventModal
                isOpen={showEventModal}
                onClose={() => setShowEventModal(false)}
                onSuccess={handleModalSuccess}
            />

            <TaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onSuccess={handleModalSuccess}
            />

            <CreateAppointmentModal
                isOpen={showAppointmentModal}
                onClose={() => setShowAppointmentModal(false)}
                onSuccess={handleModalSuccess}
                prefilledDate={selectedDate}
            />
        </div>
    );
};

export default WeeklyPlanningPage;
