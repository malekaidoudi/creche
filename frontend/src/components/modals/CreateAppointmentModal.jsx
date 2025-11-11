import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateAppointmentModal = ({ isOpen, onClose, onSuccess }) => {
  const { isRTL } = useLanguage();
  const [parents, setParents] = useState([]);
  const [formData, setFormData] = useState({
    parent_id: '',
    subject: '',
    description: '',
    proposed_date: '',
    proposed_time: '',
    location: 'Crèche'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadParents();
    }
  }, [isOpen]);

  const loadParents = async () => {
    try {
      const response = await api.get('/api/users?role=parent');
      if (response.data.success) {
        setParents(response.data.users || []);
      }
    } catch (error) {
      console.error('Erreur chargement parents:', error);
      toast.error(isRTL ? 'خطأ في تحميل الآباء' : 'Erreur lors du chargement des parents');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.parent_id || !formData.subject || !formData.proposed_date || !formData.proposed_time) {
      setError(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setLoading(true);
      
      // Combiner date et heure
      const proposedDateTime = `${formData.proposed_date}T${formData.proposed_time}:00`;
      
      const response = await api.post('/api/appointments', {
        parent_id: parseInt(formData.parent_id),
        subject: formData.subject,
        description: formData.description,
        proposed_date: proposedDateTime,
        location: formData.location
      });

      if (response.data.success) {
        toast.success(isRTL ? 'تم إنشاء الموعد بنجاح' : 'Rendez-vous créé avec succès');
        onSuccess?.();
        handleClose();
      } else {
        setError(response.data.error || (isRTL ? 'حدث خطأ' : 'Une erreur est survenue'));
      }
    } catch (error) {
      console.error('Erreur création RDV:', error);
      setError(error.response?.data?.error || (isRTL ? 'حدث خطأ' : 'Erreur lors de la création'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      parent_id: '',
      subject: '',
      description: '',
      proposed_date: '',
      proposed_time: '',
      location: 'Crèche'
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

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
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {isRTL ? 'إنشاء موعد جديد' : 'Créer un rendez-vous'}
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
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Sélection parent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  {isRTL ? 'ولي الأمر' : 'Parent'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">{isRTL ? 'اختر ولي الأمر' : 'Sélectionner un parent'}</option>
                  {parents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.first_name} {parent.last_name} ({parent.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Objet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  {isRTL ? 'الموضوع' : 'Objet'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={isRTL ? 'مثال: مناقشة تقدم الطفل' : 'Ex: Discussion sur le progrès de l\'enfant'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isRTL ? 'تفاصيل إضافية...' : 'Détails supplémentaires...'}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {isRTL ? 'التاريخ المقترح' : 'Date proposée'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.proposed_date}
                  onChange={(e) => setFormData({ ...formData, proposed_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Heure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {isRTL ? 'الوقت المقترح' : 'Heure proposée'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.proposed_time}
                  onChange={(e) => setFormData({ ...formData, proposed_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'المكان' : 'Lieu'}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {isRTL 
                    ? 'سيتم إعلام ولي الأمر بالموعد المقترح وسيتمكن من قبوله أو اقتراح تاريخ آخر.'
                    : 'Le parent sera informé du rendez-vous proposé et pourra l\'accepter ou proposer une autre date.'
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
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isRTL ? 'جاري الإنشاء...' : 'Création...'}</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>{isRTL ? 'إنشاء الموعد' : 'Créer le rendez-vous'}</span>
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

export default CreateAppointmentModal;
