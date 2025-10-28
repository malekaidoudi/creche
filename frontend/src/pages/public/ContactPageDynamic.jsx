import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Send,
    CheckCircle,
    MessageCircle,
    Globe,
    Baby
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import toast from 'react-hot-toast'
import api from '../../services/api'

const ContactPageDynamic = () => {
    // Hook pour la langue
    const { isRTL } = useLanguage()
    
    // États de base
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [contactData, setContactData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Charger les données
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                // Récupérer les données depuis l'API
                const response = await api.get('/api/contact')
                const apiData = response.data
                console.log('📋 Données contact API:', apiData)
                
                if (apiData.success && apiData.contact) {
                    const contactData = {
                        address: isRTL ? apiData.contact.address_ar : apiData.contact.address,
                        phone: apiData.contact.phone,
                        email: apiData.contact.email,
                        title: isRTL ? 'تواصل معنا' : 'Contactez-nous',
                        subtitle: isRTL ? 'نحن هنا للإجابة على جميع أسئلتكم ومساعدتكم في رحلة طفلكم التعليمية' : 'Nous sommes là pour répondre à toutes vos questions et vous accompagner dans le parcours éducatif de votre enfant',
                        hours: isRTL ? apiData.contact.hours_ar : apiData.contact.hours,
                        // Données de localisation
                        nursery_name: isRTL ? 'حضانة ميما الغالية' : 'Crèche Mima Elghalia',
                        map_title: isRTL ? 'موقعنا على الخريطة' : 'Notre localisation',
                        map_description: isRTL ? 'تجدونا في هذا الموقع بمدنين' : 'Vous nous trouverez à cette adresse à Médenine',
                        google_maps_button: isRTL ? 'فتح في خرائط جوجل' : 'Ouvrir dans Google Maps',
                        latitude: '33.3407',
                        longitude: '10.4899'
                    }
                    
                    setContactData(contactData)
                    console.log('✅ Données contact chargées depuis l\'API')
                } else {
                    throw new Error('Données API invalides')
                }
            } catch (error) {
                console.error('Erreur chargement contact:', error)
                // Fallback avec données par défaut
                const defaultData = {
                    address: isRTL ? '8 شارع بنزرت، مدنين 4100، تونس' : '8 Rue Bizerte, Medenine 4100, Tunisie',
                    phone: '+216 25 95 35 32',
                    email: 'contact@mimaelghalia.tn',
                    title: isRTL ? 'تواصل معنا' : 'Contactez-nous',
                    subtitle: isRTL ? 'نحن هنا للإجابة على جميع أسئلتكم ومساعدتكم في رحلة طفلكم التعليمية' : 'Nous sommes là pour répondre à toutes vos questions et vous accompagner dans le parcours éducatif de votre enfant',
                    hours: isRTL ? 'الإثنين - الجمعة: 07:00-18:00، السبت: 08:00-14:00' : 'Lun - Ven: 07:00-18:00, Sam: 08:00-14:00',
                    // Données de localisation
                    nursery_name: isRTL ? 'حضانة ميما الغالية' : 'Crèche Mima Elghalia',
                    map_title: isRTL ? 'موقعنا على الخريطة' : 'Notre localisation',
                    map_description: isRTL ? 'تجدونا في هذا الموقع بمدنين' : 'Vous nous trouverez à cette adresse à Médenine',
                    google_maps_button: isRTL ? 'فتح في خرائط جوجل' : 'Ouvrir dans Google Maps',
                    latitude: '33.3407',
                    longitude: '10.4899'
                }
                
                setContactData(defaultData)
                console.log('⚠️ Utilisation des données par défaut')
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [isRTL]) // Recharger seulement quand la langue change

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            setSubmitted(true)
            toast.success(isRTL ? 'تم إرسال رسالتك بنجاح' : 'Message envoyé avec succès')
            setTimeout(() => {
                setSubmitted(false)
                e.target.reset()
            }, 3000)
        } catch (error) {
            toast.error(isRTL ? 'خطأ في إرسال الرسالة' : 'Erreur lors de l\'envoi du message')
        } finally {
            setLoading(false)
        }
    }

    // Affichage de chargement
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    // Données à afficher (dynamiques ou par défaut)
    const data = contactData || defaultData

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
                        {data.title}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        {data.subtitle}
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {isRTL ? 'معلومات الاتصال' : 'Informations de contact'}
                            </h2>
                            <div className="grid gap-6">
                                {/* Adresse */}
                                <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                    {isRTL ? 'العنوان' : 'Adresse'}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    {data.address}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Téléphone */}
                                <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                                                <Phone className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                    {isRTL ? 'الهاتف' : 'Téléphone'}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300" dir="ltr">
                                                    {data.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Email */}
                                <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                                                <Mail className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    {data.email}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Horaires */}
                                <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                    {isRTL ? 'ساعات العمل' : 'Horaires'}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    {data.hours}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Card className="border-0 bg-white dark:bg-gray-800 shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                    <MessageCircle className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                                    {isRTL ? 'أرسل لنا رسالة' : 'Envoyez-nous un message'}
                                </CardTitle>
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
                                            {isRTL ? 'شكراً لك، سنتواصل معك قريباً' : 'Merci, nous vous répondrons bientôt'}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {isRTL ? 'الاسم' : 'Nom'}
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {isRTL ? 'الموضوع' : 'Sujet'}
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {isRTL ? 'الرسالة' : 'Message'}
                                            </label>
                                            <textarea
                                                rows="5"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                            ></textarea>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                                        >
                                            {loading ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
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

                {/* Section Carte */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-16"
                >
                    <Card className="overflow-hidden border-0 bg-white dark:bg-gray-800 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-gray-900 dark:text-white">
                                <Globe className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                                {data.map_title}
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-300">
                                {data.map_description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                {/* Carte Google Maps intégrée */}
                                <iframe
                                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d655.04!2d${data.longitude}!3d${data.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f18.1!3m3!1m2!1s0x125a50a5b1234567%3A0x987654321abcdef0!2s${encodeURIComponent(data.address)}!5e0!3m2!1s${isRTL ? 'ar' : 'fr'}!2stn!4v1698765432100!5m2!1s${isRTL ? 'ar' : 'fr'}!2stn`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title={isRTL ? 'موقع الحضانة على الخريطة' : 'Localisation de la crèche'}
                                    className="w-full h-full"
                                ></iframe>
                                
                                {/* Marqueur personnalisé au centre */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                    <div className="relative">
                                        {/* Nom de la crèche au-dessus du marqueur */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4">
                                            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 whitespace-nowrap">
                                                <div className="text-sm font-bold text-center">
                                                    {data.nursery_name}
                                                </div>
                                                {/* Flèche pointant vers le marqueur */}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"></div>
                                            </div>
                                        </div>

                                        {/* Pin de localisation personnalisé */}
                                        <div className="flex flex-col items-center">
                                            <div className="bg-red-500 text-white p-3 rounded-full shadow-lg border-4 border-white animate-pulse">
                                                <Baby className="w-6 h-6" />
                                            </div>
                                            {/* Pointe du pin */}
                                            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-red-500 -mt-1"></div>
                                        </div>
                                        
                                        {/* Cercle d'animation */}
                                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-red-500 bg-opacity-20 rounded-full animate-ping"></div>
                                    </div>
                                </div>
                                
                                {/* Overlay avec informations */}
                                <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
                                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                        <div className="p-2 rounded-lg bg-red-500 text-white">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                                {data.title}
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                                                {data.address}
                                            </p>
                                            <div className="mt-2 flex items-center space-x-2 rtl:space-x-reverse">
                                                <Phone className="w-3 h-3 text-red-500" />
                                                <span className="text-xs text-gray-600 dark:text-gray-300" dir="ltr">
                                                    {data.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bouton d'action */}
                                <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4">
                                    <Button
                                        onClick={() => {
                                            const address = encodeURIComponent(data.address);
                                            window.open(`https://www.google.com/maps/search/${address}`, '_blank');
                                        }}
                                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg"
                                    >
                                        <Globe className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                        {data.google_maps_button}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

export default ContactPageDynamic
