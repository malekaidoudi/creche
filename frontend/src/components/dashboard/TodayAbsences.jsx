import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Baby, Calendar, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import api from '../../services/api';

const TodayAbsences = () => {
  const { isRTL } = useLanguage();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayAbsences();
    // Rafraîchir toutes les 5 minutes
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

  if (loading) {
    return null;
  }

  if (absences.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
            <AlertCircle className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'الغيابات اليوم' : 'Absences du jour'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {absences.map((absence) => (
              <div
                key={absence.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {absence.child_first_name} {absence.child_last_name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {absence.reason === 'sick' && (isRTL ? 'مريض' : 'Maladie')}
                    {absence.reason === 'vacation' && (isRTL ? 'عطلة' : 'Vacances')}
                    {absence.reason === 'medical_visit' && (isRTL ? 'زيارة طبية' : 'Visite médicale')}
                    {absence.reason === 'family_event' && (isRTL ? 'مناسبة عائلية' : 'Événement familial')}
                    {absence.reason === 'other' && (isRTL ? 'أخرى' : 'Autre')}
                  </span>
                </div>
                
                {absence.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {absence.notes}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {isRTL ? 'الوالد:' : 'Parent:'} {absence.parent_first_name} {absence.parent_last_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-orange-200 dark:border-orange-700">
            <p className="text-sm text-orange-700 dark:text-orange-300 text-center">
              {isRTL 
                ? `${absences.length} ${absences.length === 1 ? 'طفل غائب' : 'أطفال غائبون'} اليوم`
                : `${absences.length} enfant${absences.length > 1 ? 's' : ''} absent${absences.length > 1 ? 's' : ''} aujourd'hui`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TodayAbsences;
