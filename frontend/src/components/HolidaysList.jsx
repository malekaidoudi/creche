import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';

const HolidaysList = ({ userRole = 'parent' }) => {
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActiveHolidays();
  }, []);

  const fetchActiveHolidays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/holidays', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Trier par date
          const sortedHolidays = data.holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
          setHolidays(sortedHolidays);
        }
      }
    } catch (error) {
      console.error('Erreur chargement jours fériés:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHolidayType = (holiday) => {
    // Déterminer le type basé sur le nom ou la description
    const name = holiday.name.toLowerCase();
    const desc = (holiday.description || '').toLowerCase();
    
    if (name.includes('national') || name.includes('indépendance') || name.includes('révolution') || 
        name.includes('république') || name.includes('travail') || name.includes('martyrs')) {
      return 'national';
    } else if (name.includes('aïd') || name.includes('ramadan') || name.includes('hégirien') || 
               name.includes('achoura') || name.includes('mawlid') || name.includes('عيد') || 
               name.includes('رمضان') || name.includes('هجرية')) {
      return 'religious';
    } else if (name.includes('vacances') || name.includes('scolaire') || name.includes('école') || 
               name.includes('عطلة') || desc.includes('école')) {
      return 'school';
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
      case 'school':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
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
      case 'school':
        return isRTL ? 'مدرسي' : 'Scolaire';
      default:
        return isRTL ? 'مخصص' : 'Personnalisé';
    }
  };

  const filteredHolidays = holidays.filter(holiday => {
    if (filter === 'all') return true;
    return getHolidayType(holiday) === filter;
  });

  const upcomingHolidays = filteredHolidays.filter(holiday => 
    new Date(holiday.date) >= new Date()
  );

  const pastHolidays = filteredHolidays.filter(holiday => 
    new Date(holiday.date) < new Date()
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isRTL ? 'الأعياد والعطل' : 'Jours Fériés'}
            </h3>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
              {isRTL ? `${filteredHolidays.length} يوم` : `${filteredHolidays.length} jours`}
            </span>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { key: 'all', label: isRTL ? 'الكل' : 'Tous' },
            { key: 'national', label: isRTL ? 'وطني' : 'National' },
            { key: 'religious', label: isRTL ? 'ديني' : 'Religieux' },
            { key: 'school', label: isRTL ? 'مدرسي' : 'Scolaire' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {filteredHolidays.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {isRTL ? 'لا توجد أعياد مفعلة' : 'Aucun jour férié activé'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Jours fériés à venir */}
            {upcomingHolidays.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-green-600" />
                  {isRTL ? 'الأعياد القادمة' : 'Prochains jours fériés'}
                </h4>
                <div className="space-y-3">
                  {upcomingHolidays.slice(0, 5).map(holiday => {
                    const type = getHolidayType(holiday);
                    return (
                      <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className={`w-3 h-3 rounded-full ${
                              type === 'national' ? 'bg-blue-500' :
                              type === 'religious' ? 'bg-green-500' :
                              type === 'school' ? 'bg-orange-500' :
                              'bg-purple-500'
                            }`}></div>
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {holiday.name}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(holiday.date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(type)}`}>
                          {getTypeLabel(type)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Jours fériés passés (limités) */}
            {pastHolidays.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {isRTL ? 'الأعياد السابقة' : 'Jours fériés passés'}
                </h4>
                <div className="space-y-2">
                  {pastHolidays.slice(-3).reverse().map(holiday => {
                    const type = getHolidayType(holiday);
                    return (
                      <div key={holiday.id} className="flex items-center justify-between p-2 opacity-60">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className={`w-2 h-2 rounded-full ${
                            type === 'national' ? 'bg-blue-400' :
                            type === 'religious' ? 'bg-green-400' :
                            type === 'school' ? 'bg-orange-400' :
                            'bg-purple-400'
                          }`}></div>
                          <div>
                            <h5 className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                              {holiday.name}
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(holiday.date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidaysList;
