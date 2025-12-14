import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import {
  Clock,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import attendanceService from '../../services/attendanceService';
import childrenService from '../../services/childrenService';
import TodaySection from '../../components/attendance/TodaySection';
import HistorySection from '../../components/attendance/HistorySection';
import StatsSection from '../../components/attendance/StatsSection';
import MobileAttendance from '../../components/mobile/MobileAttendance';
import MobileNavigation from '../../components/mobile/MobileNavigation';

const AttendancePage = () => {
  const { isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const dialog = useDialogContext();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Déterminer la section active basée sur l'URL
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/today')) return 'today';
    if (path.includes('/history')) return 'history';
    if (path.includes('/stats')) return 'stats';
    return 'today'; // Par défaut
  };

  const [activeSection, setActiveSection] = useState(getActiveSection());
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentlyPresent, setCurrentlyPresent] = useState([]);
  const [allChildren, setAllChildren] = useState([]); // Liste complète des enfants
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  // Configuration des onglets
  const tabs = [
    {
      id: 'today',
      label: isRTL ? 'اليوم' : 'Aujourd\'hui',
      icon: Clock,
      path: '/dashboard/attendance/today'
    },
    {
      id: 'history',
      label: isRTL ? 'التاريخ' : 'Historique',
      icon: Calendar,
      path: '/dashboard/attendance/history'
    },
    {
      id: 'stats',
      label: isRTL ? 'الإحصائيات' : 'Statistiques',
      icon: BarChart3,
      path: '/dashboard/attendance/stats'
    }
  ];

  // Fonction pour charger les données selon la section active
  const loadData = async () => {
    try {
      setLoading(true);

      switch (activeSection) {
        case 'today':
          await loadTodayData();
          break;
        case 'history':
          await loadHistoryData();
          break;
        case 'stats':
          await loadStatsData();
          break;
        default:
          await loadTodayData();
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      dialog.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données d'aujourd'hui
  const loadTodayData = async () => {
    try {
      // Charger TOUT en parallèle
      const [childrenResponse, attendanceResponse, currentPresentResponse, statsResponse] = await Promise.all([
        childrenService.getAllChildren({ status: 'approved', limit: 100 }),
        attendanceService.getTodayAttendance(),
        attendanceService.getCurrentlyPresent(),
        attendanceService.getAttendanceStats()
      ]);

      // Mettre à jour TOUS les states en même temps
      const children = childrenResponse.success ? (childrenResponse.data.children || []) : [];
      console.log('🎯 AttendancePage - Enfants chargés:', children.length);

      setAllChildren(children);
      setAttendanceData(attendanceResponse.attendance || []);
      setCurrentlyPresent(currentPresentResponse.children || []);
      setStats(statsResponse);
    } catch (error) {
      console.error('❌ AttendancePage - Erreur loadTodayData:', error);
    }
  };

  // Charger l'historique
  const loadHistoryData = async () => {
    try {
      const attendanceResponse = await attendanceService.getAttendanceByDate(selectedDate);
      setAttendanceData(attendanceResponse.attendances || []);
    } catch (error) {
      console.error('❌ AttendancePage - Erreur loadHistoryData:', error);
    }
  };

  // Charger les statistiques
  const loadStatsData = async () => {
    const [attendanceResponse, statsResponse] = await Promise.all([
      attendanceService.getTodayAttendance(),
      attendanceService.getAttendanceStats()
    ]);

    setAttendanceData(attendanceResponse.attendance || attendanceResponse.attendances || []);
    setStats(statsResponse);
  };

  // Fonction check-in
  const handleCheckIn = async (childId) => {
    try {
      setActionLoading(childId);
      await attendanceService.checkIn(childId);
      dialog.success(isRTL ? 'تم تسجيل الوصول بنجاح' : 'Arrivée enregistrée avec succès');
      await loadTodayData();
    } catch (error) {
      console.error('Erreur check-in:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في تسجيل الوصول' : 'Erreur lors de l\'enregistrement'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction check-out
  const handleCheckOut = async (childId) => {
    try {
      setActionLoading(childId);
      await attendanceService.checkOut(childId);
      dialog.success(isRTL ? 'تم تسجيل المغادرة بنجاح' : 'Départ enregistré avec succès');
      await loadTodayData();
    } catch (error) {
      console.error('Erreur check-out:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في تسجيل المغادرة' : 'Erreur lors de l\'enregistrement'));
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSection, selectedDate]);

  // Mettre à jour la section active quand l'URL change
  useEffect(() => {
    setActiveSection(getActiveSection());
  }, [location.pathname]);

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    loadData();
  };

  // Rendu du contenu selon la section active
  const renderContent = () => {
    switch (activeSection) {
      case 'today':
        return (
          <TodaySection
            currentlyPresent={currentlyPresent}
            attendanceData={attendanceData}
            allChildren={allChildren}
            stats={stats}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            actionLoading={actionLoading}
          />
        );
      case 'history':
        return (
          <HistorySection
            attendanceData={attendanceData}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
          />
        );
      case 'stats':
        return (
          <StatsSection
            stats={stats}
            attendanceData={attendanceData}
          />
        );
      default:
        console.log('🎯 AttendancePage - Rendu TodaySection avec allChildren:', allChildren.length);
        return (
          <TodaySection
            currentlyPresent={currentlyPresent}
            attendanceData={attendanceData}
            allChildren={allChildren}
            stats={stats}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            actionLoading={actionLoading}
          />
        );
    }
  };


  // Préparer les données pour le composant mobile
  const mobileAttendanceMap = useMemo(() => {
    const map = {};
    attendanceData.forEach(record => {
      map[record.child_id] = {
        check_in: record.check_in_time || record.check_in,
        check_out: record.check_out_time || record.check_out
      };
    });
    return map;
  }, [attendanceData]);

  const mobileStats = useMemo(() => ({
    present: currentlyPresent.length,
    absent: allChildren.length - currentlyPresent.length,
    total: allChildren.length
  }), [currentlyPresent, allChildren]);

  // Version Mobile
  if (isMobile) {
    return (
      <>
        <MobileAttendance
          children={allChildren}
          attendance={mobileAttendanceMap}
          stats={mobileStats}
          loading={loading}
          selectedDate={new Date(selectedDate)}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onRefresh={handleRefresh}
        />
        <MobileNavigation />
      </>
    );
  }

  // Version Desktop
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'إدارة الحضور' : 'Gestion des présences'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'تتبع حضور وغياب الأطفال' : 'Suivi des présences et absences des enfants'}
          </p>
        </div>


      </motion.div>

      {/* Onglets de navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide relative z-10">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 rtl:space-x-reverse min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 rtl:mr-0 rtl:ml-1.5 sm:rtl:ml-2" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Contenu de la section active */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default AttendancePage;
