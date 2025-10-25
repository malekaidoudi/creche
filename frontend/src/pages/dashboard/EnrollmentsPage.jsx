import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Check, 
  X,
  Calendar,
  User,
  Phone,
  Mail,
  Download,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import enrollmentsService from '../../services/enrollmentsService';

const EnrollmentsPage = () => {
  const { user } = useAuth();
  const isAdmin = () => user?.role === 'admin';
  const isStaff = () => user?.role === 'staff';
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalData, setApprovalData] = useState({
    appointment_date: '',
    admin_comment: ''
  });
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [allEnrollmentsForCounts, setAllEnrollmentsForCounts] = useState([]);

  useEffect(() => {
    fetchEnrollments();
  }, [activeTab]);

  // Charger toutes les inscriptions pour les compteurs
  useEffect(() => {
    const fetchAllForCounts = async () => {
      try {
        const response = await enrollmentsService.getAllEnrollments({
          status: 'all',
          limit: 1000
        });
        if (response.enrollments) {
          setAllEnrollmentsForCounts(response.enrollments);
        }
      } catch (error) {
        console.warn('Erreur chargement compteurs:', error);
        // Utiliser les données actuelles comme fallback
        setAllEnrollmentsForCounts(enrollments);
      }
    };
    fetchAllForCounts();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      
      // Essayer de récupérer les données réelles de la base de données
      try {
        const response = await enrollmentsService.getAllEnrollments({
          status: activeTab === 'all' ? 'all' : activeTab,
          limit: 100 // Récupérer plus d'inscriptions
        });
        
        
        if (response.enrollments) {
          // Utiliser les données de l'API même si la liste est vide
          setEnrollments(response.enrollments);
          setUsingDemoData(false);
          return;
        }
      } catch (apiError) {
        console.error('❌ Erreur API:', apiError);
        console.error('Détails erreur:', apiError.response?.data || apiError.message);
        // En cas d'erreur API, afficher une liste vide
        setEnrollments([]);
        setUsingDemoData(true);
      }
    } catch (error) {
      console.error('Erreur récupération inscriptions:', error);
      toast.error(isRTL ? 'خطأ في تحميل الطلبات' : 'Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEnrollment = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowModal(true);
  };

  const handleApproveEnrollment = async (enrollmentId) => {
    // Ouvrir le formulaire d'approbation
    setShowApprovalForm(true);
  };

  const submitApproval = async () => {
    if (!selectedEnrollment) return;
    
    setActionLoading(true);
    try {
      await enrollmentsService.approveEnrollment(selectedEnrollment.id, {
        appointment_date: approvalData.appointment_date || null,
        admin_comment: approvalData.admin_comment || ''
      });
      
      // Rafraîchir la liste
      await fetchEnrollments();
      
      // Fermer les modals et réinitialiser
      setShowModal(false);
      setShowApprovalForm(false);
      setSelectedEnrollment(null);
      setApprovalData({ appointment_date: '', admin_comment: '' });
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewFile = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:3003/api/uploads/view/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        console.error('Erreur lors de l\'affichage du fichier');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const response = await fetch(`http://localhost:3003/api/uploads/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `document_${fileId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        console.error('Erreur lors du téléchargement du fichier');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleRejectEnrollment = async (enrollmentId, reason = '', notes = '') => {
    setActionLoading(true);
    try {
      await enrollmentsService.rejectEnrollment(enrollmentId, {
        reason,
        notes
      });
      toast.success(isRTL ? 'تم رفض الطلب' : 'Demande rejetée');
      fetchEnrollments();
      setShowModal(false);
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في الرفض' : 'Erreur lors du rejet'));
    } finally {
      setActionLoading(false);
    }
  };

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    fetchEnrollments();
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    return enrollment.status === activeTab;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: isRTL ? 'في الانتظار' : 'En attente',
      approved: isRTL ? 'مقبول' : 'Approuvé',
      rejected: isRTL ? 'مرفوض' : 'Rejeté'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${isRTL ? 'شهر' : 'mois'}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 ? 's' : ''} ${months > 0 ? `${months} ${isRTL ? 'شهر' : 'mois'}` : ''}`;
    }
  };

  const tabs = [
    { id: 'all', label: isRTL ? 'الكل' : 'Toutes', count: allEnrollmentsForCounts.length },
    { id: 'pending', label: isRTL ? 'في الانتظار' : 'En attente', count: allEnrollmentsForCounts.filter(e => e.status === 'pending').length },
    { id: 'approved', label: isRTL ? 'مقبولة' : 'Approuvées', count: allEnrollmentsForCounts.filter(e => e.status === 'approved').length },
    { id: 'rejected', label: isRTL ? 'مرفوضة' : 'Rejetées', count: allEnrollmentsForCounts.filter(e => e.status === 'rejected').length }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'جميع طلبات التسجيل' : 'Toutes les inscriptions'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'عرض وتتبع جميع طلبات التسجيل وحالاتها' : 'Consulter et suivre toutes les demandes d\'inscription et leur statut'}
          </p>
        </div>
        
        <Button 
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Actualiser'}
        </Button>
      </div>

      {/* Message d'information sur le type de données */}
      {usingDemoData && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {isRTL ? 'بيانات تجريبية' : 'Données de démonstration'}
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                {isRTL ? 'لا يمكن الاتصال بقاعدة البيانات. يتم عرض بيانات تجريبية.' : 'Impossible de se connecter à la base de données. Affichage des données de démonstration.'}
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Onglets */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              <span className={`ml-2 rtl:ml-0 rtl:mr-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {isRTL ? 'لا توجد طلبات في هذه الفئة' : 'Aucune demande dans cette catégorie'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {enrollments.map((enrollment) => (
            <motion.div
              key={enrollment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse mb-3">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {getStatusIcon(enrollment.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                            {getStatusLabel(enrollment.status)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(enrollment.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                            {enrollment.child_first_name} {enrollment.child_last_name}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              {calculateAge(enrollment.child_birth_date)} ({enrollment.child_gender === 'M' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')})
                            </div>
                            
                            {/* Informations de décision */}
                            {enrollment.decision_by && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  {isRTL ? 'معلومات القرار' : 'Informations de décision'}
                                </h5>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center">
                                    <User className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                    <span>{enrollment.decision_by} ({enrollment.decision_by_role})</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                    <span>
                                      {isRTL ? 'تاريخ القرار:' : 'Décision:'} {new Date(enrollment.decision_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {enrollment.processed_date && (
                                    <div className="flex items-center">
                                      <CheckCircle className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                      <span>
                                        {isRTL ? 'تاريخ المعالجة:' : 'Traitement:'} {new Date(enrollment.processed_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {enrollment.admin_comment && (
                                    <div className="mt-2 text-xs italic text-gray-600 dark:text-gray-400">
                                      "{enrollment.admin_comment}"
                                    </div>
                                  )}
                                  {enrollment.rejection_reason && (
                                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                      {isRTL ? 'سبب الرفض:' : 'Raison du rejet:'} {enrollment.rejection_reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {!enrollment.decision_by && enrollment.status === 'pending' && (
                              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <div className="flex items-center text-xs text-yellow-700 dark:text-yellow-300">
                                  <Clock className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                  <span>{isRTL ? 'في انتظار المراجعة' : 'En attente de révision'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {isRTL ? 'ولي الأمر' : 'Parent'}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              {enrollment.parent_first_name} {enrollment.parent_last_name}
                            </div>
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              <a href={`mailto:${enrollment.parent_email}`} className="text-blue-600 hover:text-blue-800">
                                {enrollment.parent_email}
                              </a>
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                              <a href={`tel:${enrollment.parent_phone || ''}`} className="text-blue-600 hover:text-blue-800" dir="ltr">
                                {enrollment.parent_phone || 'Téléphone non disponible'}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse ml-4 rtl:ml-0 rtl:mr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEnrollment(enrollment)}
                      >
                        <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {isRTL ? 'عرض التفاصيل' : 'Voir détails'}
                      </Button>

                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de détails */}
      {showModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'تفاصيل طلب التسجيل' : 'Détails de la demande'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations de l'enfant */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {isRTL ? 'معلومات الطفل' : 'Informations de l\'enfant'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? 'الاسم:' : 'Nom:'}
                      </span>
                      <span className="ml-2 rtl:ml-0 rtl:mr-2">
                        {selectedEnrollment.child_first_name} {selectedEnrollment.child_last_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? 'تاريخ الميلاد:' : 'Date de naissance:'}
                      </span>
                      <span className="ml-2 rtl:ml-0 rtl:mr-2">
                        {new Date(selectedEnrollment.child_birth_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? 'الجنس:' : 'Sexe:'}
                      </span>
                      <span className="ml-2 rtl:ml-0 rtl:mr-2">
                        {selectedEnrollment.child_gender === 'M' ? (isRTL ? 'ذكر' : 'Masculin') : (isRTL ? 'أنثى' : 'Féminin')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? 'العمر:' : 'Âge:'}
                      </span>
                      <span className="ml-2 rtl:ml-0 rtl:mr-2">
                        {calculateAge(selectedEnrollment.child_birth_date)}
                      </span>
                    </div>
                  </div>
                  
                  {selectedEnrollment.child_medical_info && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? 'المعلومات الطبية:' : 'Informations médicales:'}
                      </span>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {selectedEnrollment.child_medical_info}
                      </p>
                    </div>
                  )}
                </div>

                {/* Informations du parent */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {isRTL ? 'معلومات ولي الأمر' : 'Informations du parent'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? 'الاسم:' : 'Nom:'}
                      </span>
                      <span className="ml-2 rtl:ml-0 rtl:mr-2">
                        {selectedEnrollment.parent_first_name} {selectedEnrollment.parent_last_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? 'البريد الإلكتروني:' : 'Email:'}
                      </span>
                      <span className="ml-2 rtl:ml-0 rtl:mr-2">
                        {selectedEnrollment.parent_email}
                      </span>
                    </div>
                    {selectedEnrollment.parent_phone && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? 'الهاتف:' : 'Téléphone:'}
                        </span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2">
                          {selectedEnrollment.parent_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact d'urgence */}
                {(selectedEnrollment.emergency_contact_name || selectedEnrollment.emergency_contact_phone) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {isRTL ? 'جهة الاتصال للطوارئ' : 'Contact d\'urgence'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {selectedEnrollment.emergency_contact_name && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {isRTL ? 'الاسم:' : 'Nom:'}
                          </span>
                          <span className="ml-2 rtl:ml-0 rtl:mr-2">
                            {selectedEnrollment.emergency_contact_name}
                          </span>
                        </div>
                      )}
                      {selectedEnrollment.emergency_contact_phone && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {isRTL ? 'الهاتف:' : 'Téléphone:'}
                          </span>
                          <span className="ml-2 rtl:ml-0 rtl:mr-2">
                            {selectedEnrollment.emergency_contact_phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {/* Actions */}
                {selectedEnrollment.status === 'pending' && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => {
                        setShowModal(false);
                        window.location.href = `/dashboard/pending-enrollments?highlight=${selectedEnrollment.id}`;
                      }}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                      {isRTL ? 'معالجة الملف الآن' : 'Traitement le dossier maintenant'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de formulaire d'approbation */}
      {showApprovalForm && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isRTL ? 'قبول طلب التسجيل' : 'Approuver la demande d\'inscription'}
              </h3>
              
              <div className="space-y-4">
                {/* Informations de l'enfant */}
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedEnrollment.child_first_name} {selectedEnrollment.child_last_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? 'الوالد:' : 'Parent:'} {selectedEnrollment.parent_first_name} {selectedEnrollment.parent_last_name}
                  </p>
                </div>

                {/* Date de rendez-vous */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'تاريخ الموعد (اختياري)' : 'Date de rendez-vous (optionnel)'}
                  </label>
                  <input
                    type="date"
                    value={approvalData.appointment_date}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, appointment_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Commentaire admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'ملاحظات إضافية (اختياري)' : 'Commentaires additionnels (optionnel)'}
                  </label>
                  <textarea
                    value={approvalData.admin_comment}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, admin_comment: e.target.value }))}
                    placeholder={isRTL ? 'أضف ملاحظات للوالد...' : 'Ajoutez des notes pour le parent...'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    rows="3"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalForm(false);
                    setApprovalData({ appointment_date: '', admin_comment: '' });
                  }}
                  disabled={actionLoading}
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  onClick={submitApproval}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />}
                  {isRTL ? 'تأكيد القبول' : 'Confirmer l\'approbation'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsPage;
