import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { Calendar, Filter, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import QuickEventModal from '../../components/modals/QuickEventModal';
import EventModal from '../../components/modals/EventModal';
import TaskModal from '../../components/modals/TaskModal';
import CreateAppointmentModal from '../../components/modals/CreateAppointmentModal';

const EVENT_TYPE_COLORS = {
  event: '#3B82F6',       // Bleu - Événement
  task: '#10B981',        // Vert - Tâche
  birthday: '#EC4899',    // Rose - Anniversaire
  vacation_reminder: '#F59E0B', // Orange - Vacances
  rdv: '#8B5CF6',         // Violet - RDV
  meeting: '#6366F1'      // Indigo - Réunion
};

const EventsCalendar = () => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const [searchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [initialFilterApplied, setInitialFilterApplied] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [dayEvents, setDayEvents] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const loadEvents = useCallback(async () => {
    try {
      console.log('🔄 ADMIN/STAFF CALENDAR - Début chargement');
      console.log('📋 Filtres actifs:', selectedTypes);

      setLoading(true);

      // Charger tous les événements des 12 prochains mois
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 12, 0);

      console.log('📅 Période:', { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });

      const params = new URLSearchParams({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      });

      if (selectedTypes.length > 0) {
        params.append('type', selectedTypes.join(','));
      }

      console.log('🌐 ADMIN/STAFF - Requête événements:', `/api/events/views/calendar?${params}`);
      const response = await api.get(`/api/events/views/calendar?${params}`);
      console.log('📅 ADMIN/STAFF - Réponse API events:', response.data);
      console.log('📅 ADMIN/STAFF - Nombre d\'events:', response.data.events?.length);

      if (response.data.success) {
        // Debug: Afficher les 3 premiers événements bruts
        console.log('🔍 3 premiers événements bruts:', response.data.events.slice(0, 3));

        // Transformer les événements pour FullCalendar
        const formattedEvents = (response.data.events || []).map(event => {
          return {
            id: event.id,
            title: event.title,
            start: event.start || event.start_date, // L'API retourne 'start', pas 'start_date'
            end: event.end || event.end_date || event.start || event.start_date,
            allDay: event.allDay !== undefined ? event.allDay : event.all_day,
            backgroundColor: event.color || EVENT_TYPE_COLORS[event.type],
            borderColor: event.color || EVENT_TYPE_COLORS[event.type],
            extendedProps: {
              type: event.type,
              status: event.status,
              priority: event.priority,
              description: event.description,
              location: event.location,
              assigned_to_name: event.assigned_to_name,
              child_name: event.child_name
            }
          };
        });

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
          console.log('Pas de jours fériés chargés');
        }

        // Charger les vacances annuelles
        let vacationEvents = [];
        try {
          const vacationResponse = await api.get('/api/nursery-settings/annual-vacation');
          if (vacationResponse.data.success && vacationResponse.data.enabled) {
            const startDate = vacationResponse.data.start_date;
            const endDate = vacationResponse.data.end_date;

            if (startDate && endDate) {
              vacationEvents.push({
                id: 'annual-vacation',
                title: '🏖️ Vacances Annuelles',
                start: startDate,
                end: endDate,
                allDay: true,
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                display: 'background',
                extendedProps: {
                  type: 'vacation',
                  isVacation: true
                }
              });
            }
          }
        } catch (error) {
          console.log('Pas de vacances annuelles configurées');
        }

        // Charger les anniversaires des enfants
        let birthdayEvents = [];
        try {
          const childrenResponse = await api.get('/api/children');
          if (childrenResponse.data.success && childrenResponse.data.data) {
            const currentYear = new Date().getFullYear();
            const children = childrenResponse.data.data.children || [];

            birthdayEvents = children
              .filter(child => child.birth_date)
              .map(child => {
                const birthDate = new Date(child.birth_date);
                const birthdayThisYear = `${currentYear}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;

                return {
                  id: `birthday-${child.id}`,
                  title: `🎂 ${child.first_name} ${child.last_name}`,
                  start: birthdayThisYear,
                  allDay: true,
                  backgroundColor: '#EC4899',
                  borderColor: '#EC4899',
                  extendedProps: {
                    type: 'birthday',
                    childId: child.id,
                    isBirthday: true
                  }
                };
              });

            console.log('🎂 Anniversaires chargés:', birthdayEvents.length);
          }
        } catch (error) {
          console.log('Pas d\'anniversaires chargés:', error);
        }

        // Combiner tous les événements
        const allEvents = [...formattedEvents, ...holidayEvents, ...vacationEvents, ...birthdayEvents];
        console.log('📊 Résumé chargement:');
        console.log('  - Événements normaux:', formattedEvents.length);
        console.log('  - Jours fériés:', holidayEvents.length);
        console.log('  - Vacances:', vacationEvents.length);
        console.log('  - Anniversaires:', birthdayEvents.length);
        console.log('  - TOTAL:', allEvents.length);

        // Debug: Afficher les 3 premiers événements formatés
        console.log('🔍 Exemple événements formatés:', allEvents.slice(0, 3));

        setEvents(allEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Erreur chargement événements:', error);
      dialog.error(isRTL ? 'خطأ في تحميل الأحداث' : 'Erreur lors du chargement');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTypes, isRTL]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Appliquer le filtre initial depuis l'URL
  useEffect(() => {
    if (!initialFilterApplied) {
      const filterParam = searchParams.get('filter');
      if (filterParam === 'events') {
        setSelectedTypes(['event', 'meeting']);
      } else if (filterParam === 'tasks') {
        setSelectedTypes(['task', 'memo']);
      }
      setInitialFilterApplied(true);
    }
  }, [searchParams, initialFilterApplied]);

  // Détecter le changement de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEventClick = (info) => {
    // Sur mobile, ne pas naviguer directement, utiliser le collapse panel
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      return; // Ne rien faire, le dateClick gère l'affichage
    }
    // Sur desktop, naviguer vers les détails
    // Ne pas ouvrir les détails pour les jours fériés, anniversaires et vacances
    const eventId = info.event.id;
    if (eventId && !String(eventId).startsWith('holiday-') && !String(eventId).startsWith('birthday-') && eventId !== 'annual-vacation') {
      navigate(`/dashboard/events/${eventId}`);
    }
  };

  const handleDateClick = (info) => {
    const isMobile = window.innerWidth < 1024;
    console.log('📅 ADMIN/STAFF - dateClick déclenché, date:', info.dateStr, 'isMobile:', isMobile);

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

      console.log('📅 ADMIN/STAFF - Événements FullCalendar du jour:', fcEvents.length);

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
    } else {
      // Sur desktop : ouvrir le modal de création
      setSelectedDate(info.dateStr);
      setShowQuickModal(true);
    }
  };

  const handleTypeSelect = (type) => {
    // Après sélection du type, ouvrir le modal approprié
    console.log('🎯 Type sélectionné:', type);

    switch (type) {
      case 'event':
        setShowEventModal(true);
        break;
      case 'task':
        setShowTaskModal(true);
        break;
      case 'rdv':
        setShowAppointmentModal(true);
        break;
      default:
        console.error('Type inconnu:', type);
    }
  };

  const handleModalSuccess = () => {
    // Recharger les événements après création
    loadEvents();
  };


  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };


  const eventTypes = [
    { value: 'event', label: isRTL ? 'حدث' : 'Événement', icon: '📅' },
    { value: 'task', label: isRTL ? 'مهمة' : 'Tâche', icon: '✅' },
    { value: 'birthday', label: isRTL ? 'عيد ميلاد' : 'Anniversaire', icon: '🎂' },
    { value: 'vacation_reminder', label: isRTL ? 'عطلة' : 'Vacances', icon: '🏖️' },
    { value: 'rdv', label: isRTL ? 'موعد' : 'RDV', icon: '🩺' },
    { value: 'meeting', label: isRTL ? 'اجتماع' : 'Réunion', icon: '👥' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'تقويم الأحداث' : 'Calendrier des Événements'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isRTL ? 'عرض وإدارة جميع الأحداث' : 'Visualiser et gérer tous les événements'}
            </p>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
            {isRTL ? 'تصفية حسب النوع' : 'Filtrer par type'}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
          {eventTypes.map(type => (
            <button
              key={type.value}
              onClick={() => toggleTypeFilter(type.value)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 transition-all ${selectedTypes.includes(type.value)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              style={
                selectedTypes.includes(type.value)
                  ? { borderColor: EVENT_TYPE_COLORS[type.value] }
                  : {}
              }
            >
              <span className="text-base sm:text-lg">{type.icon}</span>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{type.label}</span>
            </button>
          ))}
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
          /* Header calendrier - Centrage et taille responsive */
          @media (max-width: 1023px) {
            .fc-toolbar {
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              padding: 0.5rem 0 !important;
            }
            
            .fc-toolbar-chunk {
              display: flex !important;
              align-items: center !important;
            }
            
            /* Centrer le titre */
            .fc-toolbar-title {
              font-size: 1rem !important;
              text-align: center !important;
              margin: 0 !important;
              flex: 1 !important;
            }
            
            /* Boutons flèches */
            .fc-button {
              padding: 0.25rem 0.5rem !important;
              font-size: 0.875rem !important;
            }
            
            .fc-prev-button,
            .fc-next-button {
              min-width: 2rem !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
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
            /* Centrer la date sur mobile */
            .fc-daygrid-day-top {
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              padding: 4px !important;
            }
            .fc-daygrid-day-number {
              text-align: center !important;
            }
            /* Masquer le contenu texte des événements sur mobile */
            .fc-event-main,
            .fc-event-title,
            .fc-event-time {
              display: none !important;
            }
            /* Style transparent pour les événements sur mobile */
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
              left: 'prev',
              center: 'title',
              right: 'next'
            }}
            buttonText={{
              today: isRTL ? 'اليوم' : 'Aujourd\'hui',
              month: isRTL ? 'شهر' : 'Mois',
              week: isRTL ? 'أسبوع' : 'Semaine',
              day: isRTL ? 'يوم' : 'Jour'
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={false}
            weekends={true}
            eventDisplay="block"
            displayEventTime={true}
            displayEventEnd={true}
            nowIndicator={true}
            eventDidMount={(info) => {
              const isMobile = window.innerWidth < 1024;
              console.log('🎨 ADMIN/STAFF eventDidMount - isMobile:', isMobile, 'width:', window.innerWidth, 'event:', info.event.title);

              // UNIQUEMENT sur mobile : remplacer par un point
              if (isMobile) {
                console.log('📍 ADMIN/STAFF - Création point pour:', info.event.title);
                info.el.innerHTML = `<div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${info.event.backgroundColor};"></div>`;
                info.el.style.cssText = 'background: transparent !important; border: none !important; padding: 0 !important; margin: 0 2px !important; pointer-events: none !important;';
              } else {
                console.log('📝 ADMIN/STAFF - Desktop, affichage normal pour:', info.event.title);
              }
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          {isRTL ? 'مفتاح الألوان' : 'Légende'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {eventTypes.map(type => (
            <div key={type.value} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: EVENT_TYPE_COLORS[type.value] }}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {type.icon} {type.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal - Liste des événements d'une journée (mobile/tablette) */}
      {showDayEventsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'أحداث اليوم' : 'Événements du jour'}
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
                            navigate(`/dashboard/events/${event.id}`);
                          }}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          {isRTL ? 'عرض التفاصيل' : 'Voir les détails'}
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

      {/* Modal de sélection de type */}
      <QuickEventModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        selectedDate={selectedDate}
        onTypeSelect={handleTypeSelect}
      />

      {/* Modal Événement */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Modal Tâche */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Modal Rendez-vous */}
      <CreateAppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSuccess={handleModalSuccess}
        prefilledDate={selectedDate}
      />
    </div>
  );
};

export default EventsCalendar;
