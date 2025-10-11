import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Baby, User, Calendar, Phone, AlertTriangle, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import api from '../../config/api';

const AddChildPage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Formatage des données
      const childData = {
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date,
        gender: data.gender,
        medical_info: data.medical_info || '',
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        lunch_assistance: data.lunch_assistance || false,
        enrollment_date: data.enrollment_date,
        parent_id: data.parent_id || null
      };

      const response = await api.post('/children', childData);
      
      toast.success(isRTL ? 'تم إضافة الطفل بنجاح' : 'Enfant ajouté avec succès');
      navigate('/dashboard/children');
    } catch (error) {
      console.error('Erreur ajout enfant:', error);
      toast.error(error.response?.data?.error || (isRTL ? 'خطأ في إضافة الطفل' : 'Erreur lors de l\'ajout'));
    } finally {
      setLoading(false);
    }
  };

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${isRTL ? 'شهر' : 'mois'}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 ? 's' : ''} ${months > 0 ? `${months} ${isRTL ? 'شهر' : 'mois'}` : ''}`;
    }
  };

  const watchedBirthDate = watch('birth_date');

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/children')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'العودة' : 'Retour'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'إضافة طفل جديد' : 'Ajouter un enfant'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isRTL ? 'إدخال معلومات الطفل الجديد' : 'Saisir les informations du nouvel enfant'}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Baby className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'معلومات الطفل' : 'Informations de l\'enfant'}
          </CardTitle>
          <CardDescription>
            {isRTL ? 'جميع الحقول المطلوبة يجب ملؤها' : 'Tous les champs obligatoires doivent être remplis'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الاسم الأول' : 'Prénom'} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    {...register('first_name', { 
                      required: isRTL ? 'الاسم الأول مطلوب' : 'Prénom requis' 
                    })}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={isRTL ? 'أدخل الاسم الأول' : 'Entrez le prénom'}
                  />
                </div>
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                )}
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'اسم العائلة' : 'Nom'} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    {...register('last_name', { 
                      required: isRTL ? 'اسم العائلة مطلوب' : 'Nom requis' 
                    })}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={isRTL ? 'أدخل اسم العائلة' : 'Entrez le nom'}
                  />
                </div>
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date de naissance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'تاريخ الميلاد' : 'Date de naissance'} *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    {...register('birth_date', { 
                      required: isRTL ? 'تاريخ الميلاد مطلوب' : 'Date de naissance requise',
                      validate: (value) => {
                        const birthDate = new Date(value);
                        const today = new Date();
                        const maxDate = new Date();
                        maxDate.setFullYear(today.getFullYear() - 6); // Maximum 6 ans
                        
                        if (birthDate > today) {
                          return isRTL ? 'تاريخ الميلاد لا يمكن أن يكون في المستقبل' : 'La date de naissance ne peut pas être dans le futur';
                        }
                        if (birthDate < maxDate) {
                          return isRTL ? 'الطفل كبير جداً للحضانة' : 'L\'enfant est trop âgé pour la crèche';
                        }
                        return true;
                      }
                    })}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.birth_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {watchedBirthDate && (
                  <p className="text-sm text-gray-500 mt-1">
                    {isRTL ? 'العمر:' : 'Âge:'} {calculateAge(watchedBirthDate)}
                  </p>
                )}
                {errors.birth_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.birth_date.message}</p>
                )}
              </div>

              {/* Sexe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الجنس' : 'Sexe'} *
                </label>
                <select
                  {...register('gender', { 
                    required: isRTL ? 'الجنس مطلوب' : 'Sexe requis' 
                  })}
                  className={`w-full px-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">{isRTL ? 'اختر الجنس' : 'Sélectionner le sexe'}</option>
                  <option value="M">{isRTL ? 'ذكر' : 'Masculin'}</option>
                  <option value="F">{isRTL ? 'أنثى' : 'Féminin'}</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                )}
              </div>

              {/* Date d'inscription */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'تاريخ التسجيل' : 'Date d\'inscription'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    {...register('enrollment_date')}
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Informations médicales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'المعلومات الطبية' : 'Informations médicales'}
              </label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 rtl:left-auto rtl:right-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  {...register('medical_info')}
                  rows={3}
                  className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors border-gray-300 dark:border-gray-600"
                  placeholder={isRTL ? 'الحساسية، الأدوية، ملاحظات طبية...' : 'Allergies, médicaments, notes médicales...'}
                />
              </div>
            </div>

            {/* Contact d'urgence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'اسم جهة الاتصال للطوارئ' : 'Contact d\'urgence'} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    {...register('emergency_contact_name', { 
                      required: isRTL ? 'اسم جهة الاتصال للطوارئ مطلوب' : 'Contact d\'urgence requis' 
                    })}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.emergency_contact_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={isRTL ? 'اسم جهة الاتصال' : 'Nom du contact'}
                  />
                </div>
                {errors.emergency_contact_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'هاتف الطوارئ' : 'Téléphone d\'urgence'} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    {...register('emergency_contact_phone', { 
                      required: isRTL ? 'هاتف الطوارئ مطلوب' : 'Téléphone d\'urgence requis' 
                    })}
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.emergency_contact_phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}
                  />
                </div>
                {errors.emergency_contact_phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_phone.message}</p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('lunch_assistance')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 rtl:ml-0 rtl:mr-2 block text-sm text-gray-700 dark:text-gray-300">
                  {isRTL ? 'مساعدة في الغداء' : 'Assistance pour le déjeuner'}
                </label>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-4 rtl:space-x-reverse pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/children')}
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
                    {isRTL ? 'حفظ' : 'Enregistrer'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddChildPage;
