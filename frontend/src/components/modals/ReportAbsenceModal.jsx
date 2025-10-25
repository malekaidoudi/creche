import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle, Save } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import toast from 'react-hot-toast';

const ReportAbsenceModal = ({ isOpen, onClose, onSuccess, children = [] }) => {
  const { isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    child_id: '',
    absence_date: '',
    reason: 'Autre',
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  const reasons = [
    { value: 'Maladie', label: isRTL ? 'مرض' : 'Maladie' },
    { value: 'Rendez-vous médical', label: isRTL ? 'موعد طبي' : 'Rendez-vous médical' },
    { value: 'Voyage', label: isRTL ? 'سفر' : 'Voyage' },
    { value: 'Événement familial', label: isRTL ? 'حدث عائلي' : 'Événement familial' },
    { value: 'Autre', label: isRTL ? 'أخرى' : 'Autre' }
  ];

  useEffect(() => {
    if (isOpen && children.length > 0) {
      setFormData({
        child_id: children[0].id,
        absence_date: '',
        reason: 'Autre',
        comment: ''
      });
    }
  }, [isOpen, children]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.child_id) {
      toast.error(isRTL ? 'يرجى اختيار طفل' : 'Veuillez sélectionner un enfant');
      return false;
    }
    
    if (!formData.absence_date) {
      toast.error(isRTL ? 'يرجى اختيار تاريخ الغياب' : 'Veuillez sélectionner la date d\'absence');
      return false;
    }
    
    // Vérifier que la date n'est pas dans le passé (sauf aujourd'hui)
    const today = new Date();
    const selectedDate = new Date(formData.absence_date);
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error(isRTL ? 'لا يمكن الإبلاغ عن غياب في الماضي' : 'Impossible de signaler une absence dans le passé');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/absences/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isRTL ? 'تم الإبلاغ عن الغياب بنجاح' : 'Absence signalée avec succès');
        setFormData({
          child_id: children.length > 0 ? children[0].id : '',
          absence_date: '',
          reason: 'Autre',
          comment: ''
        });
        onSuccess && onSuccess(result.absence);
        onClose();
      } else {
        toast.error(result.error || (isRTL ? 'خطأ في الإبلاغ عن الغياب' : 'Erreur lors du signalement'));
      }
    } catch (error) {
      console.error('Erreur signalement absence:', error);
      toast.error(isRTL ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      child_id: children.length > 0 ? children[0].id : '',
      absence_date: '',
      reason: 'Autre',
      comment: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isRTL ? 'إبلاغ عن غياب' : 'Signaler une absence'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Sélection enfant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'الطفل' : 'Enfant'}
              </label>
              <select
                value={formData.child_id}
                onChange={(e) => handleInputChange('child_id', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date d'absence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'تاريخ الغياب' : 'Date d\'absence'}
              </label>
              <input
                type="date"
                value={formData.absence_date}
                onChange={(e) => handleInputChange('absence_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Raison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'سبب الغياب' : 'Raison de l\'absence'}
              </label>
              <select
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'تعليق (اختياري)' : 'Commentaire (optionnel)'}
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={isRTL ? 'أضف تفاصيل إضافية...' : 'Ajoutez des détails supplémentaires...'}
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading 
                  ? (isRTL ? 'جاري الإبلاغ...' : 'Signalement...') 
                  : (isRTL ? 'إبلاغ عن الغياب' : 'Signaler l\'absence')
                }
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReportAbsenceModal;
