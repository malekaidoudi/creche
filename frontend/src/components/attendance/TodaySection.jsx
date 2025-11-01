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
import { formatTime, calculateDuration } from '../../utils/dateUtils';

const TodaySection = ({ 
  currentlyPresent, 
  attendanceData, 
  allChildren,
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
                        {formatTime(child.check_in_time, isRTL)}
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
            {(() => {
              const filteredChildren = allChildren?.filter(child => {
                // Exclure les enfants actuellement présents (déjà affichés dans la section du haut)
                const isPresentNow = currentlyPresent?.some(present => present.id === child.id || present.child_id === child.id);
                return !isPresentNow;
              }) || [];
              
              console.log('🎯 TodaySection - Enfants filtrés pour Enregistrement rapide:', filteredChildren.length);
              
              return filteredChildren.map((child) => {
              // Trouver l'enregistrement d'attendance pour cet enfant aujourd'hui
              const todayRecord = attendanceData?.find(record => record.child_id === child.id);
              const isPresent = todayRecord?.check_in_time && !todayRecord?.check_out_time;
              const isCompleted = todayRecord?.check_in_time && todayRecord?.check_out_time;
              const isAbsent = !todayRecord?.check_in_time;
              
              return (
                <div
                  key={child.id}
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
                          {child.first_name} {child.last_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {calculateAge(child.birth_date)}
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
                    {todayRecord?.check_in_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          {isRTL ? 'وصل:' : 'Arrivée:'}
                        </span>
                        <span className="font-medium">
                          {formatTime(todayRecord.check_in_time, isRTL)}
                        </span>
                      </div>
                    )}
                    
                    {todayRecord?.check_out_time && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">
                            {isRTL ? 'غادر:' : 'Départ:'}
                          </span>
                          <span className="font-medium">
                            {formatTime(todayRecord.check_out_time, isRTL)}
                          </span>
                        </div>
                        
                        {/* Afficher la durée si check-in et check-out sont présents */}
                        {todayRecord.check_in_time && (
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-300 flex items-center">
                              <Clock className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                              {isRTL ? 'المدة:' : 'Durée:'}
                            </span>
                            <span className="font-semibold text-primary-600 dark:text-primary-400">
                              {(() => {
                                const duration = calculateDuration(todayRecord.check_in_time, todayRecord.check_out_time);
                                if (duration) {
                                  const hours = Math.floor(duration);
                                  const minutes = Math.round((duration - hours) * 60);
                                  return hours > 0 
                                    ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
                                    : `${minutes}min`;
                                }
                                return '-';
                              })()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="flex space-x-2 rtl:space-x-reverse mt-3">
                      {isAbsent && (
                        <Button
                          onClick={() => onCheckIn(child.id)}
                          disabled={actionLoading === child.id}
                          size="sm"
                          className="flex-1"
                        >
                          {actionLoading === child.id ? (
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
                          onClick={() => onCheckOut(child.id)}
                          disabled={actionLoading === child.id}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          {actionLoading === child.id ? (
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
            });
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodaySection;
