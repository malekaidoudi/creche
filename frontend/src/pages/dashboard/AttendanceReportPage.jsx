import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar,
  Download,
  Filter,
  Search,
  Users,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const AttendanceReportPage = () => {
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    childName: '',
    status: 'all'
  });
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    attendanceRate: 0
  });

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/attendance/report');
      const result = response.data;
      if (result.success) {
        const data = result.attendances || [];
        setAttendanceData(data);
        setFilteredData(data);
        calculateStats(data);
        console.log('Données chargées:', data.length, 'enregistrements');
      } else {
        throw new Error(result.error || 'Erreur dans la réponse API');
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      setError(`Erreur: ${error.message}`);
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalPresent = data.filter(item => item.status === 'present').length;
    const totalAbsent = data.filter(item => item.status === 'absent').length;
    const totalLate = data.filter(item => item.status === 'late').length;
    const total = data.length;
    const attendanceRate = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

    setStats({
      totalPresent,
      totalAbsent,
      totalLate,
      attendanceRate
    });
  };

  const applyFilters = () => {
    let filtered = [...attendanceData];

    // Filtre par nom d'enfant
    if (filters.childName) {
      filtered = filtered.filter(item => 
        item.child_name.toLowerCase().includes(filters.childName.toLowerCase())
      );
    }

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Filtre par date
    if (filters.dateFrom) {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(item => new Date(item.date) <= new Date(filters.dateTo));
    }

    setFilteredData(filtered);
    calculateStats(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      childName: '',
      status: 'all'
    });
    setFilteredData(attendanceData);
    calculateStats(attendanceData);
  };

  const exportToCSV = () => {
    const headers = ['Enfant', 'Date', 'Statut', 'Heure d\'arrivée', 'Heure de départ'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.child_name,
        item.date,
        item.status === 'present' ? 'Présent' : item.status === 'absent' ? 'Absent' : 'En retard',
        item.check_in || '',
        item.check_out || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_presence_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadAttendanceData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, attendanceData]);

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">
                  {isRTL ? 'حدث خطأ' : 'Une erreur s\'est produite'}
                </h3>
                <p className="text-red-600 text-sm">{error}</p>
                <Button onClick={loadAttendanceData} variant="outline" size="sm" className="mt-2">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isRTL ? 'إعادة المحاولة' : 'Réessayer'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isRTL ? 'تقرير الحضور' : 'Rapport de Présence'}
              </h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {isRTL ? 'تقرير مفصل عن حضور الأطفال مع الإحصائيات' : 'Rapport détaillé avec statistiques de présence'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                {isRTL ? 'تصدير CSV' : 'Exporter CSV'}
              </Button>
              <Button onClick={loadAttendanceData} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {isRTL ? 'تحديث' : 'Actualiser'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Statistiques */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4 rtl:ml-0 rtl:mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {isRTL ? 'حاضر' : 'Présents'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPresent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4 rtl:ml-0 rtl:mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {isRTL ? 'غائب' : 'Absents'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalAbsent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4 rtl:ml-0 rtl:mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {isRTL ? 'متأخر' : 'En retard'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalLate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4 rtl:ml-0 rtl:mr-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {isRTL ? 'معدل الحضور' : 'Taux présence'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.attendanceRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filtres */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'تصفية البيانات' : 'Filtres'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'من تاريخ' : 'Date de début'}
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'إلى تاريخ' : 'Date de fin'}
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'اسم الطفل' : 'Nom enfant'}
                  </label>
                  <input
                    type="text"
                    placeholder={isRTL ? 'البحث بالاسم...' : 'Rechercher par nom...'}
                    value={filters.childName}
                    onChange={(e) => handleFilterChange('childName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'الحالة' : 'Statut'}
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">{isRTL ? 'الكل' : 'Tous'}</option>
                    <option value="present">{isRTL ? 'حاضر' : 'Présent'}</option>
                    <option value="absent">{isRTL ? 'غائب' : 'Absent'}</option>
                    <option value="late">{isRTL ? 'متأخر' : 'En retard'}</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={resetFilters} variant="outline" className="w-full">
                    {isRTL ? 'إعادة تعيين' : 'Réinitialiser'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tableau des données */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'بيانات الحضور' : 'Données de présence'}
                </CardTitle>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isRTL ? `${filteredData.length} سجل` : `${filteredData.length} enregistrements`}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'لا توجد بيانات للعرض' : 'Aucune donnée à afficher'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {isRTL ? 'الطفل' : 'Enfant'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {isRTL ? 'التاريخ' : 'Date'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {isRTL ? 'وقت الوصول' : 'Arrivée'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {isRTL ? 'وقت المغادرة' : 'Départ'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {isRTL ? 'الحالة' : 'Statut'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {item.child_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(item.date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.check_in ? (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1 text-green-500" />
                                {item.check_in}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.check_out ? (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1 text-red-500" />
                                {item.check_out}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'present' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                              item.status === 'absent' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                              'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                            }`}>
                              {item.status === 'present' && <CheckCircle className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />}
                              {item.status === 'absent' && <XCircle className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />}
                              {item.status === 'late' && <Clock className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />}
                              {isRTL ? 
                                (item.status === 'present' ? 'حاضر' : item.status === 'absent' ? 'غائب' : 'متأخر') :
                                (item.status === 'present' ? 'Présent' : item.status === 'absent' ? 'Absent' : 'En retard')
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AttendanceReportPage;
