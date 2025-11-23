import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import { motion, AnimatePresence } from 'framer-motion';
import RejectWithProposalModal from '../modals/RejectWithProposalModal';

const PendingAppointmentsWidget = ({ onUpdate }) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    loadPendingAppointments();
  }, []);

  const loadPendingAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/appointments?status=rescheduled');
      if (response.data.success) {
        setAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Erreur chargement RDV en attente:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleValidate = async (appointment) => {
    try {
      const response = await api.patch(`/api/appointments/${appointment.id}/confirm`, {
        confirmed_date: appointment.proposed_date
      });

      if (response.data.success) {
        dialog.success(isRTL ? 'تم تأكيد الموعد' : 'Rendez-vous confirmé');
        setAppointments(prev => prev.filter(a => a.id !== appointment.id));
        onUpdate?.();
      }
    } catch (error) {
      console.error('Erreur validation RDV:', error);
      dialog.error(isRTL ? 'خطأ في التأكيد' : 'Erreur lors de la validation');
    }
  };

  const handleReject = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRejectModal(true);
  };

  const handleRejectSuccess = () => {
    loadPendingAppointments();
    onUpdate?.();
  };

  if (loading) {
    return (
      <div className="rounded-lg shadow-sm p-6 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return null; // Ne rien afficher si pas de RDV en attente
  }

  return (
    <div className="rounded-lg shadow-sm bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isRTL ? 'مواعيد في انتظار التأكيد' : 'Rendez-vous à valider'}
              </h3>
              <p className="text-sm text-orange-100">
                {isRTL ? 'تم إعادة جدولتها من قبل الآباء' : 'Replanifiés par les parents'}
              </p>
            </div>
          </div>
          <div className="px-3 py-1 bg-white/20 rounded-full">
            <span className="text-white font-bold">{appointments.length}</span>
          </div>
        </div>
      </div>

      {/* Liste des RDV */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {appointments.map((appointment, index) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg border-2 bg-orange-50 border-orange-200 dark:bg-gray-700 dark:border-orange-600/30"
            >
              {/* Parent */}
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {appointment.parent_name || 'Parent'}
                </span>
              </div>

              {/* Objet */}
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                {appointment.subject || appointment.title}
              </h4>

              {/* Description */}
              {appointment.description && (
                <p className="text-sm mb-3 text-gray-600 dark:text-gray-300">
                  {appointment.description}
                </p>
              )}

              {/* Changement de date */}
              <div className="p-3 rounded-lg mb-3 bg-white dark:bg-gray-600">
                <div className="flex items-center justify-between text-sm">
                  {/* Ancienne date */}
                  <div>
                    <p className="text-xs mb-1 text-gray-500 dark:text-gray-400">
                      {isRTL ? 'التاريخ السابق' : 'Date initiale'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {formatDate(appointment.confirmed_date || appointment.created_at)}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-orange-500 mx-2" />

                  {/* Nouvelle date */}
                  <div>
                    <p className="text-xs mb-1 text-gray-500 dark:text-gray-400">
                      {isRTL ? 'التاريخ الجديد' : 'Nouvelle date'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(appointment.proposed_date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Heure */}
                <div className="flex items-center gap-2 mt-2 justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatTime(appointment.proposed_date)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleValidate(appointment)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isRTL ? 'تأكيد' : 'Valider'}
                </button>
                <button
                  onClick={() => handleReject(appointment)}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
                >
                  <XCircle className="w-4 h-4" />
                  {isRTL ? 'رفض' : 'Refuser'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal refus avec proposition */}
      <RejectWithProposalModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={handleRejectSuccess}
      />
    </div>
  );
};

export default PendingAppointmentsWidget;
