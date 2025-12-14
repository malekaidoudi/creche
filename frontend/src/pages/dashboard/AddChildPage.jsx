import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Baby, User, Calendar, Phone, AlertTriangle, Save, ArrowLeft, CheckCircle, UserPlus, ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DatePicker from '../../components/ui/DatePicker';
import childrenService from '../../services/childrenService';
import { convertToISO, calculateAge } from '../../utils/dateUtils';
import DocumentScanner from '../../components/ui/DocumentScanner';

const AddChildPage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState([]);
  const [showSuccessInfo, setShowSuccessInfo] = useState(false);
  const [createdChild, setCreatedChild] = useState(null);
  const [documents, setDocuments] = useState({
    carnet_medical: null,
    acte_naissance: null,
    certificat_medical: null
  });

  // Détection mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isPersonal = searchParams.get('personal') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm();

  // Pré-remplir la date d'inscription avec aujourd'hui
  useEffect(() => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    setValue('enrollment_date', formattedDate);
  }, [setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Formatage des données
      // Workflow: L'enfant est créé avec statut "enrolled" (inscrit)
      // et sans parent_id (orphelin) - sera associé plus tard
      const childData = {
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: convertToISO(data.birth_date), // Convertir dd/mm/yyyy → yyyy-mm-dd
        gender: data.gender,
        medical_info: data.medical_info || '',
        // Contact d'urgence sera défini lors de la création du compte parent
        // Pas de parent_id = enfant orphelin
        // enrollment_status = 'enrolled' par défaut dans la DB
      };

      const response = await childrenService.createChild(childData);

      if (response.success) {
        // Afficher les informations de succès avec instructions
        setCreatedChild(response.child);
        setShowSuccessInfo(true);
        dialog.success(isRTL ? 'تم إضافة الطفل بنجاح' : 'Enfant inscrit avec succès');
      } else {
        dialog.error(response.error || (isRTL ? 'خطأ في إضافة الطفل' : 'Erreur lors de l\'ajout'));
      }
    } catch (error) {
      console.error('Erreur ajout enfant:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في إضافة الطفل' : 'Erreur lors de l\'ajout'));
    } finally {
      setLoading(false);
    }
  };

  // Utiliser la fonction calculateAge de dateUtils

  const watchedBirthDate = watch('birth_date');

  // Si l'enfant a été créé avec succès, afficher les instructions
  if (showSuccessInfo && createdChild) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              {/* Icône de succès */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'تم تسجيل الطفل بنجاح!' : 'Enfant inscrit avec succès !'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  <strong>{createdChild.first_name} {createdChild.last_name}</strong>
                  {isRTL ? ' مسجل الآن في الحضانة' : ' est maintenant inscrit(e) à la crèche'}
                </p>
              </div>

              {/* Info Box - Enfant orphelin */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  {isRTL ? 'الخطوة التالية' : 'Prochaine étape'}
                </h3>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  {isRTL
                    ? 'الطفل مسجل بدون حساب ولي أمر. يمكنك الآن إنشاء حساب للوالد وربطه بهذا الطفل.'
                    : 'L\'enfant est inscrit sans compte parent associé. Vous pouvez maintenant créer un compte parent et l\'associer à cet enfant.'
                  }
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/dashboard/add-user', { state: { preselectedChild: createdChild, preselectedRole: 'parent' } })}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'إنشاء حساب ولي أمر' : 'Créer un compte parent'}
                  <ArrowRight className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSuccessInfo(false);
                      setCreatedChild(null);
                    }}
                    className="flex-1"
                  >
                    <Baby className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'إضافة طفل آخر' : 'Ajouter un autre enfant'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard/children')}
                    className="flex-1"
                  >
                    {isRTL ? 'العودة للقائمة' : 'Retour à la liste'}
                  </Button>
                </div>
              </div>

              {/* Note */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                {isRTL
                  ? 'يمكن للوالد أيضًا إنشاء حسابه بنفسه من صفحة التسجيل على الموقع'
                  : 'Le parent peut aussi créer son compte lui-même depuis la page d\'inscription du site'
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isPersonal ?
                (isRTL ? 'إضافة طفلي' : 'Ajouter mon enfant') :
                (isRTL ? 'إضافة طفل جديد' : 'Inscrire un enfant')
              }
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isPersonal ?
                (isRTL ? 'إدخال معلومات طفلي الشخصي' : 'Saisir les informations de mon enfant personnel') :
                (isRTL ? 'إدخال معلومات الطفل الجديد' : 'L\'enfant sera inscrit directement (statut: inscrit)')
              }
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
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                    className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                <DatePicker
                  label={isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}
                  title={isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}
                  required
                  value={watchedBirthDate}
                  onChange={(value) => setValue('birth_date', value)}
                  error={errors.birth_date?.message}
                />
                {watchedBirthDate && (
                  <p className="text-sm text-gray-500 mt-1">
                    {isRTL ? 'العمر:' : 'Âge:'} {calculateAge(watchedBirthDate, isRTL)}
                  </p>
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
                  className={`w-full px-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
              <DatePicker
                label={isRTL ? 'تاريخ التسجيل' : 'Date d\'inscription'}
                title={isRTL ? 'تاريخ التسجيل' : 'Date d\'inscription'}
                value={watch('enrollment_date')}
                onChange={(value) => setValue('enrollment_date', value)}
              />
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


            {/* Documents (optionnel - scanner sur mobile) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isRTL ? 'المستندات (اختياري)' : 'Documents (optionnel)'}
                </h3>
                {isMobile && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    {isRTL ? 'المسح متاح' : 'Scan disponible'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DocumentScanner
                  label={isRTL ? 'الدفتر الصحي' : 'Carnet médical'}
                  onCapture={(file) => setDocuments(d => ({ ...d, carnet_medical: file }))}
                  onRemove={() => setDocuments(d => ({ ...d, carnet_medical: null }))}
                />
                <DocumentScanner
                  label={isRTL ? 'شهادة الميلاد' : 'Acte de naissance'}
                  onCapture={(file) => setDocuments(d => ({ ...d, acte_naissance: file }))}
                  onRemove={() => setDocuments(d => ({ ...d, acte_naissance: null }))}
                />
                <DocumentScanner
                  label={isRTL ? 'الشهادة الطبية' : 'Certificat médical'}
                  onCapture={(file) => setDocuments(d => ({ ...d, certificat_medical: file }))}
                  onRemove={() => setDocuments(d => ({ ...d, certificat_medical: null }))}
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isMobile
                  ? (isRTL ? 'يمكنك مسح المستندات مباشرة باستخدام كاميرا هاتفك' : 'Vous pouvez scanner les documents directement avec la caméra de votre téléphone')
                  : (isRTL ? 'يمكنك تحميل المستندات من جهازك' : 'Vous pouvez télécharger les documents depuis votre appareil')
                }
              </p>
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
