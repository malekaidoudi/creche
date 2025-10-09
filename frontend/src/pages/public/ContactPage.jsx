import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  MessageSquare, 
  CheckCircle,
  User,
  MessageCircle,
  Globe
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import toast from 'react-hot-toast'

const ContactPage = () => {
  const { isRTL } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // Informations par défaut de la crèche
  const nurseryInfo = {
    name: 'Mima Elghalia',
    nameAr: 'ميما الغالية',
    address: '8 Rue Bizerte, Medenine 4100, Tunisie',
    addressAr: '8 نهج بنزرت، مدنين 4100، تونس',
    phone: '+216 25 95 35 32',
    email: 'contact@mimaelghalia.tn'
  }
  
  const mapAddress = nurseryInfo.address
  
  const getFormattedOpeningHours = (isRTL) => {
    return isRTL ? 'الإثنين - الجمعة: 7:00 - 18:00، السبت: 8:00 - 12:00' : 'Lun - Ven: 7h00 - 18h00, Sam: 8h00 - 12h00'
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      
      // Simuler l'envoi du message
      console.log('Message de contact:', data)
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSubmitted(true)
      toast.success(isRTL ? 'تم إرسال رسالتك بنجاح' : 'Votre message a été envoyé avec succès')
      reset()
      
      // Reset submitted state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000)
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      toast.error(isRTL ? 'خطأ في إرسال الرسالة' : 'Erreur lors de l\'envoi du message')
    } finally {
      setLoading(false)
    }
  }

  // Contact information
  const contactInfo = [
    {
      icon: MapPin,
      title: isRTL ? 'العنوان' : 'Adresse',
      content: isRTL ? (nurseryInfo.addressAr || nurseryInfo.address) : nurseryInfo.address,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Phone,
      title: isRTL ? 'الهاتف' : 'Téléphone',
      content: nurseryInfo.phone,
      gradient: 'from-green-500 to-emerald-500',
      isPhone: true // Marqueur pour le traitement spécial RTL
    },
    {
      icon: Mail,
      title: isRTL ? 'البريد الإلكتروني' : 'Email',
      content: nurseryInfo.email,
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Clock,
      title: isRTL ? 'ساعات العمل' : 'Horaires',
      content: getFormattedOpeningHours(isRTL),
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {isRTL ? 'تواصل معنا' : 'Contactez-nous'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {isRTL
              ? 'نحن هنا للإجابة على جميع أسئلتكم ومساعدتكم في رحلة طفلكم التعليمية'
              : 'Nous sommes là pour répondre à toutes vos questions et vous accompagner dans le parcours éducatif de votre enfant'
            }
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            <motion.div variants={fadeInUp}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {isRTL ? 'معلومات الاتصال' : 'Informations de contact'}
              </h2>
              <div className="grid gap-6">
                {contactInfo.map((info, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${info.gradient} p-3 group-hover:scale-110 transition-transform duration-300`}>
                            <info.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {info.title}
                            </h3>
                            <p 
                              className={`text-gray-600 dark:text-gray-300 ${info.isPhone ? 'ltr' : ''}`}
                              dir={info.isPhone ? 'ltr' : undefined}
                            >
                              {info.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Map */}
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Globe className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'موقعنا' : 'Notre localisation'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full h-64 relative">
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-b-lg"
                      title={isRTL ? 'موقع الحضانة على الخريطة' : 'Localisation de la crèche'}
                    />
                    {/* Overlay avec adresse au survol */}
                    <div className="absolute top-2 left-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-300 truncate">
                          {mapAddress}
                        </p>
                      </div>
                    </div>
                    {/* Bouton pour ouvrir dans Google Maps */}
                    <div className="absolute bottom-2 right-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 rounded-lg shadow-sm transition-all duration-200 flex items-center text-xs"
                      >
                        <Globe className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {isRTL ? 'فتح في خرائط جوجل' : 'Ouvrir dans Maps'}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-0 bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl text-gray-900 dark:text-white">
                  <MessageSquare className="w-6 h-6 mr-3 rtl:mr-0 rtl:ml-3" />
                  {isRTL ? 'أرسل لنا رسالة' : 'Envoyez-nous un message'}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {isRTL
                    ? 'املأ النموذج أدناه وسنتواصل معك في أقرب وقت ممكن'
                    : 'Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {isRTL ? 'تم إرسال رسالتك!' : 'Message envoyé !'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {isRTL
                        ? 'شكراً لتواصلك معنا. سنرد عليك قريباً.'
                        : 'Merci de nous avoir contactés. Nous vous répondrons bientôt.'
                      }
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name and Email */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isRTL ? 'الاسم الكامل' : 'Nom complet'}
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            {...register('name', { required: true })}
                            className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                              errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Entrez votre nom complet'}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {isRTL ? 'الاسم مطلوب' : 'Le nom est requis'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isRTL ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
                            className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                              errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Entrez votre email'}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {isRTL ? 'بريد إلكتروني صحيح مطلوب' : 'Email valide requis'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          {...register('phone')}
                          className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                          placeholder={isRTL ? 'أدخل رقم هاتفك (اختياري)' : 'Entrez votre téléphone (optionnel)'}
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الموضوع' : 'Sujet'}
                      </label>
                      <select
                        {...register('subject', { required: true })}
                        className={`w-full px-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                          errors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <option value="">{isRTL ? 'اختر الموضوع' : 'Sélectionnez un sujet'}</option>
                        <option value="inscription">{isRTL ? 'استفسار عن التسجيل' : 'Demande d\'inscription'}</option>
                        <option value="information">{isRTL ? 'طلب معلومات' : 'Demande d\'information'}</option>
                        <option value="visit">{isRTL ? 'طلب زيارة' : 'Demande de visite'}</option>
                        <option value="other">{isRTL ? 'أخرى' : 'Autre'}</option>
                      </select>
                      {errors.subject && (
                        <p className="text-red-500 text-sm mt-1">
                          {isRTL ? 'الموضوع مطلوب' : 'Le sujet est requis'}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الرسالة' : 'Message'}
                      </label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 rtl:left-auto rtl:right-3 top-3 text-gray-400 w-5 h-5" />
                        <textarea
                          {...register('message', { required: true, minLength: 10 })}
                          rows={5}
                          className={`w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none ${
                            errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Écrivez votre message ici...'}
                        />
                      </div>
                      {errors.message && (
                        <p className="text-red-500 text-sm mt-1">
                          {isRTL ? 'رسالة من 10 أحرف على الأقل مطلوبة' : 'Message de 10 caractères minimum requis'}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 text-lg font-semibold group"
                      size="lg"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                          {isRTL ? 'إرسال الرسالة' : 'Envoyer le message'}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'الأسئلة الشائعة' : 'Questions fréquentes'}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {isRTL ? 'إجابات على الأسئلة الأكثر شيوعاً' : 'Réponses aux questions les plus courantes'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                question: isRTL ? 'ما هي الأعمار المقبولة؟' : 'Quels sont les âges acceptés ?',
                answer: isRTL ? 'نقبل الأطفال من عمر شهرين إلى 3 سنوات' : 'Nous accueillons les enfants de 2 mois à 3 ans'
              },
              {
                question: isRTL ? 'ما هي ساعات العمل؟' : 'Quels sont les horaires ?',
                answer: isRTL ? 'من الإثنين إلى الجمعة من 7:00 إلى 18:00' : 'Du lundi au vendredi de 7h00 à 18h00'
              },
              {
                question: isRTL ? 'هل تقدمون وجبات الطعام؟' : 'Proposez-vous les repas ?',
                answer: isRTL ? 'نعم، نقدم وجبات صحية ومتوازنة' : 'Oui, nous proposons des repas sains et équilibrés'
              },
              {
                question: isRTL ? 'كيف يمكنني زيارة الحضانة؟' : 'Comment puis-je visiter la crèche ?',
                answer: isRTL ? 'يمكنكم حجز موعد للزيارة عبر الهاتف أو البريد الإلكتروني' : 'Vous pouvez prendre rendez-vous par téléphone ou email'
              }
            ].map((faq, index) => (
              <Card key={index} className="border-0 bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ContactPage
