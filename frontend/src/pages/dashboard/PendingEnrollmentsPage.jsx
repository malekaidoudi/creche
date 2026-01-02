import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import enrollmentsService from '../../services/enrollmentsService';
import ApproveEnrollmentModal from '../../components/modals/ApproveEnrollmentModal';
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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectData, setRejectData] = useState({ rejection_type: 'autre', custom_reason: '' });
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

  const handleApproveClick = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowApproveModal(true);
  };

  const handleApprove = async (enrollmentId, appointmentDate) => {
    try {
      setActionLoading(true);

      if (!usingDemoData) {
        // Utiliser l'API réelle avec la date de rendez-vous
        await enrollmentsService.approveEnrollment(enrollmentId, {
          appointment_date: appointmentDate
        });
      } else {
        // Simulation pour les données de démonstration
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      toast.success(isRTL ? 'تم قبول الطلب' : 'Dossier approuvé avec succès');
      setShowApproveModal(false);

      // Rafraîchir la liste
      await fetchPendingEnrollments();
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast.error(isRTL ? 'خطأ في الموافقة' : 'Erreur lors de l\'approbation');
      throw error; // Le modal affichera l'erreur
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setRejectData({ rejection_type: 'autre', custom_reason: '' });
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectData.rejection_type) {
      toast.error(isRTL ? 'يرجى اختيار نوع الرفض' : 'Veuillez sélectionner un type de rejet');
      return;
    }

    try {
      setActionLoading(true);

      if (!usingDemoData) {
        // Utiliser l'API réelle
        await enrollmentsService.rejectEnrollment(selectedEnrollment.id, {
          rejection_type: rejectData.rejection_type,
          custom_reason: rejectData.custom_reason || undefined
        });
      } else {
        // Simulation pour les données de démonstration
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setEnrollments(prev => prev.filter(e => e.id !== selectedEnrollment.id));
      setShowRejectModal(false);
      toast.success(isRTL ? 'تم رفض الطلب' : 'Demande rejetée');
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error(isRTL ? 'خطأ في الرفض' : 'Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocuments = async (enrollment) => {
    try {
      // Charger les documents depuis l'API
      const response = await enrollmentsService.getEnrollmentById(enrollment.id);
      setSelectedEnrollment({
        ...enrollment,
        files: response.documents || []
      });
      setShowDocumentsModal(true);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      toast.error(isRTL ? 'خطأ في تحميل الوثائق' : 'Erreur lors du chargement des documents');
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      // Utiliser cloudinary_url si disponible, sinon fallback
      const documentUrl = doc.cloudinary_url ||
        `${import.meta.env.VITE_API_URL || 'https://creche-backend-prod.onrender.com'}/uploads/enrollments/${doc.filename}`;

      // Télécharger le fichier
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error('Fichier non trouvé');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.original_filename || doc.filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast.success(
        isRTL
          ? `تم تحميل ${doc.original_filename || doc.filename}`
          : `Téléchargement de ${doc.original_filename || doc.filename} réussi`
      );
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error(
        isRTL
          ? 'فشل التحميل'
          : 'Erreur lors du téléchargement'
      );
    }
  };

  const handleViewDocument = (doc) => {
    try {
      // Utiliser cloudinary_url si disponible, sinon fallback
      const documentUrl = doc.cloudinary_url ||
        `${import.meta.env.VITE_API_URL || 'https://creche-backend-prod.onrender.com'}/uploads/enrollments/${doc.filename}`;

      // Ouvrir dans un nouvel onglet
      window.open(documentUrl, '_blank');

      toast.success(
        isRTL
          ? `فتح ${doc.original_filename || doc.filename}`
          : `Ouverture de ${doc.original_filename || doc.filename}`
      );
    } catch (error) {
      console.error('Erreur visualisation:', error);
      toast.error(
        isRTL
          ? 'فشل فتح الملف'
          : 'Erreur lors de l\'ouverture'
      );
    }
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
              <Card className={`hover:shadow-md transition-shadow ${enrollment.id === highlightId ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                }`}>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  {/* Mobile: Header avec bouton Docs à droite */}
                  <div className="md:hidden flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
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
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocuments(enrollment)}
                      disabled={!enrollment.documents_count || parseInt(enrollment.documents_count) === 0}
                      className="text-xs px-2 py-1.5 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                      Docs ({parseInt(enrollment.documents_count) || 0})
                    </Button>
                  </div>

                  {/* Desktop/Tablette: Layout classique */}
                  <div className="hidden md:flex md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-2">
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
                          <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-2">
                            {isRTL ? 'معلومات الوالد' : 'Informations parent'}
                          </h4>
                          <div className="space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
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

                    {/* Boutons Desktop/Tablette à droite */}
                    <div className="flex flex-col gap-2 ml-4 rtl:ml-0 rtl:mr-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocuments(enrollment)}
                        disabled={!enrollment.documents_count || parseInt(enrollment.documents_count) === 0}
                        className="text-sm px-3 py-2"
                      >
                        <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {isRTL ? 'الوثائق' : 'Documents'} ({parseInt(enrollment.documents_count) || 0})
                      </Button>

                      {(isAdmin() || isStaff()) && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveClick(enrollment)}
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

                  {/* Contenu Mobile */}
                  <div className="md:hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2">
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
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                          {isRTL ? 'معلومات الوالد' : 'Informations parent'}
                        </h4>
                        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            {enrollment.parent_first_name} {enrollment.parent_last_name}
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            <a href={`mailto:${enrollment.parent_email}`} className="text-blue-600 hover:text-blue-800 truncate">
                              {enrollment.parent_email}
                            </a>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            <a href={`tel:${enrollment.parent_phone || ''}`} className="text-blue-600 hover:text-blue-800" dir="ltr">
                              {enrollment.parent_phone || 'N/A'}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Boutons Mobile en bas */}
                    {(isAdmin() || isStaff()) && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          size="sm"
                          onClick={() => handleApproveClick(enrollment)}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700 flex-1 text-xs px-2 py-2"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'قبول' : 'Approuver'}
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(enrollment)}
                          disabled={actionLoading}
                          className="flex-1 text-xs px-2 py-2"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'رفض' : 'Rejeter'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal des documents - Responsive */}
      {showDocumentsModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header sticky */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'وثائق الطلب' : 'Documents de la demande'}
                </h3>
                <button
                  onClick={() => setShowDocumentsModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <span className="text-gray-500 text-xl">✕</span>
                </button>
              </div>

              {/* Info enfant */}
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selectedEnrollment.child_first_name} {selectedEnrollment.child_last_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isRTL ? 'الوالد:' : 'Parent:'} {selectedEnrollment.parent_first_name} {selectedEnrollment.parent_last_name}
                </p>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {selectedEnrollment.files && selectedEnrollment.files.length > 0 ? (
                <div className="space-y-3">
                  {selectedEnrollment.files.map((document) => (
                    <div key={document.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 sm:p-4">
                      {/* Layout mobile: empilé / Desktop: côte à côte */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="flex items-start sm:items-center space-x-3 rtl:space-x-reverse">
                          <div className="text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0">
                            {getDocumentIcon(getDocumentTypeFromFilename(document.filename))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {document.original_filename || document.original_name || document.filename}
                            </h5>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                              <span className="bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                                {document.document_type || document.filename}
                              </span>
                              {document.file_size && (
                                <span>{Math.round(document.file_size / 1024)} KB</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Boutons - pleine largeur sur mobile */}
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(document)}
                            className="flex-1 sm:flex-initial"
                          >
                            <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'عرض' : 'Voir'}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(document)}
                            className="flex-1 sm:flex-initial"
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
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'لا توجد وثائق مرفقة' : 'Aucun document attaché'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer sticky */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowDocumentsModal(false)}
                className="w-full sm:w-auto sm:ml-auto block"
              >
                {isRTL ? 'إغلاق' : 'Fermer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rejet */}
      {showRejectModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'رفض الطلب' : 'Rejeter la demande'}
            </h3>

            <div className="space-y-4">
              {/* Type de rejet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'نوع الرفض' : 'Type de rejet'}
                </label>
                <select
                  value={rejectData.rejection_type}
                  onChange={(e) => setRejectData({ ...rejectData, rejection_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="age_depasse">{isRTL ? 'تجاوز السن المطلوب' : 'Âge dépassé'}</option>
                  <option value="maladie_contagieuse">{isRTL ? 'مرض معدي' : 'Maladie contagieuse'}</option>
                  <option value="dossier_manquant">{isRTL ? 'ملف غير مكتمل' : 'Dossier incomplet'}</option>
                  <option value="places_completes">{isRTL ? 'الأماكن ممتلئة' : 'Places complètes'}</option>
                  <option value="autre">{isRTL ? 'أخرى' : 'Autre'}</option>
                </select>
              </div>

              {/* Raison personnalisée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'السبب (اختياري)' : 'Raison (optionnel)'}
                </label>
                <textarea
                  value={rejectData.custom_reason}
                  onChange={(e) => setRejectData({ ...rejectData, custom_reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={isRTL ? 'أضف تفاصيل إضافية...' : 'Ajoutez des détails supplémentaires...'}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button
                onClick={confirmReject}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? (isRTL ? 'جاري الرفض...' : 'Rejet en cours...') : (isRTL ? 'تأكيد الرفض' : 'Confirmer le rejet')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'approbation avec date picker */}
      <ApproveEnrollmentModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        enrollment={selectedEnrollment}
        onApprove={handleApprove}
      />
    </div>
  );
};

export default PendingEnrollmentsPage;
