import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { Calendar, Plus, Filter, Download } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const EVENT_TYPE_COLORS = {
  memo: '#3B82F6',        // Bleu
  task: '#10B981',        // Vert
  rdv: '#8B5CF6',         // Violet
  birthday: '#EC4899',    // Rose
  vacation_reminder: '#F59E0B', // Orange
  medical: '#EF4444',     // Rouge
  meeting: '#6366F1',     // Indigo
  custom: '#6B7280'       // Gris
};

const EventsCalendar = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  
  const [events, setEvents] = useState([]);
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
      
      if (selectedTypes.length > 0) {
        params.append('type', selectedTypes.join(','));
      }
      
      const response = await api.get(`/api/events/views/calendar?${params}`);
      
      if (response.data.success) {
        // Transformer les événements pour FullCalendar
        const formattedEvents = (response.data.events || []).map(event => ({
          id: event.id,
          title: event.title,
          start: event.start_date,
          end: event.end_date || event.start_date,
          allDay: event.all_day,
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
        }));
        
        setEvents(formattedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Erreur chargement événements:', error);
      toast.error(isRTL ? 'خطأ في تحميل الأحداث' : 'Erreur lors du chargement');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTypes, isRTL]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventClick = (info) => {
    navigate(`/dashboard/events/${info.event.id}`);
  };

  const handleDateClick = (info) => {
    // Créer un nouvel événement à cette date
    navigate('/dashboard/events/new', {
      state: { date: info.dateStr }
    });
  };


  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const exportCalendar = () => {
    // Exporter au format ICS
    toast.success(isRTL ? 'التصدير قريبا' : 'Export bientôt disponible');
  };

  const eventTypes = [
    { value: 'memo', label: isRTL ? 'مذكرة' : 'Mémo', icon: '📝' },
    { value: 'task', label: isRTL ? 'مهمة' : 'Tâche', icon: '✅' },
    { value: 'rdv', label: isRTL ? 'موعد' : 'RDV', icon: '📅' },
    { value: 'birthday', label: isRTL ? 'عيد ميلاد' : 'Anniversaire', icon: '🎂' },
    { value: 'vacation_reminder', label: isRTL ? 'تذكير عطلة' : 'Vacances', icon: '🏖️' },
    { value: 'medical', label: isRTL ? 'طبي' : 'Médical', icon: '🏥' },
    { value: 'meeting', label: isRTL ? 'اجتماع' : 'Réunion', icon: '👥' },
    { value: 'custom', label: isRTL ? 'مخصص' : 'Personnalisé', icon: '⭐' }
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

        <div className="flex items-center gap-3">
          <button
            onClick={exportCalendar}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isRTL ? 'تصدير' : 'Exporter'}</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/events/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'حدث جديد' : 'Nouvel Événement'}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            {isRTL ? 'تصفية حسب النوع' : 'Filtrer par type'}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {eventTypes.map(type => (
            <button
              key={type.value}
              onClick={() => toggleTypeFilter(type.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                selectedTypes.includes(type.value)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              style={
                selectedTypes.includes(type.value)
                  ? { borderColor: EVENT_TYPE_COLORS[type.value] }
                  : {}
              }
            >
              <span className="text-lg">{type.icon}</span>
              <span className="text-sm font-medium">{type.label}</span>
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
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            weekends={true}
            eventDisplay="block"
            displayEventTime={true}
            displayEventEnd={true}
            nowIndicator={true}
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
    </div>
  );
};

export default EventsCalendar;
