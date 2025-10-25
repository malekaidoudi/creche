import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Baby, Calendar, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from './Button';

const AbsenceFormModal = ({ 
  isOpen, 
  onClose, 
  selectedDate,
  children,
  selectedChild,
  onChildSelect,
  reason,
  onReasonChange,
  notes,
  onNotesChange,
  onSubmit,
  submitting 
}) => {
  const { isRTL } = useLanguage();

  const absenceReasons = [
    { value: 'sick', label: isRTL ? 'مرض' : 'Maladie' },
    { value: 'vacation', label: isRTL ? 'عطلة' : 'Vacances' },
    { value: 'medical_visit', label: isRTL ? 'زيارة طبية' : 'Visite médicale' },
    { value: 'family_event', label: isRTL ? 'حدث عائلي' : 'Événement familial' },
    { value: 'other', label: isRTL ? 'أخرى' : 'Autre' }
  ];

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedChild && reason) {
      onSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 mr-3 rtl:mr-0 rtl:ml-3 text-primary-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'تفاصيل طلب الغياب' : 'Détails de la demande'}
                </h2>
                {selectedDate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedDate.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Sélection enfant */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <Baby className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'الطفل *' : 'Enfant *'}
                </label>
                <select
                  value={selectedChild}
                  onChange={(e) => onChildSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                  required
                  disabled={submitting}
                >
                  <option value="">
                    {isRTL ? 'اختر طفل' : 'Sélectionnez un enfant'}
                  </option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Raison */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <MessageSquare className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'سبب الغياب *' : 'Raison de l\'absence *'}
                </label>
                <select
                  value={reason}
                  onChange={(e) => onReasonChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                  required
                  disabled={submitting}
                >
                  <option value="">
                    {isRTL ? 'اختر سبب' : 'Sélectionnez une raison'}
                  </option>
                  {absenceReasons.map((reasonOption) => (
                    <option key={reasonOption.value} value={reasonOption.value}>
                      {reasonOption.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {isRTL ? 'ملاحظات إضافية' : 'Notes supplémentaires'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={4}
                  placeholder={isRTL ? 'أي معلومات إضافية...' : 'Toute information supplémentaire...'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none transition-colors"
                  disabled={submitting}
                />
              </div>

              {/* Boutons */}
              <div className="flex space-x-3 rtl:space-x-reverse pt-4">
                <Button
                  type="submit"
                  disabled={submitting || !selectedChild || !reason}
                  className="flex-1"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 rtl:mr-0 rtl:ml-2"></div>
                      {isRTL ? 'جاري الإرسال...' : 'Envoi en cours...'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Send className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {isRTL ? 'إرسال الطلب' : 'Envoyer la demande'}
                    </div>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-6"
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AbsenceFormModal;
