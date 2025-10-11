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
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const AttendancePage = () => {
  const { isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Simuler le chargement des données de présence
    setTimeout(() => {
      setAttendanceData([
        {
          id: 1,
          child: {
            id: 1,
            first_name: 'Youssef',
            last_name: 'Ben Ali',
            birth_date: '2021-05-15',
            parent: {
              first_name: 'Fatima',
              last_name: 'Ben Ali',
              phone: '98765432'
            }
          },
          date: selectedDate,
          check_in_time: '08:30:00',
          check_out_time: '16:45:00',
          status: 'present',
          notes: 'Arrivé à l\'heure'
        },
        {
          id: 2,
          child: {
            id: 2,
            first_name: 'Lina',
            last_name: 'Ben Ali',
            birth_date: '2022-08-22',
            parent: {
              first_name: 'Fatima',
              last_name: 'Ben Ali',
              phone: '98765432'
            }
          },
          date: selectedDate,
          check_in_time: null,
          check_out_time: null,
          status: 'absent',
          notes: 'Maladie - Justifié'
        },
        {
          id: 3,
          child: {
            id: 3,
            first_name: 'Sara',
            last_name: 'Ahmed',
            birth_date: '2021-03-15',
            parent: {
              first_name: 'Ahmed',
              last_name: 'Mohamed',
              phone: '25123789'
            }
          },
          date: selectedDate,
          check_in_time: '09:15:00',
          check_out_time: null,
          status: 'present',
          notes: 'Retard de 15 minutes'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [selectedDate]);

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
      case 'late':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
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
      case 'late':
        return isRTL ? 'متأخر' : 'En retard';
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
      case 'late':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleCheckIn = (childId) => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    
    setAttendanceData(prev => 
      prev.map(record => 
        record.child.id === childId 
          ? { ...record, check_in_time: timeString, status: 'present' }
          : record
      )
    );
    
    toast.success(isRTL ? 'تم تسجيل الوصول' : 'Arrivée enregistrée');
  };

  const handleCheckOut = (childId) => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    
    setAttendanceData(prev => 
      prev.map(record => 
        record.child.id === childId 
          ? { ...record, check_out_time: timeString }
          : record
      )
    );
    
    toast.success(isRTL ? 'تم تسجيل المغادرة' : 'Départ enregistré');
  };

  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = record.child.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.child.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: attendanceData.length,
    present: attendanceData.filter(r => r.status === 'present').length,
    absent: attendanceData.filter(r => r.status === 'absent').length,
    late: attendanceData.filter(r => r.status === 'late').length
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
                  {stats.total}
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
                  {stats.present}
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
                  {stats.absent}
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
                  {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-2 rtl:ml-0 rtl:mr-2">{getStatusText(record.status)}</span>
                    </span>

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
                      {record.status === 'present' && !record.check_in_time && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(record.child.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isRTL ? 'تسجيل الوصول' : 'Arrivée'}
                        </Button>
                      )}
                      
                      {record.status === 'present' && record.check_in_time && !record.check_out_time && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(record.child.id)}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          {isRTL ? 'تسجيل المغادرة' : 'Départ'}
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
