import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Camera, Save, ArrowLeft, Eye, EyeOff, Shield, Edit3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useProfileImage } from '../../hooks/useProfileImage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();
  const { getImageUrl, hasImage } = useProfileImage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, [user]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const result = await response.json();
      
      if (result.success) {
        updateUser({ ...user, profile_image: result.imageUrl });
        toast.success(isRTL ? 'تم تحديث الصورة' : 'Photo mise à jour');
      } else {
        throw new Error(result.error || 'Erreur upload');
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editMode && !showPasswordSection) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        updateUser(result.user);
        toast.success(isRTL ? 'تم التحديث بنجاح' : 'Profil mis à jour');
        setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
        setEditMode(false);
        setShowPasswordSection(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(error.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = () => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      staff: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      parent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    };
    
    const roleLabels = {
      admin: isRTL ? 'مدير' : 'Administrateur',
      staff: isRTL ? 'موظف' : 'Personnel',
      parent: isRTL ? 'ولي أمر' : 'Parent'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleColors[user?.role] || roleColors.parent}`}>
        <Shield className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
        {roleLabels[user?.role] || roleLabels.parent}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8"
        >
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {isRTL ? 'الملف الشخصي' : 'Mon Profil'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isRTL ? 'إدارة معلوماتك الشخصية' : 'Gérez vos informations personnelles'}
              </p>
            </div>
            {getRoleBadge()}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-white dark:ring-gray-800">
                      {hasImage() ? (
                        <img
                          src={getImageUrl()}
                          alt="Photo de profil"
                          className="w-32 h-32 object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-16 h-16 text-white" />
                      )}
                    </div>
                    <button
                      onClick={() => document.getElementById('photo-upload').click()}
                      className="absolute bottom-2 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {user?.first_name} {user?.last_name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{user?.email}</p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {user?.phone || (isRTL ? 'غير محدد' : 'Non renseigné')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Information Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 dark:text-white flex items-center">
                    <Edit3 className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'المعلومات الشخصية' : 'Informations personnelles'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? (isRTL ? 'إلغاء' : 'Annuler') : (isRTL ? 'تعديل' : 'Modifier')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الاسم الأول' : 'Prénom'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                          disabled={!editMode}
                          className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'اسم العائلة' : 'Nom de famille'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                          disabled={!editMode}
                          className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Adresse email'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={!editMode}
                        className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!editMode}
                        className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Section mot de passe */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Lock className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                        {isRTL ? 'الأمان' : 'Sécurité'}
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                      >
                        {showPasswordSection ? (isRTL ? 'إخفاء' : 'Masquer') : (isRTL ? 'تغيير كلمة المرور' : 'Changer le mot de passe')}
                      </Button>
                    </div>

                    {showPasswordSection && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        <input
                          type="password"
                          placeholder={isRTL ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                          value={formData.current_password}
                          onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <input
                          type="password"
                          placeholder={isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                          value={formData.new_password}
                          onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <input
                          type="password"
                          placeholder={isRTL ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                          value={formData.confirm_password}
                          onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </motion.div>
                    )}
                  </div>

                  {(editMode || showPasswordSection) && (
                    <div className="flex gap-3">
                      <Button type="submit" disabled={loading} className="flex-1">
                        <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {loading ? (isRTL ? 'جاري الحفظ...' : 'Sauvegarde...') : (isRTL ? 'حفظ التغييرات' : 'Sauvegarder')}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
