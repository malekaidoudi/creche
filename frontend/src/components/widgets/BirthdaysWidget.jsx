import React, { useState, useEffect } from 'react';
import { Cake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import WidgetCard, { WidgetEmptyState } from '../ui/WidgetCard';

const BirthdaysWidget = ({ isMobileView = false }) => {
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
      const response = await api.get('/api/events?type=birthday&limit=50');

      if (response.data.success) {
        // Filtrer pour garder seulement les anniversaires du mois en cours
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const allBirthdays = response.data.events || [];
        const currentMonthBirthdays = allBirthdays.filter(event => {
          const eventDate = new Date(event.start_date);
          return eventDate.getMonth() === now.getMonth() &&
            eventDate.getFullYear() === now.getFullYear();
        });

        // Afficher tous les anniversaires du mois
        setBirthdays(currentMonthBirthdays);
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
    let age = event.getFullYear() - birth.getFullYear();
    const monthDiff = event.getMonth() - birth.getMonth();

    // Ajuster si l'anniversaire n'est pas encore passé cette année
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

  return (
    <WidgetCard
      icon={Cake}
      title={isRTL ? 'أعياد الميلاد' : 'Anniversaires'}
      subtitle={isRTL ? 'هذا الشهر' : 'Ce mois-ci'}
      badge={birthdays.length || null}
      iconColor="pink"
      loading={loading}
    >
      {birthdays.length === 0 ? (
        <WidgetEmptyState
          icon={Cake}
          message={isRTL ? 'لا توجد أعياد ميلاد هذا الشهر' : 'Aucun anniversaire ce mois-ci'}
        />
      ) : (
        <div className="space-y-2">
          {birthdays.map((birthday) => (
            <div
              key={birthday.id}
              className={`relative overflow-hidden rounded-lg border-2 p-2 hover:shadow-md transition-shadow cursor-pointer ${birthday.child_gender === 'male'
                ? 'border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
                : 'border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20'
                }`}
              onClick={() => navigate(`/dashboard/children/${birthday.child_id}`)}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 text-4xl opacity-10">
                🎂
              </div>

              <div className="relative flex items-center gap-2">
                {/* Photo or Avatar */}
                <div className="flex-shrink-0">
                  {birthday.child_photo_url ? (
                    <img
                      src={birthday.child_photo_url}
                      alt={birthday.child_name}
                      className={`w-10 h-10 rounded-full object-cover border-2 ${birthday.child_gender === 'male'
                        ? 'border-blue-300 dark:border-blue-700'
                        : 'border-pink-300 dark:border-pink-700'
                        }`}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 ${birthday.child_gender === 'male'
                      ? 'bg-gradient-to-br from-blue-400 to-cyan-400 border-blue-300 dark:border-blue-700'
                      : 'bg-gradient-to-br from-pink-400 to-purple-400 border-pink-300 dark:border-pink-700'
                      }`}>
                      {birthday.child_name?.charAt(0) || '👶'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                      {birthday.child_name || birthday.title.replace('🎂 Anniversaire de ', '')}
                    </h4>
                    <span className="text-lg">🎉</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-medium ${birthday.child_gender === 'male' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'}`}>
                      {getDaysUntil(birthday.start_date)}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(birthday.start_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Age Badge */}
              {birthday.child_birth_date && (
                <div className="absolute bottom-1 right-1">
                  <div className={`text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg ${birthday.child_gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                    }`}>
                    {calculateAge(birthday.child_birth_date, birthday.start_date)} {isRTL ? 'سنة' : 'ans'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
};

export default BirthdaysWidget;
