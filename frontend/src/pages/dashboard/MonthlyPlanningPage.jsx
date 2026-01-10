import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { Calendar, Filter, X, ChevronRight, Clock, User, MapPin, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import QuickEventModal from '../../components/modals/QuickEventModal';
import EventModal from '../../components/modals/EventModal';
import TaskModal from '../../components/modals/TaskModal';
import CreateAppointmentModal from '../../components/modals/CreateAppointmentModal';
import MobilePlanning from '../../components/mobile/MobilePlanning';
import MobileNavigation from '../../components/mobile/MobileNavigation';

const EVENT_TYPE_COLORS = {
  event: '#3B82F6',       // Bleu - Événement
  task: '#10B981',        // Vert - Tâche
  birthday: '#EC4899',    // Rose - Anniversaire
  vacation_reminder: '#F59E0B', // Orange - Vacances
  rdv: '#8B5CF6',         // Violet - RDV
  meeting: '#6366F1'      // Indigo - Réunion
};

const MonthlyPlanningPage = () => {
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const dialog = useDialogContext();
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
  const [prefilledParentId, setPrefilledParentId] = useState(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [dayEvents, setDayEvents] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);

  // Modal de détails d'événement
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

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

  const handleEventClick = async (info) => {
    // Ne pas ouvrir les détails pour les jours fériés et vacances
    const eventId = info.event.id;
    if (!eventId || String(eventId).startsWith('holiday-') || eventId === 'annual-vacation') {
      return;
    }

    // Pour les anniversaires, afficher directement
    if (String(eventId).startsWith('birthday-')) {
      setSelectedEvent({
        id: eventId,
        title: info.event.title,
        type: 'birthday',
        start_date: info.event.start
      });
      setShowDetailModal(true);
      return;
    }

    // Charger les détails complets de l'événement
    try {
      const response = await api.get(`/api/events/${eventId}`);
      if (response.data.success) {
        setSelectedEvent(response.data.event);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      // Fallback avec les données locales
      setSelectedEvent({
        id: eventId,
        title: info.event.title,
        type: info.event.extendedProps?.type,
        start_date: info.event.start,
        description: info.event.extendedProps?.description
      });
      setShowDetailModal(true);
    }
  };

  // Ouvrir le modal de détails depuis la liste du jour
  const openEventDetail = async (event) => {
    const eventId = event.id;

    // Pour les anniversaires et jours fériés
    if (String(eventId).startsWith('birthday-') || String(eventId).startsWith('holiday-') || eventId === 'annual-vacation') {
      setSelectedEvent({
        id: eventId,
        title: event.title,
        type: String(eventId).startsWith('birthday-') ? 'birthday' : 'holiday',
        start_date: event.start
      });
      setShowDetailModal(true);
      return;
    }

    // Charger les détails complets
    try {
      const response = await api.get(`/api/events/${eventId}`);
      if (response.data.success) {
        setSelectedEvent(response.data.event);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      setSelectedEvent({
        id: eventId,
        title: event.title,
        type: event.extendedProps?.type,
        start_date: event.start,
        description: event.extendedProps?.description
      });
      setShowDetailModal(true);
    }
  };

  // Changer le statut d'un événement
  const handleStatusChange = async (newStatus) => {
    if (!selectedEvent?.id || String(selectedEvent.id).startsWith('birthday-') || String(selectedEvent.id).startsWith('holiday-')) {
      return;
    }

    try {
      const response = await api.patch(`/api/events/${selectedEvent.id}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setSelectedEvent(prev => ({ ...prev, status: newStatus }));
        dialog.success(isRTL ? 'تم تحديث الحالة' : 'Statut mis à jour');
        loadEvents();
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      dialog.error(isRTL ? 'خطأ في تحديث الحالة' : 'Erreur lors de la mise à jour');
    }
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
      holiday: isRTL ? 'عطلة' : 'Jour férié'
    };
    return labels[type] || type;
  };

  const handleDateClick = (info) => {
    console.log('📅 dateClick déclenché, date:', info.dateStr);

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

    console.log('📅 Événements du jour:', fcEvents.length);

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

    // Toujours ouvrir le modal avec les tâches du jour + boutons création
    setDayEvents(eventsOnDay);
    setSelectedDayDate(clickedDate);
    setSelectedDate(clickedDate);
    setShowDayEventsModal(true);
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

  // Version Mobile
  if (isMobile) {
    return (
      <>
        <MobilePlanning
          events={events}
          loading={loading}
          onAddEvent={() => setShowQuickModal(true)}
          onEventClick={(event) => {
            setSelectedEvent(event);
            setShowDetailModal(true);
          }}
          onDateChange={(date) => setSelectedDate(date.toISOString().split('T')[0])}
        />

        {/* Modals */}
        <QuickEventModal
          isOpen={showQuickModal}
          onClose={() => setShowQuickModal(false)}
          selectedDate={selectedDate}
          onSelectType={handleTypeSelect}
        />
        <EventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          selectedDate={selectedDate}
          onSuccess={handleModalSuccess}
        />
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          selectedDate={selectedDate}
          onSuccess={handleModalSuccess}
        />
        <CreateAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          selectedDate={selectedDate}
          onSuccess={handleModalSuccess}
        />

        <MobileNavigation />
      </>
    );
  }

  // Version Desktop
  return (
    <div className="space-y-6">
      {/* Header - Style unifié avec Planning Hebdomadaire */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                {isRTL ? 'التخطيط الشهري' : 'Planning Mensuel'}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {isRTL ? 'عرض وإدارة جميع الأحداث والمهام' : 'Visualiser et gérer tous les événements et tâches'}
              </p>
            </div>
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
          /* Dark mode support pour FullCalendar */
          .dark .fc-col-header-cell-cushion,
          .dark .fc-daygrid-day-number {
            color: #e5e7eb !important;
          }
          .dark .fc-toolbar-title {
            color: #f3f4f6 !important;
          }
          .dark .fc-scrollgrid,
          .dark .fc-scrollgrid td,
          .dark .fc-scrollgrid th {
            border-color: #374151 !important;
          }
          .dark .fc-daygrid-day {
            background-color: transparent !important;
          }
          .dark .fc-day-today {
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
          .dark .fc-col-header {
            background-color: #1f2937 !important;
          }
          .dark .fc-col-header-cell {
            background-color: #1f2937 !important;
          }
          
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
            dayMaxEvents={3}
            weekends={true}
            eventDisplay="auto"
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

      {/* Modal - Tâches du jour + Actions de création */}
      {showDayEventsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedDayDate && new Date(selectedDayDate + 'T00:00:00').toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h3>
                <p className="text-sm text-blue-100 mt-0.5">
                  {dayEvents.length} {isRTL ? 'عناصر' : dayEvents.length > 1 ? 'éléments' : 'élément'}
                </p>
              </div>
              <button
                onClick={() => setShowDayEventsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Boutons de création rapide */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                {isRTL ? 'إضافة جديد' : 'Ajouter'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setShowDayEventsModal(false);
                    setShowEventModal(true);
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <span className="text-xl">📅</span>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{isRTL ? 'حدث' : 'Événement'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowDayEventsModal(false);
                    setShowTaskModal(true);
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors border border-green-200 dark:border-green-800"
                >
                  <span className="text-xl">✅</span>
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">{isRTL ? 'مهمة' : 'Tâche'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowDayEventsModal(false);
                    setShowAppointmentModal(true);
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
                >
                  <span className="text-xl">📋</span>
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{isRTL ? 'موعد' : 'RDV'}</span>
                </button>
              </div>
            </div>

            {/* Liste des tâches du jour */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-220px)]">
              {dayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'لا توجد أحداث في هذا اليوم' : 'Aucun événement ce jour'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {isRTL ? 'استخدم الأزرار أعلاه للإضافة' : 'Utilisez les boutons ci-dessus pour en créer'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    {isRTL ? 'الأحداث' : 'Événements'}
                  </p>
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => {
                        if (event.id !== 'annual-vacation') {
                          setShowDayEventsModal(false);
                          openEventDetail(event);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${event.id !== 'annual-vacation'
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer hover:shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                        }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.backgroundColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {event.title}
                        </h4>
                        {!event.allDay && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(event.start).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                      {event.id !== 'annual-vacation' && (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
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
        onClose={() => {
          setShowAppointmentModal(false);
          setPrefilledParentId(null);
        }}
        onSuccess={handleModalSuccess}
        prefilledDate={selectedDate}
        prefilledParentId={prefilledParentId}
      />

      {/* Modal de détails d'événement */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden">
            {/* Header avec type */}
            <div className={`p-4 ${selectedEvent.type === 'birthday' ? 'bg-gradient-to-r from-pink-500 to-rose-500'
              : selectedEvent.type === 'rdv' ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : selectedEvent.type === 'task' ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  : selectedEvent.type === 'holiday' ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              } text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {selectedEvent.type === 'birthday' ? '🎂' :
                      selectedEvent.type === 'rdv' ? '📅' :
                        selectedEvent.type === 'task' ? '✅' :
                          selectedEvent.type === 'memo' ? '📝' :
                            selectedEvent.type === 'holiday' ? '🏖️' : '📌'}
                  </span>
                  <div>
                    <p className="text-xs text-white/80 uppercase tracking-wide">
                      {getTypeLabel(selectedEvent.type)}
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
                      {selectedEvent.type !== 'birthday' && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          {new Date(selectedEvent.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
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
                {selectedEvent.child_name && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-lg">👶</span>
                    <span className="text-gray-900 dark:text-white">
                      {selectedEvent.child_name}
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

              {/* Actions spéciales pour tâche urgente RDV */}
              {selectedEvent.metadata?.is_urgent_appointment && selectedEvent.status === 'pending' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase">
                    {isRTL ? 'إجراءات' : 'Actions'}
                  </p>
                  <div className="space-y-2">
                    {/* Bouton créer nouveau RDV */}
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedDate(selectedEvent.metadata?.proposed_date || new Date().toISOString().split('T')[0]);
                        setPrefilledParentId(selectedEvent.metadata?.parent_id || null);
                        setShowAppointmentModal(true);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <Calendar className="w-4 h-4" />
                      {isRTL ? 'إنشاء موعد جديد' : 'Créer nouveau RDV'}
                    </button>
                    {/* Bouton marquer comme traité */}
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isRTL ? 'تم التعامل معه' : 'Marquer comme traité'}
                    </button>
                  </div>
                  {selectedEvent.metadata?.parent_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                      {isRTL ? 'الوالد:' : 'Parent:'} {selectedEvent.metadata.parent_name}
                    </p>
                  )}
                </div>
              )}

              {/* Actions de statut standard */}
              {selectedEvent.status && selectedEvent.status !== 'completed' && selectedEvent.status !== 'cancelled' &&
                !selectedEvent.metadata?.is_urgent_appointment &&
                !String(selectedEvent.id).startsWith('birthday-') && !String(selectedEvent.id).startsWith('holiday-') && (
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
        </div>
      )}
    </div>
  );
};

export default MonthlyPlanningPage;
