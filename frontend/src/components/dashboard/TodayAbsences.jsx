import React, { useState, useEffect } from 'react';
import { Baby, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import WidgetCard, { WidgetEmptyState } from '../ui/WidgetCard';
import api from '../../services/api';

const TodayAbsences = ({ isMobileView = false }) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayAbsences();
    const interval = setInterval(loadTodayAbsences, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayAbsences = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/api/absence-requests/today?date=${today}`);

      if (response.data.success) {
        setAbsences(response.data.absences || []);
      }
    } catch (error) {
      console.error('Erreur chargement absences du jour:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      sick: isRTL ? 'مريض' : 'Maladie',
      vacation: isRTL ? 'عطلة' : 'Vacances',
      medical_visit: isRTL ? 'زيارة طبية' : 'Visite médicale',
      family_event: isRTL ? 'مناسبة عائلية' : 'Événement familial',
      other: isRTL ? 'أخرى' : 'Autre'
    };
    return reasons[reason] || reason;
  };

  const getReasonColor = (reason) => {
    const colors = {
      sick: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      vacation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      medical_visit: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      family_event: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[reason] || colors.other;
  };

  if (!loading && absences.length === 0) {
    return null;
  }

  return (
    <WidgetCard
      icon={AlertCircle}
      title={isRTL ? 'الغيابات اليوم' : 'Absences du jour'}
      subtitle={isRTL ? 'الأطفال الغائبون' : 'Enfants absents'}
      badge={absences.length || null}
      iconColor="orange"
      loading={loading}
      maxItems={4}
      itemHeight={72}
    >
      {absences.length === 0 ? (
        <WidgetEmptyState
          icon={Baby}
          message={isRTL ? 'لا توجد غيابات اليوم' : 'Aucune absence aujourd\'hui'}
        />
      ) : (
        <div className="space-y-2">
          {absences.map((absence) => (
            <div
              key={absence.id}
              className="relative overflow-hidden rounded-lg border border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/dashboard/children/${absence.child_id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400">
                  <Baby className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {absence.child_first_name} {absence.child_last_name}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getReasonColor(absence.reason)}`}>
                      {getReasonLabel(absence.reason)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{isRTL ? 'الوالد:' : 'Parent:'} {absence.parent_first_name} {absence.parent_last_name}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
};

export default TodayAbsences;
