import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RescheduleAppointmentModal = ({ isOpen, onClose, appointment, onSuccess }) => {
  const { isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    new_date: '',
    new_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialiser avec la date proposée actuelle
  React.useEffect(() => {
    if (appointment && appointment.proposed_date) {
      const date = new Date(appointment.proposed_date);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().slice(0, 5);
      setFormData({
        new_date: dateStr,
        new_time: timeStr
      });
    }
  }, [appointment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.new_date || !formData.new_time) {
      setError(isRTL ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      
      // Combiner date et heure
      const newDateTime = `${formData.new_date}T${formData.new_time}:00`;
      
      const response = await api.patch(`/api/appointments/${appointment.id}/reschedule`, {
        new_date: newDateTime
      });

      if (response.data.success) {
        toast.success(isRTL ? 'تم إرسال الاقتراح بنجاح' : 'Nouvelle date proposée avec succès');
        onSuccess?.();
        handleClose();
      } else {
        setError(response.data.error || (isRTL ? 'حدث خطأ' : 'Une erreur est survenue'));
      }
    } catch (error) {
      console.error('Erreur proposition date:', error);
      setError(error.response?.data?.error || (isRTL ? 'حدث خطأ' : 'Erreur lors de la proposition'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ new_date: '', new_time: '' });
    setError('');
    onClose();
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {isRTL ? 'اقتراح تاريخ آخر' : 'Proposer une autre date'}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Info RDV actuel */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {isRTL ? 'الموعد الحالي' : 'Rendez-vous actuel'}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                <strong>{isRTL ? 'الموضوع:' : 'Objet:'}</strong> {appointment.subject}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{isRTL ? 'التاريخ المقترح:' : 'Date proposée:'}</strong>{' '}
                {new Date(appointment.proposed_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Nouvelle date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {isRTL ? 'التاريخ الجديد' : 'Nouvelle date'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.new_date}
                  onChange={(e) => setFormData({ ...formData, new_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Nouvelle heure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {isRTL ? 'الوقت الجديد' : 'Nouvelle heure'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.new_time}
                  onChange={(e) => setFormData({ ...formData, new_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {isRTL 
                    ? 'سيتم إعلام الإدارة بالتاريخ الجديد المقترح وسيتم الرد عليك قريبًا.'
                    : 'L\'administration sera informée de votre proposition et vous répondra prochainement.'
                  }
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={loading}
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isRTL ? 'جاري الإرسال...' : 'Envoi...'}</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>{isRTL ? 'إرسال الاقتراح' : 'Envoyer la proposition'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RescheduleAppointmentModal;
