import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Camera, Save, ArrowLeft, Eye, EyeOff, Shield, Edit3, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import { useProfileImage } from '../hooks/useProfileImage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const UnifiedProfilePage = () => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await api.post('/api/profile/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        updateUser({ ...user, profile_image: response.data.imageUrl });
        toast.success(isRTL ? 'تم تحديث الصورة' : 'Photo mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editMode && !showPasswordSection) return;
    
    if (showPasswordSection && formData.new_password !== formData.confirm_password) {
      toast.error(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.put('/api/profile', formData);
      if (response.data.success) {
        updateUser(response.data.user);
        toast.success(isRTL ? 'تم التحديث بنجاح' : 'Profil mis à jour');
        setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
        setEditMode(false);
        setShowPasswordSection(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6">
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {isRTL ? 'رجوع' : 'Retour'}
          </Button>
          
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {isRTL ? 'الملف الشخصي' : 'Mon Profil'}
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Photo de profil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                {isRTL ? 'الصورة الشخصية' : 'Photo de profil'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {hasImage() ? (
                    <img src={getImageUrl()} alt="Photo de profil" className="w-32 h-32 object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.first_name} {user?.last_name}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user?.role === 'admin' ? (isRTL ? 'مدير' : 'Administrateur') :
                   user?.role === 'staff' ? (isRTL ? 'موظف' : 'Personnel') :
                   (isRTL ? 'ولي أمر' : 'Parent')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {isRTL ? 'المعلومات الشخصية' : 'Informations personnelles'}
                  </CardTitle>
                  
                  {!editMode && !showPasswordSection && (
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      {isRTL ? 'تعديل' : 'Modifier'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'الاسم الأول' : 'Prénom'}
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!editMode ? 'opacity-60' : ''}`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'اسم العائلة' : 'Nom'}
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!editMode ? 'opacity-60' : ''}`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'البريد الإلكتروني' : 'Email'}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!editMode ? 'opacity-60' : ''}`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} ${!editMode ? 'opacity-60' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Section changement de mot de passe */}
                  {!showPasswordSection && editMode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPasswordSection(true)}
                      className="flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      {isRTL ? 'تغيير كلمة المرور' : 'Changer le mot de passe'}
                    </Button>
                  )}

                  {showPasswordSection && (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isRTL ? 'تغيير كلمة المرور' : 'Changer le mot de passe'}
                      </h3>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {isRTL ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
                        </label>
                        <input
                          type="password"
                          name="current_password"
                          value={formData.current_password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                        </label>
                        <input
                          type="password"
                          name="new_password"
                          value={formData.new_password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {isRTL ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                        </label>
                        <input
                          type="password"
                          name="confirm_password"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  {(editMode || showPasswordSection) && (
                    <div className="flex gap-4">
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {isRTL ? 'حفظ' : 'Sauvegarder'}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setShowPasswordSection(false);
                          setFormData({
                            first_name: user?.first_name || '',
                            last_name: user?.last_name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            current_password: '',
                            new_password: '',
                            confirm_password: ''
                          });
                        }}
                      >
                        {isRTL ? 'إلغاء' : 'Annuler'}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedProfilePage;
