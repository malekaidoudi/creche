import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  User,
  AlertTriangle,
  Info,
  AlertCircle,
  Bug,
  RefreshCw,
  Trash2,
  Eye,
  Clock,
  Globe
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import logsService from '../../services/logsService';

const LogsPage = () => {
  const { isAdmin } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [availableActions, setAvailableActions] = useState([]);
  const [filters, setFilters] = useState({
    level: 'all',
    action: 'all',
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Charger les logs
  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logsService.getAllLogs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setLogs(response.data.logs);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.totalPages
        }));
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await logsService.getLogsStats({ days: 7 });
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  // Charger les actions disponibles
  const loadAvailableActions = async () => {
    try {
      const response = await logsService.getAvailableActions();
      if (response.success) {
        setAvailableActions(response.actions);
      }
    } catch (error) {
      console.error('Erreur chargement actions:', error);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      loadLogs();
      loadStats();
      loadAvailableActions();
    }
  }, [filters, pagination.page]);

  // Fonction pour voir un log en détail
  const handleViewLog = async (logId) => {
    try {
      const response = await logsService.getLogById(logId);
      if (response.success) {
        setSelectedLog(response.log);
        setShowLogModal(true);
      }
    } catch (error) {
      console.error('Erreur récupération log:', error);
      toast.error('Erreur lors de la récupération du log');
    }
  };

  // Fonction pour nettoyer les anciens logs
  const handleCleanup = async () => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف السجلات القديمة؟' : 'Êtes-vous sûr de vouloir supprimer les anciens logs ?')) {
      return;
    }

    try {
      setCleanupLoading(true);
      const response = await logsService.cleanOldLogs(90);
      if (response.success) {
        toast.success(isRTL ? `تم حذف ${response.deletedCount} سجل` : `${response.deletedCount} logs supprimés`);
        loadLogs(); // Recharger
        loadStats(); // Recharger les stats
      }
    } catch (error) {
      console.error('Erreur nettoyage:', error);
      toast.error('Erreur lors du nettoyage');
    } finally {
      setCleanupLoading(false);
    }
  };

  // Fonction pour rafraîchir
  const handleRefresh = () => {
    loadLogs();
    loadStats();
  };

  // Obtenir l'icône selon le niveau
  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // Obtenir la couleur selon le niveau
  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'warning':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'debug':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {isRTL ? 'غير مخول' : 'Accès non autorisé'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isRTL ? 'ليس لديك صلاحية للوصول إلى السجلات' : 'Vous n\'avez pas l\'autorisation d\'accéder aux logs'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'سجلات النظام' : 'Logs système'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'مراقبة نشاط النظام والأخطاء' : 'Surveillance de l\'activité système et des erreurs'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Actualiser'}
          </Button>
          
          <Button 
            onClick={handleCleanup} 
            variant="outline" 
            disabled={cleanupLoading}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            {cleanupLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            )}
            {isRTL ? 'تنظيف' : 'Nettoyer'}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.levelStats.map((stat) => (
            <motion.div
              key={stat.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.level.charAt(0).toUpperCase() + stat.level.slice(1)}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.count}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                      {getLevelIcon(stat.level)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'الفلاتر' : 'Filtres'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Niveau */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRTL ? 'المستوى' : 'Niveau'}
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters({...filters, level: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">{isRTL ? 'الكل' : 'Tous'}</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            {/* Action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRTL ? 'الإجراء' : 'Action'}
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({...filters, action: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">{isRTL ? 'الكل' : 'Toutes'}</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            {/* Date début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRTL ? 'من تاريخ' : 'Date début'}
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRTL ? 'إلى تاريخ' : 'Date fin'}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'سجلات النشاط' : 'Journaux d\'activité'}
          </CardTitle>
          <CardDescription>
            {isRTL ? `إجمالي ${pagination.total} سجل` : `Total: ${pagination.total} logs`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                        {getLevelIcon(log.level)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                        {log.action && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {log.action}
                          </span>
                        )}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                          {new Date(log.created_at).toLocaleString(isRTL ? 'ar' : 'fr')}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-900 dark:text-white mb-2">
                        {log.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs text-gray-500 dark:text-gray-400">
                        {log.user && (
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                            {log.user.first_name} {log.user.last_name}
                          </div>
                        )}
                        {log.ip_address && (
                          <div className="flex items-center">
                            <Globe className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                            {log.ip_address}
                          </div>
                        )}
                        {log.response_status && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.response_status >= 500 ? 'bg-red-100 text-red-800' :
                            log.response_status >= 400 ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {log.response_status}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewLog(log.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isRTL ? 
                  `صفحة ${pagination.page} من ${pagination.totalPages}` :
                  `Page ${pagination.page} sur ${pagination.totalPages}`
                }
              </div>
              
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  {isRTL ? 'السابق' : 'Précédent'}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  {isRTL ? 'التالي' : 'Suivant'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal détail log */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'تفاصيل السجل' : 'Détails du log'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isRTL ? 'المستوى' : 'Niveau'}
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(selectedLog.level)}`}>
                    {selectedLog.level}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isRTL ? 'التاريخ' : 'Date'}
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedLog.created_at).toLocaleString(isRTL ? 'ar' : 'fr')}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'الرسالة' : 'Message'}
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedLog.message}
                </p>
              </div>
              
              {selectedLog.additional_data && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'بيانات إضافية' : 'Données additionnelles'}
                  </label>
                  <pre className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.additional_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowLogModal(false)}>
                {isRTL ? 'إغلاق' : 'Fermer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
