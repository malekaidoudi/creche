import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Send,
    MessageCircle,
    Copy,
    Check,
    Navigation,
    Compass,
    Sparkles,
    CheckCircle
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useDialogContext } from '../../contexts/DialogContext'
import InteractiveNurseryMap from '../../components/common/InteractiveNurseryMap'
import api, { cachedGet, getStoredCache } from '../../services/api'

const ContactPageDynamic = () => {
    const { isRTL } = useLanguage()
    const dialog = useDialogContext()

    // Coordonnées GPS exactes
    const EXACT_LAT = '33.340592'
    const EXACT_LNG = '10.490699'

    // Initialisation instantanée depuis le cache navigateur persistant si disponible
    const [contactData, setContactData] = useState(() => {
        const cached = getStoredCache('/api/contact/info')
        if (cached?.data?.success && cached?.data?.contact) {
            const c = cached.data.contact
            const rawAddr = isRTL ? c.address_ar : c.address
            const fallbackAddr = isRTL ? c.address : c.address_ar
            return {
                address: rawAddr || fallbackAddr || (isRTL ? '9 نهج لطيف الكسيكسي, مدنين 4100' : '9 Rue Latif Ksiksi, Médenine 4100'),
                phone: c.phone || '+216 25 95 35 32',
                email: c.email || 'contact@mimaelghalia.tn',
                title: isRTL ? 'تواصل معنا' : 'Contactez-nous',
                subtitle: isRTL
                    ? 'نحن هنا للإجابة على جميع أسئلتكم ومساعدتكم في رحلة طفلكم التعليمية في روضة ميما الغالية'
                    : 'Nous sommes là pour répondre à toutes vos questions et vous accompagner dans le parcours éducatif de votre enfant.',
                hours: isRTL ? (c.hours_ar || c.hours) : (c.hours || c.hours_ar),
                nursery_name: isRTL ? (c.nursery_name_ar || 'روضة ميما الغالية') : (c.nursery_name || 'Crèche Mima Elghalia'),
                latitude: c.latitude || EXACT_LAT,
                longitude: c.longitude || EXACT_LNG
            }
        }
        return null
    })
    const [isLoading, setIsLoading] = useState(!contactData)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [copied, setCopied] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })

    // Charger les données de contact
    useEffect(() => {
        const loadData = async () => {
            if (!contactData) setIsLoading(true)
            try {
                const response = await cachedGet('/api/contact/info')
                const apiData = response.data

                if (apiData.success && apiData.contact) {
                    const c = apiData.contact
                    const rawAddr = isRTL ? c.address_ar : c.address
                    const fallbackAddr = isRTL ? c.address : c.address_ar
                    const displayAddr = rawAddr || fallbackAddr || (isRTL ? '9 نهج لطيف الكسيكسي, مدنين 4100' : '9 Rue Latif Ksiksi, Médenine 4100')

                    setContactData({
                        address: displayAddr,
                        phone: c.phone || '+216 25 95 35 32',
                        email: c.email || 'contact@mimaelghalia.tn',
                        title: isRTL ? 'تواصل معنا' : 'Contactez-nous',
                        subtitle: isRTL
                            ? 'نحن هنا للإجابة على جميع أسئلتكم ومساعدتكم في رحلة طفلكم التعليمية في روضة ميما الغالية'
                            : 'Nous sommes là pour répondre à toutes vos questions et vous accompagner dans le parcours éducatif de votre enfant.',
                        hours: isRTL ? (c.hours_ar || c.hours) : (c.hours || c.hours_ar),
                        nursery_name: isRTL ? (c.nursery_name_ar || 'روضة ميما الغالية') : (c.nursery_name || 'Crèche Mima Elghalia'),
                        latitude: c.latitude || EXACT_LAT,
                        longitude: c.longitude || EXACT_LNG
                    })
                } else {
                    throw new Error('Données API invalides')
                }
            } catch (error) {
                console.error('Erreur chargement contact:', error)
                // Fallback avec données exactes harmonisées si aucun cache existant
                setContactData((prev) => {
                    if (prev) return prev
                    return {
                        address: isRTL ? '9 نهج لطيف الكسيكسي, مدنين 4100' : '9 Rue Latif Ksiksi, Médenine 4100',
                        phone: '+216 25 95 35 32',
                        email: 'contact@mimaelghalia.tn',
                        title: isRTL ? 'تواصل معنا' : 'Contactez-nous',
                        subtitle: isRTL
                            ? 'نحن هنا للإجابة على جميع أسئلتكم ومساعدتكم في رحلة طفلكم التعليمية في روضة ميما الغالية'
                            : 'Nous sommes là pour répondre à toutes vos questions et vous accompagner dans le parcours éducatif de votre enfant.',
                        hours: isRTL ? 'الإثنين - الجمعة: 07:00-18:00، السبت: مغلق' : 'Lun - Ven: 07:00-18:00, Sam: Fermé',
                        nursery_name: isRTL ? 'روضة ميما الغالية' : 'Crèche Mima Elghalia',
                        latitude: EXACT_LAT,
                        longitude: EXACT_LNG
                    }
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [isRTL])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await api.post('/api/contacts', formData)

            if (response.data.success) {
                setSubmitted(true)
                dialog.success(isRTL ? 'تم إرسال رسالتك بنجاح' : 'Message envoyé avec succès')
                setTimeout(() => {
                    setSubmitted(false)
                    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
                }, 3500)
            } else {
                throw new Error(response.data.error || 'Erreur')
            }
        } catch (error) {
            console.error('Erreur envoi message:', error)
            dialog.error(isRTL ? 'خطأ في إرسال الرسالة' : 'Erreur lors de l\'envoi du message')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const copyAddressToClipboard = () => {
        if (!contactData) return
        navigator.clipboard.writeText(contactData.address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    // Affichage de chargement
    if (isLoading || !contactData) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    const data = contactData

    // Liens GPS exacts
    const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`
    const wazeDirectionsUrl = `https://www.waze.com/ul?ll=${data.latitude},${data.longitude}&navigate=yes`

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* ========================================================================= */}
                {/* 1. HERO HEADER                                                            */}
                {/* ========================================================================= */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto space-y-3"
                >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-xs font-semibold border border-primary-200/60 dark:border-primary-800/60">
                        <Sparkles className="w-3.5 h-3.5" />
                        {isRTL ? 'نحن في خدمتكم دائماً' : 'À votre écoute 6j/7'}
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {data.title}
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        {data.subtitle}
                    </p>
                </motion.div>

                {/* ========================================================================= */}
                {/* 2. SECTION SUPÉRIEURE : FORMULAIRE DE CONTACT (7 COL) + CARTES EXPRESS (5 COL) */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Bloc Formulaire de Contact */}
                    <motion.div
                        initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6"
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/20">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {isRTL ? 'أرسل لنا رسالة' : 'Envoyez-nous un message'}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {isRTL ? 'سنرد عليكم في غضون 24 ساعة' : 'Réponse garantie sous 24 heures ouvrées'}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 hidden sm:inline-block">
                                {isRTL ? 'استجابة سريعة' : 'Réponse rapide'}
                            </span>
                        </div>

                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 text-center bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800"
                            >
                                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3 animate-bounce" />
                                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                                    {isRTL ? 'تم استلام رسالتك بنجاح!' : 'Message envoyé avec succès !'}
                                </h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    {isRTL
                                        ? 'شكراً لك، سيتواصل فريق روضة ميما الغالية معك في أقرب وقت.'
                                        : 'Merci de nous avoir contactés, notre équipe vous répondra très prochainement.'}
                                </p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            {isRTL ? 'الاسم واللقب *' : 'Nom et Prénom *'}
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder={isRTL ? 'مثال: سارة بن علي' : 'Ex: Sarah Mansour'}
                                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            {isRTL ? 'البريد الإلكتروني *' : 'Email *'}
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="contact@exemple.com"
                                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            dir="ltr"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="+216 -- --- ---"
                                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            {isRTL ? 'الموضوع *' : 'Sujet *'}
                                        </label>
                                        <input
                                            type="text"
                                            name="subject"
                                            required
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            placeholder={isRTL ? 'طلب تسجيل / استفسار' : 'Demande d\'inscription / Renseignement'}
                                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRTL ? 'رسالتكم *' : 'Votre message *'}
                                    </label>
                                    <textarea
                                        name="message"
                                        rows="4"
                                        required
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder={isRTL ? 'اكتب رسالتك أو استفسارك هنا...' : 'Écrivez votre question ou demande ici...'}
                                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60"
                                >
                                    {loading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>{isRTL ? 'إرسال الرسالة' : 'Envoyer le message'}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>

                    {/* Bloc Coordonnées Express */}
                    <motion.div
                        initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="lg:col-span-5 space-y-4"
                    >
                        {/* Téléphone direct */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:border-primary-500/50 transition-all flex items-start gap-3.5">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                                    {isRTL ? 'الهاتف المباشر' : 'Téléphone direct'}
                                </h3>
                                <a
                                    href={`tel:${data.phone}`}
                                    dir="ltr"
                                    className="text-base font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors inline-block"
                                >
                                    {data.phone}
                                </a>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {isRTL ? 'متاح من 07:00 إلى 18:00' : 'Disponible dès 07h00 du matin'}
                                </p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:border-primary-500/50 transition-all flex items-start gap-3.5">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex-shrink-0">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                </h3>
                                <a
                                    href={`mailto:${data.email}`}
                                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors"
                                >
                                    {data.email}
                                </a>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {isRTL ? 'للتسجيلات والمراسلات الإدارية' : 'Pour inscriptions et démarches'}
                                </p>
                            </div>
                        </div>

                        {/* Horaires */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:border-primary-500/50 transition-all flex items-start gap-3.5">
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex-shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                                    {isRTL ? 'أوقات العمل' : 'Horaires d\'ouverture'}
                                </h3>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {data.hours}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {isRTL ? 'استقبال الأطفال ابتداءً من 07:00' : 'Accueil échelonné dès 07:00'}
                                </p>
                            </div>
                        </div>

                        {/* Adresse officielle réelle avec bouton copier + badge Plus Code */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-50/60 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800/80 border border-primary-200/70 dark:border-slate-700 shadow-md flex items-start gap-3.5">
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex-shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        {isRTL ? 'العنوان الفعلي' : 'Adresse physique'}
                                    </h3>
                                    <button
                                        onClick={copyAddressToClipboard}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-600 dark:text-primary-400 bg-white/80 dark:bg-slate-800 hover:bg-primary-100/60 transition-colors shadow-sm"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? (isRTL ? 'تم النسخ!' : 'Copié !') : (isRTL ? 'نسخ' : 'Copier')}</span>
                                    </button>
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                                    {data.address}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ========================================================================= */}
                {/* 3. SECTION BASSE : PROPOSITION 1 — SPLIT LOCALISATION (5/7) AVEC LOGO PIN */}
                {/* ========================================================================= */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {isRTL ? 'موقعنا على الخريطة' : 'Notre localisation à Médenine'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isRTL ? 'موقع الحضانة بدقة مع إرشادات الوصول السريع' : 'Repère officiel Google Maps avec facilités d\'accès'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                        {/* Panneau latéral gauche (5 colonnes) : Accès, statut & GPS */}
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl">
                            <div>
                                {/* Badge de statut en temps réel */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold mb-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {isRTL ? 'مفتوح للزيارات والتسجيل' : 'Accueil & Inscriptions ouverts'}
                                </div>

                                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {data.nursery_name}
                                </h3>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                                    {data.address}
                                </p>

                                {/* Horaires & Téléphone express */}
                                <div className="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                        <span>{data.hours}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        <span dir="ltr">{data.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {/* Boutons GPS directs */}
                                <div className="grid grid-cols-2 gap-2">
                                    <a
                                        href={googleMapsDirectionsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all"
                                    >
                                        <Navigation className="w-3.5 h-3.5" />
                                        <span>{isRTL ? 'خرائط جوجل' : 'Google Maps'}</span>
                                    </a>
                                    <a
                                        href={wazeDirectionsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                                    >
                                        <Compass className="w-3.5 h-3.5" />
                                        <span>Waze</span>
                                    </a>
                                </div>

                                {/* 3 Capsules d'atouts d'accès parents */}
                                <div className="grid grid-cols-3 gap-2 text-[11px] text-center text-slate-500 dark:text-slate-400">
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                                        <span className="block text-base mb-0.5">🅿️</span>
                                        <span>{isRTL ? 'موقف سهل' : 'Dépose-minute'}</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                                        <span className="block text-base mb-0.5">🚼</span>
                                        <span>{isRTL ? 'عربات أطفال' : 'Poussettes OK'}</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                                        <span className="block text-base mb-0.5">🛡️</span>
                                        <span>{isRTL ? 'منطقة آمنة' : 'Zone calme'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panneau interactif droit (7 colonnes) : Carte Satellite Haute Précision avec REPÈRE LOGO ANCRÉ */}
                        <div className="lg:col-span-7 h-[460px] lg:h-auto min-h-[460px] flex flex-col">
                            <InteractiveNurseryMap
                                latitude={data.latitude}
                                longitude={data.longitude}
                                nurseryName={data.nursery_name}
                                address={data.address}
                                isRTL={isRTL}
                            />
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    )
}

export default ContactPageDynamic
