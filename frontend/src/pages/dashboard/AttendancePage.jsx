import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Baby,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  LogIn,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import attendanceService from '../../services/attendanceService';

const AttendancePage = () => {
  const { isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentlyPresent, setCurrentlyPresent] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  // Fonction pour charger les données d'attendance
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Charger les données selon la date sélectionnée
      let attendanceResponse;
      if (selectedDate === new Date().toISOString().split('T')[0]) {
        // Si c'est aujourd'hui, utiliser l'endpoint spécialisé
        attendanceResponse = await attendanceService.getTodayAttendance();
      } else {
        // Sinon, utiliser l'endpoint par date
        attendanceResponse = await attendanceService.getAttendanceByDate(selectedDate);
      }
      
      // Charger les statistiques
      const statsResponse = await attendanceService.getAttendanceStats(selectedDate);
      
      // Charger les enfants actuellement présents (seulement pour aujourd'hui)
      let currentlyPresentResponse = [];
      if (selectedDate === new Date().toISOString().split('T')[0]) {
        currentlyPresentResponse = await attendanceService.getCurrentlyPresent();
      }
      
      setAttendanceData(attendanceResponse.attendances || []);
      setStats(statsResponse);
      setCurrentlyPresent(currentlyPresentResponse.children || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'attendance:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    loadAttendanceData();
  };

  // Fonction pour check-in
  const handleCheckIn = async (childId) => {
    try {
      setActionLoading(childId);
      const response = await attendanceService.checkIn(childId);
      toast.success(isRTL ? 'تم تسجيل الوصول بنجاح' : 'Arrivée enregistrée avec succès');
      loadAttendanceData(); // Recharger les données
    } catch (error) {
      console.error('Erreur check-in:', error);
      const message = error.response?.data?.error || 'Erreur lors de l\'enregistrement';
      toast.error(isRTL ? 'خطأ في تسجيل الوصول' : message);
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour check-out
  const handleCheckOut = async (childId) => {
    try {
      setActionLoading(childId);
      const response = await attendanceService.checkOut(childId);
      toast.success(isRTL ? 'تم تسجيل المغادرة بنجاح' : 'Départ enregistré avec succès');
      loadAttendanceData(); // Recharger les données
    } catch (error) {
      console.error('Erreur check-out:', error);
      const message = error.response?.data?.error || 'Erreur lors de l\'enregistrement';
      toast.error(isRTL ? 'خطأ في تسجيل المغادرة' : message);
    } finally {
      setActionLoading(null);
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return isRTL ? `${ageInMonths} أشهر` : `${ageInMonths} mois`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return isRTL ? `${years} سنة` : `${years} an${years > 1 ? 's' : ''}`;
      }
      return isRTL ? `${years} سنة و ${months} أشهر` : `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present':
        return isRTL ? 'حاضر' : 'Présent';
      case 'absent':
        return isRTL ? 'غائب' : 'Absent';
      case 'completed':
        return isRTL ? 'مكتمل' : 'Terminé';
      default:
        return isRTL ? 'غير محدد' : 'Non défini';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };


  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = record.child?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.child?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const status = getRecordStatus(record);
      matchesStatus = status === filterStatus;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Fonction pour déterminer le statut d'un enregistrement
  const getRecordStatus = (record) => {
    if (!record.check_in_time) return 'absent';
    if (record.check_in_time && !record.check_out_time) return 'present';
    if (record.check_in_time && record.check_out_time) return 'completed';
    return 'absent';
  };

  // Utiliser les stats de l'API ou calculer en fallback
  const displayStats = stats || {
    total: attendanceData.length,
    present: attendanceData.filter(r => r.check_in_time && !r.check_out_time).length,
    absent: attendanceData.filter(r => !r.check_in_time).length,
    completed: attendanceData.filter(r => r.check_in_time && r.check_out_time).length
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
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'إدارة الحضور' : 'Gestion des présences'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {isRTL 
                ? `${new Date(selectedDate).toLocaleDateString('ar')} - ${filteredAttendance.length} طفل`
                : `${new Date(selectedDate).toLocaleDateString('fr')} - ${filteredAttendance.length} enfants`
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-3 rtl:space-x-reverse mt-4 sm:mt-0">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
              {isRTL ? 'تحديث' : 'Actualiser'}
            </Button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'تصدير' : 'Exporter'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'المجموع' : 'Total'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayStats.total}
                </p>
              </div>
              <Baby className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'حاضر' : 'Présents'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {displayStats.present}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'غائب' : 'Absents'}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {displayStats.absent}
                </p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'معدل الحضور' : 'Taux présence'}
                </p>
                <p className="text-2xl font-bold text-primary-600">
                  {displayStats.total > 0 ? Math.round((displayStats.present / displayStats.total) * 100) : 0}%
                </p>
              </div>
              <Clock className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={isRTL ? 'البحث في الأطفال...' : 'Rechercher des enfants...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'Tous les statuts'}</option>
              <option value="present">{isRTL ? 'حاضر' : 'Présents'}</option>
              <option value="absent">{isRTL ? 'غائب' : 'Absents'}</option>
              <option value="late">{isRTL ? 'متأخر' : 'En retard'}</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
            >
              <Filter className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'إعادة تعيين' : 'Réinitialiser'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des présences */}
      <div className="space-y-4">
        {filteredAttendance.map((record) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <Baby className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {record.child.first_name} {record.child.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {calculateAge(record.child.birth_date)} • {record.child.parent.first_name} {record.child.parent.last_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    {/* Statut */}
                    {(() => {
                      const status = getRecordStatus(record);
                      return (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="ml-2 rtl:ml-0 rtl:mr-2">{getStatusText(status)}</span>
                        </span>
                      );
                    })()}

                    {/* Horaires */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {record.check_in_time && (
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <Clock className="w-3 h-3" />
                          <span>{isRTL ? 'الوصول:' : 'Arrivée:'} {record.check_in_time.slice(0, 5)}</span>
                        </div>
                      )}
                      {record.check_out_time && (
                        <div className="flex items-center space-x-1 rtl:space-x-reverse mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{isRTL ? 'المغادرة:' : 'Départ:'} {record.check_out_time.slice(0, 5)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {!record.check_in_time && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(record.child.id)}
                          disabled={actionLoading === record.child.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <LogIn className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                          {actionLoading === record.child.id ? 
                            (isRTL ? 'جاري...' : 'En cours...') : 
                            (isRTL ? 'تسجيل الوصول' : 'Arrivée')
                          }
                        </Button>
                      )}
                      
                      {record.check_in_time && !record.check_out_time && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(record.child.id)}
                          disabled={actionLoading === record.child.id}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          <LogOut className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                          {actionLoading === record.child.id ? 
                            (isRTL ? 'جاري...' : 'En cours...') : 
                            (isRTL ? 'تسجيل المغادرة' : 'Départ')
                          }
                        </Button>
                      )}

                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {isRTL ? 'تفاصيل' : 'Détails'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {record.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{isRTL ? 'ملاحظات:' : 'Notes:'}</span> {record.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredAttendance.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isRTL ? 'لا توجد بيانات حضور' : 'Aucune donnée de présence'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL 
              ? 'لا توجد بيانات حضور لهذا التاريخ'
              : 'Aucune donnée de présence pour cette date'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
