import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Filter } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useLanguage } from '../../hooks/useLanguage';
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

    const loadEvents = useCallback(async () => {
        try {
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

            const eventsResponse = await api.get(`/api/events/views/calendar?${params}`);
            const formattedEvents = eventsResponse.data.events.map(event => ({
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
                const childrenResponse = await api.get('/api/children');
                if (childrenResponse.data.success && childrenResponse.data.children) {
                    birthdayEvents = childrenResponse.data.children
                        .filter(child => child.date_of_birth)
                        .map(child => {
                            const birthDate = new Date(child.date_of_birth);
                            const currentYear = new Date().getFullYear();
                            return {
                                id: `birthday-${child.id}`,
                                title: `🎂 ${child.first_name} ${child.last_name}`,
                                start: `${currentYear}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`,
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
                // Anniversaires non chargés
            }

            // Combiner tous les événements
            const combinedEvents = [...formattedEvents, ...holidayEvents, ...vacationEvents, ...birthdayEvents];

            // Stocker tous les événements
            setAllEvents(combinedEvents);
            setEvents(combinedEvents);
        } catch (error) {
            toast.error(isRTL ? 'خطأ في تحميل الأحداث' : 'Erreur lors du chargement des événements');
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
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale={frLocale}
                            direction={isRTL ? 'rtl' : 'ltr'}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            buttonText={{
                                today: isRTL ? 'اليوم' : 'Aujourd\'hui',
                                month: isRTL ? 'شهر' : 'Mois',
                                week: isRTL ? 'أسبوع' : 'Semaine',
                                day: isRTL ? 'يوم' : 'Jour'
                            }}
                            events={events}
                            key={events.length}
                            editable={false}
                            selectable={false}
                            selectMirror={true}
                            dayMaxEvents={true}
                            weekends={true}
                            height="auto"
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: false
                            }}
                            eventClick={(info) => {
                                // Ouvrir la page de détails pour les événements cliquables
                                const eventId = info.event.id;
                                if (eventId && !eventId.startsWith('holiday-') && !eventId.startsWith('birthday-') && eventId !== 'annual-vacation') {
                                    navigate(`/mon-espace/events/${eventId}`);
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentCalendarPage;
