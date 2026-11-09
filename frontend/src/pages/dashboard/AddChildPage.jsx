import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Baby, User, Calendar, AlertTriangle, Save, ArrowLeft, CheckCircle, UserPlus, ArrowRight, FileText, Search, Users, Lock, Sun, Tag, CreditCard, Receipt, Calculator, Info, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useAccess, FEATURES } from '../../access';
import { useDialogContext } from '../../contexts/DialogContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DatePicker from '../../components/ui/DatePicker';
import childrenService from '../../services/childrenService';
import userService from '../../services/userService';
import { convertToISO, calculateAge } from '../../utils/dateUtils';
import DocumentScanner from '../../components/ui/DocumentScanner';
import { uploadToEndpoint } from '../../services/api';
import BillingManagementModal from '../../components/modals/BillingManagementModal';

const AddChildPage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { can } = useAccess();
  const dialog = useDialogContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState([]);
  const [showSuccessInfo, setShowSuccessInfo] = useState(false);
  const [createdChild, setCreatedChild] = useState(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [prorataChoice, setProrataChoice] = useState('prorata'); // 'prorata' | 'full' | 'custom'
  const [customProrataAmount, setCustomProrataAmount] = useState('');
  const [documents, setDocuments] = useState({
    carnet_medical: null,
    acte_naissance: null,
    certificat_medical: null
  });
  const [existingParents, setExistingParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const preselectedParentId = searchParams.get('parentId');
  const isPersonal = searchParams.get('personal') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm();

  // Charger les parents existants (pour admin/staff)
  useEffect(() => {
    const loadParents = async () => {
      if (isPersonal) return;
      try {
        setLoadingParents(true);
        const response = await userService.getAllUsers({ role: 'parent', limit: 200 });
        const users = response.users || response.data?.users || [];
        setExistingParents(users);
      } catch (error) {
        console.error('Erreur chargement parents:', error);
      } finally {
        setLoadingParents(false);
      }
    };
    loadParents();
  }, [isPersonal]);

  // Pré-remplir la date d'inscription avec aujourd'hui et le nom de famille si passé en paramètre
  useEffect(() => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    setValue('enrollment_date', formattedDate);
    setValue('care_schedule', 'full_day');
    const preselectedLastName = searchParams.get('lastName');
    if (preselectedLastName) {
      setValue('last_name', preselectedLastName);
    }
  }, [setValue, searchParams]);

  // Surveillance des champs financiers et date d'inscription
  const watchedCareSchedule = watch('care_schedule') || 'full_day';
  const watchedSaturday = watch('saturday_attendance');
  const watchedMonthlyDiscount = watch('monthly_discount');
  const watchedEnrollmentDate = watch('enrollment_date');

  // Détection et calcul automatique du prorata si l'enfant s'inscrit en cours de mois
  const prorataInfo = useMemo(() => {
    if (!watchedEnrollmentDate) return null;
    let enrollDate;
    if (typeof watchedEnrollmentDate === 'string' && watchedEnrollmentDate.includes('/')) {
      const parts = watchedEnrollmentDate.split('/');
      enrollDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      enrollDate = new Date(watchedEnrollmentDate);
    }
    if (isNaN(enrollDate.getTime())) return null;

    const day = enrollDate.getDate();
    // Si l'enfant commence le 1er du mois, facturation mensuelle classique
    if (day <= 1) return null;

    const year = enrollDate.getFullYear();
    const month = enrollDate.getMonth();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const remainingDays = totalDaysInMonth - day + 1;

    const baseTariff = watchedCareSchedule === 'half_day' ? 100 : 130;
    const calculatedProrata = Math.round((baseTariff / totalDaysInMonth) * remainingDays);

    return {
      day,
      month: month + 1,
      year,
      totalDaysInMonth,
      remainingDays,
      baseTariff,
      calculatedProrata
    };
  }, [watchedEnrollmentDate, watchedCareSchedule]);

  // Tarif de base retenu pour le premier mois selon le choix de l'administrateur
  const effectiveFirstMonthBase = useMemo(() => {
    if (!prorataInfo) {
      return watchedCareSchedule === 'half_day' ? 100 : 130;
    }
    if (prorataChoice === 'prorata') {
      return prorataInfo.calculatedProrata;
    }
    if (prorataChoice === 'full') {
      return prorataInfo.baseTariff;
    }
    if (prorataChoice === 'custom') {
      return parseFloat(customProrataAmount) || 0;
    }
    return prorataInfo.calculatedProrata;
  }, [prorataInfo, prorataChoice, customProrataAmount, watchedCareSchedule]);

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
        medical_info: can(FEATURES.MEDICAL_VIEW) ? (data.medical_info || '') : '',
        parent_id: data.parent_id || null,
        enrollment_date: convertToISO(data.enrollment_date) || new Date().toISOString().split('T')[0],
        saturday_attendance: !!data.saturday_attendance,
        care_schedule: data.care_schedule || 'full_day',
        monthly_discount: parseFloat(data.monthly_discount) || 0,
        first_month_prorata: prorataInfo ? effectiveFirstMonthBase : null,
      };

      const response = await childrenService.createChild(childData);

      if (response.success) {
        const childId = response.child.id;

        // Uploader les documents si présents (utilise uploadToEndpoint générique)
        const docsToUpload = Object.entries(documents).filter(([_, file]) => file !== null);
        if (docsToUpload.length > 0) {
          console.log(`📄 Upload de ${docsToUpload.length} document(s) pour l'enfant #${childId}`);
          for (const [docType, file] of docsToUpload) {
            try {
              await uploadToEndpoint(`/api/documents/children/${childId}`, file, { document_type: docType });
              console.log(`✅ Document ${docType} uploadé`);
            } catch (docError) {
              console.error(`❌ Erreur upload ${docType}:`, docError);
            }
          }
        }

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
      <div className="space-y-6 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] lg:pt-0">
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

              {/* Info Box */}
              <div className={`border rounded-xl p-4 mb-4 ${createdChild.parent_id ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                <h3 className={`font-semibold mb-2 ${createdChild.parent_id ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}`}>
                  {createdChild.parent_id
                    ? (isRTL ? 'تم الربط بنجاح' : 'Association réussie')
                    : (isRTL ? 'الخطوة التالية' : 'Prochaine étape')
                  }
                </h3>
                <p className={`text-sm ${createdChild.parent_id ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}`}>
                  {createdChild.parent_id
                    ? (isRTL
                      ? 'تم تسجيل الطفل وربطه بولي الأمر المختار. يمكنه الآن رؤية الطفل في مساحته.'
                      : 'L\'enfant est inscrit et lié au parent sélectionné. Le parent peut maintenant voir l\'enfant dans son espace.'
                    )
                    : (isRTL
                      ? 'الطفل مسجل بدون حساب ولي أمر. يمكنك الآن إنشاء حساب للوالد وربطه بهذا الطفل.'
                      : 'L\'enfant est inscrit sans compte parent associé. Vous pouvez maintenant créer un compte parent et l\'associer à cet enfant.'
                    )
                  }
                </p>
              </div>

              {/* Billing Alert & Receipt Section (Option B) */}
              {createdChild.parent_id && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 mb-6 text-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                        {isRTL ? 'معلوم التسجيل والشهر الأول (في الانتظار)' : 'Frais d\'inscription & 1ère mensualité (À régler)'}
                      </h4>
                      <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                        {isRTL
                          ? 'تم إنشاء فاتورة التسجيل والشهر الأول تلقائياً بحالة "في الانتظار". يمكنك استخلاص المبلغ الآن وتسليم الوصل للولي، أو تسويته لاحقاً عبر إدارة الاشتراكات.'
                          : 'La cotisation d\'inscription et du premier mois a été générée automatiquement avec le statut "À régler". Vous pouvez encaisser le règlement maintenant et remettre le reçu officiel, ou le faire plus tard.'}
                      </p>
                      <Button
                        onClick={() => setShowBillingModal(true)}
                        className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 px-3.5 shadow-sm inline-flex items-center"
                      >
                        <Receipt className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
                        {isRTL ? 'استخلاص معلوم التسجيل وإصدار الوصل' : 'Encaisser le règlement & Émettre le reçu'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {!createdChild.parent_id && (
                  <Button
                    onClick={() => navigate('/dashboard/add-user', { 
                      state: { 
                        preselectedChild: createdChild, 
                        preselectedRole: 'parent',
                        prefilledLastName: createdChild.last_name 
                      } 
                    })}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'إنشاء حساب ولي أمر' : 'Créer un compte parent'}
                    <ArrowRight className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
                  </Button>
                )}

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
    <div className="space-y-6 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] lg:pt-0">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 rtl:-mr-1 rtl:ml-0 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors lg:hidden shrink-0"
            title={isRTL ? 'رجوع' : 'Retour'}
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
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

        {!isPersonal && (
          <button
            type="button"
            onClick={() => navigate('/dashboard/add-user?role=parent')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-xl border border-primary-200 dark:border-primary-800 transition-colors shadow-2xs shrink-0"
            title={isRTL ? 'الانتقال إلى وضع التسجيل السريع' : 'Passer à l\'enregistrement express'}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            <span>{isRTL ? 'التسجيل السريع' : 'Inscription Express ⚡'}</span>
          </button>
        )}
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

            {/* Section: Parent existant (admin/staff uniquement) */}
            {!isPersonal && (
              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
                {preselectedParentId ? (
                  /* Mode verrouillé : parent pré-sélectionné depuis la page Parents */
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <h3 className="font-semibold text-teal-800 dark:text-teal-300 text-sm">
                        {isRTL ? 'ولي الأمر المختار' : 'Parent sélectionné'}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-medium">
                        {isRTL ? 'مغلق' : 'Verrouillé'}
                      </span>
                    </div>
                    {loadingParents ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <LoadingSpinner size="sm" />
                        {isRTL ? 'جاري التحميل...' : 'Chargement...'}
                      </div>
                    ) : (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-700">
                        <input type="hidden" {...register('parent_id')} value={preselectedParentId} />
                        {(() => {
                          const preselected = existingParents.find(p => String(p.id) === String(preselectedParentId));
                          return preselected ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {preselected.first_name} {preselected.last_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{preselected.email}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</p>
                          );
                        })()}
                      </div>
                    )}
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                      {isRTL
                        ? 'الطفل سيرتبط بهذا الولي مباشرةً. لا يمكن تغييره من هذه الصفحة.'
                        : 'L\'enfant sera lié directement à ce parent. Non modifiable depuis cette page.'
                      }
                    </p>
                  </div>
                ) : (
                  /* Mode libre : aucun parent pré-sélectionné */
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <h3 className="font-semibold text-teal-800 dark:text-teal-300 text-sm">
                        {isRTL ? 'ربط بولي أمر موجود (اختياري)' : 'Associer à un parent existant (optionnel)'}
                      </h3>
                    </div>
                    {loadingParents ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <LoadingSpinner size="sm" />
                        {isRTL ? 'جاري التحميل...' : 'Chargement...'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {existingParents.length > 10 && (
                          <div className="relative">
                            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              value={parentSearch}
                              onChange={(e) => setParentSearch(e.target.value)}
                              placeholder={isRTL ? 'بحث باسم الولي...' : 'Rechercher un parent...'}
                              className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        )}
                        <select
                          {...register('parent_id')}
                          className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors border-gray-300 dark:border-gray-600"
                        >
                          <option value="">
                            {isRTL ? 'لا أحد — سجّل كطفل بدون ولي' : 'Aucun — Enregistrer comme enfant orphelin'}
                          </option>
                          {existingParents
                            .filter(p => {
                              if (!parentSearch) return true;
                              const term = parentSearch.toLowerCase();
                              const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
                              return fullName.includes(term) || p.email?.toLowerCase().includes(term);
                            })
                            .map(parent => (
                              <option key={parent.id} value={parent.id}>
                                {parent.first_name} {parent.last_name} — {parent.email}
                              </option>
                            ))}
                        </select>
                        <p className="text-xs text-teal-700 dark:text-teal-400">
                          {isRTL
                            ? 'إذا اخترت وليًا، سيُربط الطفل بحسابه مباشرة.'
                            : 'Si vous choisissez un parent, l\'enfant sera lié directement à son compte.'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                readOnlyInput={true}
              />
            </div>

            {/* Informations médicales */}
            {can(FEATURES.MEDICAL_VIEW) ? (
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
            ) : (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2.5">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>
                  {isRTL
                    ? 'المعلومات الطبية سرية وتتطلب صلاحية خاصة (medical.view).'
                    : 'Informations médicales confidentielles (réservées au personnel autorisé avec la permission medical.view).'}
                </span>
              </div>
            )}


            {/* Documents (optionnel) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isRTL ? 'المستندات (اختياري)' : 'Documents (optionnel)'}
                </h3>
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
                {isRTL ? 'يمكنك مسح أو تحميل المستندات مباشرة' : 'Vous pouvez numériser ou importer les documents du dossier'}
              </p>
            </div>

            {/* Modalités d'accueil & Tarification */}
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sun className="w-4 h-4 text-primary-600" />
                {isRTL ? 'نظام الحضور والخصم' : 'Modalités d\'accueil & Remise'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Formule d'accueil */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? 'نظام الحضور' : 'Formule d\'accueil'} *
                  </label>
                  <select
                    {...register('care_schedule')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="full_day">☀️ {isRTL ? 'يوم كامل (حتى 18:00)' : 'Journée complète (jusqu\'à 18h00)'}</option>
                    <option value="half_day">🌤️ {isRTL ? 'نصف يوم (خروج أقصاه 13:00)' : 'Demi-journée (départ max 13h00)'}</option>
                  </select>
                </div>

                {/* Remise exceptionnelle fixe */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-primary-600" />
                    {isRTL ? 'تخفيض استثنائي قار (د.ت)' : 'Remise exceptionnelle fixe (DT)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ex: 20"
                    {...register('monthly_discount')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 inline shrink-0" />
                    {isRTL
                      ? 'مبلغ قار يطرح كل شهر بصفة آلية، ويمكن تعديله أو حذفه في أي وقت.'
                      : 'Remise récurrente appliquée chaque mois automatiquement. Modifiable ou supprimable à tout moment.'}
                  </p>
                </div>
              </div>

              {/* Présence le samedi */}
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="dash_saturday_attendance"
                  {...register('saturday_attendance')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="dash_saturday_attendance" className="ml-2 rtl:ml-0 rtl:mr-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  {isRTL ? 'الحضور يوم السبت (+20 د.ت/شهر)' : 'Présence le samedi (+20 DT/mois)'}
                </label>
              </div>

              {/* Encadré d'aide & Choix Prorata en cas d'arrivée en cours de mois */}
              {prorataInfo && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/30 text-start space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 text-xs font-bold">
                      <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>
                        {isRTL
                          ? `تسجيل في وسط الشهر (${prorataInfo.day}/${prorataInfo.month}) — تبقى ${prorataInfo.remainingDays} يوم من أصل ${prorataInfo.totalDaysInMonth}`
                          : `Arrivée en cours de mois (${prorataInfo.day}/${prorataInfo.month}) — Reste ${prorataInfo.remainingDays} j / ${prorataInfo.totalDaysInMonth} j`}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200/70 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold">
                      {isRTL ? 'تعديل معلوم الشهر الأول' : 'Choix du 1er mois'}
                    </span>
                  </div>

                  <p className="text-xs text-blue-800/90 dark:text-blue-300/90">
                    {isRTL
                      ? 'حدد المبلغ المتفق عليه مع الولي بالنسبة للشهر الأول :'
                      : 'Choisissez la formule convenue avec le parent pour ce premier mois :'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* Option 1: Prorata calculé */}
                    <label className={`p-2.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                      prorataChoice === 'prorata'
                        ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-sm ring-1 ring-blue-500'
                        : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="prorata_mode"
                          checked={prorataChoice === 'prorata'}
                          onChange={() => setProrataChoice('prorata')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {isRTL ? 'تناسبي (Prorata)' : 'Prorata calculé'}
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-1.5">
                        {prorataInfo.calculatedProrata} DT
                      </span>
                      <span className="text-[10px] text-gray-500">
                        ({prorataInfo.remainingDays} {isRTL ? 'أيام متبقية' : 'jours restants'})
                      </span>
                    </label>

                    {/* Option 2: Plein mois */}
                    <label className={`p-2.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                      prorataChoice === 'full'
                        ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-sm ring-1 ring-blue-500'
                        : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="prorata_mode"
                          checked={prorataChoice === 'full'}
                          onChange={() => setProrataChoice('full')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {isRTL ? 'شهر كامل' : 'Mois complet'}
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-gray-900 dark:text-white mt-1.5">
                        {prorataInfo.baseTariff} DT
                      </span>
                      <span className="text-[10px] text-gray-500">
                        ({isRTL ? 'معلوم كامل' : 'Tarif plein'})
                      </span>
                    </label>

                    {/* Option 3: Montant personnalisé */}
                    <label className={`p-2.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                      prorataChoice === 'custom'
                        ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-sm ring-1 ring-blue-500'
                        : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="prorata_mode"
                          checked={prorataChoice === 'custom'}
                          onChange={() => setProrataChoice('custom')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {isRTL ? 'مبلغ متفق عليه' : 'Montant convenu'}
                        </span>
                      </div>
                      {prorataChoice === 'custom' ? (
                        <div className="mt-1">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={customProrataAmount}
                            onChange={(e) => setCustomProrataAmount(e.target.value)}
                            placeholder="Ex: 80"
                            className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-bold"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 mt-2 italic">
                          {isRTL ? 'تحديد حر' : 'Saisie libre'}
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Estimation du 1er règlement complet */}
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800/60 flex items-center justify-between text-xs font-medium">
                    <span className="text-blue-900 dark:text-blue-200">
                      {isRTL ? 'المجموع التقديري لأول وصل (معلوم التسجيل 60 د.ت + الشهر الأول - التخفيض) :' : 'Total estimé 1ère facture (60 DT assurance + 1er mois - remise) :'}
                    </span>
                    <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                      {Math.max(0, effectiveFirstMonthBase + (watchedSaturday ? 20 : 0) + 60 - (parseFloat(watchedMonthlyDiscount) || 0)).toFixed(0)} DT
                    </span>
                  </div>
                </div>
              )}
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
      {/* Modale de gestion des cotisations et reçus */}
      <BillingManagementModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
      />
    </div>
  );
};

export default AddChildPage;
