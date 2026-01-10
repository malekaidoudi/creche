import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import api from '../services/api';
import WidgetCard, { WidgetEmptyState } from './ui/WidgetCard';

const HolidaysList = ({ userRole = 'parent', showFilters = false }) => {
  const { isRTL } = useLanguage();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActiveHolidays();
  }, []);

  const fetchActiveHolidays = async () => {
    try {
      setLoading(true);
      // Utiliser ?effective=true pour obtenir les dates générées (pas les politiques)
      const response = await api.get('/api/holidays?effective=true');
      const data = response.data;
      if (data.success) {
        // Trier par date
        const sortedHolidays = data.holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
        setHolidays(sortedHolidays);
      }
    } catch (error) {
      console.error('Erreur chargement jours fériés:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHolidayType = (holiday) => {
    // Utiliser le type depuis l'API s'il existe
    if (holiday.type) {
      return holiday.type;
    }
    // Sinon déterminer le type basé sur le nom
    const name = holiday.name.toLowerCase();
    if (name.includes('indépendance') || name.includes('révolution') ||
      name.includes('république') || name.includes('travail') || name.includes('martyrs') ||
      name.includes('jour de l\'an') || name.includes('femme') || name.includes('évacuation')) {
      return 'national';
    } else if (name.includes('aïd') || name.includes('hégirien') ||
      name.includes('achoura') || name.includes('mawlid') || name.includes('isra') ||
      name.includes('arafat')) {
      return 'religious';
    } else {
      return 'custom';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'national':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'religious':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'national':
        return isRTL ? 'وطني' : 'National';
      case 'religious':
        return isRTL ? 'ديني' : 'Religieux';
      default:
        return isRTL ? 'مخصص' : 'Personnalisé';
    }
  };

  const filteredHolidays = holidays.filter(holiday => {
    if (filter === 'all') return true;
    return getHolidayType(holiday) === filter;
  });

  // Afficher uniquement les jours fériés à venir
  const upcomingHolidays = filteredHolidays.filter(holiday =>
    new Date(holiday.date) >= new Date()
  );

  // Filtres pour le header
  const filterButtons = showFilters ? (
    <div className="flex flex-wrap gap-2 mt-3">
      {[
        { key: 'all', label: isRTL ? 'الكل' : 'Tous' },
        { key: 'national', label: isRTL ? 'وطني' : 'National' },
        { key: 'religious', label: isRTL ? 'ديني' : 'Religieux' }
      ].map(filterOption => (
        <button
          key={filterOption.key}
          onClick={() => setFilter(filterOption.key)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === filterOption.key
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          {filterOption.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <WidgetCard
      icon={Calendar}
      title={isRTL ? 'الأعياد القادمة' : 'Jours Fériés'}
      badge={upcomingHolidays.length}
      iconColor="blue"
      loading={loading}
      maxItems={4}
      itemHeight={64}
    >
      {/* Filtres */}
      {filterButtons}

      {/* Contenu */}
      {upcomingHolidays.length === 0 ? (
        <WidgetEmptyState
          icon={AlertCircle}
          message={isRTL ? 'لا توجد أعياد قادمة' : 'Aucun jour férié à venir'}
        />
      ) : (
        <div className="space-y-2">
          {upcomingHolidays.map((holiday, index) => {
            const type = getHolidayType(holiday);
            return (
              <div key={`${holiday.holiday_key}-${holiday.date}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${type === 'national' ? 'bg-blue-500' :
                      type === 'religious' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {holiday.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(holiday.date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getTypeColor(type)}`}>
                  {getTypeLabel(type)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
};

export default HolidaysList;
