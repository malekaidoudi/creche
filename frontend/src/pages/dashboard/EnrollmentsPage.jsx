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
  Download
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import api from '../../config/api';

const EnrollmentsPage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enrollments');
      setEnrollments(response.data.enrollments || []);
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
    setActionLoading(true);
    try {
      await api.put(`/enrollments/${enrollmentId}/approve`);
      toast.success(isRTL ? 'تم قبول الطلب' : 'Demande approuvée');
      fetchEnrollments();
      setShowModal(false);
    } catch (error) {
      console.error('Erreur approbation:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في الموافقة' : 'Erreur lors de l\'approbation'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectEnrollment = async (enrollmentId, reason = '') => {
    setActionLoading(true);
    try {
      await api.put(`/enrollments/${enrollmentId}/reject`, { reason });
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

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (activeTab === 'all') return true;
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
    { id: 'pending', label: isRTL ? 'في الانتظار' : 'En attente', count: enrollments.filter(e => e.status === 'pending').length },
    { id: 'approved', label: isRTL ? 'مقبولة' : 'Approuvées', count: enrollments.filter(e => e.status === 'approved').length },
    { id: 'rejected', label: isRTL ? 'مرفوضة' : 'Rejetées', count: enrollments.filter(e => e.status === 'rejected').length },
    { id: 'all', label: isRTL ? 'الكل' : 'Toutes', count: enrollments.length }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'طلبات التسجيل' : 'Demandes d\'inscription'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'إدارة طلبات التسجيل الجديدة' : 'Gérer les nouvelles demandes d\'inscription'}
          </p>
        </div>
      </div>

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

      {/* Liste des demandes */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredEnrollments.length === 0 ? (
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
          {filteredEnrollments.map((enrollment) => (
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
                              {enrollment.parent_email}
                            </div>
                            {enrollment.parent_phone && (
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                {enrollment.parent_phone}
                              </div>
                            )}
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
                        {isRTL ? 'عرض' : 'Voir'}
                      </Button>

                      {enrollment.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveEnrollment(enrollment.id)}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'قبول' : 'Approuver'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectEnrollment(enrollment.id)}
                            disabled={actionLoading}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
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

                {/* Fichiers */}
                {selectedEnrollment.files && selectedEnrollment.files.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {isRTL ? 'الملفات المرفقة' : 'Fichiers joints'}
                    </h3>
                    <div className="space-y-2">
                      {selectedEnrollment.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {file.name || `Document ${index + 1}`}
                          </span>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'تحميل' : 'Télécharger'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedEnrollment.status === 'pending' && (
                  <div className="flex justify-end space-x-4 rtl:space-x-reverse pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleRejectEnrollment(selectedEnrollment.id)}
                      disabled={actionLoading}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {actionLoading ? <LoadingSpinner size="sm" /> : <X className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />}
                      {isRTL ? 'رفض' : 'Rejeter'}
                    </Button>
                    <Button
                      onClick={() => handleApproveEnrollment(selectedEnrollment.id)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />}
                      {isRTL ? 'قبول' : 'Approuver'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsPage;
