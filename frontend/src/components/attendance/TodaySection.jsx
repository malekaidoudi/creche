import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LogIn, 
  LogOut, 
  Clock, 
  Baby, 
  CheckCircle, 
  XCircle,
  Users,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const TodaySection = ({ 
  currentlyPresent, 
  attendanceData, 
  stats, 
  onCheckIn, 
  onCheckOut, 
  actionLoading 
}) => {
  const { isRTL } = useLanguage();

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${isRTL ? 'شهر' : 'mois'}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 ? 's' : ''}`;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === 'null') return '-';
    
    try {
      let date;
      
      // Si c'est déjà au format complet (YYYY-MM-DD HH:mm:ss)
      if (timeString.includes(' ')) {
        date = new Date(timeString);
      }
      // Si c'est juste l'heure (HH:mm:ss)
      else if (timeString.includes(':')) {
        const today = new Date().toISOString().split('T')[0];
        date = new Date(`${today} ${timeString}`);
      }
      // Sinon, essayer de parser directement
      else {
        date = new Date(timeString);
      }
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur formatTime:', error, 'pour:', timeString);
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques du jour */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'المجموع' : 'Total'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'حاضر' : 'Présents'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {currentlyPresent?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'غائب' : 'Absents'}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.absent || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'مكتمل' : 'Terminé'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.completed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enfants actuellement présents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'الأطفال الحاضرون حالياً' : 'Enfants actuellement présents'}
            <span className="ml-2 rtl:ml-0 rtl:mr-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm">
              {currentlyPresent?.length || 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentlyPresent?.length === 0 ? (
            <div className="text-center py-8">
              <Baby className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? 'لا يوجد أطفال حاضرون حالياً' : 'Aucun enfant présent actuellement'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentlyPresent?.map((child) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Baby className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {child.first_name} {child.last_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {calculateAge(child.birth_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        {isRTL ? 'وقت الوصول:' : 'Arrivée:'}
                      </span>
                      <span className="font-medium">
                        {formatTime(child.check_in_time)}
                      </span>
                    </div>
                    
                    <Button
                      onClick={() => onCheckOut(child.id)}
                      disabled={actionLoading === child.id}
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                    >
                      {actionLoading === child.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <LogOut className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {isRTL ? 'تسجيل المغادرة' : 'Enregistrer départ'}
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tous les enfants - Check-in rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'تسجيل الحضور السريع' : 'Enregistrement rapide'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendanceData?.map((record) => {
              const isPresent = record.check_in_time && !record.check_out_time;
              const isCompleted = record.check_in_time && record.check_out_time;
              
              return (
                <div
                  key={record.child_id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isPresent ? 'bg-green-100 dark:bg-green-900' :
                        isCompleted ? 'bg-blue-100 dark:bg-blue-900' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Baby className={`w-5 h-5 ${
                          isPresent ? 'text-green-600 dark:text-green-400' :
                          isCompleted ? 'text-blue-600 dark:text-blue-400' :
                          'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {record.child?.first_name} {record.child?.last_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {calculateAge(record.child?.birth_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isPresent ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      isCompleted ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {isPresent ? (isRTL ? 'حاضر' : 'Présent') :
                       isCompleted ? (isRTL ? 'مكتمل' : 'Terminé') :
                       (isRTL ? 'غائب' : 'Absent')}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {record.check_in_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          {isRTL ? 'وصل:' : 'Arrivée:'}
                        </span>
                        <span className="font-medium">
                          {formatTime(record.check_in_time)}
                        </span>
                      </div>
                    )}
                    
                    {record.check_out_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          {isRTL ? 'غادر:' : 'Départ:'}
                        </span>
                        <span className="font-medium">
                          {formatTime(record.check_out_time)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 rtl:space-x-reverse mt-3">
                      {!record.check_in_time && (
                        <Button
                          onClick={() => onCheckIn(record.child_id)}
                          disabled={actionLoading === record.child_id}
                          size="sm"
                          className="flex-1"
                        >
                          {actionLoading === record.child_id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <LogIn className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              {isRTL ? 'وصول' : 'Arrivée'}
                            </>
                          )}
                        </Button>
                      )}
                      
                      {isPresent && (
                        <Button
                          onClick={() => onCheckOut(record.child_id)}
                          disabled={actionLoading === record.child_id}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          {actionLoading === record.child_id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <LogOut className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              {isRTL ? 'مغادرة' : 'Départ'}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodaySection;
