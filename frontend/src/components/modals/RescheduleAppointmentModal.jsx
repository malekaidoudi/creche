import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import DatePicker from '../ui/DatePicker';
import { convertToISO, convertFromISO } from '../../utils/dateUtils';
import { getNextWorkingDayFormatted, fetchHolidays, isWorkingDay } from '../../utils/workingDays';

const RescheduleAppointmentModal = ({ isOpen, onClose, appointment, onSuccess }) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [formData, setFormData] = useState({
    new_date: '',
    new_time: '10:00'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [dateError, setDateError] = useState('');

  // Charger les jours fériés au montage
  useEffect(() => {
    fetchHolidays().then(setHolidays);
  }, []);

  // Initialiser avec la date proposée actuelle ou le prochain jour ouvré
  React.useEffect(() => {
    if (appointment && appointment.proposed_date) {
      const date = new Date(appointment.proposed_date);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().slice(0, 5);
      setFormData({
        new_date: convertFromISO(dateStr),
        new_time: timeStr
      });
    } else if (isOpen) {
      // Si pas de date existante, utiliser le prochain jour ouvré
      getNextWorkingDayFormatted().then(date => {
        setFormData(prev => ({ ...prev, new_date: date }));
      });
    }
  }, [appointment, isOpen]);

  // Valider si la date sélectionnée est un jour ouvrable
  const validateDate = (dateStr) => {
    if (!dateStr) {
      setDateError('');
      return true;
    }

    // Convertir dd/mm/yyyy en Date
    const [day, month, year] = dateStr.split('/');
    const date = new Date(year, month - 1, day);

    if (!isWorkingDay(date, holidays)) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setDateError(isRTL
          ? 'لا يمكن اختيار يوم السبت أو الأحد. يرجى اختيار يوم عمل.'
          : 'Vous ne pouvez pas choisir un samedi ou dimanche. Veuillez sélectionner un jour ouvrable.'
        );
      } else {
        setDateError(isRTL
          ? 'هذا اليوم هو عطلة رسمية. يرجى اختيار يوم عمل آخر.'
          : 'Ce jour est un jour férié ou une période de vacances. Veuillez choisir un autre jour ouvrable.'
        );
      }
      return false;
    }

    setDateError('');
    return true;
  };

  // Valider la date quand elle change
  const handleDateChange = (value) => {
    setFormData({ ...formData, new_date: value });
    validateDate(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.new_date || !formData.new_time) {
      setError(isRTL ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs');
      return;
    }

    // Valider que c'est un jour ouvrable
    if (!validateDate(formData.new_date)) {
      return;
    }

    try {
      setLoading(true);

      // Combiner date et heure
      const isoDate = convertToISO(formData.new_date);
      const newDateTime = `${isoDate}T${formData.new_time}:00`;

      const response = await api.patch(`/api/appointments/${appointment.id}/reschedule`, {
        new_date: newDateTime
      });

      if (response.data.success) {
        dialog.success(isRTL ? 'تم إرسال الاقتراح بنجاح' : 'Rendez-vous reporté avec succès');
        onSuccess?.();
        handleClose();
      } else {
        setError(response.data.error || (isRTL ? 'حدث خطأ' : 'Une erreur est survenue'));
      }
    } catch (error) {
      console.error('Erreur proposition date:', error);
      dialog.error(isRTL ? 'حدث خطأ' : 'Erreur lors de la proposition');
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="p-2 bg-white/20 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-white leading-tight break-words">
                  {isRTL ? 'اقتراح تاريخ آخر' : 'Proposer une autre date'}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors shrink-0"
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
                <DatePicker
                  label={isRTL ? 'التاريخ الجديد' : 'Nouvelle date'}
                  required
                  value={formData.new_date}
                  onChange={handleDateChange}
                  error={dateError}
                />
                {dateError && (
                  <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{dateError}</p>
                  </div>
                )}
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

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>{isRTL ? 'ملاحظة:' : 'Note :'}</strong>{' '}
                  {isRTL
                    ? 'يرجى اختيار يوم عمل فقط (من الاثنين إلى الجمعة، باستثناء العطل الرسمية).'
                    : 'Veuillez choisir uniquement un jour ouvrable (du lundi au vendredi, hors jours fériés et vacances).'
                  }
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                disabled={loading || !!dateError}
                className="px-3 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></div>
                    <span className="text-xs sm:text-base">
                      {isRTL ? 'جاري الإرسال...' : 'Envoi...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="text-xs sm:text-base">
                      {isRTL ? 'إرسال الاقتراح' : 'Envoyer la proposition'}
                    </span>
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
