import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Baby, User, Calendar, Phone, FileText, Send, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Utensils, Heart, Upload, Download } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { enrollmentService } from '../../services/enrollmentService'
import { childrenService } from '../../services/childrenService'
import { documentService } from '../../services/documentService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import DocumentUpload from '../../components/ui/DocumentUpload'
import toast from 'react-hot-toast'

const EnrollmentPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Enfant, 2: Parent, 3: Documents, 4: Règlement, 5: Confirmation
  const [regulationScrolled, setRegulationScrolled] = useState(false)
  const regulationRef = useRef(null)
  
  // États pour les documents
  const [documents, setDocuments] = useState({
    carnet_medical: null,
    acte_naissance: null,
    certificat_medical: null
  })
  const [documentErrors, setDocumentErrors] = useState({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm()

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

  // Gestion du scroll du règlement
  const handleRegulationScroll = () => {
    if (regulationRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = regulationRef.current
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10
      setRegulationScrolled(scrolledToBottom)
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // D'abord créer l'enfant
      const childData = {
        first_name: data.child_first_name,
        last_name: data.child_last_name,
        birth_date: data.birth_date,
        gender: data.gender,
        medical_info: data.medical_info,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone
      }

      const childResponse = await childrenService.createChild(childData)
      
      // Ensuite créer l'inscription avec les nouvelles options
      const enrollmentData = {
        child_id: childResponse.child.id,
        enrollment_date: data.enrollment_date,
        lunch_assistance: data.lunch_assistance || false,
        regulation_accepted: data.regulation_accepted || false,
        notes: data.notes
      }

      const enrollmentResponse = await enrollmentService.createEnrollment(enrollmentData)
      
      // Upload des documents si présents
      if (documents.carnet_medical || documents.acte_naissance || documents.certificat_medical) {
        try {
          const uploadPromises = []
          
          if (documents.carnet_medical) {
            uploadPromises.push(
              documentService.uploadDocument(
                documents.carnet_medical, 
                documentService.documentTypes.CARNET_MEDICAL, 
                childResponse.child.id
              )
            )
          }
          
          if (documents.acte_naissance) {
            uploadPromises.push(
              documentService.uploadDocument(
                documents.acte_naissance, 
                documentService.documentTypes.ACTE_NAISSANCE, 
                childResponse.child.id
              )
            )
          }
          
          if (documents.certificat_medical) {
            uploadPromises.push(
              documentService.uploadDocument(
                documents.certificat_medical, 
                documentService.documentTypes.CERTIFICAT_MEDICAL, 
                childResponse.child.id
              )
            )
          }
          
          await Promise.all(uploadPromises)
          console.log('Documents uploadés avec succès')
        } catch (uploadError) {
          console.error('Erreur lors de l\'upload des documents:', uploadError)
          // Ne pas bloquer l'inscription si l'upload échoue
          toast.warning(isRTL ? 'تم التسجيل بنجاح ولكن فشل في تحميل بعض الوثائق' : 'Inscription réussie mais échec de l\'upload de certains documents')
        }
      }
      
      toast.success(isRTL ? 'تم التسجيل بنجاح!' : 'Inscription réussie !')
      reset()
      setStep(1)
      
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    // Validation spéciale pour l'étape des documents (temporairement désactivée pour permettre les tests)
    if (step === 3) {
      // Validation temporairement désactivée - sera réactivée après tests
      // if (!validateDocuments()) {
      //   toast.error(isRTL ? 'يرجى تحميل جميع الوثائق المطلوبة' : 'Veuillez télécharger tous les documents requis')
      //   return
      // }
    }
    
    setStep(prev => Math.min(prev + 1, 5))
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('enrollment.title')}
          </h1>
          <p className="text-xl text-gray-600">
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepNumber 
                    ? 'bg-primary-600 text-white' 
                    : step > stepNumber 
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div className={`w-8 h-1 mx-1 ${
                    step > stepNumber ? 'bg-primary-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600">
              {step === 1 && (isRTL ? 'معلومات الطفل' : 'Informations de l\'enfant')}
              {step === 2 && (isRTL ? 'معلومات الوالدين' : 'Informations des parents')}
              {step === 3 && (isRTL ? 'الوثائق المطلوبة' : 'Documents requis')}
              {step === 4 && (isRTL ? 'الموافقة على القوانين' : 'Acceptation du règlement')}
              {step === 5 && (isRTL ? 'التأكيد' : 'Confirmation')}
            </span>
          </div>
        </div>

        {/* Formulaire */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Étape 1: Informations de l'enfant */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                    <Baby className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      {t('enrollment.childInfo')}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">
                        {t('enrollment.childFirstName')} *
                      </label>
                      <input
                        type="text"
                        className={`form-input ${errors.child_first_name ? 'border-error-500' : ''}`}
                        {...register('child_first_name', {
                          required: t('validation.required')
                        })}
                      />
                      {errors.child_first_name && (
                        <p className="form-error">{errors.child_first_name.message}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {t('enrollment.childLastName')} *
                      </label>
                      <input
                        type="text"
                        className={`form-input ${errors.child_last_name ? 'border-error-500' : ''}`}
                        {...register('child_last_name', {
                          required: t('validation.required')
                        })}
                      />
                      {errors.child_last_name && (
                        <p className="form-error">{errors.child_last_name.message}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {t('enrollment.birthDate')} *
                      </label>
                      <input
                        type="date"
                        className={`form-input ${errors.birth_date ? 'border-error-500' : ''}`}
                        {...register('birth_date', {
                          required: t('validation.required')
                        })}
                      />
                      {errors.birth_date && (
                        <p className="form-error">{errors.birth_date.message}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {t('enrollment.gender')} *
                      </label>
                      <select
                        className={`form-input ${errors.gender ? 'border-error-500' : ''}`}
                        {...register('gender', {
                          required: t('validation.required')
                        })}
                      >
                        <option value="">
                          {isRTL ? 'اختر الجنس' : 'Sélectionner le sexe'}
                        </option>
                        <option value="M">{t('enrollment.male')}</option>
                        <option value="F">{t('enrollment.female')}</option>
                      </select>
                      {errors.gender && (
                        <p className="form-error">{errors.gender.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('enrollment.medicalInfo')}
                    </label>
                    <textarea
                      rows={3}
                      className="form-input"
                      placeholder={isRTL ? 'أي معلومات طبية مهمة...' : 'Toute information médicale importante...'}
                      {...register('medical_info')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">
                        {t('enrollment.emergencyContactName')} *
                      </label>
                      <input
                        type="text"
                        className={`form-input ${errors.emergency_contact_name ? 'border-error-500' : ''}`}
                        {...register('emergency_contact_name', {
                          required: t('validation.required')
                        })}
                      />
                      {errors.emergency_contact_name && (
                        <p className="form-error">{errors.emergency_contact_name.message}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {t('enrollment.emergencyContactPhone')} *
                      </label>
                      <input
                        type="tel"
                        className={`form-input ${errors.emergency_contact_phone ? 'border-error-500' : ''}`}
                        {...register('emergency_contact_phone', {
                          required: t('validation.required')
                        })}
                      />
                      {errors.emergency_contact_phone && (
                        <p className="form-error">{errors.emergency_contact_phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 2: Informations du parent */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                    <User className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      {t('enrollment.parentInfo')}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Prénom du parent */}
                    <div className="form-group">
                      <label className="form-label">
                        {isRTL ? 'الاسم الأول للوالد' : 'Prénom du parent'} *
                      </label>
                      <input
                        type="text"
                        className={`form-input ${errors.parent_first_name ? 'border-error-500' : ''}`}
                        placeholder={isRTL ? 'الاسم الأول' : 'Prénom'}
                        {...register('parent_first_name', {
                          required: t('validation.required')
                        })}
                      />
                      {errors.parent_first_name && (
                        <p className="form-error">{errors.parent_first_name.message}</p>
                      )}
                    </div>

                    {/* Nom du parent */}
                    <div className="form-group">
                      <label className="form-label">
                        {isRTL ? 'اسم العائلة للوالد' : 'Nom du parent'} *
                      </label>
                      <input
                        type="text"
                        className={`form-input ${errors.parent_last_name ? 'border-error-500' : ''}`}
                        placeholder={isRTL ? 'اسم العائلة' : 'Nom de famille'}
                        {...register('parent_last_name', {
                          required: t('validation.required')
                        })}
                      />
                      {errors.parent_last_name && (
                        <p className="form-error">{errors.parent_last_name.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                    </label>
                    <input
                      type="email"
                      className={`form-input ${errors.parent_email ? 'border-error-500' : ''}`}
                      placeholder={isRTL ? 'البريد الإلكتروني' : 'votre.email@exemple.com'}
                      {...register('parent_email', {
                        required: t('validation.required'),
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: isRTL ? 'البريد الإلكتروني غير صحيح' : 'Email invalide'
                        }
                      })}
                    />
                    {errors.parent_email && (
                      <p className="form-error">{errors.parent_email.message}</p>
                    )}
                  </div>

                  {/* Mot de passe */}
                  <div className="form-group">
                    <label className="form-label">
                      {isRTL ? 'كلمة المرور' : 'Mot de passe'} *
                    </label>
                    <input
                      type="password"
                      className={`form-input ${errors.parent_password ? 'border-error-500' : ''}`}
                      placeholder={isRTL ? 'كلمة المرور (6 أحرف على الأقل)' : 'Mot de passe (minimum 6 caractères)'}
                      {...register('parent_password', {
                        required: t('validation.required'),
                        minLength: {
                          value: 6,
                          message: isRTL ? 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères'
                        }
                      })}
                    />
                    {errors.parent_password && (
                      <p className="form-error">{errors.parent_password.message}</p>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div className="form-group">
                    <label className="form-label">
                      {isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'} *
                    </label>
                    <input
                      type="tel"
                      className={`form-input ${errors.parent_phone ? 'border-error-500' : ''}`}
                      placeholder={isRTL ? 'رقم الهاتف' : '+216 XX XXX XXX'}
                      {...register('parent_phone', {
                        required: t('validation.required')
                      })}
                    />
                    {errors.parent_phone && (
                      <p className="form-error">{errors.parent_phone.message}</p>
                    )}
                  </div>

                  {/* Date d'inscription souhaitée */}
                  <div className="form-group">
                    <label className="form-label">
                      {t('enrollment.enrollmentDate')} *
                    </label>
                    <input
                      type="date"
                      className={`form-input ${errors.enrollment_date ? 'border-error-500' : ''}`}
                      {...register('enrollment_date', {
                        required: t('validation.required')
                      })}
                    />
                    {errors.enrollment_date && (
                      <p className="form-error">{errors.enrollment_date.message}</p>
                    )}
                  </div>

                  {/* Assistance au déjeuner */}
                  <div className="form-group">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id="lunch_assistance"
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        {...register('lunch_assistance')}
                      />
                      <label htmlFor="lunch_assistance" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Utensils className="w-5 h-5 text-primary-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {isRTL ? 'المساعدة في الغداء' : 'Assistance au déjeuner'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {isRTL 
                                ? 'رسوم إضافية: 20 دينار تونسي شهرياً'
                                : 'Frais supplémentaires : 20 TND par mois'
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
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isRTL ? 'الوثائق المطلوبة' : 'Documents requis'}
                    </h2>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-blue-900">
                          {isRTL ? 'معلومات مهمة' : 'Informations importantes'}
                        </h3>
                        <p className="text-sm text-blue-800 mt-1">
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
                      documentType={documentService.documentTypes.CARNET_MEDICAL}
                      label={isRTL ? 'الدفتر الطبي' : 'Carnet médical'}
                      description={isRTL ? 'الدفتر الطبي للطفل مع التطعيمات' : 'Carnet de santé de l\'enfant avec vaccinations'}
                      required={true}
                      onFileChange={(file) => handleDocumentChange('carnet_medical', file)}
                      value={documents.carnet_medical}
                      error={documentErrors.carnet_medical}
                    />

                    {/* Acte de naissance */}
                    <DocumentUpload
                      documentType={documentService.documentTypes.ACTE_NAISSANCE}
                      label={isRTL ? 'شهادة الميلاد' : 'Acte de naissance'}
                      description={isRTL ? 'شهادة الميلاد الأصلية أو نسخة مصدقة' : 'Acte de naissance original ou copie certifiée'}
                      required={true}
                      onFileChange={(file) => handleDocumentChange('acte_naissance', file)}
                      value={documents.acte_naissance}
                      error={documentErrors.acte_naissance}
                    />

                    {/* Certificat médical */}
                    <DocumentUpload
                      documentType={documentService.documentTypes.CERTIFICAT_MEDICAL}
                      label={isRTL ? 'الشهادة الطبية' : 'Certificat médical'}
                      description={isRTL ? 'شهادة طبية تؤكد عدم وجود أمراض معدية' : 'Certificat médical attestant l\'absence de maladies contagieuses'}
                      required={true}
                      onFileChange={(file) => handleDocumentChange('certificat_medical', file)}
                      value={documents.certificat_medical}
                      error={documentErrors.certificat_medical}
                    />
                  </div>

                  {/* Téléchargement du règlement */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {isRTL ? 'النظام الداخلي للحضانة' : 'Règlement intérieur de la crèche'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {isRTL 
                            ? 'قم بتحميل ومراجعة النظام الداخلي قبل المتابعة'
                            : 'Téléchargez et consultez le règlement avant de continuer'
                          }
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={documentService.downloadReglement}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isRTL ? 'تحميل' : 'Télécharger'}
                      </button>
                    </div>
                  </div>

                  {/* Rappel important sur les documents originaux */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-1">
                          {isRTL ? '📋 تذكير مهم' : '📋 Rappel important'}
                        </h3>
                        <p className="text-orange-800 text-sm">
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
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isRTL ? 'الموافقة على القوانين الداخلية' : 'Acceptation du règlement intérieur'}
                    </h2>
                  </div>

                  <div className="border border-gray-200 rounded-lg">
                    <div 
                      ref={regulationRef}
                      onScroll={handleRegulationScroll}
                      className="h-64 overflow-y-auto p-4 text-sm text-gray-700 space-y-3"
                    >
                      <h3 className="font-semibold text-gray-900">
                        {isRTL ? 'القوانين الداخلية لحضانة ميما الغالية' : 'Règlement intérieur de la crèche Mima Elghalia'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-800">
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
                          <h4 className="font-medium text-gray-800">
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
                          <h4 className="font-medium text-gray-800">
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
                          <h4 className="font-medium text-gray-800">
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
                          <h4 className="font-medium text-gray-800">
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
                          <h4 className="font-medium text-gray-800">
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
                    
                    <div className="border-t border-gray-200 p-4">
                      <label className="flex items-start space-x-3 rtl:space-x-reverse cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          {...register('regulation_accepted', {
                            required: isRTL ? 'يجب الموافقة على القوانين الداخلية' : 'Vous devez accepter le règlement intérieur'
                          })}
                          disabled={!regulationScrolled}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
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
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isRTL ? 'مراجعة الطلب' : 'Révision de la demande'}
                    </h2>
                  </div>

                  {/* Informations de l'enfant */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900">
                      {isRTL ? 'معلومات الطفل:' : 'Informations de l\'enfant :'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{isRTL ? 'الاسم:' : 'Nom :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium">
                          {watch('child_first_name')} {watch('child_last_name')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">{isRTL ? 'تاريخ الميلاد:' : 'Date de naissance :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium">
                          {watch('birth_date')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">{isRTL ? 'الجنس:' : 'Sexe :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium">
                          {watch('gender') === 'M' ? (isRTL ? 'ذكر' : 'Masculin') : (isRTL ? 'أنثى' : 'Féminin')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">{isRTL ? 'تاريخ التسجيل:' : 'Date d\'inscription :'}</span>
                        <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium">
                          {watch('enrollment_date')}
                        </span>
                      </div>
                      {watch('emergency_contact_name') && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600">{isRTL ? 'جهة الاتصال للطوارئ:' : 'Contact d\'urgence :'}</span>
                          <span className="ml-2 rtl:ml-0 rtl:mr-2 font-medium">
                            {watch('emergency_contact_name')} - {watch('emergency_contact_phone')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options sélectionnées */}
                  <div className="bg-primary-50 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900">
                      {isRTL ? 'الخيارات المحددة:' : 'Options sélectionnées :'}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className={`w-4 h-4 ${watch('lunch_assistance') ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={watch('lunch_assistance') ? 'text-green-800 font-medium' : 'text-gray-600'}>
                          {isRTL ? 'المساعدة في الغداء' : 'Assistance au déjeuner'}
                          {watch('lunch_assistance') && (
                            <span className="text-xs text-gray-500 ml-1 rtl:ml-0 rtl:mr-1">
                              (+50 TND/mois)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className={`w-4 h-4 ${watch('regulation_accepted') ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={watch('regulation_accepted') ? 'text-green-800 font-medium' : 'text-gray-600'}>
                          {isRTL ? 'الموافقة على القوانين الداخلية' : 'Règlement intérieur accepté'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      {isRTL 
                        ? 'سيتم مراجعة طلبكم من قبل فريقنا وسنتواصل معكم قريباً.'
                        : 'Votre demande sera examinée par notre équipe et nous vous recontacterons bientôt.'
                      }
                    </p>
                  </div>

                  {/* Mention importante sur les documents originaux */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-2">
                          {isRTL ? '⚠️ تذكير مهم' : '⚠️ Rappel important'}
                        </h3>
                        <p className="text-orange-800 text-sm">
                          {isRTL 
                            ? 'يجب عليكم إحضار جميع الوثائق الأصلية (الدفتر الطبي، شهادة الميلاد، الشهادة الطبية) والنظام الداخلي موقع يوم التسجيل النهائي في الحضانة للتحقق منها.'
                            : 'Vous devez apporter tous les documents originaux (carnet médical, acte de naissance, certificat médical) et le règlement intérieur signé le jour de l\'inscription définitive à la crèche pour vérification.'
                          }
                        </p>
                        <p className="text-orange-700 text-xs mt-2 font-medium">
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
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-secondary flex items-center"
                  >
                    <ArrowLeft className={`w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 ${isRTL ? 'rotate-180' : ''}`} />
                    {isRTL ? 'السابق' : 'Précédent'}
                  </button>
                )}

                <div className={step === 1 ? 'ml-auto rtl:ml-0 rtl:mr-auto' : ''}>
                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn-primary flex items-center"
                      disabled={step === 4 && !regulationScrolled}
                    >
                      {isRTL ? 'التالي' : 'Suivant'}
                      <ArrowRight className={`w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex items-center"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <Send className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
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
        <div className="mt-8 text-center text-gray-600">
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
