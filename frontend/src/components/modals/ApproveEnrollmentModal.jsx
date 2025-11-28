import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import DatePicker from '../ui/DatePicker';
import { convertToISO } from '../../utils/dateUtils';

const ApproveEnrollmentModal = ({ isOpen, onClose, enrollment, onApprove }) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentDate) {
      dialog.error(isRTL ? 'يرجى اختيار تاريخ الموعد' : 'Veuillez choisir une date de rendez-vous');
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      dialog.error(isRTL ? 'يرجى اختيار تاريخ ووقت للموعد' : 'Veuillez sélectionner une date et une heure pour le rendez-vous');
      return;
    }

    setLoading(true);

    try {
      // Combiner date et heure
      const isoDate = convertToISO(appointmentDate);
      const appointmentDateTime = new Date(`${isoDate}T${appointmentTime}`);
      if (appointmentDateTime < new Date()) {
        dialog.error(isRTL ? 'تاريخ الموعد يجب أن يكون في المستقبل' : 'La date du rendez-vous doit être dans le futur');
        return;
      }

      await onApprove(enrollment.id, `${isoDate}T${appointmentTime}:00`);

      dialog.success(
        isRTL
          ? 'تم قبول الطلب بنجاح'
          : 'Dossier approuvé avec succès'
      );

      onClose();
    } catch (error) {
      console.error('Erreur approbation:', error);
      dialog.error(
        isRTL
          ? 'حدث خطأ أثناء قبول الطلب'
          : 'Erreur lors de l\'approbation du dossier'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!enrollment) return null;

  // Date minimale: aujourd'hui
  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {isRTL ? 'قبول الطلب' : 'Approuver le dossier'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Info enfant */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                    {isRTL ? 'معلومات الطفل' : 'Informations de l\'enfant'}
                  </p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {enrollment.child_first_name} {enrollment.child_last_name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {isRTL ? 'ولي الأمر:' : 'Parent :'} {enrollment.applicant_first_name} {enrollment.applicant_last_name}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    📧 {enrollment.applicant_email}
                  </p>
                </div>

                {/* Date picker */}
                <DatePicker
                  label={isRTL ? 'تاريخ الموعد' : 'Date du rendez-vous'}
                  required
                  value={appointmentDate}
                  onChange={(value) => setAppointmentDate(value)}
                />

                {/* Time picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    {isRTL ? 'وقت الموعد' : 'Heure du rendez-vous'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Info box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">ℹ️ {isRTL ? 'ملاحظة:' : 'Note :'}</span>
                    <br />
                    {isRTL
                      ? 'سيتم إرسال بريد إلكتروني للوالدين يحتوي على تاريخ الموعد ورابط لإنشاء كلمة المرور.'
                      : 'Un e-mail sera envoyé aux parents avec la date du rendez-vous et un lien pour créer leur mot de passe.'
                    }
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 font-medium shadow-lg shadow-green-500/30"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        {isRTL ? 'جاري القبول...' : 'Approbation...'}
                      </span>
                    ) : (
                      <>
                        <Check className="w-5 h-5 inline mr-2" />
                        {isRTL ? 'قبول الطلب' : 'Approuver'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ApproveEnrollmentModal;
