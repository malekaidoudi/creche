import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn,
  LogOut,
  Clock,
  Baby,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  ChevronDown,
  BarChart3,
  CalendarCheck,
  PlusCircle,
  AlertTriangle,
  Undo2,
  Search,
  X,
  Edit2
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatTime, calculateDuration, calculateLivePresenceDuration, formatDurationHuman } from '../../utils/dateUtils';

const TodaySection = ({
  currentlyPresent = [],
  attendanceData = [],
  allChildren = [],
  stats,
  attendanceMode = 'hourly',
  onCheckIn,
  onCheckOut,
  onTogglePresence,
  onCancelAttendance,
  onUpdateAttendance,
  onRecordExceptionalSaturday,
  actionLoading
}) => {
  const { isRTL } = useLanguage();
  const [statsExpanded, setStatsExpanded] = useState(false);
  const isSaturdayToday = new Date().getDay() === 6;
  const isDailyMode = attendanceMode === 'daily';

  // Modal pour marquer absent (avec confirmation)
  const [confirmAbsentChild, setConfirmAbsentChild] = useState(null);

  // Modal pour accueil exceptionnel le samedi
  const [showExceptionalModal, setShowExceptionalModal] = useState(false);
  const [exceptionalSearch, setExceptionalSearch] = useState('');

  // Modal pour rattrapage de présence (quand la crèche est fermée et mode horaire actif)
  const [rattrapageModalOpen, setRattrapageModalOpen] = useState(false);
  const [rattrapageForm, setRattrapageForm] = useState({
    child: null,
    check_in_time: '07:00',
    check_out_time: '18:00',
    notes: ''
  });

  // Modal pour rectification d'un pointage terminé (heures d'arrivée / départ)
  const [rectifyModalOpen, setRectifyModalOpen] = useState(false);
  const [rectifyForm, setRectifyForm] = useState({
    child: null,
    check_in_time: '07:00',
    check_out_time: '18:00',
    notes: ''
  });

  // Heure de fermeture standard : 13h00 le samedi ou mi-journée, sinon 18h00
  const standardClosingTime = isSaturdayToday ? '13:00' : '18:00';

  // Vérifie si la crèche est actuellement fermée
  const isCrecheClosed = useMemo(() => {
    const now = new Date();
    const [closeH, closeM] = standardClosingTime.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const closingMinutes = closeH * 60 + closeM;
    const openingMinutes = 7 * 60; // 07h00
    return currentMinutes >= closingMinutes || currentMinutes < openingMinutes;
  }, [standardClosingTime]);

  // Enfants éligibles le samedi
  const eligibleChildren = useMemo(() => {
    if (!isSaturdayToday) return allChildren;
    return allChildren.filter(c => c.saturday_attendance || attendanceData.some(a => a.child_id === c.id));
  }, [allChildren, isSaturdayToday, attendanceData]);

  // Enfants non inscrits le samedi (pour exception)
  const nonSaturdayChildren = useMemo(() => {
    if (!isSaturdayToday) return [];
    return allChildren.filter(c => !c.saturday_attendance && !attendanceData.some(a => a.child_id === c.id));
  }, [allChildren, isSaturdayToday, attendanceData]);

  // Liste unifiée des enfants présents aujourd'hui (en cours ou journée terminée)
  const presentList = useMemo(() => {
    const list = [];
    const pool = isSaturdayToday ? eligibleChildren : allChildren;

    pool.forEach(child => {
      // 1. Chercher dans attendanceData
      const record = attendanceData?.find(a => a.child_id === child.id);
      
      // 2. Chercher dans currentlyPresent
      const curr = currentlyPresent?.find(p => p.id === child.id || p.child_id === child.id);

      // Présent aujourd'hui si enregistrement existe et n'est pas absent, ou s'il est dans currentlyPresent
      const hasAttendanceToday = (record && record.status !== 'absent' && (record.status === 'present' || record.check_in_time)) || Boolean(curr);

      if (hasAttendanceToday) {
        list.push({
          ...child,
          attendance_id: record?.id || curr?.attendance_id || curr?.id,
          check_in_time: record?.check_in_time || curr?.check_in_time,
          check_out_time: record?.check_out_time || curr?.check_out_time,
          is_exceptional_saturday: record?.is_exceptional_saturday || curr?.is_exceptional_saturday,
          notes: record?.notes || curr?.notes,
          status: record?.status || curr?.status || 'present'
        });
      }
    });

    return list;
  }, [allChildren, eligibleChildren, isSaturdayToday, attendanceData, currentlyPresent]);

  // Liste des enfants NON ENCORE POINTÉS (exclut strictement tous les enfants déjà présents aujourd'hui)
  const unpointedChildren = useMemo(() => {
    const pool = isSaturdayToday ? eligibleChildren : allChildren;
    return pool.filter(child => {
      return !presentList.some(present => present.id === child.id);
    });
  }, [allChildren, eligibleChildren, isSaturdayToday, presentList]);

  // Clic sur "Marquer présent" dans la section des non encore pointés
  const handleCheckInClick = (child) => {
    // Si mode horaire ET crèche fermée : modale de rattrapage
    if (!isDailyMode && isCrecheClosed) {
      const defaultDeparture = (isSaturdayToday || child.care_schedule === 'half_day') ? '13:00' : '18:00';
      setRattrapageForm({
        child,
        check_in_time: '07:00',
        check_out_time: defaultDeparture,
        notes: isRTL ? 'تسجيل متأخر عند انتهاء الدوام' : '[Pointage rattrapage fin de journée]'
      });
      setRattrapageModalOpen(true);
    } else {
      // Mode journalier OU crèche ouverte : 1 clic
      onCheckIn(child.id);
    }
  };

  // Confirmation du rattrapage
  const handleConfirmRattrapage = async () => {
    if (!rattrapageForm.child) return;
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      check_in_time: `${today} ${rattrapageForm.check_in_time || '07:00'}:00`,
      check_out_time: rattrapageForm.check_out_time ? `${today} ${rattrapageForm.check_out_time}:00` : null,
      notes: rattrapageForm.notes || null
    };
    await onCheckIn(rattrapageForm.child.id, payload);
    setRattrapageModalOpen(false);
    setRattrapageForm({ child: null, check_in_time: '07:00', check_out_time: '18:00', notes: '' });
  };

  // Ouverture modale de rectification pour un pointage terminé
  const handleOpenRectify = (child) => {
    let inTime = '07:00';
    if (child.check_in_time) {
      const d = new Date(child.check_in_time);
      if (!isNaN(d.getTime())) inTime = d.toTimeString().slice(0, 5);
    }
    let outTime = (isSaturdayToday || child.care_schedule === 'half_day') ? '13:00' : '18:00';
    if (child.check_out_time) {
      const d = new Date(child.check_out_time);
      if (!isNaN(d.getTime())) outTime = d.toTimeString().slice(0, 5);
    }

    setRectifyForm({
      child,
      check_in_time: inTime,
      check_out_time: outTime,
      notes: child.notes || ''
    });
    setRectifyModalOpen(true);
  };

  // Confirmation de la rectification
  const handleConfirmRectify = async () => {
    if (!rectifyForm.child) return;
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      check_in_time: rectifyForm.check_in_time ? `${today} ${rectifyForm.check_in_time}:00` : null,
      check_out_time: rectifyForm.check_out_time ? `${today} ${rectifyForm.check_out_time}:00` : null,
      notes: rectifyForm.notes || null,
      status: 'present'
    };
    if (onUpdateAttendance) {
      await onUpdateAttendance(rectifyForm.child.attendance_id, payload);
    }
    setRectifyModalOpen(false);
    setRectifyForm({ child: null, check_in_time: '', check_out_time: '', notes: '' });
  };

  const handleConfirmAbsent = async () => {
    if (!confirmAbsentChild) return;
    const childId = confirmAbsentChild.id;
    const record = attendanceData.find(a => a.child_id === childId);
    if (record?.id && onCancelAttendance) {
      await onCancelAttendance(record.id);
    } else if (onTogglePresence) {
      await onTogglePresence(childId, { target_status: 'absent' });
    }
    setConfirmAbsentChild(null);
  };

  const handleAddExceptional = async (child) => {
    if (onRecordExceptionalSaturday) {
      await onRecordExceptionalSaturday(child.id);
      setShowExceptionalModal(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
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

  // Statistiques calculées dynamiquement et synchronisées en temps réel
  const totalCount = useMemo(() => {
    if (isSaturdayToday) {
      return eligibleChildren.length;
    }
    return (allChildren && allChildren.length > 0) ? allChildren.length : (stats?.total || 0);
  }, [isSaturdayToday, eligibleChildren, allChildren, stats]);

  const presentCount = useMemo(() => {
    return presentList.length;
  }, [presentList]);

  const completedCount = useMemo(() => {
    if (isDailyMode) return 0;
    return presentList.filter(p => Boolean(p.check_out_time)).length;
  }, [isDailyMode, presentList]);

  const absentCount = useMemo(() => {
    return Math.max(0, totalCount - presentCount);
  }, [totalCount, presentCount]);

  return (
    <div className="space-y-6">
      {/* Statistiques du jour - Version Desktop */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'المجموع' : 'Total'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalCount}
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
                  {presentCount}
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
                  {absentCount}
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
                  {completedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques du jour - Version Mobile Collapsible */}
      <motion.div
        className="md:hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        layout
      >
        {/* Header Collapsible */}
        <div
          onClick={() => setStatsExpanded(!statsExpanded)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'الإحصائيات' : 'Statistiques'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRTL ? 'اليوم' : 'Aujourd\'hui'}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: statsExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.div>
        </div>

        {/* Content Collapsible */}
        <AnimatePresence>
          {statsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 space-y-3 border-t border-gray-100 dark:border-gray-700">
                {/* Total */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                        {isRTL ? 'المجموع' : 'Total'}
                      </p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
                        {totalCount}
                      </p>
                    </div>
                    <Users className="w-10 h-10 text-blue-500 opacity-50" />
                  </div>
                </div>

                {/* Présents */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-300 font-medium">
                        {isRTL ? 'حاضر' : 'Présents'}
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-200">
                        {presentCount}
                      </p>
                    </div>
                    <UserCheck className="w-10 h-10 text-green-500 opacity-50" />
                  </div>
                </div>

                {/* Absents */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-300 font-medium">
                        {isRTL ? 'غائب' : 'Absents'}
                      </p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-200">
                        {absentCount}
                      </p>
                    </div>
                    <XCircle className="w-10 h-10 text-red-500 opacity-50" />
                  </div>
                </div>

                {/* Terminé */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">
                        {isRTL ? 'مكتمل' : 'Terminé'}
                      </p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-200">
                        {completedCount}
                      </p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-purple-500 opacity-50" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Enfants présents aujourd'hui */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'الأطفال الحاضرون اليوم' : 'Enfants présents aujourd\'hui'}
            <span className="ml-2 rtl:ml-0 rtl:mr-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm font-semibold">
              {presentList.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {presentList.length === 0 ? (
            <div className="text-center py-8">
              <Baby className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? 'لا يوجد أطفال حاضرون اليوم' : 'Aucun enfant présent aujourd\'hui'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presentList.map((child) => {
                const isCompleted = !isDailyMode && Boolean(child.check_out_time);

                return (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl p-4 border transition-all ${
                      isCompleted 
                        ? 'bg-blue-50/40 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/40' 
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        }`}>
                          <Baby className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {child.first_name} {child.last_name}
                            </h3>
                            {child.is_exceptional_saturday && (
                              <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                                {isRTL ? 'استثنائي' : 'Exceptionnel'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {calculateAge(child.birth_date)}
                          </p>
                        </div>
                      </div>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{isRTL ? 'مكتمل' : 'Terminé'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span>{isRTL ? 'حاضر' : 'Présent'}</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      {isDailyMode ? (
                        <div className="p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between font-medium text-green-800 dark:text-green-300">
                            <span>{isRTL ? 'الوضع اليومي (يوم كامل)' : 'Pointage forfait journalier'}</span>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <p className="text-green-700 dark:text-green-400">
                            {child.care_schedule === 'half_day' || isSaturdayToday
                              ? 'Horaire contractuel : 07h00 - 13h00'
                              : 'Horaire contractuel : 07h00 - 18h00'}
                          </p>
                        </div>
                      ) : isCompleted ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'وقت الوصول:' : 'Arrivée:'}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatTime(child.check_in_time, isRTL)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'وقت المغادرة:' : 'Départ:'}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatTime(child.check_out_time, isRTL)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-primary-500" />
                              {isRTL ? 'المدة:' : 'Durée:'}
                            </span>
                            <span className="font-semibold text-primary-600 dark:text-primary-400">
                              {formatDurationHuman(calculateDuration(child.check_in_time, child.check_out_time), isRTL)}
                            </span>
                          </div>

                          {child.notes?.includes('[Départ automatique') && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded px-2 py-1 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{isRTL ? 'إغلاق تلقائي عند انتهاء الدوام' : 'Clôture auto à la fermeture'}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        (() => {
                          const live = calculateLivePresenceDuration(child.check_in_time, '18:00', isRTL);
                          return (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-300">
                                  {isRTL ? 'وقت الوصول:' : 'Arrivée:'}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {formatTime(child.check_in_time, isRTL)}
                                </span>
                              </div>

                              {live && (
                                <div className="flex items-center justify-between pt-1 text-xs">
                                  <span className="text-gray-600 dark:text-gray-300 flex items-center">
                                    <Clock className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-primary-500" />
                                    {isRTL ? 'المدة الحالية:' : 'Durée actuelle:'}
                                  </span>
                                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                                    {live.formatted}
                                  </span>
                                </div>
                              )}

                              {live?.isCapped && (
                                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1 mt-1">
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>
                                    {isRTL 
                                      ? `توقف العداد عند وقت الإغلاق (${live.closingTime})` 
                                      : `Compteur arrêté à l'heure de fermeture (${live.closingTime})`}
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()
                      )}

                      <div className="flex gap-2 pt-2">
                        {isCompleted ? (
                          <>
                            <Button
                              onClick={() => setConfirmAbsentChild(child)}
                              disabled={actionLoading === child.id || actionLoading === child.attendance_id}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5"
                              title={isRTL ? 'تسجيل كغائب / إلغاء' : 'Marquer absent / Annuler'}
                            >
                              <Undo2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleOpenRectify(child)}
                              disabled={actionLoading === child.id || actionLoading === child.attendance_id}
                              size="sm"
                              variant="outline"
                              className="flex-1 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <Edit2 className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
                              {isRTL ? 'تصحيح الساعات' : 'Rectifier les heures'}
                            </Button>
                          </>
                        ) : isDailyMode ? (
                          <Button
                            onClick={() => setConfirmAbsentChild(child)}
                            disabled={actionLoading === child.id}
                            size="sm"
                            variant="outline"
                            className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <XCircle className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            {isRTL ? 'تغيير إلى غائب' : 'Marquer absent'}
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() => setConfirmAbsentChild(child)}
                              disabled={actionLoading === child.id}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5"
                              title={isRTL ? 'تسجيل كغائب / إلغاء' : 'Marquer absent / Annuler'}
                            >
                              <Undo2 className="w-4 h-4" />
                            </Button>
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
                                  {isRTL ? 'تسجيل المغادرة' : 'Enregistrer départ'}
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tous les enfants - Check-in rapide (Non encore pointés) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center flex-wrap gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              <span>{isRTL ? 'تسجيل سريع (أطفال بانتظار التسجيل)' : 'Enregistrement rapide (Non encore pointés)'}</span>
              {isSaturdayToday && (
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full text-xs font-semibold">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  {isRTL
                    ? `${eligibleChildren.length} مسجلين للسبت`
                    : `${eligibleChildren.length} inscrits le samedi`}
                </span>
              )}
            </CardTitle>

            {isSaturdayToday && nonSaturdayChildren.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExceptionalModal(true)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700"
              >
                <PlusCircle className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
                {isRTL ? 'استقبال استثنائي (السبت)' : '+ Accueil exceptionnel samedi'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {unpointedChildren.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isRTL ? 'تم تسجيل حضور جميع الأطفال اليوم !' : 'Tous les enfants ont été pointés aujourd\'hui !'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpointedChildren.map((child) => {
                const todayRecord = attendanceData?.find(record => record.child_id === child.id);
                const isExplicitAbsent = todayRecord?.status === 'absent';

                return (
                  <div
                    key={child.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <Baby className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {child.first_name} {child.last_name}
                            {isSaturdayToday && child.saturday_attendance && (
                              <CalendarCheck className="w-4 h-4 text-amber-600" title={isRTL ? 'مسجل يوم السبت' : 'Inscrit le samedi'} />
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {calculateAge(child.birth_date)}
                          </p>
                        </div>
                      </div>

                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {isExplicitAbsent ? (isRTL ? 'غائب' : 'Absent') : (isRTL ? 'غير مسجل' : 'Non pointé')}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => handleCheckInClick(child)}
                        disabled={actionLoading === child.id}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {actionLoading === child.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            {isRTL ? 'تسجيل الحضور' : 'Marquer présent'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Confirmation Marquer Absent */}
      <AnimatePresence>
        {confirmAbsentChild && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {isRTL ? 'إلغاء تسجيل الحضور ؟' : 'Annuler la présence ?'}
                    </h3>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate mt-0.5">
                      {confirmAbsentChild.first_name} {confirmAbsentChild.last_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmAbsentChild(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span>{isRTL ? 'الحالة الحالية: مسجل كحاضر' : 'Statut actuel : noté Présent'}</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                  {isRTL
                    ? `هل تريد إلغاء نقطة حضور ${confirmAbsentChild.first_name} وتغيير حالته إلى غائب اليوم ؟`
                    : `Voulez-vous annuler le pointage de ${confirmAbsentChild.first_name} et le repasser en absent pour aujourd'hui ?`}
                </p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmAbsentChild(null)}
                  className="flex-1 text-xs font-semibold"
                >
                  {isRTL ? 'لا، إبقاء الحضور' : 'Non, laisser présent'}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmAbsent}
                  disabled={actionLoading === confirmAbsentChild.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  {actionLoading === confirmAbsentChild.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    (isRTL ? 'نعم، تحويل لغائب' : 'Oui, marquer absent')
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Accueil Exceptionnel le Samedi */}
      <AnimatePresence>
        {showExceptionalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                      {isRTL ? 'استقبال استثنائي يوم السبت' : 'Accueil exceptionnel le Samedi'}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {isRTL ? 'إشعار الولي تلقائياً' : 'Le parent recevra automatiquement une notification'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExceptionalModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={exceptionalSearch}
                    onChange={(e) => setExceptionalSearch(e.target.value)}
                    placeholder={isRTL ? 'بحث عن طفل...' : 'Rechercher un enfant non inscrit au samedi...'}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 overflow-y-auto space-y-2 flex-1">
                {nonSaturdayChildren
                  .filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(exceptionalSearch.toLowerCase()))
                  .map(child => (
                    <div
                      key={child.id}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between gap-3 hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 font-semibold text-xs flex-shrink-0">
                          {child.first_name?.[0]}{child.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                            {child.first_name} {child.last_name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {child.care_schedule === 'half_day' ? 'Mi-journée' : 'Journée complète'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddExceptional(child)}
                        disabled={actionLoading === child.id}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                      >
                        {actionLoading === child.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5 mr-1" />
                            <span>{isRTL ? 'تسجيل' : 'Accueillir'}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ))}

                {nonSaturdayChildren.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(exceptionalSearch.toLowerCase())).length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-6">
                    {isRTL ? 'لا يوجد أطفال' : 'Aucun enfant non inscrit trouvé'}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Rattrapage de Présence (Crèche fermée) */}
      <AnimatePresence>
        {rattrapageModalOpen && rattrapageForm.child && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                      {isRTL ? 'تسجيل حضور متأخر (الروضة مغلقة)' : 'Rattrapage de présence (Crèche fermée)'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {rattrapageForm.child.first_name} {rattrapageForm.child.last_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRattrapageModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  {isRTL
                    ? 'الروضة مغلقة حالياً. يمكنك تحديد ساعات الوصول والمغادرة الفعلية لتسجيل هذا الحضور.'
                    : 'La crèche est actuellement fermée. Vous pouvez renseigner les horaires effectifs d\'arrivée et de départ pour enregistrer ce pointage tardif.'}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'ساعة الوصول' : 'Heure d\'arrivée'}
                    </label>
                    <input
                      type="time"
                      value={rattrapageForm.check_in_time}
                      onChange={(e) => setRattrapageForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'ساعة المغادرة' : 'Heure de départ'}
                    </label>
                    <input
                      type="time"
                      value={rattrapageForm.check_out_time}
                      onChange={(e) => setRattrapageForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'ملاحظة' : 'Remarque / Motif'}
                  </label>
                  <input
                    type="text"
                    value={rattrapageForm.notes}
                    onChange={(e) => setRattrapageForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={isRTL ? 'ملاحظة اختيارية...' : 'Remarque optionnelle...'}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRattrapageModalOpen(false)}
                  className="flex-1 text-xs"
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmRattrapage}
                  disabled={actionLoading === rattrapageForm.child?.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  {actionLoading === rattrapageForm.child?.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    (isRTL ? 'تأكيد الحضور' : 'Enregistrer présence')
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Rectification des Heures (Pointage terminé) */}
      <AnimatePresence>
        {rectifyModalOpen && rectifyForm.child && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                      {isRTL ? 'تصحيح ساعات الحضور' : 'Rectifier les heures'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {rectifyForm.child.first_name} {rectifyForm.child.last_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRectifyModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'ساعة الوصول' : 'Heure d\'arrivée'}
                    </label>
                    <input
                      type="time"
                      value={rectifyForm.check_in_time}
                      onChange={(e) => setRectifyForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? 'ساعة المغادرة' : 'Heure de départ'}
                    </label>
                    <input
                      type="time"
                      value={rectifyForm.check_out_time}
                      onChange={(e) => setRectifyForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'ملاحظة' : 'Remarque / Motif'}
                  </label>
                  <input
                    type="text"
                    value={rectifyForm.notes}
                    onChange={(e) => setRectifyForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={isRTL ? 'ملاحظة اختيارية...' : 'Motif de correction...'}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRectifyModalOpen(false)}
                  className="flex-1 text-xs"
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmRectify}
                  disabled={actionLoading === rectifyForm.child?.id || actionLoading === rectifyForm.child?.attendance_id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  {actionLoading === rectifyForm.child?.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    (isRTL ? 'حفظ التعديل' : 'Enregistrer la rectification')
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TodaySection;
