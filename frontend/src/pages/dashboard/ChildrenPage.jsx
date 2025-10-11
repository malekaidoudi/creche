import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Baby, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ChildrenPage = () => {
  const { isAdmin } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAge, setFilterAge] = useState('all');

  useEffect(() => {
    // Simuler le chargement des données
    // TODO: Remplacer par de vrais appels API
    setTimeout(() => {
      setChildren([
        {
          id: 1,
          first_name: 'Youssef',
          last_name: 'Ben Ali',
          birth_date: '2021-05-15',
          gender: 'M',
          enrollment_status: 'approved',
          parent: {
            first_name: 'Fatima',
            last_name: 'Ben Ali',
            phone: '+216 98 765 432',
            email: 'parent@example.com'
          },
          medical_info: 'Aucune allergie connue',
          emergency_contact: 'Grand-mère: +216 71 123 456',
          attendance_today: {
            status: 'present',
            check_in: '08:30',
            check_out: null
          }
        },
        {
          id: 2,
          first_name: 'Lina',
          last_name: 'Ben Ali',
          birth_date: '2022-08-22',
          gender: 'F',
          enrollment_status: 'approved',
          parent: {
            first_name: 'Fatima',
            last_name: 'Ben Ali',
            phone: '+216 98 765 432',
            email: 'parent@example.com'
          },
          medical_info: 'Allergie aux arachides',
          emergency_contact: 'Oncle: +216 22 987 654',
          attendance_today: {
            status: 'absent',
            check_in: null,
            check_out: null
          }
        },
        {
          id: 3,
          first_name: 'Sara',
          last_name: 'Ahmed',
          birth_date: '2021-03-15',
          gender: 'F',
          enrollment_status: 'pending',
          parent: {
            first_name: 'Ahmed',
            last_name: 'Mohamed',
            phone: '+216 25 123 789',
            email: 'ahmed@example.com'
          },
          medical_info: 'Asthme léger',
          emergency_contact: 'Père: +216 25 123 789',
          attendance_today: {
            status: 'not_enrolled',
            check_in: null,
            check_out: null
          }
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      default:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return isRTL ? 'مقبول' : 'Inscrit';
      case 'rejected':
        return isRTL ? 'مرفوض' : 'Rejeté';
      case 'pending':
      default:
        return isRTL ? 'في الانتظار' : 'En attente';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const getAttendanceStatus = (attendance) => {
    if (attendance.status === 'present') {
      return {
        text: isRTL ? 'حاضر' : 'Présent',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900'
      };
    } else if (attendance.status === 'absent') {
      return {
        text: isRTL ? 'غائب' : 'Absent',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900'
      };
    } else {
      return {
        text: isRTL ? 'غير مسجل' : 'Non inscrit',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-900'
      };
    }
  };

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.parent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.parent.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || child.enrollment_status === filterStatus;
    
    let matchesAge = true;
    if (filterAge !== 'all') {
      const ageInMonths = (new Date().getFullYear() - new Date(child.birth_date).getFullYear()) * 12 + 
                         (new Date().getMonth() - new Date(child.birth_date).getMonth());
      
      if (filterAge === 'baby' && ageInMonths >= 12) matchesAge = false;
      if (filterAge === 'toddler' && (ageInMonths < 12 || ageInMonths >= 36)) matchesAge = false;
      if (filterAge === 'preschool' && ageInMonths < 36) matchesAge = false;
    }
    
    return matchesSearch && matchesStatus && matchesAge;
  });

  const handleDeleteChild = (childId) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطفل؟' : 'Êtes-vous sûr de vouloir supprimer cet enfant ?')) {
      setChildren(prev => prev.filter(child => child.id !== childId));
      toast.success(isRTL ? 'تم حذف الطفل' : 'Enfant supprimé');
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
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'إدارة الأطفال' : 'Gestion des enfants'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {isRTL 
                ? `${filteredChildren.length} طفل من أصل ${children.length}`
                : `${filteredChildren.length} enfants sur ${children.length}`
              }
            </p>
          </div>
          
          {isAdmin() && (
            <Button asChild className="mt-4 sm:mt-0">
              <Link to="/dashboard/children/add">
                <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRTL ? 'إضافة طفل' : 'Ajouter enfant'}
              </Link>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
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

            {/* Filtre par statut */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'Tous les statuts'}</option>
              <option value="approved">{isRTL ? 'مقبول' : 'Inscrits'}</option>
              <option value="pending">{isRTL ? 'في الانتظار' : 'En attente'}</option>
              <option value="rejected">{isRTL ? 'مرفوض' : 'Rejetés'}</option>
            </select>

            {/* Filtre par âge */}
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">{isRTL ? 'جميع الأعمار' : 'Tous les âges'}</option>
              <option value="baby">{isRTL ? 'رضع (< 1 سنة)' : 'Bébés (< 1 an)'}</option>
              <option value="toddler">{isRTL ? 'أطفال صغار (1-3 سنة)' : 'Tout-petits (1-3 ans)'}</option>
              <option value="preschool">{isRTL ? 'ما قبل المدرسة (> 3 سنة)' : 'Préscolaire (> 3 ans)'}</option>
            </select>

            {/* Bouton de réinitialisation */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterAge('all');
              }}
            >
              <Filter className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'إعادة تعيين' : 'Réinitialiser'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des enfants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredChildren.map((child) => {
          const attendanceStatus = getAttendanceStatus(child.attendance_today);
          
          return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <Baby className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {child.first_name} {child.last_name}
                        </CardTitle>
                        <CardDescription>
                          {calculateAge(child.birth_date)} • {child.gender === 'M' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(child.enrollment_status)}`}>
                        {getStatusIcon(child.enrollment_status)}
                        <span className="ml-1 rtl:ml-0 rtl:mr-1">{getStatusText(child.enrollment_status)}</span>
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Présence aujourd'hui */}
                    <div className={`p-3 rounded-lg ${attendanceStatus.bgColor}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {isRTL ? 'الحضور اليوم:' : 'Présence aujourd\'hui:'}
                        </span>
                        <span className={`text-sm font-medium ${attendanceStatus.color}`}>
                          {attendanceStatus.text}
                        </span>
                      </div>
                      {child.attendance_today.check_in && (
                        <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Clock className="w-3 h-3" />
                            <span>{isRTL ? 'الوصول:' : 'Arrivée:'} {child.attendance_today.check_in}</span>
                          </div>
                          {child.attendance_today.check_out && (
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <Clock className="w-3 h-3" />
                              <span>{isRTL ? 'المغادرة:' : 'Départ:'} {child.attendance_today.check_out}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Informations parent */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'معلومات الولي' : 'Informations parent'}
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <User className="w-3 h-3" />
                          <span>{child.parent.first_name} {child.parent.last_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Phone className="w-3 h-3" />
                          <span>{child.parent.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Informations médicales */}
                    {child.medical_info && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {isRTL ? 'معلومات طبية:' : 'Infos médicales:'}
                        </span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{child.medical_info}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {isRTL ? 'عرض' : 'Voir'}
                      </Button>
                      
                      {isAdmin() && (
                        <>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'تعديل' : 'Modifier'}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteChild(child.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'حذف' : 'Supprimer'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Message si aucun résultat */}
      {filteredChildren.length === 0 && (
        <div className="text-center py-12">
          <Baby className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isRTL ? 'لا توجد أطفال' : 'Aucun enfant trouvé'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL 
              ? 'لا توجد أطفال مطابقة لمعايير البحث'
              : 'Aucun enfant ne correspond aux critères de recherche'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ChildrenPage;
