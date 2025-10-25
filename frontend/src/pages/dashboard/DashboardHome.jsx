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
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import HolidaysList from '../../components/HolidaysList';

const DashboardHome = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des statistiques
    // TODO: Remplacer par de vrais appels API
    setTimeout(() => {
      setStats({
        totalChildren: 24,
        presentToday: 18,
        pendingEnrollments: 5,
        maxCapacity: 30,
        availablePlaces: 6,
        attendanceRate: 85,
        newEnrollmentsThisMonth: 3
      });
      setLoading(false);
    }, 1000);
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
      title: isRTL ? 'إضافة طفل' : 'Ajouter enfant',
      description: isRTL ? 'تسجيل طفل جديد في النظام' : 'Enregistrer nouvel enfant',
      icon: Baby,
      link: '/dashboard/children/add',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      adminOnly: true
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

  const recentActivities = [
    {
      type: 'enrollment',
      message: isRTL ? 'طلب تسجيل جديد من لينا بن علي' : 'Nouvelle demande d\'inscription de Lina Ben Ali',
      time: isRTL ? 'منذ 2 ساعات' : 'il y a 2h',
      icon: ClipboardList,
      color: 'text-blue-600'
    },
    {
      type: 'attendance',
      message: isRTL ? 'يوسف بن علي وصل إلى الحضانة' : 'Youssef Benali est arrivé à la crèche',
      time: isRTL ? 'منذ 8:30 صباحاً' : 'à 8:30',
      icon: UserCheck,
      color: 'text-green-600'
    },
    {
      type: 'approval',
      message: isRTL ? 'تم قبول طلب تسجيل أمينة العلوي' : 'Demande d\'Amina Alaoui approuvée',
      time: isRTL ? 'أمس' : 'hier',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      type: 'attendance',
      message: isRTL ? 'إيما مارتن غادرت الحضانة' : 'Emma Martin a quitté la crèche',
      time: isRTL ? 'منذ 17:15' : 'à 17:15',
      icon: UserX,
      color: 'text-orange-600'
    }
  ];

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
                  {recentActivities.map((activity, index) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Jours fériés sur toute la largeur */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <HolidaysList userRole={user?.role} />
        </motion.div>
      )}
    </div>
  );
};

export default DashboardHome;
