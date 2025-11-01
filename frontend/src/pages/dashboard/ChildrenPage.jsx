import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
  Mail,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserPlus,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import childrenService from '../../services/childrenService';
import userService from '../../services/userService';
import { documentService } from '../../services/documentService';
import approvalService from '../../services/approvalService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';

const ChildrenPage = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [parents, setParents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [children, setChildren] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [editFormData, setEditFormData] = useState({});
  const [childDocuments, setChildDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
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
        status: 'approved', // Toujours filtrer sur les enfants approuvés
        age: filterAge
      };
      
      const response = await childrenService.getAllChildren(params);
      console.log('📋 ChildrenPage - Réponse API:', response);
      
      if (response.success) {
        const childrenData = response.data.children || [];
        console.log('✅ ChildrenPage - Enfants chargés:', childrenData.length);
        setChildren(childrenData);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.pages || 0
        }));
      } else {
        console.error('❌ ChildrenPage - Erreur:', response);
        toast.error('Erreur lors du chargement des enfants');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
      toast.error('Erreur de connexion, vérifiez votre connexion internet');
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour la recherche, rechargement immédiat pour les filtres
  useEffect(() => {
    if (searchTerm.trim() !== '') {
      // Debounce pour la recherche
      const timeoutId = setTimeout(() => {
        loadChildren();
      }, 1000); // Attendre 1 seconde après la dernière saisie
      return () => clearTimeout(timeoutId);
    } else {
      // Rechargement immédiat si pas de recherche
      loadChildren();
    }
  }, [searchTerm, filterAge, pagination.page]);

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    loadChildren();
  };

  // Fonction pour voir un enfant
  const handleViewChild = async (child) => {
    setSelectedChild(child);
    setShowAssociateModal(false);
    setShowEditModal(false);
    
    // Charger les documents de l'enfant
    try {
      setDocumentsLoading(true);
      const response = await documentService.getChildDocuments(child.id);
      if (response.success) {
        setChildDocuments(response.documents);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      setChildDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Fonction pour modifier un enfant
  const handleEditChild = (child) => {
    setSelectedChild(child);
    setEditFormData({
      first_name: child.first_name || '',
      last_name: child.last_name || '',
      birth_date: child.birth_date ? child.birth_date.split('T')[0] : '',
      gender: child.gender || 'M',
      medical_info: child.medical_info || '',
      emergency_contact_name: child.emergency_contact_name || '',
      emergency_contact_phone: child.emergency_contact_phone || '',
      status: child.status || 'pending'
    });
    setShowEditModal(true);
  };

  // Fonction pour désactiver le compte parent (remplace la suppression)
  const handleDeactivateParent = async (child) => {
    const confirmMessage = isRTL 
      ? `هل أنت متأكد من إلغاء تفعيل حساب الوالد لـ ${child.first_name} ${child.last_name}؟\n\nسيتم:\n- إلغاء تفعيل حساب الوالد\n- إخفاء الطفل من القائمة\n- منع الوالد من الدخول للنظام`
      : `Êtes-vous sûr de vouloir désactiver le compte parent de ${child.first_name} ${child.last_name} ?\n\nCeci va :\n- Désactiver le compte parent\n- Masquer l'enfant de la liste\n- Empêcher le parent de se connecter`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(child.id);
      
      // Appel API pour désactiver le parent
      const response = await fetch(`/api/children/${child.id}/deactivate-parent`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success(isRTL ? 'تم إلغاء تفعيل حساب الوالد بنجاح' : 'Compte parent désactivé avec succès');
        loadChildren(); // Recharger la liste
      } else {
        throw new Error('Erreur lors de la désactivation');
      }
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error);
      toast.error(isRTL ? 'خطأ في إلغاء تفعيل الحساب' : 'Erreur lors de la désactivation du compte');
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour sauvegarder les modifications d'un enfant
  const handleSaveChild = async (e) => {
    e.preventDefault();
    
    if (!selectedChild) return;

    try {
      setActionLoading('save');
      
      // Appeler l'API pour mettre à jour l'enfant
      const response = await childrenService.updateChild(selectedChild.id, editFormData);
      
      if (response.success) {
        toast.success(isRTL ? 'تم تحديث بيانات الطفل بنجاح' : 'Informations de l\'enfant mises à jour avec succès');
        
        // Fermer le modal
        setShowEditModal(false);
        setSelectedChild(null);
        setEditFormData({});
        
        // Recharger la liste des enfants
        loadChildren();
      } else {
        toast.error(response.error || (isRTL ? 'خطأ في التحديث' : 'Erreur lors de la mise à jour'));
      }
    } catch (error) {
      console.error('Erreur sauvegarde enfant:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في الاتصال' : 'Erreur de connexion'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour mettre à jour les données du formulaire
  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour voir un document
  const handleViewDocument = async (document) => {
    try {
      await documentService.viewDocument(document);
      toast.success(isRTL ? 'تم فتح الوثيقة' : 'Document ouvert');
    } catch (error) {
      toast.error(isRTL ? 'خطأ في فتح الوثيقة' : 'Erreur lors de l\'ouverture');
    }
  };

  // Fonction pour télécharger un document
  const handleDownloadDocument = async (document) => {
    try {
      await documentService.downloadDocument(document);
      toast.success(isRTL ? 'تم تحميل الوثيقة' : 'Document téléchargé');
    } catch (error) {
      toast.error(isRTL ? 'خطأ في تحميل الوثيقة' : 'Erreur lors du téléchargement');
    }
  };

  // Fonction pour approuver un enfant
  const handleApproveChild = async (child) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من قبول هذا الطلب؟' : 'Êtes-vous sûr d\'approuver cette demande ?')) {
      return;
    }

    try {
      setActionLoading('approve');
      const response = await approvalService.approveChild(child.id);
      
      if (response.success) {
        toast.success(isRTL ? 'تم قبول الطلب بنجاح' : 'Demande approuvée avec succès');
        
        // Mettre à jour l'enfant sélectionné
        setSelectedChild(prev => ({ ...prev, status: 'approved' }));
        
        // Recharger la liste
        loadChildren();
      } else {
        toast.error(response.error || (isRTL ? 'خطأ في القبول' : 'Erreur lors de l\'approbation'));
      }
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في الاتصال' : 'Erreur de connexion'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour rejeter un enfant
  const handleRejectChild = async (child) => {
    const reason = window.prompt(
      isRTL ? 'سبب الرفض (اختياري):' : 'Raison du rejet (optionnel):'
    );
    
    if (reason === null) return; // Utilisateur a annulé

    try {
      setActionLoading('reject');
      const response = await approvalService.rejectChild(child.id, reason);
      
      if (response.success) {
        toast.success(isRTL ? 'تم رفض الطلب' : 'Demande rejetée');
        
        // Mettre à jour l'enfant sélectionné
        setSelectedChild(prev => ({ ...prev, status: 'rejected' }));
        
        // Recharger la liste
        loadChildren();
      } else {
        toast.error(response.error || (isRTL ? 'خطأ في الرفض' : 'Erreur lors du rejet'));
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في الاتصال' : 'Erreur de connexion'));
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
    
    // Calcul précis mois par mois
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    
    // Ajustement si les jours sont négatifs
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    // Ajustement si les mois sont négatifs
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Pour les très jeunes enfants (moins de 1 mois)
    if (years === 0 && months === 0) {
      return isRTL ? `${days} يوم` : `${days} jour${days > 1 ? 's' : ''}`;
    }
    
    // Pour les enfants de moins d'un an
    if (years === 0) {
      if (days === 0) {
        return isRTL ? `${months} شهر` : `${months} mois`;
      }
      return isRTL ? `${months} شهر و ${days} يوم` : `${months} mois et ${days} jour${days > 1 ? 's' : ''}`;
    }
    
    // Pour les enfants de plus d'un an
    if (months === 0) {
      return isRTL ? `${years} سنة` : `${years} an${years > 1 ? 's' : ''}`;
    }
    
    return isRTL ? `${years} سنة و ${months} شهر` : `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getEnrollmentStatus = (status) => {
    switch (status) {
      case 'approved':
        return {
          text: isRTL ? 'مقبول' : 'Inscrit',
          color: 'text-green-800 dark:text-green-200',
          bgColor: 'bg-green-100 dark:bg-green-900'
        };
      case 'pending':
        return {
          text: isRTL ? 'في الانتظار' : 'En attente',
          color: 'text-yellow-800 dark:text-yellow-200',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900'
        };
      case 'rejected':
        return {
          text: isRTL ? 'مرفوض' : 'Rejeté',
          color: 'text-red-800 dark:text-red-200',
          bgColor: 'bg-red-100 dark:bg-red-900'
        };
      default:
        return {
          text: isRTL ? 'غير محدد' : 'Non défini',
          color: 'text-gray-800 dark:text-gray-200',
          bgColor: 'bg-gray-100 dark:bg-gray-900'
        };
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
            
            {(isAdmin() || isStaff()) && (
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/dashboard/children/add">
                    <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'إضافة طفل' : 'Ajouter enfant'}
                  </Link>
                </Button>
                {isStaff() && (
                  <Button asChild variant="outline">
                    <Link to="/dashboard/children/add?personal=true">
                      <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {isRTL ? 'إضافة طفلي' : 'Mon enfant'}
                    </Link>
                  </Button>
                )}
              </div>
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
          const enrollmentStatus = getEnrollmentStatus(child.enrollment_status || 'approved');
          
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
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${enrollmentStatus.color} ${enrollmentStatus.bgColor}`}>
                        {getStatusIcon(child.status)}
                        <span className="ml-1 rtl:ml-0 rtl:mr-1">{enrollmentStatus.text}</span>
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
                              {child.parent_phone ? (
                                <a 
                                  href={`tel:${child.parent_phone}`}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                  dir="ltr"
                                >
                                  {child.parent_phone}
                                </a>
                              ) : (
                                <span dir="ltr" className={isRTL ? 'text-right' : 'text-left'}>
                                  {isRTL ? 'غير محدد' : 'Non spécifié'}
                                </span>
                              )}
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
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'معلومات طبية:' : 'Infos médicales:'}
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {child.medical_info || (isRTL ? 'لا توجد معلومات طبية' : 'Aucune information médicale')}
                      </p>
                    </div>

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
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeactivateParent(child)}
                              disabled={actionLoading === child.id}
                            >
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

      {/* Modal de visualisation d'enfant */}
      {selectedChild && !showAssociateModal && !showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'تفاصيل الطفل' : 'Détails de l\'enfant'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedChild(null)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Informations de base */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'الاسم الأول' : 'Prénom'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedChild.first_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'اسم العائلة' : 'Nom de famille'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedChild.last_name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedChild.birth_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'العمر' : 'Âge'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {calculateAge(selectedChild.birth_date)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isRTL ? 'الجنس' : 'Genre'}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedChild.gender === 'M' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')}
                  </p>
                </div>
                
                {selectedChild.medical_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'المعلومات الطبية' : 'Informations médicales'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedChild.medical_info}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'جهة الاتصال الطارئة' : 'Contact d\'urgence'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedChild.emergency_contact_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? 'هاتف الطوارئ' : 'Téléphone d\'urgence'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white" dir="ltr">
                      {selectedChild.emergency_contact_phone}
                    </p>
                  </div>
                </div>
                
                {/* Informations et actions de contact */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    {isRTL ? 'معلومات ووسائل الاتصال' : 'Informations et moyens de contact'}
                  </h4>
                  
                  {/* Contact Parent */}
                  {selectedChild.parent_first_name && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-blue-900 dark:text-blue-100">
                          {isRTL ? '👤 الوالد' : '👤 Parent'}
                        </h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-700 dark:text-blue-300">
                            {isRTL ? 'الاسم' : 'Nom'}
                          </label>
                          <p className="mt-1 text-sm text-blue-900 dark:text-blue-100">
                            {selectedChild.parent_first_name} {selectedChild.parent_last_name}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 dark:text-blue-300">
                            {isRTL ? 'البريد الإلكتروني' : 'Email'}
                          </label>
                          <p className="mt-1 text-sm text-blue-900 dark:text-blue-100" dir="ltr">
                            {selectedChild.parent_email || 'Non renseigné'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 dark:text-blue-300">
                            {isRTL ? 'الهاتف' : 'Téléphone'}
                          </label>
                          <p className="mt-1 text-sm text-blue-900 dark:text-blue-100" dir="ltr">
                            {selectedChild.parent_phone}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions de contact parent */}
                      <div className="flex flex-wrap gap-2">
                        {selectedChild.parent_email && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => window.location.href = `mailto:${selectedChild.parent_email}`}
                          >
                            <Mail className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'إرسال إيميل' : 'Envoyer email'}
                          </Button>
                        )}
                        {selectedChild.parent_phone && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-100"
                              onClick={() => window.location.href = `tel:${selectedChild.parent_phone}`}
                            >
                              <Phone className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                              {isRTL ? 'اتصال' : 'Appeler'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-300 text-purple-700 hover:bg-purple-100"
                              onClick={() => window.location.href = `sms:${selectedChild.parent_phone}`}
                            >
                              <MessageSquare className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                              {isRTL ? 'رسالة نصية' : 'SMS'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact d'urgence (si différent du parent) */}
                  {selectedChild.emergency_contact_name && 
                   selectedChild.emergency_contact_name !== `${selectedChild.parent_first_name} ${selectedChild.parent_last_name}` && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-orange-900 dark:text-orange-100">
                          {isRTL ? '🚨 جهة الاتصال للطوارئ' : '🚨 Contact d\'urgence'}
                        </h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-orange-700 dark:text-orange-300">
                            {isRTL ? 'الاسم' : 'Nom'}
                          </label>
                          <p className="mt-1 text-sm text-orange-900 dark:text-orange-100">
                            {selectedChild.emergency_contact_name}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-orange-700 dark:text-orange-300">
                            {isRTL ? 'الهاتف' : 'Téléphone'}
                          </label>
                          <p className="mt-1 text-sm text-orange-900 dark:text-orange-100" dir="ltr">
                            {selectedChild.emergency_contact_phone}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions de contact urgence */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-100"
                          onClick={() => window.location.href = `tel:${selectedChild.emergency_contact_phone}`}
                        >
                          <Phone className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'اتصال طارئ' : 'Appel d\'urgence'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-100"
                          onClick={() => window.location.href = `sms:${selectedChild.emergency_contact_phone}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'رسالة طارئة' : 'SMS d\'urgence'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={() => {
                  setSelectedChild(null);
                  setChildDocuments([]);
                }}>
                  {isRTL ? 'إغلاق' : 'Fermer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'enfant */}
      {showEditModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'تعديل معلومات الاتصال والطبية' : 'Modifier les contacts et informations médicales'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedChild(null);
                  }}
                >
                  ✕
                </Button>
              </div>
              
              <form className="space-y-6" onSubmit={handleSaveChild}>
                {/* Informations non modifiables */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {isRTL ? 'معلومات الطفل (غير قابلة للتعديل)' : 'Informations de l\'enfant (non modifiables)'}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'الاسم:' : 'Nom:'}</span>
                      <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium text-gray-900 dark:text-white">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'تاريخ الميلاد:' : 'Date de naissance:'}</span>
                      <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium text-gray-900 dark:text-white">
                        {new Date(selectedChild.birth_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations médicales - Modifiable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'المعلومات الطبية' : 'Informations médicales'}
                  </label>
                  <textarea
                    value={editFormData.medical_info || ''}
                    onChange={(e) => handleFormChange('medical_info', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={isRTL ? 'أدخل المعلومات الطبية (حساسية، أدوية، ملاحظات خاصة...)' : 'Entrez les informations médicales (allergies, médicaments, notes spéciales...)'}
                  />
                </div>
                
                {/* Contact d'urgence - Modifiable */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {isRTL ? 'جهة الاتصال للطوارئ' : 'Contact d\'urgence'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الاسم الكامل' : 'Nom complet'}
                      </label>
                      <input
                        type="text"
                        value={editFormData.emergency_contact_name || ''}
                        onChange={(e) => handleFormChange('emergency_contact_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={isRTL ? 'اسم جهة الاتصال للطوارئ' : 'Nom du contact d\'urgence'}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}
                      </label>
                      <input
                        type="tel"
                        value={editFormData.emergency_contact_phone || ''}
                        onChange={(e) => handleFormChange('emergency_contact_phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={isRTL ? '+33 6 12 34 56 78' : '+33 6 12 34 56 78'}
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {isRTL ? 'يمكن أن يكون هذا الشخص هو الوالد أو شخص آخر موثوق' : 'Peut être le parent ou une autre personne de confiance'}
                  </p>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedChild(null);
                      setEditFormData({});
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={actionLoading === 'save'}
                  >
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={actionLoading === 'save'}
                  >
                    {actionLoading === 'save' ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                        {isRTL ? 'جاري الحفظ...' : 'Sauvegarde...'}
                      </>
                    ) : (
                      isRTL ? 'حفظ التغييرات' : 'Sauvegarder'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChildrenPage;
