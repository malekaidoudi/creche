import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Baby, User, Calendar, Phone, Send, CheckCircle } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const EnrollmentPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Simuler l'envoi des données d'inscription
      const enrollmentData = {
        // Données de l'enfant
        child_first_name: data.child_first_name,
        child_last_name: data.child_last_name,
        birth_date: data.birth_date,
        gender: data.gender,
        
        // Données du parent
        parent_first_name: data.parent_first_name,
        parent_last_name: data.parent_last_name,
        parent_phone: data.parent_phone,
        parent_email: data.parent_email,
        
        // Informations complémentaires
        medical_info: data.medical_info,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        notes: data.notes
      }

      // Ici on pourrait appeler une API simplifiée
      console.log('Données d\'inscription:', enrollmentData)
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSubmitted(true)
      toast.success(isRTL ? 'تم إرسال طلب التسجيل بنجاح' : 'Demande d\'inscription envoyée avec succès')
      reset()
      
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      toast.error(isRTL ? 'خطأ في إرسال طلب التسجيل' : 'Erreur lors de l\'envoi de la demande')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {isRTL ? 'تم إرسال طلبك بنجاح!' : 'Demande envoyée avec succès !'}
            </h1>
            <p className="text-gray-600 mb-8">
              {isRTL 
                ? 'سنتواصل معك قريباً لمتابعة إجراءات التسجيل'
                : 'Nous vous contacterons bientôt pour finaliser l\'inscription'
              }
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-primary"
            >
              {isRTL ? 'طلب جديد' : 'Nouvelle demande'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isRTL ? 'تسجيل طفل جديد' : 'Inscription d\'un enfant'}
          </h1>
          <p className="text-xl text-gray-600">
            {isRTL 
              ? 'املأ النموذج أدناه لتسجيل طفلك في حضانة ميما الغالية'
              : 'Remplissez le formulaire ci-dessous pour inscrire votre enfant à la crèche Mima Elghalia'
            }
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Section Enfant */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-6">
                <Baby className="w-6 h-6 text-primary-600 mr-3 rtl:mr-0 rtl:ml-3" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  {isRTL ? 'معلومات الطفل' : 'Informations de l\'enfant'}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'الاسم الأول' : 'Prénom'}
                  </label>
                  <input
                    type="text"
                    {...register('child_first_name', { required: true })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.child_first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isRTL ? 'أدخل الاسم الأول' : 'Entrez le prénom'}
                  />
                  {errors.child_first_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'اسم العائلة' : 'Nom de famille'}
                  </label>
                  <input
                    type="text"
                    {...register('child_last_name', { required: true })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.child_last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isRTL ? 'أدخل اسم العائلة' : 'Entrez le nom de famille'}
                  />
                  {errors.child_last_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {isRTL ? 'اسم العائلة مطلوب' : 'Le nom de famille est requis'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}
                  </label>
                  <input
                    type="date"
                    {...register('birth_date', { required: true })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.birth_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.birth_date && (
                    <p className="text-red-500 text-sm mt-1">
                      {isRTL ? 'تاريخ الميلاد مطلوب' : 'La date de naissance est requise'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'الجنس' : 'Sexe'}
                  </label>
                  <select
                    {...register('gender', { required: true })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.gender ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{isRTL ? 'اختر الجنس' : 'Sélectionnez le sexe'}</option>
                    <option value="male">{isRTL ? 'ذكر' : 'Garçon'}</option>
                    <option value="female">{isRTL ? 'أنثى' : 'Fille'}</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">
                      {isRTL ? 'الجنس مطلوب' : 'Le sexe est requis'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Parent */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-6">
                <User className="w-6 h-6 text-primary-600 mr-3 rtl:mr-0 rtl:ml-3" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  {isRTL ? 'معلومات ولي الأمر' : 'Informations du parent'}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'الاسم الأول' : 'Prénom'}
                  </label>
                  <input
                    type="text"
                    {...register('parent_first_name', { required: true })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.parent_first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isRTL ? 'أدخل الاسم الأول' : 'Entrez le prénom'}
                  />
                  {errors.parent_first_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'اسم العائلة' : 'Nom de famille'}
                  </label>
                  <input
                    type="text"
                    {...register('parent_last_name', { required: true })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.parent_last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isRTL ? 'أدخل اسم العائلة' : 'Entrez le nom de famille'}
                  />
                  {errors.parent_last_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {isRTL ? 'اسم العائلة مطلوب' : 'Le nom de famille est requis'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                  </label>
                  <input
                    type="tel"
                    {...register('parent_phone', { required: true })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.parent_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Entrez le numéro de téléphone'}
                  />
                  {errors.parent_phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {isRTL ? 'رقم الهاتف مطلوب' : 'Le téléphone est requis'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    {...register('parent_email', { required: true })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.parent_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={isRTL ? 'أدخل البريد الإلكتروني' : 'Entrez l\'email'}
                  />
                  {errors.parent_email && (
                    <p className="text-red-500 text-sm mt-1">
                      {isRTL ? 'البريد الإلكتروني مطلوب' : 'L\'email est requis'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Informations complémentaires */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {isRTL ? 'معلومات إضافية' : 'Informations complémentaires'}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'معلومات طبية' : 'Informations médicales'}
                  </label>
                  <textarea
                    {...register('medical_info')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={isRTL ? 'أي معلومات طبية مهمة (حساسية، أدوية، إلخ)' : 'Allergies, médicaments, conditions médicales, etc.'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isRTL ? 'اسم جهة الاتصال في حالات الطوارئ' : 'Contact d\'urgence - Nom'}
                    </label>
                    <input
                      type="text"
                      {...register('emergency_contact_name')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={isRTL ? 'اسم الشخص للاتصال في حالة الطوارئ' : 'Nom de la personne à contacter'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isRTL ? 'هاتف جهة الاتصال في حالات الطوارئ' : 'Contact d\'urgence - Téléphone'}
                    </label>
                    <input
                      type="tel"
                      {...register('emergency_contact_phone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={isRTL ? 'رقم هاتف جهة الاتصال في حالات الطوارئ' : 'Téléphone du contact d\'urgence'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'ملاحظات إضافية' : 'Notes supplémentaires'}
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={isRTL ? 'أي معلومات إضافية تود مشاركتها' : 'Toute information supplémentaire que vous souhaitez partager'}
                  />
                </div>
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'إرسال طلب التسجيل' : 'Envoyer la demande d\'inscription'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EnrollmentPage
