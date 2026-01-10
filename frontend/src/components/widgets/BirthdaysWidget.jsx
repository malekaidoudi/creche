import React, { useState, useEffect } from 'react';
import { Cake, Calendar, Users, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import WidgetCard, { WidgetEmptyState } from '../ui/WidgetCard';

const EventsWidget = ({ isMobileView = false }) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [birthdays, setBirthdays] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'events', 'birthdays'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les anniversaires du mois
      const birthdaysResponse = await api.get('/api/children/birthdays/month');
      if (birthdaysResponse.data.success) {
        const sortedBirthdays = (birthdaysResponse.data.children || []).map(b => ({
          ...b,
          itemType: 'birthday',
          displayDate: b.start_date
        })).sort((a, b) => new Date(a.start_date).getDate() - new Date(b.start_date).getDate());
        setBirthdays(sortedBirthdays);
      }

      // Charger les événements du mois (réunions, célébrations)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const eventsResponse = await api.get(`/api/events?start_date=${startOfMonth}&end_date=${endOfMonth}&limit=50`);
      if (eventsResponse.data.success) {
        const filteredEvents = (eventsResponse.data.events || [])
          .filter(e => ['meeting', 'celebration', 'event'].includes(e.type))
          .map(e => ({
            ...e,
            itemType: 'event',
            displayDate: e.start_date
          }))
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
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
      default: return Calendar;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'celebration': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 border-purple-200 dark:border-purple-800';
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
      <div className="flex gap-1 mb-3 flex-wrap">
        <FilterButton value="events" label={isRTL ? 'أحداث' : 'Événements'} count={events.length} icon={Calendar} />
        <FilterButton value="birthdays" label={isRTL ? 'أعياد' : 'Anniversaires'} count={birthdays.length} icon={Cake} />
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
                onClick={() => navigate(`/dashboard/children/${item.child_id}`)}
              >
                <div className="absolute top-0 right-0 text-3xl opacity-10">🎂</div>
                <div className="relative flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {item.child_photo_url ? (
                      <img
                        src={item.child_photo_url}
                        alt={item.child_name}
                        className={`w-9 h-9 rounded-full object-cover border-2 ${item.child_gender === 'male' ? 'border-blue-300' : 'border-pink-300'
                          }`}
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${item.child_gender === 'male'
                          ? 'bg-gradient-to-br from-blue-400 to-cyan-400'
                          : 'bg-gradient-to-br from-pink-400 to-purple-400'
                        }`}>
                        {item.child_name?.charAt(0) || '👶'}
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
              // Affichage événement (réunion, célébration)
              <div
                key={`event-${item.id}-${index}`}
                className={`relative overflow-hidden rounded-lg border p-2 hover:shadow-md transition-shadow cursor-pointer ${getEventColor(item.type)}`}
                onClick={() => navigate('/dashboard/calendar')}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item.type === 'meeting' ? 'bg-blue-200 dark:bg-blue-800' :
                      item.type === 'celebration' ? 'bg-purple-200 dark:bg-purple-800' :
                        'bg-green-200 dark:bg-green-800'
                    }`}>
                    {React.createElement(getEventIcon(item.type), { className: 'w-4 h-4' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{getDaysUntil(item.start_date)}</span>
                      <span>•</span>
                      <span>{formatDate(item.start_date)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.type === 'meeting' ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200' :
                      item.type === 'celebration' ? 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-200' :
                        'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200'
                    }`}>
                    {item.type === 'meeting' ? (isRTL ? 'اجتماع' : 'Réunion') :
                      item.type === 'celebration' ? (isRTL ? 'احتفال' : 'Célébration') :
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
