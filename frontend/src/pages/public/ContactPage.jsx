import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { contactService } from '../../services/contactService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ContactPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      await contactService.createContact(data)
      toast.success(t('contact.success'))
      reset()
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi du message')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: t('contact.info.address'),
      content: isRTL ? '8 نهج بنزرت، مدنين 4100، تونس' : '8 Rue Bizerte, Medenine 4100, Tunisie',
      color: 'text-red-600'
    },
    {
      icon: Phone,
      title: t('contact.info.phone'),
      content: '+216 25 95 35 32',
      color: 'text-green-600'
    },
    {
      icon: Mail,
      title: t('contact.info.email'),
      content: 'contact@mimaelghalia.tn',
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      title: t('contact.info.hours'),
      content: isRTL ? 'الإثنين - الجمعة: 7:00 - 18:00، السبت: 8:00 - 12:00' : 'Lun - Ven: 7h00 - 18h00, Sam: 8h00 - 12h00',
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Informations de contact */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('contact.info.title')}
              </h2>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  return (
                    <div key={index} className="flex items-start space-x-4 rtl:space-x-reverse">
                      <div className={`flex-shrink-0 w-12 h-12 ${info.color} bg-gray-100 rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {info.title}
                        </h3>
                        <p className="text-gray-600">
                          {info.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Carte (placeholder) */}
            <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2" />
                <p>{isRTL ? 'خريطة الموقع' : 'Carte de localisation'}</p>
                <p className="text-sm">
                  {isRTL ? 'قريباً...' : 'Bientôt disponible...'}
                </p>
              </div>
            </div>

            {/* Heures d'ouverture détaillées */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('contact.info.hours')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {isRTL ? 'الإثنين - الجمعة' : 'Lundi - Vendredi'}
                    </span>
                    <span className="font-medium">7:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {isRTL ? 'السبت' : 'Samedi'}
                    </span>
                    <span className="font-medium">8:00 - 12:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {isRTL ? 'الأحد' : 'Dimanche'}
                    </span>
                    <span className="font-medium text-red-600">
                      {isRTL ? 'مغلق' : 'Fermé'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de contact */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
                <MessageSquare className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {isRTL ? 'أرسل لنا رسالة' : 'Envoyez-nous un message'}
                </h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="form-group">
                  <label className="form-label">
                    {t('contact.name')} *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? 'border-error-500' : ''}`}
                    placeholder={isRTL ? 'اسمكم الكامل' : 'Votre nom complet'}
                    {...register('name', {
                      required: t('validation.required'),
                      minLength: {
                        value: 2,
                        message: t('validation.minLength', { min: 2 })
                      }
                    })}
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">
                      {t('contact.email')} *
                    </label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'border-error-500' : ''}`}
                      placeholder={isRTL ? 'بريدكم الإلكتروني' : 'Votre email'}
                      {...register('email', {
                        required: t('validation.required'),
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: t('validation.email')
                        }
                      })}
                    />
                    {errors.email && (
                      <p className="form-error">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('contact.phone')}
                    </label>
                    <input
                      type="tel"
                      className={`form-input ${errors.phone ? 'border-error-500' : ''}`}
                      placeholder={isRTL ? 'رقم هاتفكم' : 'Votre téléphone'}
                      {...register('phone', {
                        pattern: {
                          value: /^[+]?[\d\s\-()]+$/,
                          message: t('validation.phone')
                        }
                      })}
                    />
                    {errors.phone && (
                      <p className="form-error">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('contact.subject')} *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.subject ? 'border-error-500' : ''}`}
                    placeholder={isRTL ? 'موضوع رسالتكم' : 'Sujet de votre message'}
                    {...register('subject', {
                      required: t('validation.required'),
                      minLength: {
                        value: 5,
                        message: t('validation.minLength', { min: 5 })
                      }
                    })}
                  />
                  {errors.subject && (
                    <p className="form-error">{errors.subject.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('contact.message')} *
                  </label>
                  <textarea
                    rows={6}
                    className={`form-input ${errors.message ? 'border-error-500' : ''}`}
                    placeholder={isRTL ? 'اكتبوا رسالتكم هنا...' : 'Écrivez votre message ici...'}
                    {...register('message', {
                      required: t('validation.required'),
                      minLength: {
                        value: 20,
                        message: t('validation.minLength', { min: 20 })
                      }
                    })}
                  />
                  {errors.message && (
                    <p className="form-error">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      <Send className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('contact.send')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isRTL ? 'الأسئلة الشائعة' : 'Questions fréquentes'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                question: isRTL ? 'ما هي أعمار الأطفال المقبولين؟' : 'Quels sont les âges acceptés ?',
                answer: isRTL ? 'نقبل الأطفال من عمر شهرين إلى 3 سنوات.' : 'Nous accueillons les enfants de 2 mois à 3 ans.'
              },
              {
                question: isRTL ? 'ما هي ساعات العمل؟' : 'Quels sont les horaires ?',
                answer: isRTL ? 'من الإثنين إلى الجمعة من 7:00 إلى 18:00، السبت من 8:00 إلى 12:00.' : 'Du lundi au vendredi de 7h00 à 18h00, samedi de 8h00 à 12h00.'
              },
              {
                question: isRTL ? 'هل تقدمون وجبات الطعام؟' : 'Proposez-vous les repas ?',
                answer: isRTL ? 'نعم، نقدم وجبات صحية ومتوازنة.' : 'Oui, nous proposons des repas sains et équilibrés.'
              },
              {
                question: isRTL ? 'كيف يمكنني زيارة الحضانة؟' : 'Comment puis-je visiter la crèche ?',
                answer: isRTL ? 'يمكنكم حجز موعد للزيارة عبر الاتصال بنا.' : 'Vous pouvez prendre rendez-vous en nous contactant.'
              }
            ].map((faq, index) => (
              <div key={index} className="card">
                <div className="card-body">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
