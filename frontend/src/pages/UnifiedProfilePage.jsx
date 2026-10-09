import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Camera, Save, ArrowLeft, Eye, EyeOff, Shield, Edit3, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import useIsMobile from '../hooks/useIsMobile';
import api from '../services/api';
import { useDialogContext } from '../contexts/DialogContext';
import { useProfileImage } from '../hooks/useProfileImage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MobileNavigation from '../components/mobile/MobileNavigation';

const UnifiedProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const { getImageUrl, hasImage, refreshImage } = useProfileImage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const fileInputRef = useRef(null);

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation de la taille du fichier (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      dialog.error(isRTL ? 'الملف كبير جداً (5 ميجا كحد أقصى)' : 'Fichier trop volumineux (5MB max)');
      return;
    }

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      dialog.error(isRTL ? 'يجب أن يكون الملف صورة' : 'Le fichier doit être une image');
      return;
    }

    try {
      setLoading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      console.log('📤 Upload - Fichier:', file);
      console.log('📤 Upload - FormData entries:', Array.from(uploadFormData.entries()));

      // Ne pas spécifier Content-Type pour multipart/form-data
      // Le navigateur le définira automatiquement avec le boundary
      const response = await api.post('/api/profile/upload', uploadFormData);

      if (response.data.success) {
        // Mettre à jour l'utilisateur avec la nouvelle image
        updateUser(response.data.user);
        // Forcer le rechargement de l'image
        refreshImage();
        dialog.success(isRTL ? 'تم تحديث الصورة بنجاح' : 'Photo mise à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      const errorMessage = error.response?.data?.error ||
        (isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement des données');
      dialog.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editMode && !showPasswordSection) return;

    // Validation des mots de passe
    if (showPasswordSection) {
      if (!formData.current_password) {
        dialog.error(isRTL ? 'كلمة المرور الحالية مطلوبة' : 'Mot de passe actuel requis');
        return;
      }

      if (!formData.new_password) {
        dialog.error(isRTL ? 'كلمة المرور الجديدة مطلوبة' : 'Nouveau mot de passe requis');
        return;
      }

      if (formData.new_password.length < 6) {
        dialog.error(isRTL ? 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      if (formData.new_password !== formData.confirm_password) {
        dialog.error(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
        return;
      }
    }

    // Validation des champs obligatoires
    if (editMode) {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        dialog.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis');
        return;
      }
    }

    setLoading(true);
    try {
      // Préparer les données à envoyer (seulement les champs non vides)
      const dataToSend = {};

      if (editMode) {
        if (formData.first_name) dataToSend.first_name = formData.first_name;
        if (formData.last_name) dataToSend.last_name = formData.last_name;
        if (formData.email) dataToSend.email = formData.email;
        if (formData.phone) dataToSend.phone = formData.phone;
      }

      if (showPasswordSection) {
        if (formData.current_password) dataToSend.current_password = formData.current_password;
        if (formData.new_password) dataToSend.new_password = formData.new_password;
        if (formData.confirm_password) dataToSend.confirm_password = formData.confirm_password;
      }

      console.log('📝 Données envoyées:', dataToSend);

      const response = await api.put('/api/profile', dataToSend);
      if (response.data.success) {
        // Mettre à jour l'utilisateur dans le contexte
        updateUser(response.data.user);

        // Réinitialiser les champs de mot de passe
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));

        // Désactiver les modes d'édition
        setEditMode(false);
        setShowPasswordSection(false);

        // Message de succès
        dialog.success(isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profil mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      const errorMessage = error.response?.data?.error ||
        (isRTL ? 'خطأ في تحديث الملف الشخصي' : 'Erreur lors de la mise à jour du profil');
      dialog.error(errorMessage);
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
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} ${isMobile ? 'pb-24' : ''}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          {/* Bouton retour masqué sur mobile */}
          {!isMobile && (
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              {isRTL ? 'رجوع' : 'Retour'}
            </Button>
          )}

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
                <Camera className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                {isRTL ? 'الصورة الشخصية' : 'Photo de profil'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {/* Input file caché */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Avatar centré avec bouton icône caméra moderne */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative inline-block group">
                  {/* Cercle Avatar principal */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 border-4 border-white dark:border-gray-800 shadow-md ring-2 ring-primary-100 dark:ring-primary-900/40 flex items-center justify-center cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:ring-primary-400 dark:group-hover:ring-primary-500 relative"
                    title={isRTL ? 'انقر لتغيير الصورة' : 'Cliquer pour changer la photo'}
                  >
                    {hasImage() ? (
                      <img
                        src={getImageUrl()}
                        alt={isRTL ? 'صورة الملف الشخصي' : 'Photo de profil'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <User className="w-14 h-14" />
                      </div>
                    )}

                    {/* Overlay au survol */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white cursor-pointer">
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 drop-shadow" strokeWidth={2.2} />
                      <span className="text-[10px] font-semibold tracking-wider uppercase drop-shadow">
                        {isRTL ? 'تغيير' : 'Changer'}
                      </span>
                    </div>
                  </div>

                  {/* Badge Icône Caméra moderne flottant en bas */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={loading}
                    aria-label={isRTL ? 'تغيير الصورة' : 'Modifier la photo'}
                    title={isRTL ? 'تغيير الصورة' : 'Modifier la photo'}
                    className={`absolute bottom-0 ${isRTL ? '-left-1' : '-right-1'} z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full aspect-square flex-shrink-0 bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg ring-3 ring-white dark:ring-gray-800 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50`}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
                    ) : (
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" strokeWidth={2.2} />
                    )}
                  </button>
                </div>

                {/* Bouton d'action et libellés sous la photo */}
                <div className="text-center mt-3 space-y-1">
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200 dark:border-primary-800/80 shadow-xs transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" strokeWidth={2.2} />
                      <span>{isRTL ? 'تغيير الصورة' : 'Changer la photo'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {isRTL ? 'JPG, PNG أو WEBP حتى 5MB' : 'JPG, PNG ou WEBP jusqu\'à 5MB'}
                  </p>
                </div>
              </div>

              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {user?.first_name} {user?.last_name}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user?.role === 'admin' ? (isRTL ? 'المدير' : 'Directeur') :
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
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            name="current_password"
                            value={formData.current_password}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 pr-12 rtl:pr-4 rtl:pl-12 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 pr-12 rtl:pr-4 rtl:pl-12 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {isRTL ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2 pr-12 rtl:pr-4 rtl:pl-12 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
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

      {/* Navigation mobile */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default UnifiedProfilePage;
