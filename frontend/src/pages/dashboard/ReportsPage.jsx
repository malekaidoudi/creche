import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Baby,
  FileText,
  TrendingUp,
  Clock,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import reportsService from '../../services/reportsService';

const ReportsPage = () => {
  const { isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [generalReport, setGeneralReport] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [exportLoading, setExportLoading] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Charger le rapport général
  const loadGeneralReport = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getGeneralReport();
      
      if (response.success) {
        setGeneralReport(response.report);
      }
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
      toast.error('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin() || isStaff()) {
      loadGeneralReport();
    }
  }, []);

  // Fonction pour exporter en CSV
  const handleExport = async (type) => {
    try {
      setExportLoading(type);
      await reportsService.downloadCSV(type, dateRange);
      toast.success(isRTL ? 'تم تصدير الملف بنجاح' : 'Export réussi');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExportLoading(null);
    }
  };

  // Fonction pour rafraîchir
  const handleRefresh = () => {
    loadGeneralReport();
  };

  if (!isAdmin() && !isStaff()) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {isRTL ? 'غير مخول' : 'Accès non autorisé'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isRTL ? 'ليس لديك صلاحية للوصول إلى التقارير' : 'Vous n\'avez pas l\'autorisation d\'accéder aux rapports'}
        </p>
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'التقارير والإحصائيات' : 'Rapports et Statistiques'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'تقارير شاملة عن نشاط الحضانة' : 'Rapports complets sur l\'activité de la crèche'}
          </p>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Actualiser'}
        </Button>
      </div>

      {/* Filtres de date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'فلاتر التاريخ' : 'Filtres de date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRTL ? 'من تاريخ' : 'Date de début'}
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRTL ? 'إلى تاريخ' : 'Date de fin'}
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques générales */}
      {generalReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isRTL ? 'إجمالي الأطفال' : 'Total enfants'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {generalReport.general.totalChildren}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Baby className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isRTL ? 'إجمالي الأولياء' : 'Total parents'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {generalReport.general.totalParents}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isRTL ? 'إجمالي الطلبات' : 'Total inscriptions'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {generalReport.general.totalEnrollments}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isRTL ? 'في الانتظار' : 'En attente'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {generalReport.general.pendingEnrollments}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Répartition par âge */}
      {generalReport && generalReport.ageDistribution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'التوزيع حسب العمر' : 'Répartition par âge'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generalReport.ageDistribution.map((item) => (
                <div key={item.age_group} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.age_group}
                  </span>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(item.count / generalReport.general.totalChildren) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-8">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boutons d'export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'تصدير البيانات' : 'Export des données'}
          </CardTitle>
          <CardDescription>
            {isRTL ? 'تصدير البيانات بصيغة CSV' : 'Exporter les données au format CSV'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleExport('children')}
              disabled={exportLoading === 'children'}
              variant="outline"
              className="w-full"
            >
              {exportLoading === 'children' ? (
                <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
              ) : (
                <Baby className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              )}
              {isRTL ? 'الأطفال' : 'Enfants'}
            </Button>
            
            <Button
              onClick={() => handleExport('attendance')}
              disabled={exportLoading === 'attendance'}
              variant="outline"
              className="w-full"
            >
              {exportLoading === 'attendance' ? (
                <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              )}
              {isRTL ? 'الحضور' : 'Présences'}
            </Button>
            
            <Button
              onClick={() => handleExport('enrollments')}
              disabled={exportLoading === 'enrollments'}
              variant="outline"
              className="w-full"
            >
              {exportLoading === 'enrollments' ? (
                <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              )}
              {isRTL ? 'الطلبات' : 'Inscriptions'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
