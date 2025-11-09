import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Baby,
  ClipboardList,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  UserCheck,
  UserX,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import HolidaysList from '../../components/HolidaysList';
import TodayAbsences from '../../components/dashboard/TodayAbsences';
import UpcomingEventsWidget from '../../components/widgets/UpcomingEventsWidget';
import BirthdaysWidget from '../../components/widgets/BirthdaysWidget';
import TodayTasksWidget from '../../components/widgets/TodayTasksWidget';
import StaffMessagesWidget from '../../components/widgets/StaffMessagesWidget';
import api from '../../services/api';

const DashboardHome = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  // Fonction pour formater un log en activité affichable
  const formatLogToActivity = (log) => {
    const actionIcons = {
      'login': UserCheck,
      'logout': UserX,
      'create_child': Baby,
      'update_child': Baby,
      'delete_child': Baby,
      'create_enrollment': ClipboardList,
      'approve_enrollment': CheckCircle,
      'reject_enrollment': AlertCircle,
      'check_in': UserCheck,
      'check_out': UserX,
      'create_document': FileText,
      'update_profile': UserCheck,
      'default': Clock
    };
    
    const actionColors = {
      'login': 'text-green-600',
      'logout': 'text-orange-600',
      'create_child': 'text-blue-600',
      'approve_enrollment': 'text-green-600',
      'reject_enrollment': 'text-red-600',
      'check_in': 'text-green-600',
      'check_out': 'text-orange-600',
      'default': 'text-gray-600'
    };
    
    const icon = actionIcons[log.action] || actionIcons.default;
    const color = actionColors[log.action] || actionColors.default;
    
    // Formater le temps relatif
    const timeAgo = formatTimeAgo(log.created_at);
    
    // Message par défaut ou description du log
    const message = log.description || `${log.first_name} ${log.last_name} - ${log.action}`;
    
    return {
      type: log.action,
      message,
      time: timeAgo,
      icon,
      color,
      user: `${log.first_name} ${log.last_name}`
    };
  };
  
  // Fonction pour formater le temps relatif
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const logDate = new Date(timestamp);
    const diffMs = now - logDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return isRTL ? 'الآن' : 'maintenant';
    } else if (diffMins < 60) {
      return isRTL ? `منذ ${diffMins} دقيقة` : `il y a ${diffMins}min`;
    } else if (diffHours < 24) {
      return isRTL ? `منذ ${diffHours} ساعة` : `il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return isRTL ? 'أمس' : 'hier';
    } else {
      return isRTL ? `منذ ${diffDays} أيام` : `il y a ${diffDays}j`;
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Charger les statistiques (simulées pour l'instant)
        setStats({
          totalChildren: 24,
          presentToday: 18,
          pendingEnrollments: 5,
          maxCapacity: 30,
          availablePlaces: 6,
          attendanceRate: 85,
          newEnrollmentsThisMonth: 3
        });
        
        // Charger les logs réels depuis l'API
        const response = await api.get('/api/logs?limit=5');
        if (response.data.success) {
          const formattedLogs = response.data.logs.map(log => formatLogToActivity(log));
          setRecentActivities(formattedLogs);
        }
      } catch (error) {
        console.error('❌ Erreur chargement dashboard:', error);
        // En cas d'erreur, garder un tableau vide
        setRecentActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  const statsCards = [
    {
      title: isRTL ? 'إجمالي الأطفال' : 'Total Enfants',
      value: stats?.totalChildren || 0,
      icon: Baby,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      change: '+2',
      changeText: isRTL ? 'هذا الشهر' : 'ce mois'
    },
    {
      title: isRTL ? 'الحاضرون اليوم' : 'Présents aujourd\'hui',
      value: stats?.presentToday || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      change: `${stats?.attendanceRate || 0}%`,
      changeText: isRTL ? 'معدل الحضور' : 'taux présence'
    },
    {
      title: isRTL ? 'طلبات معلقة' : 'Demandes en attente',
      value: stats?.pendingEnrollments || 0,
      icon: ClipboardList,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      change: 'Urgent',
      changeText: isRTL ? 'يتطلب مراجعة' : 'nécessite révision'
    },
    {
      title: isRTL ? 'أماكن متاحة' : 'Places disponibles',
      value: stats?.availablePlaces || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      change: `/${stats?.maxCapacity || 30}`,
      changeText: isRTL ? 'السعة القصوى' : 'capacité max'
    }
  ];

  const quickActions = [
    {
      title: isRTL ? 'تسجيل حضور' : 'Enregistrer présence',
      description: isRTL ? 'تسجيل وصول أو مغادرة طفل' : 'Marquer arrivée/départ enfant',
      icon: Clock,
      link: '/dashboard/attendance/today',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: isRTL ? 'مراجعة الطلبات' : 'Réviser demandes',
      description: isRTL ? 'مراجعة طلبات التسجيل المعلقة' : 'Examiner inscriptions en attente',
      icon: FileText,
      link: '/dashboard/pending-enrollments',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: isRTL ? 'إدارة الغيابات' : 'Gestion des absences',
      description: isRTL ? 'عرض وتأكيد طلبات الغياب' : 'Voir et valider les demandes d\'absence',
      icon: Calendar,
      link: '/dashboard/absence-management',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      adminOnly: false
    },
    {
      title: isRTL ? 'التقارير' : 'Rapports',
      description: isRTL ? 'عرض الإحصائيات والتقارير' : 'Voir statistiques et rapports',
      icon: TrendingUp,
      link: '/dashboard/reports/stats',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      adminOnly: true
    }
  ];

  // recentActivities est maintenant chargé depuis l'API via useEffect

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête de bienvenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {isRTL ? `مرحباً، ${user?.first_name}` : `Bonjour, ${user?.first_name}`}
          </h1>
          <p className="text-primary-100 text-lg">
            {isRTL
              ? 'إليك نظرة عامة على أنشطة الحضانة اليوم'
              : 'Voici un aperçu des activités de la crèche aujourd\'hui'
            }
          </p>
        </div>
      </motion.div>

      {/* Statistiques sur toute la largeur */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {isRTL ? 'الإحصائيات' : 'Statistiques'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow h-32">
              <CardContent className="p-6 h-full">
                <div className="flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="font-medium">{stat.change}</span> {stat.changeText}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        </div>
      </div>

      {/* Tâches d'aujourd'hui (staff/admin uniquement) */}
      {(isStaff() || isAdmin()) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isRTL ? 'مهام اليوم' : 'Tâches d\'aujourd\'hui'}
            </h2>
            {isStaff() && !isAdmin() && (
              <Link
                to="/dashboard/staff/send-message"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                {isRTL ? 'إرسال رسالة' : 'Envoyer un message'}
              </Link>
            )}
          </div>
          <TodayTasksWidget />
        </motion.div>
      )}

      {/* Widgets Événements (staff/admin uniquement) */}
      {(isStaff() || isAdmin()) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UpcomingEventsWidget days={7} limit={5} />
            {isAdmin() ? (
              <StaffMessagesWidget />
            ) : (
              <BirthdaysWidget />
            )}
          </div>
          {isAdmin() && (
            <div className="grid grid-cols-1 gap-6">
              <BirthdaysWidget />
            </div>
          )}
        </motion.div>
      )}

      {/* Actions rapides et Activités récentes sur la même ligne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Actions rapides */}
        <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'الإجراءات السريعة' : 'Actions rapides'}
            </h2>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'الإجراءات السريعة' : 'Actions rapides'}
              </CardTitle>
              <CardDescription>
                {isRTL ? 'الوصول السريع للمهام الشائعة' : 'Accès rapide aux tâches courantes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions
                  .filter(action => !action.adminOnly || isAdmin())
                  .map((action, index) => (
                    <Link
                      key={index}
                      to={action.link}
                      className={`p-4 rounded-lg border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${action.bgColor} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                          <action.icon className={`w-5 h-5 ${action.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
            </motion.div>
        </div>

        {/* Activités récentes */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {isRTL ? 'الأنشطة الأخيرة' : 'Activités récentes'}
          </h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'الأنشطة الأخيرة' : 'Activités récentes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>{isRTL ? 'لا توجد أنشطة حديثة' : 'Aucune activité récente'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Absences du jour (admin/staff uniquement) */}
      {(isAdmin() || isStaff()) && (
        <TodayAbsences />
      )}

      {/* Jours fériés sur toute la largeur */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <HolidaysList userRole={user?.role} />
        </motion.div>
      )}
    </div>
  );
};

export default DashboardHome;
