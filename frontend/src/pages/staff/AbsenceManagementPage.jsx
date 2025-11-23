import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Baby,
  Clock,
  CheckCircle,
  User,
  FileText,
  Filter,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AbsenceManagementPage = () => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, acknowledged
  const [highlightedId, setHighlightedId] = useState(null);
  const highlightedRef = useRef(null);
  const [statsExpanded, setStatsExpanded] = useState(false);

  const absenceReasons = {
    'sick': isRTL ? 'مريض' : 'Maladie',
    'vacation': isRTL ? 'عطلة' : 'Vacances',
    'medical_visit': isRTL ? 'زيارة طبية' : 'Visite médicale',
    'family_event': isRTL ? 'مناسبة عائلية' : 'Événement familial',
    'other': isRTL ? 'أخرى' : 'Autre'
  };

  useEffect(() => {
    loadAbsenceRequests();
  }, []);

  // Gérer le highlight de la demande depuis la notification
  useEffect(() => {
    const requestId = searchParams.get('requestId');
    if (requestId && absenceRequests.length > 0) {
      const id = parseInt(requestId);
      setHighlightedId(id);

      // Scroll vers l'élément après un court délai
      setTimeout(() => {
        if (highlightedRef.current) {
          highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      // Retirer le highlight après 3 secondes
      setTimeout(() => {
        setHighlightedId(null);
      }, 3000);
    }
  }, [searchParams, absenceRequests]);

  const loadAbsenceRequests = async () => {
    try {
      console.log('🔄 Chargement des demandes d\'absence...');
      setLoading(true);
      const response = await api.get('/api/absence-requests/all');
      console.log('📥 Réponse reçue:', response.data);

      if (response.data.success) {
        const requests = response.data.requests || [];
        console.log(`✅ ${requests.length} demande(s) chargée(s)`);
        setAbsenceRequests(requests);
      } else {
        console.warn('⚠️ Réponse non réussie:', response.data);
        setAbsenceRequests([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement demandes:', error);
      console.error('Détails:', error.response?.data);
      dialog.error(isRTL ? 'خطأ في تحميل الطلبات' : 'Erreur lors du chargement des demandes');
      setAbsenceRequests([]);
    } finally {
      setLoading(false);
      console.log('✅ Chargement terminé');
    }
  };

  const handleAcknowledge = async (requestId) => {
    try {
      const response = await api.put(`/api/absence-requests/${requestId}/acknowledge`);

      if (response.data.success) {
        dialog.success(isRTL ? 'تم تأكيد الطلب' : 'Demande validée');
        loadAbsenceRequests();
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      dialog.error(isRTL ? 'خطأ في التأكيد' : 'Erreur lors de la validation');
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'pending') {
      return absenceRequests.filter(r => r.status === 'pending');
    } else if (filter === 'acknowledged') {
      return absenceRequests.filter(r => r.status === 'acknowledged');
    }
    return absenceRequests;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'acknowledged':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
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

  console.log('🎨 Rendu - Loading:', loading, 'Requests:', absenceRequests.length);

  const filteredRequests = getFilteredRequests();
  const pendingCount = absenceRequests.filter(r => r.status === 'pending').length;
  const acknowledgedCount = absenceRequests.filter(r => r.status === 'acknowledged').length;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isRTL ? 'إدارة طلبات الغياب' : 'Gestion des demandes d\'absence'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL ? 'عرض وتأكيد طلبات الغياب من الآباء' : 'Consulter et valider les demandes d\'absence des parents'}
          </p>
        </motion.div>

        {/* Statistiques - Version Desktop (md et plus) */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                    {isRTL ? 'المجموع' : 'Total'}
                  </p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-200">
                    {absenceRequests.length}
                  </p>
                </div>
                <FileText className="w-12 h-12 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">
                    {isRTL ? 'في الانتظار' : 'En attente'}
                  </p>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-200">
                    {pendingCount}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-300 font-medium">
                    {isRTL ? 'تم التأكيد' : 'Validées'}
                  </p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-200">
                    {acknowledgedCount}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques - Version Mobile Collapsible (< md) */}
        <motion.div
          className="md:hidden mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          layout
        >
          {/* Header Collapsible */}
          <div
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'الإحصائيات' : 'Statistiques'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isRTL ? `${absenceRequests.length} طلب` : `${absenceRequests.length} demandes`}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: statsExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.div>
          </div>

          {/* Content Collapsible */}
          <AnimatePresence>
            {statsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-3 border-t border-gray-100 dark:border-gray-700">
                  {/* Total */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                          {isRTL ? 'المجموع' : 'Total'}
                        </p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
                          {absenceRequests.length}
                        </p>
                      </div>
                      <FileText className="w-10 h-10 text-blue-500 opacity-50" />
                    </div>
                  </div>

                  {/* En attente */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">
                          {isRTL ? 'في الانتظار' : 'En attente'}
                        </p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-200">
                          {pendingCount}
                        </p>
                      </div>
                      <Clock className="w-10 h-10 text-yellow-500 opacity-50" />
                    </div>
                  </div>

                  {/* Validées */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-300 font-medium">
                          {isRTL ? 'تم التأكيد' : 'Validées'}
                        </p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-200">
                          {acknowledgedCount}
                        </p>
                      </div>
                      <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isRTL ? 'تصفية:' : 'Filtrer:'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all ${filter === 'all'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <span className={`text-lg sm:text-2xl font-bold ${filter === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                    {absenceRequests.length}
                  </span>
                  <span className={`text-xs sm:text-sm font-medium mt-1 ${filter === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                    {isRTL ? 'الكل' : 'Tous'}
                  </span>
                </button>

                <button
                  onClick={() => setFilter('pending')}
                  className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all ${filter === 'pending'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <span className={`text-lg sm:text-2xl font-bold ${filter === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                    {pendingCount}
                  </span>
                  <span className={`text-xs sm:text-sm font-medium mt-1 ${filter === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                    {isRTL ? 'في الانتظار' : 'En attente'}
                  </span>
                </button>

                <button
                  onClick={() => setFilter('acknowledged')}
                  className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all ${filter === 'acknowledged'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <span className={`text-lg sm:text-2xl font-bold ${filter === 'acknowledged' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                    {acknowledgedCount}
                  </span>
                  <span className={`text-xs sm:text-sm font-medium mt-1 ${filter === 'acknowledged' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                    {isRTL ? 'تم التأكيد' : 'Validées'}
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? 'طلبات الغياب' : 'Demandes d\'absence'}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? `${filteredRequests.length} ${filteredRequests.length === 1 ? 'طلب' : 'طلبات'}`
                : `${filteredRequests.length} demande${filteredRequests.length > 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <LoadingSpinner />
                <p className="text-gray-500 dark:text-gray-400 mt-4">
                  {isRTL ? 'جاري التحميل...' : 'Chargement...'}
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {isRTL ? 'لا توجد طلبات' : 'Aucune demande'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Total: {absenceRequests.length} | Filtrées: {filteredRequests.length}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    ref={request.id === highlightedId ? highlightedRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 hover:shadow-md transition-all ${request.id === highlightedId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Baby className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-lg text-gray-900 dark:text-white">
                            {request.child_first_name} {request.child_last_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <User className="w-4 h-4" />
                          <span>
                            {isRTL ? 'الوالد:' : 'Parent:'} {request.parent_first_name} {request.parent_last_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(request.start_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')}
                            {request.end_date && request.end_date !== request.start_date && (
                              <> → {new Date(request.end_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')}</>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>

                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledge(request.id)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'تأكيد' : 'Valider'}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? 'السبب:' : 'Raison:'}
                        </span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 text-gray-600 dark:text-gray-400">
                          {absenceReasons[request.reason] || request.reason}
                        </span>
                      </div>

                      {request.admin_notes && (
                        <div className="text-sm mt-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {isRTL ? 'ملاحظات:' : 'Notes:'}
                          </span>
                          <span className="ml-2 rtl:ml-0 rtl:mr-2 text-gray-600 dark:text-gray-400">
                            {request.admin_notes}
                          </span>
                        </div>
                      )}

                      {request.acknowledged_at && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                          ✓ {isRTL ? 'تم التأكيد في' : 'Validé le'} {new Date(request.acknowledged_at).toLocaleString(isRTL ? 'ar-TN' : 'fr-FR')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AbsenceManagementPage;
