import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Camera, Save, Edit, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import userService from '../../services/userService';
import API_CONFIG from '../../config/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  });

  // Fonction pour charger le profil depuis l'API
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      if (response.user) {
        const userData = response.user;
        reset({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
        setProfileImage(userData.profile_image || '');
        updateUser(userData); // Mettre à jour le contexte
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error(isRTL ? 'خطأ في تحميل الملف الشخصي' : 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      setProfileImage(user.profile_image || '');
    } else {
      // Si pas d'utilisateur en contexte, charger depuis l'API
      loadProfile();
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await userService.updateProfile(data);
      
      // Mettre à jour le contexte utilisateur
      if (response.user) {
        updateUser(response.user);
      }
      
      toast.success(isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profil mis à jour avec succès');
      setEditing(false);
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في تحديث الملف الشخصي' : 'Erreur lors de la mise à jour'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error(isRTL ? 'يرجى اختيار صورة صالحة' : 'Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)' : 'Image trop volumineuse (5MB max)');
      return;
    }

    setUploading(true);
    try {
      const response = await userService.uploadProfileImage(file);

      if (response.success) {
        const newImagePath = response.profile_image;
        setProfileImage(newImagePath);
        
        // Mettre à jour le contexte utilisateur
        if (response.user) {
          updateUser(response.user);
        }
        
        toast.success(isRTL ? 'تم تحديث صورة الملف الشخصي بنجاح' : 'Photo de profil mise à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في رفع الصورة' : 'Erreur lors de l\'upload'));
    } finally {
      setUploading(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: isRTL ? 'مدير' : 'Administrateur',
      staff: isRTL ? 'موظف' : 'Personnel',
      parent: isRTL ? 'ولي أمر' : 'Parent'
    };
    return roles[role] || role;
  };

  // Fonction pour rafraîchir le profil
  const handleRefresh = () => {
    loadProfile();
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'الملف الشخصي' : 'Mon Profil'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'إدارة معلوماتك الشخصية' : 'Gérez vos informations personnelles'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 ${loading ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Actualiser'}
          </Button>
          
          <Button
            onClick={() => setEditing(!editing)}
            variant={editing ? 'outline' : 'default'}
          >
            <Edit className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {editing ? (isRTL ? 'إلغاء' : 'Annuler') : (isRTL ? 'تعديل' : 'Modifier')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo de profil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isRTL ? 'صورة الملف الشخصي' : 'Photo de profil'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {profileImage ? (
                  <img
                    src={`${API_CONFIG.BASE_URL}${profileImage}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              {editing && (
                <label className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            
            {uploading && (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-600">
                  {isRTL ? 'جاري الرفع...' : 'Upload en cours...'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations personnelles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {isRTL ? 'المعلومات الشخصية' : 'Informations personnelles'}
            </CardTitle>
            <CardDescription>
              {isRTL ? 'معلوماتك الأساسية' : 'Vos informations de base'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'الاسم الأول' : 'Prénom'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register('first_name', { 
                        required: isRTL ? 'الاسم الأول مطلوب' : 'Prénom requis' 
                      })}
                      disabled={!editing}
                      className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        !editing ? 'cursor-not-allowed opacity-60' : ''
                      } ${errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                  )}
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'اسم العائلة' : 'Nom'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register('last_name', { 
                        required: isRTL ? 'اسم العائلة مطلوب' : 'Nom requis' 
                      })}
                      disabled={!editing}
                      className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                        !editing ? 'cursor-not-allowed opacity-60' : ''
                      } ${errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                  </div>
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    {...register('email', { 
                      required: isRTL ? 'البريد الإلكتروني مطلوب' : 'Email requis',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: isRTL ? 'بريد إلكتروني غير صحيح' : 'Email invalide'
                      }
                    })}
                    disabled={!editing}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      !editing ? 'cursor-not-allowed opacity-60' : ''
                    } ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    {...register('phone')}
                    disabled={!editing}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      !editing ? 'cursor-not-allowed opacity-60' : ''
                    } ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Rôle (lecture seule) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الدور' : 'Rôle'}
                </label>
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300">
                  {getRoleLabel(user?.role)}
                </div>
              </div>

              {editing && (
                <div className="flex justify-end space-x-4 rtl:space-x-reverse">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      reset();
                    }}
                  >
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {isRTL ? 'حفظ' : 'Sauvegarder'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
