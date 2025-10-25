import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Lock, Save } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import toast from 'react-hot-toast';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const { isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      toast.error(isRTL ? 'كلمة المرور الحالية مطلوبة' : 'Mot de passe actuel requis');
      return false;
    }
    
    if (!formData.newPassword) {
      toast.error(isRTL ? 'كلمة المرور الجديدة مطلوبة' : 'Nouveau mot de passe requis');
      return false;
    }
    
    if (formData.newPassword.length < 6) {
      toast.error(isRTL ? 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(isRTL ? 'كلمات المرور الجديدة غير متطابقة' : 'Les nouveaux mots de passe ne correspondent pas');
      return false;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      toast.error(isRTL ? 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية' : 'Le nouveau mot de passe doit être différent de l\'actuel');
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
      
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Mot de passe changé avec succès');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(result.error || (isRTL ? 'خطأ في تغيير كلمة المرور' : 'Erreur lors du changement de mot de passe'));
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      toast.error(isRTL ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'تغيير كلمة المرور' : 'Changer le mot de passe'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Mot de passe actuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isRTL ? 'أدخل كلمة المرور الحالية' : 'Entrez votre mot de passe actuel'}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isRTL ? 'أدخل كلمة المرور الجديدة' : 'Entrez le nouveau mot de passe'}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isRTL ? 'يجب أن تحتوي على 6 أحرف على الأقل' : 'Minimum 6 caractères'}
              </p>
            </div>

            {/* Confirmer nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le nouveau mot de passe'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isRTL ? 'أعد إدخال كلمة المرور الجديدة' : 'Confirmez le nouveau mot de passe'}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading 
                  ? (isRTL ? 'جاري التغيير...' : 'Changement...') 
                  : (isRTL ? 'تغيير كلمة المرور' : 'Changer le mot de passe')
                }
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ChangePasswordModal;
