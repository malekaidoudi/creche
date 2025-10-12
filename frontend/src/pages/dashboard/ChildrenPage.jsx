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
  AlertCircle,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import childrenService from '../../services/childrenService';
import userService from '../../services/userService';

const ChildrenPage = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [parents, setParents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [children, setChildren] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fonction pour charger les enfants depuis l'API
  const loadChildren = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: filterStatus,
        age: filterAge
      };
      
      const response = await childrenService.getAllChildren(params);
      
      if (response.success) {
        setChildren(response.data.children || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        }));
      } else {
        toast.error('Erreur lors du chargement des enfants');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
      toast.error('Erreur de connexion, vérifiez votre connexion internet');
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadChildren();
    }, 300); // Attendre 300ms après la dernière saisie

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Recharger immédiatement pour les autres filtres
  useEffect(() => {
    loadChildren();
  }, [filterStatus, filterAge, pagination.page]);

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    loadChildren();
  };

  // Fonction pour voir un enfant
  const handleViewChild = (child) => {
    setSelectedChild(child);
    // TODO: Ouvrir modal de détails ou naviguer vers page détail
    toast.info(isRTL ? `عرض تفاصيل ${child.first_name}` : `Voir détails de ${child.first_name}`);
  };

  // Fonction pour modifier un enfant
  const handleEditChild = (child) => {
    setSelectedChild(child);
    setShowEditModal(true);
  };

  // Fonction pour supprimer un enfant
  const handleDeleteChild = async (childId) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطفل؟' : 'Êtes-vous sûr de vouloir supprimer cet enfant ?')) {
      return;
    }

    try {
      setActionLoading(childId);
      await childrenService.deleteChild(childId);
      toast.success(isRTL ? 'تم حذف الطفل بنجاح' : 'Enfant supprimé avec succès');
      loadChildren(); // Recharger la liste
    } catch (error) {
      console.error('Erreur suppression enfant:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في حذف الطفل' : 'Erreur lors de la suppression'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour ouvrir le modal d'association parent
  const handleAssociateParent = async (child) => {
    try {
      setSelectedChild(child);
      setShowAssociateModal(true);
      
      // Charger la liste des parents
      const response = await userService.getAllUsers({ role: 'parent' });
      console.log('Parents response:', response);
      if (response.users) {
        setParents(response.users);
      } else if (response.data?.users) {
        setParents(response.data.users);
      }
    } catch (error) {
      console.error('Erreur chargement parents:', error);
      toast.error('Erreur lors du chargement des parents');
    }
  };

  // Fonction pour associer un enfant à un parent
  const handleConfirmAssociation = async () => {
    if (!selectedParentId || !selectedChild) {
      toast.error(isRTL ? 'يرجى اختيار ولي أمر' : 'Veuillez sélectionner un parent');
      return;
    }

    try {
      setActionLoading('associate');
      const response = await childrenService.associateChildToParent(selectedChild.id, selectedParentId);
      
      if (response.success) {
        toast.success(isRTL ? 'تم ربط الطفل بولي الأمر بنجاح' : 'Enfant associé au parent avec succès');
        setShowAssociateModal(false);
        setSelectedChild(null);
        setSelectedParentId('');
        loadChildren(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur association:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'association');
    } finally {
      setActionLoading(null);
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    
    // Calcul précis en millisecondes
    const diffTime = Math.abs(today - birth);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.44); // Moyenne de jours par mois
    const diffYears = Math.floor(diffDays / 365.25); // Moyenne avec années bissextiles
    
    // Pour les très jeunes enfants (moins de 2 mois)
    if (diffDays < 60) {
      return isRTL ? `${diffDays} يوم` : `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
    
    // Pour les enfants de moins d'un an
    if (diffMonths < 12) {
      return isRTL ? `${diffMonths} شهر` : `${diffMonths} mois`;
    }
    
    // Pour les enfants de plus d'un an
    const years = diffYears;
    const remainingMonths = Math.floor((diffDays - (years * 365.25)) / 30.44);
    
    if (remainingMonths === 0) {
      return isRTL ? `${years} سنة` : `${years} an${years > 1 ? 's' : ''}`;
    }
    
    return isRTL ? `${years} سنة و ${remainingMonths} شهر` : `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
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

  // Les données sont déjà filtrées côté serveur via l'API

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
                ? `${children.length} طفل`
                : `${children.length} enfants`
              }
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
              {isRTL ? 'تحديث' : 'Actualiser'}
            </Button>
            
            {isAdmin() && (
              <Button asChild>
                <Link to="/dashboard/children/add">
                  <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'إضافة طفل' : 'Ajouter enfant'}
                </Link>
              </Button>
            )}
          </div>
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
        {children.map((child) => {
          // Valeur par défaut pour attendance_today si pas présente
          const attendanceToday = child.attendance_today || { status: 'absent', check_in: null, check_out: null };
          const attendanceStatus = getAttendanceStatus(attendanceToday);
          
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
                      {attendanceToday.check_in && (
                        <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Clock className="w-3 h-3" />
                            <span>{isRTL ? 'الوصول:' : 'Arrivée:'} {attendanceToday.check_in}</span>
                          </div>
                          {attendanceToday.check_out && (
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <Clock className="w-3 h-3" />
                              <span>{isRTL ? 'المغادرة:' : 'Départ:'} {attendanceToday.check_out}</span>
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
                        {child.parent_first_name ? (
                          <>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <User className="w-3 h-3" />
                              <span>{child.parent_first_name} {child.parent_last_name}</span>
                            </div>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Phone className="w-3 h-3" />
                              <span dir="ltr" className={isRTL ? 'text-right' : 'text-left'}>
                                {child.parent_phone || (isRTL ? 'غير محدد' : 'Non spécifié')}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-gray-500">
                              {isRTL ? 'لا يوجد ولي أمر مسجل' : 'Aucun parent enregistré'}
                            </div>
                            {isAdmin() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAssociateParent(child)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <UserPlus className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'ربط ولي أمر' : 'Associer parent'}
                              </Button>
                            )}
                          </div>
                        )}
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
                      <Button size="sm" variant="outline" onClick={() => handleViewChild(child)}>
                        <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {isRTL ? 'عرض' : 'Voir'}
                      </Button>
                      
                      {(isAdmin() || isStaff()) && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEditChild(child)}>
                            <Edit className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'تعديل' : 'Modifier'}
                          </Button>
                          {isAdmin() && (
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteChild(child.id)}>
                              <Trash2 className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                              {isRTL ? 'حذف' : 'Supprimer'}
                            </Button>
                          )}
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
      {children.length === 0 && (
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

      {/* Modal d'association parent */}
      {showAssociateModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'ربط ولي أمر' : 'Associer un parent'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'الطفل' : 'Enfant'}
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedChild.first_name} {selectedChild.last_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {calculateAge(selectedChild.birth_date)}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'اختر ولي الأمر' : 'Sélectionner un parent'}
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">
                    {isRTL ? 'اختر ولي أمر...' : 'Sélectionner un parent...'}
                  </option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.first_name} {parent.last_name} ({parent.email})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedParentId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    {isRTL 
                      ? 'سيتم ربط هذا الطفل بولي الأمر المحدد. يمكن لولي الأمر بعد ذلك رؤية معلومات الطفل في حسابه.'
                      : 'Cet enfant sera associé au parent sélectionné. Le parent pourra alors voir les informations de l\'enfant dans son compte.'
                    }
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowAssociateModal(false);
                  setSelectedChild(null);
                  setSelectedParentId('');
                }}
                variant="outline"
                className="flex-1"
                disabled={actionLoading === 'associate'}
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button
                onClick={handleConfirmAssociation}
                disabled={!selectedParentId || actionLoading === 'associate'}
                className="flex-1"
              >
                {actionLoading === 'associate' ? (
                  <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                )}
                {actionLoading === 'associate' ? 
                  (isRTL ? 'جاري الربط...' : 'Association...') : 
                  (isRTL ? 'ربط' : 'Associer')
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildrenPage;
