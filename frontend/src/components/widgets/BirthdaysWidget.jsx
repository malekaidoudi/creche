import React, { useState, useEffect } from 'react';
import { Cake, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

const BirthdaysWidget = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBirthdays();
  }, []);

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events?type=birthday&limit=5');
      
      if (response.data.success) {
        // Filtrer pour garder seulement les anniversaires du mois en cours
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const thisMonthBirthdays = (response.data.events || []).filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate.getMonth() === currentMonth && 
                 eventDate.getFullYear() === currentYear &&
                 eventDate >= now;
        });
        
        setBirthdays(thisMonthBirthdays);
      } else {
        setBirthdays([]);
      }
    } catch (error) {
      console.error('Erreur chargement anniversaires:', error);
      setBirthdays([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate, eventDate) => {
    const birth = new Date(birthDate);
    const event = new Date(eventDate);
    return event.getFullYear() - birth.getFullYear();
  };

  const getDaysUntil = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return isRTL ? 'اليوم' : 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return isRTL ? 'غدا' : 'Demain';
    } else {
      return isRTL ? `في ${diffDays} أيام` : `Dans ${diffDays} jours`;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'أعياد الميلاد' : 'Anniversaires'}
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
              <Cake className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'أعياد الميلاد' : 'Anniversaires'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRTL ? 'هذا الشهر' : 'Ce mois-ci'}
              </p>
            </div>
          </div>
          
          {birthdays.length > 0 && (
            <button
              onClick={() => navigate('/dashboard/events/calendar')}
              className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 text-sm font-medium flex items-center gap-1"
            >
              {isRTL ? 'عرض الكل' : 'Voir tout'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Birthdays List */}
      <div className="p-6">
        {birthdays.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-3">🎂</div>
            <p className="text-gray-500 dark:text-gray-400">
              {isRTL ? 'لا توجد أعياد ميلاد هذا الشهر' : 'Aucun anniversaire ce mois-ci'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {birthdays.map((birthday) => (
              <div
                key={birthday.id}
                className="relative overflow-hidden rounded-lg border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/children/${birthday.child_id}`)}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 text-6xl opacity-10">
                  🎂
                </div>
                
                <div className="relative flex items-center gap-4">
                  {/* Photo or Avatar */}
                  <div className="flex-shrink-0">
                    {birthday.child_photo_url ? (
                      <img
                        src={birthday.child_photo_url}
                        alt={birthday.child_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-pink-300 dark:border-pink-700"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-2xl font-bold border-2 border-pink-300 dark:border-pink-700">
                        {birthday.child_name?.charAt(0) || '👶'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {birthday.child_name || birthday.title.replace('🎂 Anniversaire de ', '')}
                      </h4>
                      <span className="text-2xl">🎉</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-pink-600 dark:text-pink-400 font-medium">
                          {getDaysUntil(birthday.start_date)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(birthday.start_date)}
                        </span>
                      </div>

                      {birthday.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {birthday.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Age Badge */}
                <div className="absolute bottom-2 right-2">
                  <div className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    🎂 {birthday.description?.match(/\d+/)?.[0] || '?'} {isRTL ? 'سنة' : 'ans'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {birthdays.length > 0 && (
        <div className="px-6 py-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-t border-pink-200 dark:border-pink-800 rounded-b-lg">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-pink-600 dark:text-pink-400">
              {birthdays.length}
            </span>
            {' '}
            {isRTL 
              ? `عيد ميلاد هذا الشهر` 
              : `anniversaire${birthdays.length > 1 ? 's' : ''} ce mois-ci`
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthdaysWidget;
