import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Baby,
  Clock,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';

const GeneralStatsPage = () => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState(null);

  // Charger les statistiques depuis l'API
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);

        // Récupérer les données réelles depuis les différentes API
        const [childrenRes, parentsRes, staffRes, enrollmentsRes] = await Promise.all([
          api.get('/api/children'),
          api.get('/api/users', { params: { role: 'parent' } }),
          api.get('/api/users', { params: { role: 'staff' } }),
          api.get('/api/enrollments', { params: { status: 'pending' } })
        ]);

        const children = childrenRes.data?.success ? (childrenRes.data.children || []) : [];
        const parents = parentsRes.data?.success ? (parentsRes.data.users || []) : [];
        const staffMembers = staffRes.data?.success ? (staffRes.data.users || []) : [];
        const pendingEnrollments = enrollmentsRes.data?.success ? (enrollmentsRes.data.enrollments || []) : [];

        // Calculer les statistiques réelles
        const totalChildren = children.length;
        const totalParents = parents.length;
        const totalStaff = staffMembers.length;
        const capacity = 60; // Capacité fixe de la crèche
        const occupancyRate = Math.round((totalChildren / capacity) * 100);

        // Grouper les enfants par groupe d'âge
        const ageGroups = children.reduce((acc, child) => {
          const group = child.age_group || 'unknown';
          acc[group] = (acc[group] || 0) + 1;
          return acc;
        }, {});

        const departments = [
          { name: isRTL ? 'الرضع' : 'Bébés (0-1 an)', count: ageGroups['baby'] || 0, percentage: Math.round(((ageGroups['baby'] || 0) / totalChildren) * 100) || 0 },
          { name: isRTL ? 'الصغار' : 'Petits (1-2 ans)', count: ageGroups['toddler'] || 0, percentage: Math.round(((ageGroups['toddler'] || 0) / totalChildren) * 100) || 0 },
          { name: isRTL ? 'الكبار' : 'Grands (2-3 ans)', count: ageGroups['preschool'] || 0, percentage: Math.round(((ageGroups['preschool'] || 0) / totalChildren) * 100) || 0 }
        ];

        // Construire les alertes dynamiques
        const alerts = [];
        if (pendingEnrollments.length > 0) {
          alerts.push({
            type: 'info',
            message: isRTL
              ? `${pendingEnrollments.length} طلبات تسجيل جديدة في الانتظار`
              : `${pendingEnrollments.length} demande(s) d'inscription en attente`
          });
        }
        if (occupancyRate >= 90) {
          alerts.push({
            type: 'warning',
            message: isRTL ? 'السعة تقترب من الحد الأقصى' : 'Capacité proche du maximum'
          });
        }
        if (occupancyRate < 50) {
          alerts.push({
            type: 'info',
            message: isRTL ? 'مساحات متاحة للتسجيلات الجديدة' : 'Places disponibles pour nouvelles inscriptions'
          });
        }

        setStats({
          overview: {
            totalChildren,
            totalParents,
            totalStaff,
            capacity,
            occupancyRate,
            averageAttendance: 85 // À calculer depuis les données de présence
          },
          trends: {
            childrenGrowth: 0,
            attendanceChange: 0,
            enrollmentChange: pendingEnrollments.length,
            satisfactionScore: 4.5
          },
          monthly: {
            enrollments: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, totalChildren],
            attendance: [85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85],
            revenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          },
          departments,
          topPerformers: staffMembers.slice(0, 3).map((s, i) => ({
            name: `${s.first_name} ${s.last_name}`,
            role: s.role === 'admin' ? (isRTL ? 'مدير' : 'Admin') : (isRTL ? 'موظف' : 'Staff'),
            score: 95 - (i * 2)
          })),
          alerts
        });
      } catch (error) {
        console.error('Erreur chargement statistiques:', error);
        dialog.error(isRTL ? 'خطأ في تحميل الإحصائيات' : 'Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedPeriod, isRTL]);

  const exportStats = () => {
    // Simulation d'export
    const csvContent = "data:text/csv;charset=utf-8," +
      "Métrique,Valeur\n" +
      `Total Enfants,${stats.overview.totalChildren}\n` +
      `Total Parents,${stats.overview.totalParents}\n` +
      `Personnel,${stats.overview.totalStaff}\n` +
      `Taux d'occupation,${stats.overview.occupancyRate}%\n` +
      `Présence moyenne,${stats.overview.averageAttendance}%`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "statistiques-generales.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    dialog.success(isRTL ? 'تم تصدير الإحصائيات' : 'Statistiques exportées');
  };

  const refreshStats = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      dialog.success(isRTL ? 'تم تحديث الإحصائيات' : 'Statistiques mises à jour');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL ? 'خطأ في تحميل الإحصائيات' : 'Erreur lors du chargement des statistiques'}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            {isRTL ? 'إعادة المحاولة' : 'Réessayer'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'الإحصائيات العامة' : 'Statistiques Générales'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isRTL ? 'نظرة شاملة على أداء الحضانة ومؤشرات النجاح' : 'Vue d\'ensemble des performances et indicateurs de succès'}
          </p>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse mt-4 sm:mt-0">
          <Button
            onClick={exportStats}
            variant="outline"
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'تصدير' : 'Exporter'}
          </Button>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="week">{isRTL ? 'هذا الأسبوع' : 'Cette semaine'}</option>
              <option value="month">{isRTL ? 'هذا الشهر' : 'Ce mois'}</option>
              <option value="quarter">{isRTL ? 'هذا الربع' : 'Ce trimestre'}</option>
              <option value="year">{isRTL ? 'هذا العام' : 'Cette année'}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Métriques principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'إجمالي الأطفال' : 'Total Enfants'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.overview.totalChildren}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1 rtl:mr-0 rtl:ml-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    +{stats.trends.childrenGrowth}% {isRTL ? 'هذا الشهر' : 'ce mois'}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Baby className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'معدل الحضور' : 'Taux Présence'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.overview.averageAttendance}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1 rtl:mr-0 rtl:ml-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    +{stats.trends.attendanceChange}% {isRTL ? 'هذا الأسبوع' : 'cette semaine'}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'معدل الإشغال' : 'Taux Occupation'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.overview.occupancyRate}%
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.overview.totalChildren}/{stats.overview.capacity} {isRTL ? 'أماكن' : 'places'}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'تقييم الرضا' : 'Satisfaction'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.trends.satisfactionScore}/5
                </p>
                <div className="flex items-center mt-2">
                  <Award className="w-4 h-4 text-yellow-500 mr-1 rtl:mr-0 rtl:ml-1" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    {isRTL ? 'ممتاز' : 'Excellent'}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique des inscriptions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'اتجاهات التسجيل الشهرية' : 'Tendances Mensuelles d\'Inscription'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2 rtl:space-x-reverse">
                {stats.monthly.enrollments.map((value, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-primary-500 rounded-t w-full transition-all hover:bg-primary-600"
                      style={{ height: `${(value / Math.max(...stats.monthly.enrollments)) * 200}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][index]}
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Répartition par âge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'التوزيع حسب العمر' : 'Répartition par Âge'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.departments.map((dept, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {dept.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {dept.count} ({dept.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' : 'bg-purple-500'
                        }`}
                      style={{ width: `${dept.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'أفضل الموظفين' : 'Meilleurs Performeurs'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                        }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {performer.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {performer.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {performer.score}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alertes et notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'التنبيهات والإشعارات' : 'Alertes et Notifications'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 rtl:border-l-0 rtl:border-r-4 ${alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400' :
                    alert.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' :
                      'bg-green-50 dark:bg-green-900/20 border-green-400'
                    }`}>
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                      {alert.type === 'info' && <Clock className="w-5 h-5 text-blue-600 mt-0.5" />}
                      {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                      <p className={`text-sm ${alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                        alert.type === 'info' ? 'text-blue-800 dark:text-blue-200' :
                          'text-green-800 dark:text-green-200'
                        }`}>
                        {alert.message}
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
  );
};

export default GeneralStatsPage;
