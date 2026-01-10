import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import { useDialogContext } from '../../contexts/DialogContext'
import { Baby, User, Calendar, Phone, FileText, Send, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Utensils, Heart, Upload, Download, Mail, Lock, Eye, EyeOff, Search, X, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import DocumentUpload from '../../components/ui/DocumentUpload'
import DatePicker from '../../components/ui/DatePicker'
import api from '../../services/api'
import { convertToISO } from '../../utils/dateUtils'
import userWorkflowService from '../../services/userWorkflowService'
import { getNextWorkingDayFormatted } from '../../utils/workingDays'

const EnrollmentPage = () => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Mode: 'parent' pour création compte parent (enfant déjà inscrit), sinon nouvelle inscription
  const isParentMode = searchParams.get('mode') === 'parent'

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [regulationScrolled, setRegulationScrolled] = useState(false)
  const regulationRef = useRef(null)
  const [hasDifferentEmergencyContact, setHasDifferentEmergencyContact] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // États pour mode parent (recherche enfant)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedChild, setSelectedChild] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [childSearchQuery, setChildSearchQuery] = useState('')
  const [childSearchError, setChildSearchError] = useState('')
  const [createdUser, setCreatedUser] = useState(null)

  // États pour les documents
  const [documents, setDocuments] = useState({
    carnet_medical: null,
    acte_naissance: null,
    certificat_medical: null
  })
  const [documentErrors, setDocumentErrors] = useState({})

  // États pour la vérification d'email
  const [emailCheckResult, setEmailCheckResult] = useState(null)
  const [emailCheckLoading, setEmailCheckLoading] = useState(false)

  // États pour la vérification d'enfant (étape 1)
  const [childCheckResult, setChildCheckResult] = useState(null)
  const [childCheckLoading, setChildCheckLoading] = useState(false)

  // Redirection pour les utilisateurs connectés
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'parent') {
        // Rediriger les parents vers leur espace
        navigate('/mon-espace', { replace: true });
      } else if (user.role === 'admin' || user.role === 'staff') {
        // Rediriger le staff vers le dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm()

  // Initialiser la date d'inscription souhaitée au prochain jour ouvré
  useEffect(() => {
    getNextWorkingDayFormatted().then(date => {
      setValue('enrollment_date', date);
    });
  }, [setValue]);

  // Si l'utilisateur est connecté, afficher un message de redirection
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {isRTL ? 'جاري التوجيه...' : 'Redirection en cours...'}
          </p>
        </div>
      </div>
    );
  }

  // ==================== FONCTIONS MODE PARENT ====================

  const handleSearchChild = async () => {
    if (!childSearchQuery.trim()) {
      setChildSearchError(isRTL ? 'أدخل اسم طفلك' : 'Entrez le nom de votre enfant')
      return
    }

    setSearchLoading(true)
    setChildSearchError('')
    setSelectedChild(null)
    setSearchResults([])

    try {
      const response = await userWorkflowService.getOrphanChildren(childSearchQuery.trim())

      if (response.success && response.children && response.children.length > 0) {
        // Toujours afficher la liste pour que le parent sélectionne son enfant
        setSearchResults(response.children)
      } else {
        setChildSearchError(
          isRTL
            ? 'لم يتم العثور على طفلك. تأكد من أن طفلك مسجل في الحضانة أو اتصل بالإدارة.'
            : 'Votre enfant n\'a pas été trouvé. Vérifiez que votre enfant est bien inscrit à la crèche ou contactez l\'administration.'
        )
      }
    } catch (error) {
      console.error('Erreur recherche enfant:', error)
      setChildSearchError(isRTL ? 'خطأ في البحث. حاول مرة أخرى.' : 'Erreur lors de la recherche.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectChild = (child) => {
    setSelectedChild(child)
    setSearchResults([])
  }

  const handleParentSubmit = async (data) => {
    // Validation
    if (!selectedChild) {
      dialog.error(isRTL ? 'يجب البحث عن طفلك' : 'Vous devez rechercher votre enfant')
      return
    }
    if (!data.parent_first_name?.trim()) {
      dialog.error(isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis')
      return
    }
    if (!data.parent_last_name?.trim()) {
      dialog.error(isRTL ? 'اسم العائلة مطلوب' : 'Le nom est requis')
      return
    }
    if (!data.parent_email?.trim() || !/\S+@\S+\.\S+/.test(data.parent_email)) {
      dialog.error(isRTL ? 'البريد الإلكتروني غير صحيح' : 'Email invalide')
      return
    }
    if (!data.parent_phone?.trim()) {
      dialog.error(isRTL ? 'رقم الهاتف مطلوب' : 'Le téléphone est requis')
      return
    }
    if (!data.password || data.password.length < 6) {
      dialog.error(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (data.password !== data.confirm_password) {
      dialog.error(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const response = await userWorkflowService.registerParent({
        first_name: data.parent_first_name,
        last_name: data.parent_last_name,
        email: data.parent_email,
        phone: data.parent_phone,
        password: data.password,
        child_already_enrolled: true,
        child_id: selectedChild.id
      })

      if (response.success) {
        setCreatedUser(response.user)
        setStep('success')
      }
    } catch (error) {
      console.error('Erreur inscription:', error)
      dialog.error(error.error || (isRTL ? 'خطأ في التسجيل' : 'Erreur lors de l\'inscription'))
    } finally {
      setLoading(false)
    }
  }

  // ==================== FONCTIONS MODE NEW ====================

  // Gestion des documents
  const handleDocumentChange = (documentType, file) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: file
    }))

    // Supprimer l'erreur si un fichier est sélectionné
    if (file && documentErrors[documentType]) {
      setDocumentErrors(prev => ({
        ...prev,
        [documentType]: null
      }))
    }
  }

  // Validation des documents
  const validateDocuments = () => {
    const errors = {}

    // Vérifier les documents obligatoires
    if (!documents.carnet_medical) {
      errors.carnet_medical = isRTL ? 'الدفتر الطبي مطلوب' : 'Le carnet médical est requis'
    }

    if (!documents.acte_naissance) {
      errors.acte_naissance = isRTL ? 'شهادة الميلاد مطلوبة' : 'L\'acte de naissance est requis'
    }

    if (!documents.certificat_medical) {
      errors.certificat_medical = isRTL ? 'الشهادة الطبية مطلوبة' : 'Le certificat médical est requis'
    }

    setDocumentErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Gestion du scroll du règlement - une seule fois suffit pour débloquer
  const handleRegulationScroll = () => {
    if (regulationRef.current && !regulationScrolled) {
      const { scrollTop, scrollHeight, clientHeight } = regulationRef.current
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10
      if (scrolledToBottom) {
        setRegulationScrolled(true) // Une fois atteint, reste débloqué
      }
    }
  }

  // Vérification de l'enfant à l'étape 1 (nom + prénom + date de naissance)
  const checkChildExists = async (childFirstName, childLastName, childBirthDate) => {
    if (!childFirstName || !childLastName || !childBirthDate) return null

    try {
      setChildCheckLoading(true)
      setChildCheckResult(null)

      const response = await api.post('/api/enrollments/check-child', {
        child_first_name: childFirstName,
        child_last_name: childLastName,
        child_birth_date: childBirthDate
      })

      if (response.data.success) {
        setChildCheckResult(response.data)
        return response.data
      }
      return null
    } catch (error) {
      console.error('Erreur vérification enfant:', error)
      setChildCheckResult(null)
      return null
    } finally {
      setChildCheckLoading(false)
    }
  }

  // Vérification de l'email avec infos parent ET enfant
  const checkEmailExists = async (email, firstName, lastName, childFirstName = null, childLastName = null) => {
    if (!email || !firstName || !lastName) return null

    try {
      setEmailCheckLoading(true)
      setEmailCheckResult(null)

      const payload = {
        email: email,
        first_name: firstName,
        last_name: lastName
      }

      // Ajouter les infos enfant si disponibles
      if (childFirstName && childLastName) {
        payload.child_first_name = childFirstName
        payload.child_last_name = childLastName
      }

      const response = await api.post('/api/enrollments/check-email', payload)

      if (response.data.success) {
        setEmailCheckResult(response.data)
        return response.data
      }
      return null
    } catch (error) {
      console.error('Erreur vérification email:', error)
      setEmailCheckResult(null)
      return null
    } finally {
      setEmailCheckLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)

      // Validation manuelle pour les DatePickers
      // Validation des dates
      if (!data.birth_date) {
        dialog.error(isRTL ? 'تاريخ الميلاد مطلوب' : 'La date de naissance est requise')
        setLoading(false)
        return
      }
      if (!data.enrollment_date) {
        dialog.error(isRTL ? 'تاريخ التسجيل مطلوب' : 'La date d\'inscription est requise')
        setLoading(false)
        return
      }

      {
        // Cas 1: Nouvelle inscription complète
        console.log('📝 Données du formulaire:', data);

        const enrollmentData = {
          // Données de l'enfant (noms conformes au backend)
          child_first_name: data.child_first_name,
          child_last_name: data.child_last_name,
          child_birth_date: convertToISO(data.birth_date), // Convertir dd/mm/yyyy → yyyy-mm-dd
          child_gender: data.gender,

          // Données du parent/applicant (noms conformes au backend)
          applicant_first_name: data.parent_first_name,
          applicant_last_name: data.parent_last_name,
          applicant_email: data.parent_email,
          applicant_phone: data.parent_phone
        };

        console.log('📤 Envoi au backend:', enrollmentData);

        const response = await api.post('/api/enrollments', enrollmentData)

        console.log('✅ Inscription créée:', response.data);

        // Upload des documents si présents
        if (documents.carnet_medical || documents.acte_naissance || documents.certificat_medical) {
          const enrollmentId = response.data.enrollment.id;
          const formData = new FormData();

          if (documents.carnet_medical) {
            formData.append('carnet_medical', documents.carnet_medical);
          }
          if (documents.acte_naissance) {
            formData.append('acte_naissance', documents.acte_naissance);
          }
          if (documents.certificat_medical) {
            formData.append('certificat_medical', documents.certificat_medical);
          }

          console.log('📎 Upload des documents pour enrollment:', enrollmentId);

          try {
            const uploadResponse = await api.post(`/api/enrollments/${enrollmentId}/documents`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            console.log('✅ Documents uploadés:', uploadResponse.data);
          } catch (uploadError) {
            console.error('❌ Erreur upload documents:', uploadError);
            dialog.error(isRTL ? 'خطأ في تحميل الوثائق' : 'Erreur lors de l\'upload des documents');
          }
        }

        dialog.success(isRTL ? 'تم التسجيل بنجاح!' : 'Inscription réussie !')

        // Rediriger vers la page d'accueil
        setTimeout(() => {
          navigate('/')
        }, 2000)
      }

      // Reset form
      reset()
      setStep(1)
      setDocuments({
        carnet_medical: null,
        acte_naissance: null,
        certificat_medical: null
      })
      setRegulationScrolled(false)

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في التسجيل' : 'Erreur lors de l\'inscription'))
    } finally {
      setLoading(false)
    }
  }

  const nextStep = async (e) => {
    // Empêcher la soumission du formulaire
    if (e) {
      e.preventDefault()
    }

    // Validation spéciale pour l'étape 1 (vérification enfant)
    if (step === 1) {
      const childFirstName = watch('child_first_name')
      const childLastName = watch('child_last_name')
      const birthDate = watch('birth_date')

      // Vérifier que les champs sont remplis
      if (!childFirstName || !childLastName || !birthDate) {
        dialog.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis')
        return
      }

      // Convertir la date dd/mm/yyyy en yyyy-mm-dd pour l'API
      const convertToISO = (dateStr) => {
        if (!dateStr) return null
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`
        }
        return dateStr
      }

      // Vérifier si l'enfant existe déjà
      const result = await checkChildExists(childFirstName, childLastName, convertToISO(birthDate))

      if (result?.exists) {
        // Cas 1: Dossier en cours pour cet enfant
        if (result.type === 'pending_child') {
          dialog.success(
            isRTL
              ? 'ملف التسجيل لهذا الطفل قيد المعالجة. سنتواصل معكم قريباً.'
              : 'Un dossier d\'inscription pour cet enfant est déjà en cours de traitement. Nous vous contacterons prochainement.',
            {
              title: isRTL ? 'ملف موجود' : 'Dossier existant',
              confirmText: isRTL ? 'العودة للصفحة الرئيسية' : 'Retour à l\'accueil',
              onConfirm: () => navigate('/')
            }
          )
          return
        }

        // Cas 2: Enfant déjà inscrit à la crèche
        if (result.type === 'already_enrolled') {
          dialog.info(
            isRTL
              ? 'هذا الطفل مسجل بالفعل في الحضانة. إذا كنت الوالد، يرجى تسجيل الدخول.'
              : 'Cet enfant est déjà inscrit à la crèche. Si vous êtes le parent, connectez-vous à votre espace.',
            {
              title: isRTL ? 'طفل مسجل' : 'Enfant déjà inscrit',
              confirmText: isRTL ? 'تسجيل الدخول' : 'Se connecter',
              onConfirm: () => navigate('/login')
            }
          )
          return
        }
      }
    }

    // Validation spéciale pour l'étape 2 (vérification email)
    if (step === 2) {
      const email = watch('parent_email')
      const firstName = watch('parent_first_name')
      const lastName = watch('parent_last_name')

      // Vérifier que les champs sont remplis
      if (!email || !firstName || !lastName) {
        dialog.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis')
        return
      }

      // Vérifier l'email (la vérification enfant est faite à l'étape 1)
      const result = await checkEmailExists(email, firstName, lastName)

      // Gérer les différents cas de réponse
      if (result?.exists) {
        // Cas 1: Email utilisé par quelqu'un d'autre
        if (result.type === 'email_taken') {
          dialog.error(result.message)
          return
        }

        // Cas 2: Parent déjà inscrit (compte existant)
        if (result.type === 'registered_parent') {
          dialog.info(isRTL
            ? 'أنت مسجل بالفعل. يرجى تسجيل الدخول لإضافة طفل جديد.'
            : 'Vous êtes déjà inscrit. Veuillez vous connecter pour ajouter un nouvel enfant.')
          return
        }
      }
      // same_parent ou email disponible - continuer normalement
    }

    // Validation spéciale pour l'étape des documents
    if (step === 3) {
      if (!validateDocuments()) {
        dialog.error(isRTL ? 'يرجى تحميل جميع الوثائق المطلوبة' : 'Veuillez télécharger tous les documents requis')
        return
      }
    }

    setStep(prev => Math.min(prev + 1, 5))

    // Auto-scroll vers le haut et focus sur premier champ
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Focus sur le premier input de l'étape
      const firstInput = document.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')
      if (firstInput) {
        firstInput.focus()
      }
    }, 100)
  }

  const prevStep = (e) => {
    // Empêcher la soumission du formulaire
    if (e) {
      e.preventDefault()
    }

    setStep(prev => Math.max(prev - 1, 1))

    // Auto-scroll vers le haut et focus sur premier champ
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Focus sur le premier input de l'étape
      const firstInput = document.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')
      if (firstInput) {
        firstInput.focus()
      }
    }, 100)
  }

  // ==================== PAGE SUCCÈS ====================
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-lg mx-auto px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card>
              <CardContent className="pt-8 pb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {isParentMode
                    ? (isRTL ? 'تم إنشاء حسابك بنجاح!' : 'Compte créé avec succès !')
                    : (isRTL ? 'تم التسجيل بنجاح!' : 'Inscription réussie !')
                  }
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {isParentMode && createdUser
                    ? (isRTL ? `مرحباً ${createdUser.first_name}` : `Bienvenue ${createdUser.first_name}`)
                    : (isRTL ? 'سنتواصل معك قريباً' : 'Nous vous contacterons bientôt')
                  }
                </p>
                {isParentMode && selectedChild && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                    <p className="text-green-800 dark:text-green-300 text-sm">
                      {isRTL
                        ? `تم ربط حسابك بـ ${selectedChild.first_name} ${selectedChild.last_name}`
                        : `Compte associé à ${selectedChild.first_name} ${selectedChild.last_name}`
                      }
                    </p>
                  </div>
                )}
                <Button onClick={() => navigate('/')} className="w-full bg-primary-600 hover:bg-primary-700">
                  {isRTL ? 'العودة للصفحة الرئيسية' : 'Retour à l\'accueil'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  // ==================== MODE PARENT ====================
  if (isParentMode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'إنشاء حساب ولي أمر' : 'Créer un compte parent'}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {isRTL
                ? 'ابحث عن طفلك المسجل وأنشئ حسابك'
                : 'Recherchez votre enfant inscrit et créez votre compte'
              }
            </p>
          </div>

          {/* Formulaire */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-8">
              <form onSubmit={handleSubmit(handleParentSubmit)}>
                {/* Section recherche enfant */}
                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800 mb-8">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2 text-lg">
                    <Baby className="w-6 h-6" />
                    {isRTL ? 'البحث عن طفلك' : 'Rechercher votre enfant'}
                  </h3>

                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={childSearchQuery}
                        onChange={(e) => { setChildSearchQuery(e.target.value); setChildSearchError('') }}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchChild())}
                        placeholder={isRTL ? 'اسم الطفل...' : 'Nom de l\'enfant...'}
                        className="w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <Button type="button" onClick={handleSearchChild} disabled={searchLoading} className="bg-green-600 hover:bg-green-700 px-6">
                      {searchLoading ? '...' : (isRTL ? 'بحث' : 'Rechercher')}
                    </Button>
                  </div>

                  {childSearchError && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        {childSearchError}
                      </p>
                    </div>
                  )}

                  {/* Liste de résultats */}
                  {searchResults.length > 0 && !selectedChild && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {searchResults.length === 1
                            ? (isRTL ? 'نتيجة واحدة - اختر طفلك:' : '1 résultat trouvé - Sélectionnez votre enfant :')
                            : (isRTL ? `${searchResults.length} نتائج - اختر طفلك:` : `${searchResults.length} résultats - Sélectionnez votre enfant :`)}
                        </p>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {searchResults.map(child => (
                          <div
                            key={child.id}
                            onClick={() => handleSelectChild(child)}
                            className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-[0.98] transition-all flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{child.first_name} {child.last_name}</p>
                              <p className="text-sm text-gray-500">{child.age_display || `${child.age_years || 0} ans`}</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enfant sélectionné - Infos complètes */}
                  {selectedChild && (
                    <div className="mt-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl overflow-hidden">
                      {/* Header avec nom */}
                      <div className="p-4 bg-green-100 dark:bg-green-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-lg">
                              {selectedChild.first_name} {selectedChild.last_name}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400">
                              {isRTL ? 'تم التحقق من الطفل' : 'Enfant vérifié'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedChild(null); setSearchResults([]) }}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title={isRTL ? 'تغيير الطفل' : 'Changer d\'enfant'}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Détails de l'enfant */}
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            {isRTL ? 'الاسم الأول' : 'Prénom'}
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedChild.first_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            {isRTL ? 'اسم العائلة' : 'Nom'}
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedChild.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            {isRTL ? 'الجنس' : 'Sexe'}
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedChild.gender === 'M' || selectedChild.gender === 'male'
                              ? (isRTL ? 'ذكر' : 'Garçon')
                              : selectedChild.gender === 'F' || selectedChild.gender === 'female'
                                ? (isRTL ? 'أنثى' : 'Fille')
                                : (isRTL ? 'غير محدد' : 'Non renseigné')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            {isRTL ? 'العمر' : 'Âge'}
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedChild.age_display || `${selectedChild.age_years || 0} ans`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            {isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedChild.birth_date
                              ? new Date(selectedChild.birth_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            {isRTL ? 'تاريخ التسجيل' : 'Date d\'inscription'}
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedChild.enrollment_date
                              ? new Date(selectedChild.enrollment_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')
                              : selectedChild.created_at
                                ? new Date(selectedChild.created_at).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')
                                : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section informations parent */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                    <User className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isRTL ? 'معلوماتك' : 'Vos informations'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الاسم الأول' : 'Prénom'} *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${errors.parent_first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder={isRTL ? 'الاسم الأول' : 'Prénom'}
                        {...register('parent_first_name', { required: true })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'اسم العائلة' : 'Nom'} *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${errors.parent_last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder={isRTL ? 'اسم العائلة' : 'Nom'}
                        {...register('parent_last_name', { required: true })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        className={`w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${errors.parent_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder={isRTL ? 'البريد الإلكتروني' : 'votre@email.com'}
                        {...register('parent_email', { required: true, pattern: /\S+@\S+\.\S+/ })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'رقم الهاتف' : 'Téléphone'} *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        dir="ltr"
                        className={`w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${errors.parent_phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder="+216 XX XXX XXX"
                        {...register('parent_phone', { required: true })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'كلمة المرور' : 'Mot de passe'} *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`w-full pl-12 rtl:pl-4 rtl:pr-12 pr-12 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          placeholder="••••••"
                          {...register('password', { required: true, minLength: 6 })}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'تأكيد كلمة المرور' : 'Confirmer'} *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${errors.confirm_password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder="••••••"
                        {...register('confirm_password', { required: true })}
                      />
                    </div>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex items-center"
                  >
                    <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !selectedChild}
                    className="bg-primary-600 hover:bg-primary-700 flex items-center"
                  >
                    {loading ? (isRTL ? 'جاري الإنشاء...' : 'Création...') : (isRTL ? 'إنشاء حسابي' : 'Créer mon compte')}
                    <ChevronRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Lien connexion */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {isRTL ? 'لديك حساب؟' : 'Vous avez déjà un compte ?'}{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ==================== MODE NEW (INSCRIPTION ENFANT) ====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {isRTL ? 'تسجيل طفل جديد' : 'Inscription d\'un enfant'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {isRTL
              ? 'املأ النموذج أدناه لتسجيل طفلك في حضانتنا'
              : 'Remplissez le formulaire ci-dessous pour inscrire votre enfant dans notre crèche'
            }
          </p>
        </div>

        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === stepNumber
                  ? 'bg-primary-600 text-white'
                  : step > stepNumber
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div className={`w-8 h-1 mx-1 ${step > stepNumber ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {step === 1 && (isRTL ? 'معلومات الطفل' : 'Informations de l\'enfant')}
              {step === 2 && (isRTL ? 'معلومات الوالدين' : 'Informations des parents')}
              {step === 3 && (isRTL ? 'الوثائق المطلوبة' : 'Documents requis')}
              {step === 4 && (isRTL ? 'الموافقة على القوانين' : 'Acceptation du règlement')}
              {step === 5 && (isRTL ? 'التأكيد' : 'Confirmation')}
            </span>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Étape 1: Informations de l'enfant */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                    <Baby className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isRTL ? 'معلومات الطفل' : 'Informations de l\'enfant'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الاسم الأول' : 'Prénom'} *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.child_first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder={isRTL ? 'أدخل الاسم الأول' : 'Entrez le prénom'}
                        {...register('child_first_name', {
                          required: isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis'
                        })}
                      />
                      {errors.child_first_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.child_first_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'اسم العائلة' : 'Nom de famille'} *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.child_last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder={isRTL ? 'أدخل اسم العائلة' : 'Entrez le nom de famille'}
                        {...register('child_last_name', {
                          required: isRTL ? 'اسم العائلة مطلوب' : 'Le nom de famille est requis'
                        })}
                      />
                      {errors.child_last_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.child_last_name.message}</p>
                      )}
                    </div>

                    <DatePicker
                      label={isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}
                      required
                      value={watch('birth_date')}
                      onChange={(value) => {
                        setValue('birth_date', value)
                        // Vérifier si l'enfant existe après saisie de la date
                        const childFirstName = watch('child_first_name')
                        const childLastName = watch('child_last_name')
                        if (childFirstName && childLastName && value) {
                          // Convertir dd/mm/yyyy en yyyy-mm-dd
                          const parts = value.split('/')
                          if (parts.length === 3) {
                            const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`
                            checkChildExists(childFirstName, childLastName, isoDate)
                          }
                        }
                      }}
                      error={errors.birth_date?.message}
                    />

                    {/* Indicateur de chargement */}
                    {childCheckLoading && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        {isRTL ? 'جاري التحقق...' : 'Vérification en cours...'}
                      </div>
                    )}

                    {/* Modal pour enfant existant */}
                    {childCheckResult?.exists && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                          {/* Header */}
                          <div className={`p-6 ${childCheckResult.type === 'pending_child'
                            ? 'bg-yellow-50 dark:bg-yellow-900/30'
                            : 'bg-blue-50 dark:bg-blue-900/30'
                            }`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${childCheckResult.type === 'pending_child'
                                ? 'bg-yellow-100 dark:bg-yellow-800'
                                : 'bg-blue-100 dark:bg-blue-800'
                                }`}>
                                <AlertCircle className={`w-8 h-8 ${childCheckResult.type === 'pending_child'
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-blue-600 dark:text-blue-400'
                                  }`} />
                              </div>
                              <h3 className={`text-xl font-bold ${childCheckResult.type === 'pending_child'
                                ? 'text-yellow-900 dark:text-yellow-200'
                                : 'text-blue-900 dark:text-blue-200'
                                }`}>
                                {childCheckResult.type === 'pending_child'
                                  ? (isRTL ? 'ملف موجود' : 'Dossier existant')
                                  : (isRTL ? 'طفل مسجل' : 'Enfant déjà inscrit')
                                }
                              </h3>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                              {childCheckResult.message}
                            </p>
                          </div>

                          {/* Footer avec 2 boutons */}
                          <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                // Vider les champs enfant et rester sur la page
                                setValue('child_first_name', '')
                                setValue('child_last_name', '')
                                setValue('birth_date', '')
                                setChildCheckResult(null)
                              }}
                              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              {isRTL ? 'تسجيل طفل آخر' : 'Inscrire un autre enfant'}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(childCheckResult.type === 'pending_child' ? '/' : '/login')}
                              className={`flex-1 px-4 py-3 rounded-xl font-medium text-white transition-colors ${childCheckResult.type === 'pending_child'
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            >
                              {childCheckResult.type === 'pending_child'
                                ? (isRTL ? 'العودة للصفحة الرئيسية' : 'Retour à l\'accueil')
                                : (isRTL ? 'تسجيل الدخول' : 'Se connecter')
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الجنس' : 'Sexe'} *
                      </label>
                      <select
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        {...register('gender', {
                          required: isRTL ? 'الجنس مطلوب' : 'Le sexe est requis'
                        })}
                      >
                        <option value="">
                          {isRTL ? 'اختر الجنس' : 'Sélectionner le sexe'}
                        </option>
                        <option value="M">{isRTL ? 'ذكر' : 'Masculin'}</option>
                        <option value="F">{isRTL ? 'أنثى' : 'Féminin'}</option>
                      </select>
                      {errors.gender && (
                        <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'معلومات طبية' : 'Informations médicales'}
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={isRTL ? 'أي معلومات طبية مهمة...' : 'Toute information médicale importante...'}
                      {...register('medical_info')}
                    />
                  </div>

                  {/* Contact d'urgence */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {isRTL ? 'جهة الاتصال للطوارئ' : 'Contact d\'urgence'}
                    </h3>

                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                      <input
                        type="checkbox"
                        id="differentContact"
                        checked={hasDifferentEmergencyContact}
                        onChange={(e) => setHasDifferentEmergencyContact(e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="differentContact" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        {isRTL ? 'شخص مختلف عن الوالد' : 'Personne différente du parent'}
                      </label>
                    </div>

                    {!hasDifferentEmergencyContact && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {isRTL ? 'سيتم استخدام معلومات الوالد كجهة اتصال للطوارئ' : 'Les informations du parent seront utilisées comme contact d\'urgence'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Champs contact d'urgence (conditionnels) */}
                  {hasDifferentEmergencyContact && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isRTL ? 'اسم جهة الاتصال للطوارئ' : 'Contact d\'urgence - Nom'} *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.emergency_contact_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          placeholder={isRTL ? 'اسم الشخص للاتصال' : 'Nom de la personne à contacter'}
                          {...register('emergency_contact_name', {
                            required: hasDifferentEmergencyContact ? (isRTL ? 'اسم جهة الاتصال مطلوب' : 'Le nom du contact est requis') : false
                          })}
                        />
                        {errors.emergency_contact_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isRTL ? 'هاتف جهة الاتصال للطوارئ' : 'Contact d\'urgence - Téléphone'} *
                        </label>
                        <input
                          type="tel"
                          className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.emergency_contact_phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          placeholder={isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}
                          {...register('emergency_contact_phone', {
                            required: hasDifferentEmergencyContact ? (isRTL ? 'رقم الهاتف مطلوب' : 'Le numéro de téléphone est requis') : false
                          })}
                        />
                        {errors.emergency_contact_phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_phone.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Informations du parent - Étape 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                    <User className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isRTL ? 'معلومات الوالدين' : 'Informations des parents'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Prénom du parent */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الاسم الأول للوالد' : 'Prénom du parent'} *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.parent_first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder={isRTL ? 'الاسم الأول' : 'Prénom'}
                        {...register('parent_first_name', {
                          required: isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis'
                        })}
                      />
                      {errors.parent_first_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.parent_first_name.message}</p>
                      )}
                    </div>

                    {/* Nom du parent */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'اسم العائلة للوالد' : 'Nom du parent'} *
                      </label>
                      <input
                        type="text"
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.parent_last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder={isRTL ? 'اسم العائلة' : 'Nom de famille'}
                        {...register('parent_last_name', {
                          required: isRTL ? 'اسم العائلة مطلوب' : 'Le nom de famille est requis'
                        })}
                      />
                      {errors.parent_last_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.parent_last_name.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Email avec vérification en temps réel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.parent_email || (emailCheckResult?.exists && emailCheckResult?.type === 'email_taken') ? 'border-red-500' : emailCheckResult?.exists === false ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder={isRTL ? 'البريد الإلكتروني' : 'votre.email@exemple.com'}
                        {...register('parent_email', {
                          required: isRTL ? 'البريد الإلكتروني مطلوب' : 'L\'email est requis',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: isRTL ? 'البريد الإلكتروني غير صالح' : 'Email invalide'
                          }
                        })}
                        onBlur={(e) => {
                          const email = e.target.value
                          const firstName = watch('parent_first_name')
                          const lastName = watch('parent_last_name')
                          if (email && firstName && lastName) {
                            checkEmailExists(email, firstName, lastName)
                          }
                        }}
                      />
                      {emailCheckLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    {errors.parent_email && (
                      <p className="text-red-500 text-sm mt-1">{errors.parent_email.message}</p>
                    )}

                    {/* Messages de vérification d'email */}
                    {emailCheckResult && emailCheckResult.exists && (
                      <div className={`mt-3 p-4 rounded-lg ${emailCheckResult.type === 'registered_parent'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                        <div className="flex items-start space-x-3 rtl:space-x-reverse">
                          <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${emailCheckResult.type === 'registered_parent'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                            }`} />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${emailCheckResult.type === 'registered_parent'
                              ? 'text-blue-900 dark:text-blue-300'
                              : 'text-red-900 dark:text-red-300'
                              }`}>
                              {emailCheckResult.message}
                            </p>
                            {emailCheckResult.type === 'registered_parent' && (
                              <Link
                                to="/login"
                                className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {isRTL ? 'تسجيل الدخول إلى حسابي' : 'Se connecter à mon espace'}
                                <ChevronRight className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0 rtl:rotate-180" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'} *
                    </label>
                    <input
                      type="tel"
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.parent_phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder={isRTL ? 'رقم الهاتف' : '+216 XX XXX XXX'}
                      {...register('parent_phone', {
                        required: isRTL ? 'رقم الهاتف مطلوب' : 'Le numéro de téléphone est requis'
                      })}
                    />
                    {errors.parent_phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.parent_phone.message}</p>
                    )}
                  </div>

                  {/* Date d'inscription souhaitée */}
                  <DatePicker
                    label={isRTL ? 'تاريخ التسجيل المرغوب' : 'Date d\'inscription souhaitée'}
                    required
                    value={watch('enrollment_date')}
                    onChange={(value) => setValue('enrollment_date', value)}
                    error={errors.enrollment_date?.message}
                  />

                  {/* Assistance au déjeuner */}
                  <div>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id="lunch_assistance"
                        className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                        {...register('lunch_assistance')}
                      />
                      <label htmlFor="lunch_assistance" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Utensils className="w-5 h-5 text-primary-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {isRTL ? 'المساعدة في الغداء' : 'Assistance au déjeuner'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {isRTL
                                ? 'يحتاج طفلي إلى مساعدة في تناول الطعام'
                                : 'Mon enfant a besoin d\'aide pour manger'
                              }
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 3: Documents requis */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                    <Upload className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isRTL ? 'الوثائق المطلوبة' : 'Documents requis'}
                    </h2>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-900 dark:text-blue-300">
                          {isRTL ? 'معلومات مهمة' : 'Informations importantes'}
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          {isRTL
                            ? 'يرجى تحميل جميع الوثائق المطلوبة. الملفات المقبولة: PDF, JPG, PNG (حتى 5MB)'
                            : 'Veuillez télécharger tous les documents requis. Formats acceptés : PDF, JPG, PNG (max 5MB)'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Carnet médical */}
                    <DocumentUpload
                      documentType="carnet_medical"
                      label={isRTL ? 'الدفتر الطبي' : 'Carnet médical'}
                      description={isRTL ? 'الدفتر الطبي للطفل مع التطعيمات' : 'Carnet de santé de l\'enfant avec vaccinations'}
                      required={true}
                      onFileChange={(file) => handleDocumentChange('carnet_medical', file)}
                      value={documents.carnet_medical}
                      error={documentErrors.carnet_medical}
                    />

                    {/* Acte de naissance */}
                    <DocumentUpload
                      documentType="acte_naissance"
                      label={isRTL ? 'شهادة الميلاد' : 'Acte de naissance'}
                      description={isRTL ? 'شهادة الميلاد الأصلية أو نسخة مصدقة' : 'Acte de naissance original ou copie certifiée'}
                      required={true}
                      onFileChange={(file) => handleDocumentChange('acte_naissance', file)}
                      value={documents.acte_naissance}
                      error={documentErrors.acte_naissance}
                    />

                    {/* Certificat médical */}
                    <DocumentUpload
                      documentType="certificat_medical"
                      label={isRTL ? 'الشهادة الطبية' : 'Certificat médical'}
                      description={isRTL ? 'شهادة طبية تؤكد عدم وجود أمراض معدية' : 'Certificat médical attestant l\'absence de maladies contagieuses'}
                      required={true}
                      onFileChange={(file) => handleDocumentChange('certificat_medical', file)}
                      value={documents.certificat_medical}
                      error={documentErrors.certificat_medical}
                    />
                  </div>

                  {/* Téléchargement du règlement */}
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {isRTL ? 'النظام الداخلي للحضانة' : 'Règlement intérieur de la crèche'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {isRTL
                            ? 'قم بتحميل ومراجعة النظام الداخلي قبل المتابعة'
                            : 'Téléchargez et consultez le règlement avant de continuer'
                          }
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await api.get('/api/documents/public/reglement');
                            if (response.data.success && response.data.url) {
                              window.open(response.data.url, '_blank');
                            } else {
                              dialog.error(isRTL ? 'النظام الداخلي غير متوفر حاليا' : 'Règlement non disponible actuellement');
                            }
                          } catch (error) {
                            console.error('Erreur téléchargement règlement:', error);
                            dialog.error(isRTL ? 'خطأ في تحميل النظام الداخلي' : 'Erreur lors du téléchargement du règlement');
                          }
                        }}
                        className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                      >
                        <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                        {isRTL ? 'تحميل' : 'Télécharger'}
                      </button>
                    </div>
                  </div>

                  {/* Rappel important sur les documents originaux */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                          {isRTL ? '📋 تذكير مهم' : '📋 Rappel important'}
                        </h3>
                        <p className="text-orange-800 dark:text-orange-200 text-sm">
                          {isRTL
                            ? 'الوثائق المرفوعة هنا للمراجعة الأولية. يجب إحضار النسخ الأصلية والنظام الداخلي موقع يوم التسجيل النهائي في الحضانة.'
                            : 'Les documents téléchargés ici sont pour l\'examen préliminaire. Vous devez apporter les originaux et le règlement intérieur signé le jour de l\'inscription définitive à la crèche.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 4: Règlement intérieur */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                    <FileText className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isRTL ? 'الموافقة على القوانين الداخلية' : 'Acceptation du règlement intérieur'}
                    </h2>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div
                      ref={regulationRef}
                      onScroll={handleRegulationScroll}
                      className="h-64 overflow-y-auto p-4 text-sm text-gray-700 dark:text-gray-300 space-y-3 bg-white dark:bg-gray-800"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {isRTL ? 'القوانين الداخلية لحضانة ميما الغالية' : 'Règlement intérieur de la crèche Mima Elghalia'}
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {isRTL ? '1. ساعات العمل' : '1. Horaires d\'ouverture'}
                          </h4>
                          <p>
                            {isRTL
                              ? 'الحضانة مفتوحة من الاثنين إلى الجمعة من 7:00 إلى 18:00، والسبت من 8:00 إلى 12:00'
                              : 'La crèche est ouverte du lundi au vendredi de 7h00 à 18h00, et le samedi de 8h00 à 12h00'
                            }
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {isRTL ? '2. الفئة العمرية' : '2. Tranche d\'âge'}
                          </h4>
                          <p>
                            {isRTL
                              ? 'نستقبل الأطفال من عمر شهرين إلى 3 سنوات'
                              : 'Nous accueillons les enfants de 2 mois à 3 ans'
                            }
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {isRTL ? '3. الصحة والسلامة' : '3. Santé et sécurité'}
                          </h4>
                          <p>
                            {isRTL
                              ? 'يجب تقديم شهادة طبية حديثة عند التسجيل. الأطفال المرضى لا يُقبلون في الحضانة لحماية الآخرين.'
                              : 'Un certificat médical récent est requis lors de l\'inscription. Les enfants malades ne sont pas acceptés pour protéger les autres.'
                            }
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {isRTL ? '4. الدفع' : '4. Paiement'}
                          </h4>
                          <p>
                            {isRTL
                              ? 'الرسوم الشهرية مستحقة في بداية كل شهر. التأخير في الدفع قد يؤدي إلى رسوم إضافية.'
                              : 'Les frais mensuels sont dus en début de mois. Un retard de paiement peut entraîner des frais supplémentaires.'
                            }
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {isRTL ? '5. المسؤولية' : '5. Responsabilité'}
                          </h4>
                          <p>
                            {isRTL
                              ? 'الحضانة غير مسؤولة عن الأشياء الشخصية المفقودة أو التالفة. يُرجى عدم إحضار أشياء ثمينة.'
                              : 'La crèche n\'est pas responsable des objets personnels perdus ou endommagés. Veuillez ne pas apporter d\'objets de valeur.'
                            }
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {isRTL ? '6. الإلغاء' : '6. Annulation'}
                          </h4>
                          <p>
                            {isRTL
                              ? 'يجب إشعار الحضانة قبل شهر واحد على الأقل في حالة الرغبة في إلغاء التسجيل.'
                              : 'Un préavis d\'un mois minimum est requis pour toute annulation d\'inscription.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
                      <label className="flex items-start space-x-3 rtl:space-x-reverse cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                          {...register('regulation_accepted', {
                            required: isRTL ? 'يجب الموافقة على القوانين الداخلية' : 'Vous devez accepter le règlement intérieur'
                          })}
                          disabled={!regulationScrolled}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {isRTL
                              ? 'أوافق على القوانين الداخلية لحضانة ميما الغالية'
                              : 'J\'accepte le règlement intérieur de la crèche Mima Elghalia'
                            }
                          </p>
                          {!regulationScrolled && (
                            <p className="text-xs text-amber-600 mt-1">
                              {isRTL
                                ? 'يرجى قراءة القوانين كاملة للمتابعة'
                                : 'Veuillez lire entièrement le règlement pour continuer'
                              }
                            </p>
                          )}
                        </div>
                      </label>
                      {errors.regulation_accepted && (
                        <p className="form-error mt-2">{errors.regulation_accepted.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 5: Confirmation */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                    <CheckCircle className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isRTL ? 'مراجعة الطلب' : 'Révision de la demande'}
                    </h2>
                  </div>

                  {/* Informations de l'enfant */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {isRTL ? 'معلومات الطفل:' : 'Informations de l\'enfant :'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">{isRTL ? 'الاسم:' : 'Nom :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium text-gray-900 dark:text-white">
                          {watch('child_first_name')} {watch('child_last_name')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">{isRTL ? 'تاريخ الميلاد:' : 'Date de naissance :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium text-gray-900 dark:text-white">
                          {watch('birth_date')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">{isRTL ? 'الجنس:' : 'Sexe :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium text-gray-900 dark:text-white">
                          {watch('gender') === 'M' ? (isRTL ? 'ذكر' : 'Masculin') : (isRTL ? 'أنثى' : 'Féminin')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">{isRTL ? 'تاريخ التسجيل:' : 'Date d\'inscription :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium text-gray-900 dark:text-white">
                          {watch('enrollment_date')}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-600 dark:text-gray-300">{isRTL ? 'جهة الاتصال للطوارئ:' : 'Contact d\'urgence :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium text-gray-900 dark:text-white">
                          {hasDifferentEmergencyContact && watch('emergency_contact_name')
                            ? `${watch('emergency_contact_name')} - ${watch('emergency_contact_phone')}`
                            : `${watch('parent_first_name')} ${watch('parent_last_name')} - ${watch('parent_phone')} ${isRTL ? '(الوالد)' : '(Parent)'}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Options sélectionnées */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {isRTL ? 'الخيارات المحددة:' : 'Options sélectionnées :'}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className={`w-4 h-4 ${watch('lunch_assistance') ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={watch('lunch_assistance') ? 'text-green-800 dark:text-green-300 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                          {isRTL ? 'المساعدة في الغداء' : 'Assistance au déjeuner'}
                          {watch('lunch_assistance') && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 rtl:ml-0 rtl:mr-1">
                              (+50 TND/mois)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className={`w-4 h-4 ${watch('regulation_accepted') ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={watch('regulation_accepted') ? 'text-green-800 dark:text-green-300 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                          {isRTL ? 'الموافقة على القوانين الداخلية' : 'Règlement intérieur accepté'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      {isRTL
                        ? 'سيتم مراجعة طلبكم من قبل فريقنا وسنتواصل معكم قريباً.'
                        : 'Votre demande sera examinée par notre équipe et nous vous recontacterons bientôt.'
                      }
                    </p>
                  </div>

                  {/* Mention importante sur les documents originaux */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                          {isRTL ? '⚠️ تذكير مهم' : '⚠️ Rappel important'}
                        </h3>
                        <p className="text-orange-800 dark:text-orange-200 text-sm">
                          {isRTL
                            ? 'يجب عليكم إحضار جميع الوثائق الأصلية (الدفتر الطبي، شهادة الميلاد، الشهادة الطبية) والنظام الداخلي موقع يوم التسجيل النهائي في الحضانة للتحقق منها.'
                            : 'Vous devez apporter tous les documents originaux (carnet médical, acte de naissance, certificat médical) et le règlement intérieur signé le jour de l\'inscription définitive à la crèche pour vérification.'
                          }
                        </p>
                        <p className="text-orange-700 dark:text-orange-300 text-xs mt-2 font-medium">
                          {isRTL
                            ? '📋 الوثائق المرفوعة هنا هي للمراجعة الأولية فقط'
                            : '📋 Les documents téléchargés ici sont uniquement pour l\'examen préliminaire'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons de navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                {step > 1 && step < 5 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-base font-medium min-w-[140px]"
                  >
                    <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    {isRTL ? 'السابق' : 'Précédent'}
                  </button>
                )}

                <div className={step === 1 || step === 5 ? 'sm:ml-auto sm:rtl:ml-0 sm:rtl:mr-auto w-full sm:w-auto' : 'w-full sm:w-auto'}>
                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium min-w-[140px] w-full sm:w-auto"
                      disabled={step === 4 && !regulationScrolled}
                    >
                      {isRTL ? 'التالي' : 'Suivant'}
                      <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base font-semibold shadow-lg hover:shadow-xl w-full"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {isRTL ? 'إرسال الطلب' : 'Envoyer la demande'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            {isRTL
              ? 'هل تحتاجون مساعدة؟ '
              : 'Besoin d\'aide ? '
            }
            <a href="/contact" className="text-primary-600 hover:text-primary-700">
              {isRTL ? 'تواصلوا معنا' : 'Contactez-nous'}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default EnrollmentPage
