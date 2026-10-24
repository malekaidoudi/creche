import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  AlertCircle,
  Send,
  Baby,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Phone
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CalendarPicker from '../../components/ui/CalendarPicker';
import { useDialogContext } from '../../contexts/DialogContext';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import api from '../../services/api';

const AbsenceRequestPage = () => {
  const { user } = useAuth();
  const dialog = useDialogContext();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [children, setChildren] = useState([]);
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const absenceReasons = [
    { value: 'sick', label: isRTL ? 'مريض' : 'Maladie' },
    { value: 'vacation', label: isRTL ? 'عطلة' : 'Vacances' },
    { value: 'medical_visit', label: isRTL ? 'زيارة طبية' : 'Visite médicale' },
    { value: 'family_event', label: isRTL ? 'مناسبة عائلية' : 'Événement familial' },
    { value: 'other', label: isRTL ? 'أخرى' : 'Autre' }
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const userId = user?.id || user?.userId;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Charger les enfants du parent (seulement les approuvés)
      const childrenResponse = await api.get(`/api/children/parent/${userId}`);
      console.log('👶 Réponse enfants:', childrenResponse.data);

      if (childrenResponse.data.success) {
        setChildren(childrenResponse.data.children || []);
        console.log('✅ Enfants chargés:', childrenResponse.data.children?.length || 0);
      } else {
        setChildren([]);
        console.log('⚠️ Aucun enfant trouvé ou erreur');
      }

      // Charger les demandes d'absence existantes
      try {
        const absenceResponse = await api.get(`/api/absence-requests/parent/${userId}`);
        setAbsenceRequests(absenceResponse.data.requests || []);
      } catch (error) {
        console.error('Erreur chargement demandes d\'absence:', error);
        setAbsenceRequests([]);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      dialog.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChild || !selectedDate || !reason) {
      dialog.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setSubmitting(true);

      const requestData = {
        child_id: selectedChild,
        start_date: selectedDate.toISOString().split('T')[0],
        end_date: selectedDate.toISOString().split('T')[0],
        reason: reason,
        notes: notes
      };

      console.log('📤 Envoi demande d\'absence:', requestData);

      // Envoyer la demande via l'API
      const response = await api.post('/api/absence-requests', requestData);

      if (response.data.success) {
        dialog.success(isRTL ? 'تم إرسال طلب الغياب بنجاح' : 'Demande d\'absence envoyée avec succès');

        // Réinitialiser le formulaire
        setSelectedDate(null);
        setSelectedChild('');
        setReason('');
        setNotes('');

        // Recharger les demandes
        loadData();
      } else {
        dialog.error(response.data.error || (isRTL ? 'خطأ في إرسال الطلب' : 'Erreur lors de l\'envoi de la demande'));
      }

    } catch (error) {
      console.error('❌ Erreur envoi demande:', error);
      const errorMessage = error.response?.data?.error || error.message;
      dialog.error(isRTL ? `خطأ: ${errorMessage}` : `Erreur: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'acknowledged':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'acknowledged':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return isRTL ? 'في الانتظار' : 'En attente';
      case 'acknowledged':
        return isRTL ? 'تم التأكيد' : 'Validé';
      default:
        return status;
    }
  };

  const handleCallNursery = () => {
    const nurseryPhone = '+21671234567'; // Numéro de la crèche
    window.location.href = `tel:${nurseryPhone}`;
  };

  const isAbsenceToday = (date) => {
    const today = new Date();
    const absenceDate = new Date(date);
    return today.toDateString() === absenceDate.toDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'} ${isMobile ? 'pb-24' : 'pb-6'}`}>
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 shadow-xs pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/mon-espace')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              title={isRTL ? 'العودة إلى مساحتي' : 'Retour à Mon Espace'}
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {isRTL ? 'طلب غياب' : 'Demande d\'absence'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {isRTL ? 'أعلم الإدارة بغياب طفلك مسبقاً' : 'Informez l\'administration de l\'absence de votre enfant à l\'avance'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendrier de demande */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <CalendarPicker
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              children={children}
              selectedChild={selectedChild}
              onChildSelect={setSelectedChild}
              reason={reason}
              onReasonChange={setReason}
              notes={notes}
              onNotesChange={setNotes}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </motion.div>

          {/* Historique des demandes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'الطلبات السابقة' : 'Demandes précédentes'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'تاريخ طلبات الغياب المرسلة' : 'Historique de vos demandes d\'absence'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {absenceRequests.length === 0 ? (
                  <div className="text-center py-8" style={{ minHeight: '300px' }}>
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {isRTL ? 'لا توجد طلبات سابقة' : 'Aucune demande précédente'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '400px', minHeight: '300px' }}>
                    {absenceRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <Baby className="w-4 h-4 text-gray-500 mr-2 rtl:mr-0 rtl:ml-2" />
                            <span className="font-medium">
                              {request.child_first_name} {request.child_last_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Icône d'appel si absence aujourd'hui et validée */}
                            {isAbsenceToday(request.start_date) && request.status === 'acknowledged' && (
                              <button
                                onClick={handleCallNursery}
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                                title={isRTL ? 'اتصل بالحضانة' : 'Appeler la crèche'}
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            )}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1 rtl:ml-0 rtl:mr-1">
                                {getStatusText(request.status)}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            {new Date(request.start_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')}
                            {isAbsenceToday(request.start_date) && (
                              <span className="ml-2 rtl:ml-0 rtl:mr-2 text-orange-600 font-semibold">
                                {isRTL ? '(اليوم)' : '(Aujourd\'hui)'}
                              </span>
                            )}
                          </div>
                          <div>
                            <strong>{isRTL ? 'السبب:' : 'Raison:'}</strong> {
                              absenceReasons.find(r => r.value === request.reason)?.label || request.reason
                            }
                          </div>
                          {request.notes && (
                            <div>
                              <strong>{isRTL ? 'ملاحظات:' : 'Notes:'}</strong> {request.notes}
                            </div>
                          )}
                          {request.status === 'acknowledged' && request.acknowledged_at && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-green-600 dark:text-green-400 text-xs">
                                ✓ {isRTL ? 'تم التأكيد من قبل الموظفين' : 'Confirmé par le personnel'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Navigation mobile */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default AbsenceRequestPage;
