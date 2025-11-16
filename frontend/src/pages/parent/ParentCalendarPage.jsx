import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EVENT_TYPE_COLORS = {
    event: '#3B82F6',
    task: '#8B5CF6',
    rdv: '#F59E0B',
    meeting: '#10B981',
    birthday: '#EC4899',
    vacation_reminder: '#EC4899',
    holiday: '#EF4444',
    medical: '#EF4444'
};

const ParentCalendarPage = () => {
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const calendarRef = useRef(null);
    const [allEvents, setAllEvents] = useState([]); // Tous les événements chargés
    const [events, setEvents] = useState([]); // Événements filtrés affichés
    const [loading, setLoading] = useState(true);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [showDayEventsModal, setShowDayEventsModal] = useState(false);
    const [dayEvents, setDayEvents] = useState([]);
    const [selectedDayDate, setSelectedDayDate] = useState(null);

    const loadEvents = useCallback(async () => {
        try {
            console.log('🔄 PARENT CALENDAR - Début chargement');
            setLoading(true);

            // Charger tous les événements des 12 prochains mois
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 12, 0);

            const params = new URLSearchParams({
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            });

            // Ne PAS envoyer le filtre au backend, on filtre tout côté frontend
            // pour inclure les jours fériés, vacances et anniversaires

            const response = await api.get(`/api/events/views/calendar?${params}`);
            console.log('📅 PARENT - Réponse API events:', response.data);
            console.log('📅 PARENT - Événements bruts:', response.data.events?.slice(0, 5));
            console.log('📅 PARENT - Anniversaires dans la réponse:', response.data.events?.filter(e => e.type === 'birthday'));

            if (response.data.success) {
                const formattedEvents = response.data.events.map(event => ({
                    id: event.id,
                    title: event.title,
                    start: event.start || event.start_date,
                    end: event.end || event.end_date || event.start || event.start_date,
                    allDay: event.allDay !== undefined ? event.allDay : event.all_day,
                    backgroundColor: event.color || EVENT_TYPE_COLORS[event.type],
                    borderColor: event.color || EVENT_TYPE_COLORS[event.type],
                    extendedProps: {
                        type: event.type,
                        status: event.status,
                        priority: event.priority,
                        description: event.description,
                        location: event.location
                    }
                }));

                // Charger les jours fériés
                let holidayEvents = [];
                try {
                    const holidaysResponse = await api.get('/api/holidays');
                    if (holidaysResponse.data.success) {
                        holidayEvents = holidaysResponse.data.holidays.map(holiday => ({
                            id: `holiday-${holiday.id}`,
                            title: `🎉 ${holiday.name}`,
                            start: holiday.date.split('T')[0],
                            allDay: true,
                            backgroundColor: '#EF4444',
                            borderColor: '#EF4444',
                            extendedProps: {
                                type: 'holiday',
                                isHoliday: true
                            }
                        }));
                    }
                } catch (error) {
                    // Jours fériés non chargés
                }

                // Charger les vacances annuelles
                let vacationEvents = [];
                try {
                    const vacationResponse = await api.get('/api/nursery-settings/annual-vacation');
                    if (vacationResponse.data.success && vacationResponse.data.enabled && vacationResponse.data.start_date && vacationResponse.data.end_date) {
                        vacationEvents = [{
                            id: 'annual-vacation',
                            title: '🏖️ Vacances annuelles',
                            start: vacationResponse.data.start_date.split('T')[0],
                            end: vacationResponse.data.end_date.split('T')[0],
                            allDay: true,
                            backgroundColor: '#F59E0B',
                            borderColor: '#F59E0B',
                            display: 'background',
                            extendedProps: {
                                type: 'vacation',
                                isVacation: true
                            }
                        }];
                    }
                } catch (error) {
                    // Vacances non chargées
                }

                // Charger les anniversaires
                let birthdayEvents = [];
                try {
                    console.log('🔄 PARENT - Chargement des enfants pour anniversaires...');
                    const childrenResponse = await api.get('/api/children');
                    console.log('📋 PARENT - Réponse API children:', childrenResponse.data);

                    if (childrenResponse.data.success && childrenResponse.data.children) {
                        console.log('👶 PARENT - Nombre d\'enfants:', childrenResponse.data.children.length);
                        console.log('👶 PARENT - Enfants avec date de naissance:', childrenResponse.data.children.filter(c => c.date_of_birth));

                        birthdayEvents = childrenResponse.data.children
                            .filter(child => child.date_of_birth)
                            .map(child => {
                                const birthDate = new Date(child.date_of_birth);
                                const currentYear = new Date().getFullYear();
                                const birthdayThisYear = `${currentYear}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
                                console.log(`🎂 PARENT - Anniversaire de ${child.first_name}: ${birthdayThisYear}`);
                                return {
                                    id: `birthday-${child.id}`,
                                    title: `🎂 ${child.first_name} ${child.last_name}`,
                                    start: birthdayThisYear,
                                    allDay: true,
                                    backgroundColor: '#EC4899',
                                    borderColor: '#EC4899',
                                    extendedProps: {
                                        type: 'birthday',
                                        childId: child.id
                                    }
                                };
                            });

                    }
                } catch (error) {
                    console.error('❌ PARENT - Erreur chargement anniversaires:', error);
                    console.error('❌ PARENT - Détails:', error.response?.data);
                }

                // Combiner tous les événements
                const combinedEvents = [...formattedEvents, ...holidayEvents, ...birthdayEvents, ...vacationEvents];
                console.log('✅ PARENT - Total événements combinés:', combinedEvents.length);
                console.log('📋 PARENT - Événements:', combinedEvents.slice(0, 3));
                console.log('🎂 PARENT - Anniversaires:', birthdayEvents);
                setAllEvents(combinedEvents);
                setEvents(combinedEvents);
            }
        } catch (error) {
            console.error('❌ PARENT - Erreur chargement événements:', error);
            console.error('❌ PARENT - Détails erreur:', error.response?.data);
            toast.error('Erreur lors du chargement des événements');
            setAllEvents([]);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [isRTL]); // Retirer selectedTypes des dépendances

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    // Effet séparé pour filtrer les événements quand selectedTypes change
    useEffect(() => {
        if (selectedTypes.length === 0) {
            setEvents(allEvents);
        } else {
            // Filtrer selon les types sélectionnés
            const filtered = allEvents.filter(event => {
                const eventType = event.extendedProps?.type || event.type;
                return selectedTypes.includes(eventType);
            });
            setEvents(filtered);
        }
    }, [selectedTypes, allEvents]);

    const toggleTypeFilter = (type) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const eventTypes = [
        { value: 'event', label: isRTL ? 'حدث' : 'Réunion/Célébration', icon: '📅' },
        { value: 'birthday', label: isRTL ? 'عيد ميلاد' : 'Anniversaire', icon: '🎂' },
        { value: 'vacation_reminder', label: isRTL ? 'عطلة' : 'Vacances', icon: '🏖️' },
        { value: 'rdv', label: isRTL ? 'موعد' : 'RDV', icon: '🩺' },
        { value: 'holiday', label: isRTL ? 'عطلة رسمية' : 'Jours fériés', icon: '🎉' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Bouton retour */}
                <button
                    onClick={() => navigate('/mon-espace')}
                    className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">{isRTL ? 'العودة إلى مساحتي' : 'Retour à Mon Espace'}</span>
                </button>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isRTL ? 'تقويم الأحداث' : 'Calendrier'}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isRTL ? 'عرض الأحداث والمواعيد' : 'Événements et rendez-vous'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900 dark:text-white">
                            {isRTL ? 'تصفية حسب النوع' : 'Filtrer par type'}
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {eventTypes.map(type => {
                            const isSelected = selectedTypes.includes(type.value);
                            const borderColor = EVENT_TYPE_COLORS[type.value];

                            return (
                                <button
                                    key={type.value}
                                    onClick={() => toggleTypeFilter(type.value)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    style={
                                        isSelected
                                            ? { borderColor: borderColor }
                                            : {}
                                    }
                                >
                                    <span className="text-lg">{type.icon}</span>
                                    <span className="text-sm font-medium">{type.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedTypes.length > 0 && (
                        <button
                            onClick={() => setSelectedTypes([])}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            {isRTL ? 'مسح الفلاتر' : 'Effacer les filtres'}
                        </button>
                    )}
                </div>

                {/* Calendar */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <style>{`
                        /* Forcer la visibilité des en-têtes de colonnes en mode dark */
                        .dark .fc-col-header-cell {
                            background-color: #1f2937 !important;
                        }
                        .dark .fc-col-header-cell-cushion {
                            color: #e5e7eb !important;
                        }
                        
                        /* Masquer les bordures de grille sur mobile et tablette */
                        @media (max-width: 1023px) {
                            .fc-scrollgrid {
                                border: none !important;
                            }
                            .fc-scrollgrid td,
                            .fc-scrollgrid th {
                                border: none !important;
                            }
                            .fc-col-header-cell {
                                border: none !important;
                            }
                            .fc-daygrid-day {
                                border: none !important;
                            }
                            .fc-daygrid-day-frame {
                                min-height: 50px !important;
                            }
                            /* Centrer la date */
                            .fc-daygrid-day-top {
                                display: flex !important;
                                justify-content: center !important;
                                align-items: center !important;
                                padding: 4px !important;
                            }
                            .fc-daygrid-day-number {
                                text-align: center !important;
                            }
                            /* Masquer complètement le contenu par défaut sur mobile */
                            .fc-event-main,
                            .fc-event-title,
                            .fc-event-time {
                                display: none !important;
                            }
                            .fc-event {
                                background: transparent !important;
                                border: none !important;
                                padding: 0 !important;
                            }
                            /* Positionner les points en bas */
                            .fc-daygrid-day-events {
                                display: flex !important;
                                flex-wrap: wrap !important;
                                align-items: flex-end !important;
                                justify-content: center !important;
                                gap: 2px !important;
                                min-height: 20px !important;
                                padding-bottom: 2px !important;
                            }
                        }
                    `}</style>
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {isRTL ? 'جاري التحميل...' : 'Chargement...'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale={frLocale}
                            direction={isRTL ? 'rtl' : 'ltr'}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: ''
                            }}
                            buttonText={{
                                today: isRTL ? 'اليوم' : 'Aujourd\'hui',
                                month: isRTL ? 'شهر' : 'Mois',
                                week: isRTL ? 'أسبوع' : 'Semaine',
                                day: isRTL ? 'يوم' : 'Jour'
                            }}
                            events={events}
                            editable={false}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={false}
                            weekends={true}
                            height="auto"
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: false
                            }}
                            dateClick={(info) => {
                                const isMobile = window.innerWidth < 1024;
                                console.log('📅 PARENT - dateClick déclenché, date:', info.dateStr, 'isMobile:', isMobile);
                                if (isMobile) {
                                    // Récupérer les événements directement depuis FullCalendar
                                    const calendarApi = info.view.calendar;
                                    const clickedDate = info.dateStr;
                                    const startOfDay = new Date(clickedDate + 'T00:00:00');
                                    const endOfDay = new Date(clickedDate + 'T23:59:59');

                                    // Récupérer tous les événements de FullCalendar pour cette journée
                                    const fcEvents = calendarApi.getEvents().filter(event => {
                                        const eventStart = event.start;
                                        return eventStart >= startOfDay && eventStart <= endOfDay;
                                    });

                                    console.log('📅 PARENT - Événements FullCalendar du jour:', fcEvents.length);

                                    if (fcEvents.length > 0) {
                                        // Convertir les événements FullCalendar en format simple
                                        const eventsOnDay = fcEvents.map(fcEvent => ({
                                            id: fcEvent.id,
                                            title: fcEvent.title,
                                            start: fcEvent.start,
                                            end: fcEvent.end,
                                            allDay: fcEvent.allDay,
                                            backgroundColor: fcEvent.backgroundColor,
                                            borderColor: fcEvent.borderColor,
                                            extendedProps: fcEvent.extendedProps
                                        }));

                                        setDayEvents(eventsOnDay);
                                        setSelectedDayDate(clickedDate);
                                        setShowDayEventsModal(true);
                                    }
                                }
                            }}
                            eventClick={(info) => {
                                // Sur mobile, ne pas naviguer directement, utiliser le modal
                                const isMobile = window.innerWidth < 1024;
                                if (isMobile) {
                                    return; // Ne rien faire, le dateClick gère l'affichage
                                }
                                // Sur desktop, naviguer vers les détails
                                const eventId = info.event.id;
                                if (eventId && !String(eventId).startsWith('holiday-') && !String(eventId).startsWith('birthday-') && eventId !== 'annual-vacation') {
                                    navigate(`/mon-espace/events/${eventId}`);
                                }
                            }}
                            eventDidMount={(info) => {
                                const isMobile = window.innerWidth < 1024;
                                const eventDate = info.event.start;
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const isPast = eventDate < today;

                                // Afficher les événements passés en gris
                                if (isPast) {
                                    info.el.style.opacity = '0.5';
                                    info.el.style.filter = 'grayscale(70%)';
                                }

                                // UNIQUEMENT sur mobile : remplacer par un point
                                if (isMobile) {
                                    const color = isPast ? '#9ca3af' : info.event.backgroundColor;
                                    info.el.innerHTML = `<div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${color};"></div>`;
                                    info.el.style.cssText = 'background: transparent !important; border: none !important; padding: 0 !important; margin: 0 2px !important; pointer-events: none !important;';
                                }
                                // Sur desktop : ne rien faire, laisser l'affichage par défaut
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Modal - Liste des événements d'une journée (mobile/tablette) */}
            {showDayEventsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Événements du jour
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {selectedDayDate && new Date(selectedDayDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDayEventsModal(false)}
                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(80vh-80px)]">
                            {dayEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                                            style={{ backgroundColor: event.backgroundColor }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                {event.title}
                                            </h4>
                                            {!event.allDay && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                    {new Date(event.start).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            )}
                                            {event.extendedProps?.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    {event.extendedProps.description}
                                                </p>
                                            )}
                                            {!String(event.id).startsWith('holiday-') && !String(event.id).startsWith('birthday-') && event.id !== 'annual-vacation' && (
                                                <button
                                                    onClick={() => {
                                                        setShowDayEventsModal(false);
                                                        navigate(`/mon-espace/events/${event.id}`);
                                                    }}
                                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    Voir les détails
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentCalendarPage;
