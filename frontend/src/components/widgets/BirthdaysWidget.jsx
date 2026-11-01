import React, { useState, useEffect } from 'react';
import { Cake, Calendar, Users, PartyPopper, Baby } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import API_CONFIG from '../../config/api';
import WidgetCard, { WidgetEmptyState } from '../ui/WidgetCard';

const resolveChildPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http') || photoUrl.startsWith('data:')) return photoUrl;
  return `${API_CONFIG.BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

// Cache mémoire pour affichage instantané des anniversaires et événements
let cachedBirthdays = null;
let cachedEvents = null;

const EventsWidget = ({ isMobileView = false }) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [birthdays, setBirthdays] = useState(() => cachedBirthdays || []);
  const [events, setEvents] = useState(() => cachedEvents || []);
  const [loading, setLoading] = useState(() => cachedBirthdays === null && cachedEvents === null);
  const [filter, setFilter] = useState('all'); // 'all', 'events', 'birthdays'
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (cachedBirthdays === null && cachedEvents === null) {
        setLoading(true);
      }

      // Anniversaires et événements du mois sont indépendants: on les charge
      // en parallèle plutôt qu'en cascade.
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [birthdaysResult, eventsResult] = await Promise.allSettled([
        api.get('/api/children/birthdays/month'),
        api.get(`/api/events?start_date=${startOfMonth}&end_date=${endOfMonth}&limit=50`)
      ]);

      if (birthdaysResult.status === 'fulfilled' && birthdaysResult.value.data.success) {
        const sortedBirthdays = (birthdaysResult.value.data.children || []).map(b => ({
          ...b,
          itemType: 'birthday',
          displayDate: b.start_date
        })).sort((a, b) => new Date(a.start_date).getDate() - new Date(b.start_date).getDate());
        cachedBirthdays = sortedBirthdays;
        setBirthdays(sortedBirthdays);
      }

      if (eventsResult.status === 'fulfilled' && eventsResult.value.data.success) {
        const filteredEvents = (eventsResult.value.data.events || [])
          .filter(e => ['meeting', 'celebration', 'event', 'birthday'].includes(e.type))
          .map(e => ({
            ...e,
            itemType: 'event',
            displayDate: e.start_date
          }))
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        cachedEvents = filteredEvents;
        setEvents(filteredEvents);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate, eventDate) => {
    const birth = new Date(birthDate);
    const event = new Date(eventDate);
    let age = event.getFullYear() - birth.getFullYear();
    const monthDiff = event.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && event.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getDaysUntil = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return isRTL ? 'مضى' : 'Passé';
    if (diffDays === 0) return isRTL ? 'اليوم' : 'Aujourd\'hui';
    if (diffDays === 1) return isRTL ? 'غدا' : 'Demain';
    return isRTL ? `في ${diffDays} أيام` : `Dans ${diffDays} jours`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short' });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'meeting': return Users;
      case 'celebration': return PartyPopper;
      case 'birthday': return Cake;
      default: return Calendar;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'celebration': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'birthday': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400 border-pink-200 dark:border-pink-800';
      default: return 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 border-green-200 dark:border-green-800';
    }
  };

  // Combiner et filtrer les données
  const getFilteredItems = () => {
    let items = [];
    if (filter === 'all' || filter === 'birthdays') {
      items = [...items, ...birthdays];
    }
    if (filter === 'all' || filter === 'events') {
      items = [...items, ...events];
    }
    // Trier par date
    return items.sort((a, b) => {
      const dateA = new Date(a.displayDate || a.start_date);
      const dateB = new Date(b.displayDate || b.start_date);
      return dateA.getDate() - dateB.getDate();
    });
  };

  const filteredItems = getFilteredItems();
  const totalCount = birthdays.length + events.length;

  // Filtres
  const FilterButton = ({ value, label, count, icon: Icon }) => (
    <button
      onClick={() => setFilter(value)}
      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${filter === value
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
        }`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
      {count > 0 && <span className="font-semibold">({count})</span>}
    </button>
  );

  return (
    <WidgetCard
      icon={Calendar}
      title={isRTL ? 'المناسبات' : 'Événements'}
      subtitle={isRTL ? 'هذا الشهر' : 'Ce mois-ci'}
      badge={totalCount || null}
      iconColor="purple"
      loading={loading}
      maxItems={4}
      itemHeight={68}
      headerAction={
        <div className="flex gap-1">
          <FilterButton value="all" label={isRTL ? 'الكل' : 'Tous'} count={totalCount} />
        </div>
      }
    >
      {/* Filtres */}
      <div className="flex gap-1 mb-3 flex-wrap items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          <FilterButton value="events" label={isRTL ? 'أحداث' : 'Événements'} count={events.length} icon={Calendar} />
          <FilterButton value="birthdays" label={isRTL ? 'أعياد' : 'Anniversaires'} count={birthdays.length} icon={Cake} />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <WidgetEmptyState
          icon={Calendar}
          message={isRTL ? 'لا توجد أحداث هذا الشهر' : 'Aucun événement ce mois-ci'}
        />
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item, index) => (
            item.itemType === 'birthday' ? (
              // Affichage anniversaire
              <div
                key={`birthday-${item.id}-${index}`}
                className={`relative overflow-hidden rounded-lg border p-2 hover:shadow-md transition-shadow cursor-pointer ${item.child_gender === 'male'
                    ? 'border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
                    : 'border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20'
                  }`}
                onClick={() => navigate(`/dashboard/children/${item.child_id}/birthday`)}
              >
                <div className="absolute top-0 right-0 text-3xl opacity-10">🎂</div>
                <div className="relative flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {resolveChildPhotoUrl(item.child_photo_url) && !failedImages[item.child_id || item.id] ? (
                      <img
                        src={resolveChildPhotoUrl(item.child_photo_url)}
                        alt={item.child_name}
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [item.child_id || item.id]: true
                          }))
                        }
                        className={`w-9 h-9 rounded-full object-cover border-2 ${item.child_gender === 'male' ? 'border-blue-300' : 'border-pink-300'
                          }`}
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.child_gender === 'male'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-pink-100 text-pink-500'
                        }`}>
                        <Baby className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {item.child_name}
                      </h4>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full text-white ${item.child_gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                        }`}>
                        {calculateAge(item.child_birth_date, item.start_date)} {isRTL ? 'سنة' : 'ans'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`font-medium ${item.child_gender === 'male' ? 'text-blue-600' : 'text-pink-600'}`}>
                        {getDaysUntil(item.start_date)}
                      </span>
                      <span>•</span>
                      <span>{formatDate(item.start_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Affichage événement (réunion, célébration, ou fête d'anniversaire confirmée dans la table events)
              <div
                key={`event-${item.id}-${index}`}
                className={`relative overflow-hidden rounded-lg border p-2 hover:shadow-md transition-shadow cursor-pointer ${getEventColor(item.type)}`}
                onClick={() => {
                  if (item.type === 'birthday' && item.child_id) {
                    navigate(`/dashboard/children/${item.child_id}/birthday`);
                  } else {
                    navigate('/dashboard/calendar');
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item.type === 'meeting' ? 'bg-blue-200 dark:bg-blue-800' :
                      item.type === 'celebration' ? 'bg-purple-200 dark:bg-purple-800' :
                      item.type === 'birthday' ? 'bg-pink-200 dark:bg-pink-800' :
                        'bg-green-200 dark:bg-green-800'
                    }`}>
                    {React.createElement(getEventIcon(item.type), { className: 'w-4 h-4' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className="font-medium">{getDaysUntil(item.start_date)}</span>
                      <span>•</span>
                      <span>{formatDate(item.start_date)}</span>
                      {item.type === 'birthday' && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 dark:bg-gray-800 text-pink-700 dark:text-pink-300">
                            {item.metadata?.notify_other_parents ? '🌍 Tous les parents' : '🔒 Parent + Équipe'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.type === 'meeting' ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200' :
                      item.type === 'celebration' ? 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-200' :
                      item.type === 'birthday' ? 'bg-pink-200 text-pink-700 dark:bg-pink-800 dark:text-pink-200' :
                        'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200'
                    }`}>
                    {item.type === 'meeting' ? (isRTL ? 'اجتماع' : 'Réunion') :
                      item.type === 'celebration' ? (isRTL ? 'احتفال' : 'Célébration') :
                      item.type === 'birthday' ? (isRTL ? 'حفل عيد ميلاد' : 'Fête Crèche') :
                        (isRTL ? 'حدث' : 'Événement')}
                  </span>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </WidgetCard>
  );
};

export default EventsWidget;
