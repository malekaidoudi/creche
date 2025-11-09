import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

const EVENT_TYPE_ICONS = {
  memo: '📝',
  task: '✅',
  rdv: '📅',
  birthday: '🎂',
  vacation_reminder: '🏖️',
  medical: '🏥',
  meeting: '👥',
  custom: '⭐'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
};

const UpcomingEventsWidget = ({ days = 7, limit = 5 }) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingEvents();
  }, [days]);

  const loadUpcomingEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/events/views/upcoming?days=${days}&limit=${limit}`);
      
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Erreur chargement événements à venir:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return isRTL ? 'اليوم' : 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return isRTL ? 'غدا' : 'Demain';
    } else if (diffDays < 7) {
      return isRTL ? `في ${diffDays} أيام` : `Dans ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: isRTL ? 'منخفضة' : 'Basse',
      medium: isRTL ? 'متوسطة' : 'Moyenne',
      high: isRTL ? 'عالية' : 'Haute',
      urgent: isRTL ? 'عاجلة' : 'Urgente'
    };
    return labels[priority] || priority;
  };

  const getTypeLabel = (type) => {
    const labels = {
      memo: isRTL ? 'مذكرة' : 'Mémo',
      task: isRTL ? 'مهمة' : 'Tâche',
      rdv: isRTL ? 'موعد' : 'RDV',
      birthday: isRTL ? 'عيد ميلاد' : 'Anniversaire',
      vacation_reminder: isRTL ? 'تذكير عطلة' : 'Rappel Vacances',
      medical: isRTL ? 'موعد طبي' : 'RDV Médical',
      meeting: isRTL ? 'اجتماع' : 'Réunion',
      custom: isRTL ? 'مخصص' : 'Personnalisé'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'الأحداث القادمة' : 'Événements à Venir'}
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'الأحداث القادمة' : 'Événements à Venir'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRTL ? `${days} أيام القادمة` : `${days} prochains jours`}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/dashboard/events/calendar')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
          >
            {isRTL ? 'عرض الكل' : 'Voir tout'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {isRTL ? 'لا توجد أحداث قادمة' : 'Aucun événement à venir'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/dashboard/events/${event.id}`)}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                {/* Icon */}
                <div className="text-2xl flex-shrink-0 mt-1">
                  {EVENT_TYPE_ICONS[event.type] || '📌'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {event.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${PRIORITY_COLORS[event.priority]}`}>
                      {getPriorityLabel(event.priority)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(event.start_date)}</span>
                      {!event.all_day && (
                        <span className="text-xs">• {formatTime(event.start_date)}</span>
                      )}
                    </div>

                    {event.assigned_to_name && (
                      <div className="flex items-center gap-1 text-xs">
                        <span>👤</span>
                        <span className="truncate">{event.assigned_to_name}</span>
                      </div>
                    )}
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>📍</span>
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {events.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button
            onClick={() => navigate('/dashboard/events/list')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium w-full text-center"
          >
            {isRTL ? 'عرض جميع الأحداث' : 'Voir tous les événements'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingEventsWidget;
