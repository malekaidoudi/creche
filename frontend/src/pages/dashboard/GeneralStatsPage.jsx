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
import toast from 'react-hot-toast';

const GeneralStatsPage = () => {
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState(null);

  // Données simulées pour les statistiques
  useEffect(() => {
    const loadStats = async () => {
      try {
        setTimeout(() => {
          const mockStats = {
            overview: {
              totalChildren: 45,
              totalParents: 38,
              totalStaff: 8,
              capacity: 60,
              occupancyRate: 75,
              averageAttendance: 85
            },
            trends: {
              childrenGrowth: 12,
              attendanceChange: 5,
              enrollmentChange: -2,
              satisfactionScore: 4.6
            },
            monthly: {
              enrollments: [5, 8, 12, 7, 9, 15, 11, 6, 10, 13, 8, 9],
              attendance: [82, 85, 88, 84, 87, 90, 89, 86, 88, 91, 87, 85],
              revenue: [12000, 15000, 18000, 14000, 16000, 22000, 19000, 13000, 17000, 21000, 16000, 18000]
            },
            departments: [
              { name: isRTL ? 'الرضع' : 'Bébés', count: 12, percentage: 27 },
              { name: isRTL ? 'الصغار' : 'Petits', count: 18, percentage: 40 },
              { name: isRTL ? 'الكبار' : 'Grands', count: 15, percentage: 33 }
            ],
            topPerformers: [
              { name: 'Amina Khelifi', role: isRTL ? 'معلمة' : 'Éducatrice', score: 98 },
              { name: 'Sarah Benali', role: isRTL ? 'مديرة' : 'Directrice', score: 96 },
              { name: 'Fatma Trabelsi', role: isRTL ? 'ممرضة' : 'Infirmière', score: 94 }
            ],
            alerts: [
              { type: 'warning', message: isRTL ? 'معدل الحضور منخفض هذا الأسبوع' : 'Taux de présence faible cette semaine' },
              { type: 'info', message: isRTL ? '5 طلبات تسجيل جديدة في الانتظار' : '5 nouvelles demandes d\'inscription en attente' },
              { type: 'success', message: isRTL ? 'تم تحقيق هدف الشهر' : 'Objectif mensuel atteint' }
            ]
          };
          setStats(mockStats);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur chargement statistiques:', error);
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
    
    toast.success(isRTL ? 'تم تصدير الإحصائيات' : 'Statistiques exportées');
  };

  const refreshStats = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(isRTL ? 'تم تحديث الإحصائيات' : 'Statistiques mises à jour');
    }, 1000);
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
            onClick={refreshStats}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'تحديث' : 'Actualiser'}
          </Button>
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
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
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
                  <div key={index} className={`p-3 rounded-lg border-l-4 rtl:border-l-0 rtl:border-r-4 ${
                    alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400' :
                    alert.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' :
                    'bg-green-50 dark:bg-green-900/20 border-green-400'
                  }`}>
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                      {alert.type === 'info' && <Clock className="w-5 h-5 text-blue-600 mt-0.5" />}
                      {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                      <p className={`text-sm ${
                        alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
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
