import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, AlertCircle, Send } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RejectWithProposalModal = ({ isOpen, onClose, appointment, onSuccess }) => {
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proposed_date: '',
    proposed_time: '',
    reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.proposed_date || !formData.proposed_time) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);

      // Combiner date et heure
      const proposedDateTime = `${formData.proposed_date}T${formData.proposed_time}:00`;

      // Refuser le RDV actuel et proposer nouvelle date
      const response = await api.post(`/api/appointments/${appointment.id}/reject-with-proposal`, {
        proposed_date: proposedDateTime,
        reason: formData.reason || 'Date non disponible'
      });

      if (response.data.success) {
        toast.success(isRTL ? 'تم رفض الموعد وإرسال تاريخ بديل' : 'RDV refusé et nouvelle date proposée');
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Erreur refus avec proposition:', error);
      toast.error(isRTL ? 'خطأ في العملية' : 'Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isRTL ? 'رفض وإقتراح تاريخ بديل' : 'Refuser et proposer une date'}
                  </h2>
                  <p className="text-red-100 text-sm">
                    {isRTL ? 'إقترح تاريخ جديد للوالد' : 'Proposez une nouvelle date au parent'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Info RDV actuel */}
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                <strong>{isRTL ? 'الموعد المرفوض:' : 'RDV refusé :'}</strong>
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                📅 {new Date(appointment.proposed_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                👤 {appointment.parent_name}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nouvelle date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  {isRTL ? 'التاريخ البديل' : 'Nouvelle date'}
                </label>
                <input
                  type="date"
                  name="proposed_date"
                  value={formData.proposed_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Nouvelle heure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {isRTL ? 'الوقت البديل' : 'Nouvelle heure'}
                </label>
                <input
                  type="time"
                  name="proposed_time"
                  value={formData.proposed_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Raison (optionnel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'السبب (اختياري)' : 'Raison (optionnel)'}
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  placeholder={isRTL ? 'سبب الرفض...' : 'Raison du refus...'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isRTL ? 'إرسال' : 'Envoyer'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RejectWithProposalModal;
