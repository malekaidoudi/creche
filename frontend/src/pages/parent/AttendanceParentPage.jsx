import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Baby,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AttendanceParentPage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nurserySettings, setNurserySettings] = useState({});
  const [closedDays, setClosedDays] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les jours fermés du mois via la nouvelle API
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        const closedDaysResponse = await api.get(`/schedule-settings/closed-days/${year}/${month}`);
        if (closedDaysResponse.data.success) {
          const closedDaysList = closedDaysResponse.data.closed_days.map(cd => cd.day);
          setClosedDays(closedDaysList);
          setNurserySettings(closedDaysResponse.data.weekly_settings);
        } else {
          // Fallback : utiliser des paramètres par défaut
          console.log('⚠️ Paramètres non trouvés, utilisation des valeurs par défaut');
          const closedDaysList = calculateClosedDays(null, currentMonth);
          setClosedDays(closedDaysList);
        }
      } catch (error) {
        console.error('Erreur chargement jours fermés:', error);
        // Fallback : utiliser des paramètres par défaut (dimanche et samedi fermés)
        console.log('⚠️ Erreur paramètres, utilisation des valeurs par défaut');
        const closedDaysList = calculateClosedDays(null, currentMonth);
        setClosedDays(closedDaysList);
        toast.error(isRTL ? 'خطأ في تحميل إعدادات الحضانة' : 'Erreur chargement paramètres crèche');
      }

      // Charger les enfants du parent
      const childrenResponse = await api.get('/api/user/children-summary');
      const childrenList = childrenResponse.data.children || [];
      setChildren(childrenList);
      
      // Sélectionner le premier enfant par défaut
      if (childrenList.length > 0 && !selectedChild) {
        setSelectedChild(childrenList[0]);
      }

      // Charger les données de présence pour chaque enfant
      const attendancePromises = childrenList.map(async (child) => {
        try {
          const response = await api.get(`/attendance/child/${child.id}/month`, {
            params: {
              year: currentMonth.getFullYear(),
              month: currentMonth.getMonth() + 1
            }
          });
          return { childId: child.id, data: response.data.attendance || [] };
        } catch (error) {
          console.error(`Erreur chargement présence enfant ${child.id}:`, error);
          return { childId: child.id, data: [] };
        }
      });

      const attendanceResults = await Promise.all(attendancePromises);
      const attendanceMap = {};
      attendanceResults.forEach(result => {
        attendanceMap[result.childId] = result.data;
      });
      
      setAttendanceData(attendanceMap);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Calculer les jours de fermeture basés sur les paramètres
  const calculateClosedDays = (settings, month) => {
    const closedDays = [];
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dayOfWeek = date.getDay(); // 0 = Dimanche, 6 = Samedi

      // Vérifier les jours de la semaine fermés
      // Gérer les différents formats de données (boolean, string, etc.)
      // Par défaut, dimanche et samedi sont fermés si pas de paramètres
      const isSundayClosed = !settings ? true : (settings.sunday_open === false || settings.sunday_open === 'false' || settings.sunday_open === '0' || settings.sunday_open === 0);
      const isMondayClosed = !settings ? false : (settings.monday_open === false || settings.monday_open === 'false' || settings.monday_open === '0' || settings.monday_open === 0);
      const isTuesdayClosed = !settings ? false : (settings.tuesday_open === false || settings.tuesday_open === 'false' || settings.tuesday_open === '0' || settings.tuesday_open === 0);
      const isWednesdayClosed = !settings ? false : (settings.wednesday_open === false || settings.wednesday_open === 'false' || settings.wednesday_open === '0' || settings.wednesday_open === 0);
      const isThursdayClosed = !settings ? false : (settings.thursday_open === false || settings.thursday_open === 'false' || settings.thursday_open === '0' || settings.thursday_open === 0);
      const isFridayClosed = !settings ? false : (settings.friday_open === false || settings.friday_open === 'false' || settings.friday_open === '0' || settings.friday_open === 0);
      const isSaturdayClosed = !settings ? true : (settings.saturday_open === false || settings.saturday_open === 'false' || settings.saturday_open === '0' || settings.saturday_open === 0);

      const weekDaySettings = {
        0: isSundayClosed,    // Dimanche
        1: isMondayClosed,    // Lundi
        2: isTuesdayClosed,   // Mardi
        3: isWednesdayClosed, // Mercredi
        4: isThursdayClosed,  // Jeudi
        5: isFridayClosed,    // Vendredi
        6: isSaturdayClosed   // Samedi
      };

      if (weekDaySettings[dayOfWeek]) {
        closedDays.push(day);
      }
    }
    return closedDays;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    if (timeString.includes('T') || timeString.includes(' ')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } catch {
      return timeString;
    }
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getAttendanceForDate = (childId, day) => {
    const childAttendance = attendanceData[childId] || [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    return childAttendance.find(att => att.date.split('T')[0] === dateStr);
  };

  const getDayStatus = (day) => {
    if (!selectedChild) return 'closed';
    
    const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // PRIORITÉ 1: Vérifier si c'est un jour de fermeture (crèche fermée)
    if (closedDays.includes(day)) {
      return 'closed';
    }

    // PRIORITÉ 2: Vérifier les données de présence
    const attendance = getAttendanceForDate(selectedChild.id, day);
    if (attendance && attendance.check_in_time) {
      return 'present';
    }

    // PRIORITÉ 3: Si pas de données de présence ET que la crèche est ouverte
    const today = new Date();
    
    // Vérifier que c'est un jour ouvrable (pas dans closedDays) ET que la date est passée
    if (currentDate < today && !closedDays.includes(day)) {
      return 'absent';
    }

    // Pour les jours futurs
    return 'future';
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const dayNames = isRTL 
      ? ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س']
      : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // En-têtes des jours
    days.push(
      <div key="headers" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((dayName, index) => (
          <div key={index} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
            {dayName}
          </div>
        ))}
      </div>
    );

    // Cases vides pour aligner le premier jour
    const emptyDays = [];
    for (let i = 0; i < firstDay; i++) {
      emptyDays.push(
        <div key={`empty-${i}`} className="p-2"></div>
      );
    }

    // Jours du mois
    const monthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const status = getDayStatus(day);
      const attendance = getAttendanceForDate(selectedChild?.id, day);
      
      let bgColor = 'bg-white';
      let borderColor = 'border-gray-200';
      let textColor = 'text-gray-900 dark:text-white';
      let icon = null;

      switch (status) {
        case 'present':
          bgColor = 'bg-green-50';
          borderColor = 'border-green-500';
          textColor = 'text-green-900';
          icon = <CheckCircle className="w-4 h-4 text-green-600" />;
          break;
        case 'absent':
          bgColor = 'bg-red-50';
          borderColor = 'border-red-500';
          textColor = 'text-red-900';
          icon = <XCircle className="w-4 h-4 text-red-600" />;
          break;
        case 'closed':
          bgColor = 'bg-gray-100';
          borderColor = 'border-gray-400';
          textColor = 'text-gray-500 dark:text-gray-400';
          icon = <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
          break;
        default:
          bgColor = 'bg-white';
          borderColor = 'border-gray-200';
          textColor = 'text-gray-400 dark:text-gray-500';
      }

      monthDays.push(
        <div
          key={day}
          className={`${bgColor} ${borderColor} ${textColor} border-2 rounded-lg p-2 min-h-[80px] flex flex-col items-center justify-start transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-sm font-medium">{day}</span>
            {icon}
          </div>
          
          {status === 'present' && attendance && (
            <div className="text-xs text-center w-full">
              <div className="text-green-700 font-medium">
                {isRTL ? 'وصول' : 'Arrivée'}: {formatTime(attendance.check_in_time)}
              </div>
              {attendance.check_out_time && (
                <div className="text-green-600">
                  {isRTL ? 'مغادرة' : 'Départ'}: {formatTime(attendance.check_out_time)}
                </div>
              )}
            </div>
          )}
          
          {status === 'closed' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {isRTL ? 'مغلق' : 'Fermé'}
            </div>
          )}
        </div>
      );
    }

    days.push(
      <div key="calendar" className="grid grid-cols-7 gap-1">
        {emptyDays}
        {monthDays}
      </div>
    );

    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/mon-espace')}
              className={`flex items-center gap-2 transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              {isRTL ? 'رجوع إلى مساحتي' : 'Retour à Mon Espace'}
            </button>
          </div>
          
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isRTL ? 'تقرير حضور الأطفال' : 'Calendrier de Présence'}
          </h1>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {isRTL ? 'تابع حضور أطفالك في الحضانة' : 'Suivez la présence de vos enfants à la crèche'}
          </p>
        </motion.div>

        {/* Sélecteur d'enfant */}
        {children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedChild?.id === child.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Baby className="w-4 h-4" />
                        {child.first_name} {child.last_name}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation du mois */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getMonthName(currentMonth)}
                </h2>
                
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Légende */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">
                {isRTL ? 'مفتاح الألوان' : 'Légende'}
              </h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border-2 border-green-500 rounded"></div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{isRTL ? 'حاضر' : 'Présent'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border-2 border-red-500 rounded"></div>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm">{isRTL ? 'غائب' : 'Absent'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border-2 border-gray-400 rounded"></div>
                  <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm">{isRTL ? 'مغلق' : 'Fermé'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendrier */}
        {children.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Baby className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isRTL ? 'لا توجد أطفال مسجلون' : 'Aucun enfant inscrit'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {isRTL ? 'لم يتم العثور على أطفال مرتبطين بحسابك' : 'Aucun enfant trouvé associé à votre compte'}
              </p>
            </CardContent>
          </Card>
        ) : selectedChild ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {isRTL ? 'تقويم حضور' : 'Calendrier de présence'} - {selectedChild.first_name} {selectedChild.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {renderCalendar()}
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default AttendanceParentPage;
