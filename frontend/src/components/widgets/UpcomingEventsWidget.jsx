import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Info, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

const EVENT_TYPE_ICONS = {
  general: '📢',
  urgent: '🚨',
  meeting: '👥',
  event: '🎉',
  celebration: '🎊',
  reunion: '👥',
  fete: '🎉',
  sortie: '🚶',
  fermeture: '🔒'
};

const TYPE_COLORS = {
  general: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
  meeting: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  event: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  celebration: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
};

const UpcomingEventsWidget = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/announcements/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Filtrer les anniversaires (ils sont dans le widget Anniversaires)
        const filteredAnnouncements = (response.data.announcements || []).filter(
          ann => ann.event_type !== 'birthday' && ann.event_type !== 'anniversaire'
        );
        // Limiter à 5 événements
        setAnnouncements(filteredAnnouncements.slice(0, 5));
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Erreur chargement annonces:', error);
      setAnnouncements([]);
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

  const getTypeLabel = (eventType) => {
    const labels = {
      general: isRTL ? 'معلومات' : 'Information',
      urgent: isRTL ? 'عاجل' : 'Urgent',
      meeting: isRTL ? 'اجتماع' : 'Réunion',
      event: isRTL ? 'حدث' : 'Événement',
      celebration: isRTL ? 'احتفال' : 'Célébration',
      reunion: isRTL ? 'اجتماع' : 'Réunion',
      fete: isRTL ? 'حفلة' : 'Fête',
      sortie: isRTL ? 'نزهة' : 'Sortie',
      fermeture: isRTL ? 'إغلاق' : 'Fermeture'
    };
    return labels[eventType] || eventType;
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col h-full max-h-[824px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
                {isRTL ? 'هذا الشهر' : 'Ce mois-ci'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto">
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {isRTL ? 'لا توجد أحداث قادمة' : 'Aucun événement à venir'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Icon */}
                <div className="text-2xl flex-shrink-0 mt-1">
                  {EVENT_TYPE_ICONS[announcement.event_type] || '📢'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1 flex-1">
                      {announcement.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${TYPE_COLORS[announcement.event_type] || 'bg-gray-100 text-gray-600'}`}>
                      {getTypeLabel(announcement.event_type)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                    {announcement.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{formatDate(announcement.event_date)}</span>
                    </div>

                    {announcement.author_name && (
                      <div className="flex items-center gap-1 truncate">
                        <span>👤</span>
                        <span className="truncate">{announcement.author_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEventsWidget;
