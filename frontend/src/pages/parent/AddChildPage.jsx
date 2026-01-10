import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useLanguage } from '../../contexts/LanguageContext'
import { useDialogContext } from '../../contexts/DialogContext'
import api from '../../services/api'
import { convertToISO } from '../../utils/dateUtils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import DatePicker from '../../components/ui/DatePicker'
import DocumentUpload from '../../components/ui/DocumentUpload'
import {
    Baby,
    Upload,
    CheckCircle,
    Send,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    ArrowLeft,
    FileText,
    Download
} from 'lucide-react'

const AddChildPage = () => {
    const { isRTL } = useLanguage()
    const dialog = useDialogContext()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)
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
        setValue
    } = useForm()

    // Gestion des documents
    const handleDocumentChange = (documentType, file) => {
        setDocuments(prev => ({
            ...prev,
            [documentType]: file
        }))

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
        if (regulationRef.current && !regulationScrolled) {
            const { scrollTop, scrollHeight, clientHeight } = regulationRef.current
            const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10
            if (scrolledToBottom) {
                setRegulationScrolled(true)
            }
        }
    }

    const onSubmit = async (data) => {
        try {
            setLoading(true)

            // Validation de la date de naissance
            if (!data.birth_date) {
                dialog.error(isRTL ? 'تاريخ الميلاد مطلوب' : 'La date de naissance est requise')
                setLoading(false)
                return
            }

            // Créer FormData pour l'upload des documents
            const formData = new FormData()
            formData.append('child_first_name', data.child_first_name)
            formData.append('child_last_name', data.child_last_name)
            formData.append('child_birth_date', convertToISO(data.birth_date))
            formData.append('child_gender', data.gender)
            if (data.medical_info) {
                formData.append('medical_info', data.medical_info)
            }

            // Ajouter les documents
            if (documents.carnet_medical) {
                formData.append('carnet_medical', documents.carnet_medical)
            }
            if (documents.acte_naissance) {
                formData.append('acte_naissance', documents.acte_naissance)
            }
            if (documents.certificat_medical) {
                formData.append('certificat_medical', documents.certificat_medical)
            }

            const response = await api.post('/api/enrollments/add-child', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (response.data.success) {
                dialog.success(isRTL
                    ? 'تم إرسال طلب التسجيل بنجاح! سيتم مراجعته قريباً.'
                    : 'Demande d\'inscription envoyée avec succès ! Elle sera examinée prochainement.')
                navigate('/mon-espace')
            }

        } catch (error) {
            console.error('Erreur ajout enfant:', error)
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في إرسال الطلب' : 'Erreur lors de l\'envoi de la demande'))
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => {
        if (step === 2) {
            if (!validateDocuments()) {
                dialog.error(isRTL ? 'يرجى تحميل جميع الوثائق المطلوبة' : 'Veuillez télécharger tous les documents requis')
                return
            }
        }
        setStep(prev => Math.min(prev + 1, 3))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/mon-espace')}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
                    >
                        <ArrowLeft className={`w-5 h-5 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {isRTL ? 'العودة إلى حسابي' : 'Retour à mon espace'}
                    </button>

                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {isRTL ? 'إضافة طفل جديد' : 'Ajouter un enfant'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        {isRTL
                            ? 'أكمل النموذج أدناه لتسجيل طفل جديد'
                            : 'Complétez le formulaire ci-dessous pour inscrire un nouvel enfant'
                        }
                    </p>
                </div>

                {/* Barre de progression */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {[1, 2, 3].map((stepNumber) => (
                            <div key={stepNumber} className="flex items-center flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step === stepNumber
                                        ? 'bg-primary-600 text-white'
                                        : step > stepNumber
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}>
                                    {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
                                </div>
                                {stepNumber < 3 && (
                                    <div className={`flex-1 h-1 mx-2 ${step > stepNumber ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            {step === 1 && (isRTL ? 'معلومات الطفل' : 'Informations de l\'enfant')}
                            {step === 2 && (isRTL ? 'الوثائق المطلوبة' : 'Documents requis')}
                            {step === 3 && (isRTL ? 'التأكيد' : 'Confirmation')}
                        </span>
                    </div>
                </div>

                {/* Formulaire */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
                >
                    <div className="p-6 md:p-8">
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
                                        {/* Prénom */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {isRTL ? 'الاسم الأول' : 'Prénom'} *
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.child_first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                placeholder={isRTL ? 'الاسم الأول للطفل' : 'Prénom de l\'enfant'}
                                                {...register('child_first_name', {
                                                    required: isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis'
                                                })}
                                            />
                                            {errors.child_first_name && (
                                                <p className="text-red-500 text-sm mt-1">{errors.child_first_name.message}</p>
                                            )}
                                        </div>

                                        {/* Nom */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {isRTL ? 'اسم العائلة' : 'Nom de famille'} *
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.child_last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                placeholder={isRTL ? 'اسم العائلة' : 'Nom de famille'}
                                                {...register('child_last_name', {
                                                    required: isRTL ? 'اسم العائلة مطلوب' : 'Le nom de famille est requis'
                                                })}
                                            />
                                            {errors.child_last_name && (
                                                <p className="text-red-500 text-sm mt-1">{errors.child_last_name.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date de naissance */}
                                    <DatePicker
                                        label={isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}
                                        required
                                        value={watch('birth_date')}
                                        onChange={(value) => setValue('birth_date', value)}
                                        error={errors.birth_date?.message}
                                    />

                                    {/* Genre */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isRTL ? 'الجنس' : 'Sexe'} *
                                        </label>
                                        <div className="flex space-x-4 rtl:space-x-reverse">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="M"
                                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                    {...register('gender', {
                                                        required: isRTL ? 'الجنس مطلوب' : 'Le sexe est requis'
                                                    })}
                                                />
                                                <span className="ml-2 rtl:ml-0 rtl:mr-2 text-gray-700 dark:text-gray-300">
                                                    {isRTL ? 'ذكر' : 'Masculin'}
                                                </span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="F"
                                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                    {...register('gender')}
                                                />
                                                <span className="ml-2 rtl:ml-0 rtl:mr-2 text-gray-700 dark:text-gray-300">
                                                    {isRTL ? 'أنثى' : 'Féminin'}
                                                </span>
                                            </label>
                                        </div>
                                        {errors.gender && (
                                            <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                                        )}
                                    </div>

                                    {/* Informations médicales */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isRTL ? 'معلومات طبية (اختياري)' : 'Informations médicales (optionnel)'}
                                        </label>
                                        <textarea
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder={isRTL ? 'الحساسية، الأمراض المزمنة، إلخ.' : 'Allergies, maladies chroniques, etc.'}
                                            {...register('medical_info')}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Étape 2: Documents requis */}
                            {step === 2 && (
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
                                        <DocumentUpload
                                            documentType="carnet_medical"
                                            label={isRTL ? 'الدفتر الطبي' : 'Carnet médical'}
                                            description={isRTL ? 'دفتر التطعيمات والمتابعة الطبية' : 'Carnet de vaccination et suivi médical'}
                                            required={true}
                                            onFileChange={(file) => handleDocumentChange('carnet_medical', file)}
                                            value={documents.carnet_medical}
                                            error={documentErrors.carnet_medical}
                                        />

                                        <DocumentUpload
                                            documentType="acte_naissance"
                                            label={isRTL ? 'شهادة الميلاد' : 'Acte de naissance'}
                                            description={isRTL ? 'نسخة من شهادة الميلاد' : 'Copie de l\'acte de naissance'}
                                            required={true}
                                            onFileChange={(file) => handleDocumentChange('acte_naissance', file)}
                                            value={documents.acte_naissance}
                                            error={documentErrors.acte_naissance}
                                        />

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
                                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mt-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    {isRTL ? 'النظام الداخلي للحضانة' : 'Règlement intérieur de la crèche'}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                    {isRTL
                                                        ? 'قم بتحميل ومراجعة النظام الداخلي'
                                                        : 'Téléchargez et consultez le règlement'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => window.open('/creche/reg-interne-mimaelghalia.pdf', '_blank')}
                                                className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap text-sm"
                                            >
                                                <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                                {isRTL ? 'تحميل' : 'Télécharger'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Étape 3: Confirmation */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {isRTL ? 'تأكيد الطلب' : 'Confirmation de la demande'}
                                        </h2>
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                                        <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h3 className="font-medium text-green-900 dark:text-green-300">
                                                    {isRTL ? 'جاهز للإرسال' : 'Prêt à envoyer'}
                                                </h3>
                                                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                                                    {isRTL
                                                        ? 'يرجى مراجعة المعلومات قبل إرسال الطلب'
                                                        : 'Veuillez vérifier les informations avant d\'envoyer la demande'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Récapitulatif */}
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
                                        </div>
                                    </div>

                                    {/* Documents uploadés */}
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {isRTL ? 'الوثائق المرفقة:' : 'Documents joints :'}
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            {['carnet_medical', 'acte_naissance', 'certificat_medical'].map((docType) => (
                                                <div key={docType} className="flex items-center space-x-2 rtl:space-x-reverse">
                                                    <CheckCircle className={`w-4 h-4 ${documents[docType] ? 'text-green-600' : 'text-gray-400'}`} />
                                                    <span className={documents[docType] ? 'text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}>
                                                        {docType === 'carnet_medical' && (isRTL ? 'الدفتر الطبي' : 'Carnet médical')}
                                                        {docType === 'acte_naissance' && (isRTL ? 'شهادة الميلاد' : 'Acte de naissance')}
                                                        {docType === 'certificat_medical' && (isRTL ? 'الشهادة الطبية' : 'Certificat médical')}
                                                        {documents[docType] && ` - ${documents[docType].name}`}
                                                    </span>
                                                </div>
                                            ))}
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
                                </div>
                            )}

                            {/* Boutons de navigation */}
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-base font-medium"
                                    >
                                        <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                        {isRTL ? 'السابق' : 'Précédent'}
                                    </button>
                                )}

                                <div className={step === 1 ? 'sm:ml-auto sm:rtl:ml-0 sm:rtl:mr-auto w-full sm:w-auto' : 'w-full sm:w-auto'}>
                                    {step < 3 ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-base font-medium w-full sm:w-auto"
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
                </motion.div>
            </div>
        </div>
    )
}

export default AddChildPage
