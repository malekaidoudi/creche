import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import enrollmentsService from '../../services/enrollmentsService';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  RefreshCw,
  AlertCircle,
  Download,
  Eye,
  Paperclip,
  Shield,
  Heart,
  MapPin
} from 'lucide-react';

const PendingEnrollmentsPage = () => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const isAdmin = () => user?.role === 'admin';
  const isStaff = () => user?.role === 'staff';
  
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    // Vérifier s'il y a un paramètre highlight dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const highlight = urlParams.get('highlight');
    if (highlight) {
      setHighlightId(parseInt(highlight));
      // Nettoyer l'URL après avoir récupéré le paramètre
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    fetchPendingEnrollments();
  }, []);

  // Scroll vers l'inscription mise en évidence après le chargement
  useEffect(() => {
    if (highlightId && enrollments.length > 0) {
      setTimeout(() => {
        const element = document.querySelector(`[data-enrollment-id="${highlightId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [highlightId, enrollments]);

  const fetchPendingEnrollments = async () => {
    try {
      setLoading(true);
      
      // Essayer de récupérer les données réelles de la base de données
      try {
        const response = await enrollmentsService.getAllEnrollments({
          status: 'pending',
          limit: 100
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
      console.error('Erreur:', error);
      toast.error(isRTL ? 'خطأ في تحميل الطلبات' : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollment) => {
    try {
      setActionLoading(true);
      
      if (!usingDemoData) {
        // Utiliser l'API réelle
        await enrollmentsService.approveEnrollment(enrollment.id, {
          appointment_date: new Date().toISOString().split('T')[0],
          admin_comment: `Approuvé par ${user?.first_name} ${user?.last_name}`
        });
      } else {
        // Simulation pour les données de démonstration
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
      toast.success(isRTL ? 'تم قبول الطلب' : 'Demande approuvée');
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast.error(isRTL ? 'خطأ في الموافقة' : 'Erreur lors de l\'approbation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (enrollment) => {
    const reason = prompt(isRTL ? 'سبب الرفض:' : 'Raison du rejet:');
    if (!reason) return;

    try {
      setActionLoading(true);
      
      if (!usingDemoData) {
        // Utiliser l'API réelle
        await enrollmentsService.rejectEnrollment(enrollment.id, {
          reason,
          admin_comment: `Rejeté par ${user?.first_name} ${user?.last_name}`
        });
      } else {
        // Simulation pour les données de démonstration
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
      toast.success(isRTL ? 'تم رفض الطلب' : 'Demande rejetée');
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error(isRTL ? 'خطأ في الرفض' : 'Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocuments = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowDocumentsModal(true);
  };

  const handleDownloadDocument = (document) => {
    // Simulation du téléchargement
    const documentName = document.original_name || document.filename;
    toast.success(
      isRTL 
        ? `تم تحميل ${documentName}` 
        : `Téléchargement de ${documentName} démarré`
    );
  };

  const handleViewDocument = (document) => {
    // Simulation de l'ouverture du document
    const documentName = document.original_name || document.filename;
    toast.success(
      isRTL 
        ? `فتح ${documentName}` 
        : `Ouverture de ${documentName}`
    );
  };

  const getDocumentTypeFromFilename = (filename) => {
    if (filename.includes('carnet_medical')) return 'vaccination_record';
    if (filename.includes('acte_naissance')) return 'birth_certificate';
    if (filename.includes('certificat_medical')) return 'medical_certificate';
    return 'document';
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'birth_certificate':
        return <FileText className="w-5 h-5" />;
      case 'vaccination_record':
        return <Shield className="w-5 h-5" />;
      case 'medical_certificate':
        return <Heart className="w-5 h-5" />;
      case 'address_proof':
        return <MapPin className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    // Ajuster si l'anniversaire n'est pas encore passé cette année
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    
    // Ajuster les mois si le jour n'est pas encore passé ce mois
    if (today.getDate() < birth.getDate()) {
      months--;
    }
    
    const totalMonths = years * 12 + months;
    
    if (totalMonths < 12) {
      return `${totalMonths} ${isRTL ? 'شهر' : 'mois'}`;
    } else {
      return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'الطلبات في الانتظار' : 'Demandes en attente'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isRTL ? 'مراجعة وإدارة طلبات التسجيل الجديدة' : 'Examiner et gérer les nouvelles demandes d\'inscription'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Button onClick={fetchPendingEnrollments} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Actualiser'}
          </Button>
          
          <div className="bg-yellow-100 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {enrollments.length} {isRTL ? 'طلب' : 'demande(s)'}
            </span>
          </div>
        </div>
      </div>



      {/* Liste des demandes */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'لا توجد طلبات في الانتظار' : 'Aucune demande en attente'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isRTL ? 'جميع الطلبات تم معالجتها' : 'Toutes les demandes ont été traitées'}
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
              data-enrollment-id={enrollment.id}
            >
              <Card className={`hover:shadow-md transition-shadow ${
                enrollment.id === highlightId ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse mb-3">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                            {isRTL ? 'في الانتظار' : 'En attente'}
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
                            {enrollment.medical_info && (
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                {enrollment.medical_info}
                              </div>
                            )}
                            {enrollment.documents && enrollment.documents.length > 0 && (
                              <div className="flex items-center">
                                <Paperclip className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                <span className="text-blue-600">
                                  {enrollment.documents.length} {isRTL ? 'وثيقة' : 'document(s)'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {isRTL ? 'معلومات الوالد' : 'Informations parent'}
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

                    <div className="flex flex-col space-y-2 ml-4 rtl:ml-0 rtl:mr-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocuments(enrollment)}
                        disabled={!enrollment.files || enrollment.files.length === 0}
                      >
                        <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {isRTL ? 'الوثائق' : 'Documents'}
                      </Button>
                      
                      {(isAdmin() || isStaff()) && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(enrollment)}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'قبول' : 'Approuver'}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(enrollment)}
                            disabled={actionLoading}
                          >
                            <XCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'رفض' : 'Rejeter'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal des documents */}
      {showDocumentsModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'وثائق الطلب' : 'Documents de la demande'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocumentsModal(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selectedEnrollment.child_first_name} {selectedEnrollment.child_last_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isRTL ? 'الوالد:' : 'Parent:'} {selectedEnrollment.parent_first_name} {selectedEnrollment.parent_last_name}
                </p>
              </div>

              {selectedEnrollment.files && selectedEnrollment.files.length > 0 ? (
                <div className="space-y-3">
                  {selectedEnrollment.files.map((document) => (
                    <div key={document.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="text-blue-600">
                            {getDocumentIcon(getDocumentTypeFromFilename(document.filename))}
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {document.original_name || document.filename}
                            </h5>
                            <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500">
                              <span>{document.filename}</span>
                              <span>{Math.round(document.file_size / 1024)} KB</span>
                              <span>{document.mime_type}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(document)}
                          >
                            <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'عرض' : 'Voir'}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(document)}
                          >
                            <Download className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'تحميل' : 'Télécharger'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'لا توجد وثائق مرفقة' : 'Aucun document attaché'}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDocumentsModal(false)}
                >
                  {isRTL ? 'إغلاق' : 'Fermer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingEnrollmentsPage;
