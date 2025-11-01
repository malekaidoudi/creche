import { useState, useEffect } from 'react';
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
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import attendanceService from '../../services/attendanceService';
import childrenService from '../../services/childrenService';
import TodaySection from '../../components/attendance/TodaySection';
import HistorySection from '../../components/attendance/HistorySection';
import StatsSection from '../../components/attendance/StatsSection';

const AttendancePage = () => {
  const { isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
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
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement');
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
      console.log('🎯 AttendancePage - loadTodayData:', {
        childrenResponse,
        children: children.length,
        attendance: attendanceResponse.attendance?.length || 0,
        currentlyPresent: currentPresentResponse.children?.length || 0
      });
      
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
      console.log('📅 AttendancePage - Chargement historique pour:', selectedDate);
      const attendanceResponse = await attendanceService.getAttendanceByDate(selectedDate);
      console.log('📅 AttendancePage - Réponse historique:', attendanceResponse);
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
      toast.success(isRTL ? 'تم تسجيل الوصول بنجاح' : 'Arrivée enregistrée avec succès');
      await loadTodayData();
    } catch (error) {
      console.error('Erreur check-in:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في تسجيل الوصول' : 'Erreur lors de l\'enregistrement'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction check-out
  const handleCheckOut = async (childId) => {
    try {
      setActionLoading(childId);
      await attendanceService.checkOut(childId);
      toast.success(isRTL ? 'تم تسجيل المغادرة بنجاح' : 'Départ enregistré avec succès');
      await loadTodayData();
    } catch (error) {
      console.error('Erreur check-out:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في تسجيل المغادرة' : 'Erreur lors de l\'enregistrement'));
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
        
        <Button 
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Actualiser'}
        </Button>
      </motion.div>

      {/* Onglets de navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
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
