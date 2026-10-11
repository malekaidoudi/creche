import { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Compass,
  Send,
  MessageCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { cachedGet } from '../../services/api';
import InteractiveNurseryMap from '../../components/common/InteractiveNurseryMap';

/**
 * 📍 Marqueur Personnalisé avec Logo Officiel de la Crèche
 */
const NurseryLogoPin = ({ nurseryName }) => (
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
    <div className="relative flex flex-col items-center">
      {/* Infobulle supérieure */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white px-3.5 py-1.5 rounded-xl shadow-2xl border border-slate-200/80 dark:border-slate-700 whitespace-nowrap flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold">{nurseryName}</span>
          {/* Flèche pointeur */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white dark:border-t-slate-900"></div>
        </div>
      </div>

      {/* Anneau d'onde pulsante */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-primary-500/25 rounded-full animate-ping pointer-events-none"></div>

      {/* Badge circulaire avec le Logo officiel de la crèche */}
      <div className="relative p-1 bg-white dark:bg-slate-900 rounded-full shadow-2xl border-2 border-primary-500 animate-bounce">
        <img
          src="/images/logo.jpg"
          alt={nurseryName}
          className="w-11 h-11 rounded-full object-cover shadow-inner"
        />
      </div>

      {/* Pointe du pin avec ombre */}
      <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[10px] border-l-transparent border-r-transparent border-t-primary-500 -mt-1 drop-shadow-md"></div>
    </div>
  </div>
);

/**
 * 📝 Composant Formulaire de Contact Interactif (Prévisualisation)
 */
const ContactFormPreview = ({ isRTL, variant = 'card' }) => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  };

  if (submitted) {
    return (
      <div className="p-8 text-center bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
        <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3 animate-bounce" />
        <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-1">
          {isRTL ? 'تم استلام رسالتك بنجاح!' : 'Message envoyé avec succès !'}
        </h4>
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          {isRTL
            ? 'شكراً لك، سيتواصل فريق الروضة معك في أقرب وقت.'
            : 'Merci de nous avoir contactés, notre équipe vous répondra très rapidement.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {isRTL ? 'الاسم واللقب *' : 'Nom et Prénom *'}
          </label>
          <input
            type="text"
            required
            placeholder={isRTL ? 'مثال: سارة بن علي' : 'Ex: Sarah Mansour'}
            value={formState.name}
            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {isRTL ? 'البريد الإلكتروني *' : 'Email *'}
          </label>
          <input
            type="email"
            required
            placeholder="contact@exemple.com"
            value={formState.email}
            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
            dir="ltr"
            placeholder="+216 -- --- ---"
            value={formState.phone}
            onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {isRTL ? 'الموضوع *' : 'Sujet *'}
          </label>
          <input
            type="text"
            required
            placeholder={isRTL ? 'طلب تسجيل / استفسار' : 'Demande d\'inscription / Renseignement'}
            value={formState.subject}
            onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {isRTL ? 'رسالتكم *' : 'Votre message *'}
        </label>
        <textarea
          rows={variant === 'compact' ? 3 : 4}
          required
          placeholder={isRTL ? 'اكتب رسالتك أو استفسارك هنا...' : 'Écrivez votre question ou demande ici...'}
          value={formState.message}
          onChange={(e) => setFormState({ ...formState, message: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
        ></textarea>
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
      >
        <Send className="w-4 h-4" />
        <span>{isRTL ? 'إرسال الرسالة' : 'Envoyer le message'}</span>
      </button>
    </form>
  );
};

const LocationShowcasePage = () => {
  const { isRTL, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Mode de prévisualisation : 'all', 'split', 'floating', 'hub'
  const [activeTab, setActiveTab] = useState('all');
  const [copied, setCopied] = useState(false);
  const [hubTab, setHubTab] = useState('map'); // pour la proposition 3 : 'map', 'directions', 'access'

  // Données crèche dynamiques avec l'adresse réelle et coordonnées exactes
  const [contactData, setContactData] = useState({
    nursery_name: 'Crèche Mima Elghalia',
    address: '9 Rue Latif Ksiksi, Médenine 4100',
    phone: '+216 25 95 35 32',
    email: 'contact@mimaelghalia.tn',
    hours: 'Lun - Ven: 07:00-18:00, Sam: Fermé',
    latitude: '33.340592',
    longitude: '10.490699',
    plus_code: '8FRR+77'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await cachedGet('/api/contact/info');
        if (res.data?.success && res.data?.contact) {
          const c = res.data.contact;
          setContactData({
            nursery_name: isRTL ? (c.nursery_name_ar || 'روضة ميما الغالية') : (c.nursery_name || 'Crèche Mima Elghalia'),
            address: isRTL ? (c.address_ar || '9 نهج لطيف الكسيكسي, مدنين 4100') : (c.address || '9 Rue Latif Ksiksi, Médenine 4100'),
            phone: c.phone || '+216 25 95 35 32',
            email: c.email || 'contact@mimaelghalia.tn',
            hours: isRTL ? (c.hours_ar || 'الإثنين - الجمعة: 07:00-18:00، السبت: مغلق') : (c.hours || 'Lun - Ven: 07:00-18:00, Sam: Fermé'),
            latitude: c.latitude || '33.340592',
            longitude: c.longitude || '10.490699',
            plus_code: c.plus_code || '8FRR+77'
          });
        }
      } catch (err) {
        console.error('Erreur chargement contact:', err);
      }
    };
    fetchData();
  }, [isRTL]);

  // URLs de navigation GPS
  const encodedAddress = encodeURIComponent(contactData.address);
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${contactData.latitude},${contactData.longitude}`;
  const wazeDirectionsUrl = `https://www.waze.com/ul?ll=${contactData.latitude},${contactData.longitude}&navigate=yes`;

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(contactData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Iframe Google Maps réutilisable
  const renderMapIframe = () => (
    <iframe
      src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1640.0!2d${contactData.longitude}!3d${contactData.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDIwJzI2LjUiTiAxMMKwMjknMjMuNiJF!5e0!3m2!1s${isRTL ? 'ar' : 'fr'}!2stn!4v1700000000000!5m2!1s${isRTL ? 'ar' : 'fr'}!2stn`}
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen=""
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={isRTL ? 'خريطة الموقع' : 'Carte de localisation'}
      className="w-full h-full filter saturate-105"
    />
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* 🎛️ Barre d'outils de démonstration sticky */}
        <div className="sticky top-4 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative p-1 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-primary-500/30">
                <img
                  src="/images/logo.jpg"
                  alt="Logo Crèche"
                  className="w-8 h-8 rounded-lg object-cover"
                />
              </div>
              <div>
                <h1 className="text-base font-bold">
                  {isRTL ? 'معاينة صفحة الاتصال الكاملة' : 'Aperçu Vue d\'Ensemble Page Contact'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isRTL
                    ? 'شاهد كيف يتكامل نموذج الاتصال مع كل مقترح من مقترحات الموقع الثلاثة'
                    : 'Visualisez l\'intégration complète du formulaire et des coordonnées pour chaque design'}
                </p>
              </div>
            </div>

            {/* Sélecteur de proposition */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isRTL ? '👁️ الكل' : '👁️ Comparer les 3'}
              </button>
              <button
                onClick={() => setActiveTab('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'split'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isRTL ? 'المقترح 1: مقسم متوازن' : '1. Split Équilibré'}
              </button>
              <button
                onClick={() => setActiveTab('floating')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'floating'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isRTL ? 'المقترح 2: آبل بانورامي' : '2. Apple Dock Panoramique'}
              </button>
              <button
                onClick={() => setActiveTab('hub')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'hub'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isRTL ? 'المقترح 3: تبويبات ذكية' : '3. Smart Tabs Hub'}
              </button>
            </div>

            {/* Outils langue et thème */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Changer la langue (FR / AR)"
              >
                {isRTL ? '🇫🇷 Français' : '🇹🇳 العربية'}
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Basculer thème clair/sombre"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 PROPOSITION 1 : ÉQUILIBRE SPLIT & CARTES EXPRESS (PAGE COMPLÈTE) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'split') && (
          <section className="space-y-6 pt-2 border-b-2 border-slate-200 dark:border-slate-800 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/80 p-4 rounded-2xl border border-primary-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-primary-600 text-white text-xs font-bold uppercase tracking-wider">
                  {isRTL ? 'المقترح 1' : 'Proposition 1'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isRTL ? 'التخطيط المتوازن: نموذج رسائل + بطاقات سريعة + خريطة مقسمة' : 'Layout Équilibré : Formulaire & Cartes Express + Split Map'}
                </h2>
              </div>
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                {isRTL ? 'الهيكل الأكثر شمولاً ووضوحاً للأولياء' : 'Structure claire et ergonomique avec logo sur la carte'}
              </span>
            </div>

            {/* Cadre simulant la page de contact complète */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 lg:p-10 space-y-10">

              {/* 1. HERO HEADER */}
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-xs font-semibold border border-primary-200/60 dark:border-primary-800/60">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isRTL ? 'نحن في خدمتكم دائماً' : 'À votre écoute 6j/7'}
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {isRTL ? 'تواصل معنا' : 'Contactez-nous'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isRTL
                    ? 'نحن هنا للإجابة على جميع أسئلتكم ومساعدتكم في رحلة طفلكم التعليمية في روضة ميما الغالية'
                    : 'Nous sommes là pour répondre à toutes vos questions et vous accompagner dans le parcours éducatif de votre enfant.'}
                </p>
              </div>

              {/* 2. SECTION HAUTE : FORMULAIRE DE CONTACT (GAUCHE) + CARTES EXPRESS (DROITE) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Bloc Formulaire de Contact */}
                <div className="lg:col-span-7 bg-slate-50/80 dark:bg-slate-800/50 p-6 sm:p-7 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary-500 text-white shadow-md shadow-primary-500/20">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {isRTL ? 'أرسل لنا رسالة' : 'Envoyez-nous un message'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {isRTL ? 'سنرد عليكم في غضون 24 ساعة' : 'Réponse garantie sous 24 heures ouvrées'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {isRTL ? 'استجابة سريعة' : 'Réponse rapide'}
                    </span>
                  </div>

                  <ContactFormPreview isRTL={isRTL} variant="card" />
                </div>

                {/* Bloc Coordonnées Express */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-primary-500/50 transition-all flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                        {isRTL ? 'الهاتف المباشر' : 'Téléphone direct'}
                      </h5>
                      <a href={`tel:${contactData.phone}`} dir="ltr" className="text-base font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors inline-block">
                        {contactData.phone}
                      </a>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isRTL ? 'متاح من 07:00 إلى 18:00' : 'Disponible dès 07h00 du matin'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-primary-500/50 transition-all flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                        {isRTL ? 'البريد الإلكتروني' : 'Email'}
                      </h5>
                      <a href={`mailto:${contactData.email}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors">
                        {contactData.email}
                      </a>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isRTL ? 'للتسجيلات والمراسلات الإدارية' : 'Pour inscriptions et démarches'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-primary-500/50 transition-all flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                        {isRTL ? 'أوقات العمل' : 'Horaires d\'ouverture'}
                      </h5>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {contactData.hours}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isRTL ? 'استقبال الأطفال ابتداءً من 07:00' : 'Accueil échelonné dès 07:00'}
                      </p>
                    </div>
                  </div>

                  {/* Adresse officielle avec bouton copier */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-50/50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-primary-100 dark:border-slate-700 shadow-sm flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {isRTL ? 'العنوان الرسمي' : 'Adresse officielle'}
                        </h5>
                        <button
                          onClick={copyAddressToClipboard}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-100/50 dark:hover:bg-primary-950 transition-colors"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? (isRTL ? 'تم النسخ' : 'Copié !') : (isRTL ? 'نسخ' : 'Copier')}</span>
                        </button>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {contactData.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SECTION BASSE : SECTION LOCALISATION PROPOSITION 1 (SPLIT 5/7 AVEC LOGO PIN) */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                      <MapPin className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isRTL ? 'موقعنا على الخريطة' : 'Notre localisation à Médenine'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {isRTL ? 'موقع الحضانة بدقة مع إرشادات الوصول السريع' : 'Repère officiel Google Maps avec facilités d\'accès'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Panneau gauche : Accès & Boutons GPS */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-slate-50/70 dark:bg-slate-800/40 p-6 sm:p-7 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {isRTL ? 'مفتوح للزيارات والتسجيل' : 'Accueil & Inscriptions ouverts'}
                      </div>
                      <h5 className="text-xl font-bold text-slate-900 dark:text-white">
                        {contactData.nursery_name}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {contactData.address}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                          <span>{contactData.hours}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span dir="ltr">{contactData.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
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

                      {/* 3 capsules d'atouts parents */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-center text-slate-500 dark:text-slate-400">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                          <span className="block text-base mb-0.5">🅿️</span>
                          <span>{isRTL ? 'موقف سهل' : 'Dépose-minute'}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                          <span className="block text-base mb-0.5">🚼</span>
                          <span>{isRTL ? 'عربات أطفال' : 'Poussettes OK'}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                          <span className="block text-base mb-0.5">🛡️</span>
                          <span>{isRTL ? 'منطقة آمنة' : 'Zone calme'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panneau droite : Carte Satellite Haute Précision avec REPÈRE LOGO ANCRÉ */}
                  <div className="lg:col-span-7 h-[440px] lg:h-auto min-h-[440px] flex flex-col">
                    <InteractiveNurseryMap
                      latitude={contactData.latitude}
                      longitude={contactData.longitude}
                      nurseryName={contactData.nursery_name}
                      address={contactData.address}
                      plusCode={contactData.plus_code || '8FRR+77'}
                      isRTL={isRTL}
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 🌟 PROPOSITION 2 : APPLE DOCK & CARTE PANORAMIQUE (PAGE COMPLÈTE) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'floating') && (
          <section className="space-y-6 pt-2 border-b-2 border-slate-200 dark:border-slate-800 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-900/80 p-4 rounded-2xl border border-blue-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                  {isRTL ? 'المقترح 2' : 'Proposition 2'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isRTL ? 'الأسلوب البانورامي الحديث: بطاقة اتصال مدمجة + جزيرة آبل عائمة' : 'Style Apple / iOS : Formulaire Moderne + Carte Panoramique avec Floating Dock'}
                </h2>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {isRTL ? 'تصميم عصري وانسيابي' : 'Immersion maximale avec repère logo'}
              </span>
            </div>

            {/* Cadre simulant la page de contact complète */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 lg:p-10 space-y-10">

              {/* 1. HERO HEADER ÉPURÉ */}
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {isRTL ? 'ابقَ على اتصال معنا' : 'Échangeons ensemble'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isRTL
                    ? 'فريق روضة ميما الغالية يرحب بكم ويسعد بالإجابة عن استفساراتكم'
                    : 'Une question ? Un projet d\'accueil pour votre enfant ? Remplissez ce formulaire.'}
                </p>
              </div>

              {/* 2. SECTION HAUTE : FORMULAIRE PLEIN CADRE AVEC BANDEAU D'APPEL DIRECT */}
              <div className="max-w-4xl mx-auto bg-slate-50/70 dark:bg-slate-800/40 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/70 shadow-sm space-y-6">
                {/* Bandeau d'accès rapide au-dessus du formulaire */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-6 border-b border-slate-200 dark:border-slate-700 text-xs">
                  <a href={`tel:${contactData.phone}`} className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-colors">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900 dark:text-white" dir="ltr">{contactData.phone}</span>
                      <span className="text-slate-400">{isRTL ? 'اتصال فوري' : 'Appel direct'}</span>
                    </div>
                  </a>

                  <a href={`mailto:${contactData.email}`} className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-colors">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{contactData.email}</span>
                      <span className="text-slate-400">{isRTL ? 'راسلنا عبر الإيميل' : 'Email express'}</span>
                    </div>
                  </a>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900 dark:text-white">{contactData.hours.split(',')[0]}</span>
                      <span className="text-slate-400">{contactData.hours.split(',')[1] || 'Sam: Fermé'}</span>
                    </div>
                  </div>
                </div>

                <ContactFormPreview isRTL={isRTL} variant="card" />
              </div>

              {/* 3. SECTION BASSE : CARTE PANORAMIQUE AVEC FLOATING DOCK & REPÈRE LOGO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span>{isRTL ? 'الوصول المباشر والخريطة البانورامية' : 'Accès & Carte Panoramique'}</span>
                  </h4>
                  <span className="text-xs text-slate-400">{contactData.address}</span>
                </div>

                <div className="relative h-[480px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
                  {renderMapIframe()}

                  {/* Le repère personnalisé avec logo */}
                  <NurseryLogoPin nurseryName={contactData.nursery_name} addressCode="8FRR+77" />

                  {/* Îlot Flottant Glassmorphism façon Apple/macOS */}
                  <div className="absolute top-6 left-6 rtl:left-auto rtl:right-6 max-w-sm w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/70 rounded-2xl shadow-2xl p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src="/images/logo.jpg"
                        alt={contactData.nursery_name}
                        className="w-10 h-10 rounded-xl object-cover shadow border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-primary-600 dark:text-primary-400">
                          {isRTL ? 'موقع الروضة' : 'Localisation'}
                        </span>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {contactData.nursery_name}
                        </h5>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                      <p className="font-semibold">{contactData.address}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{contactData.hours}</p>
                    </div>

                    {/* Pilules de guidage GPS */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={googleMapsDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-md"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'خرائط جوجل' : 'Itinéraire'}</span>
                      </a>
                      <a
                        href={wazeDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Waze
                      </a>
                      <button
                        onClick={copyAddressToClipboard}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                        title={isRTL ? 'نسخ العنوان' : 'Copier l\'adresse'}
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Barre d'accès rapide en bas du Panoramic Map */}
                  <div className="absolute bottom-4 left-6 right-6 hidden sm:flex items-center justify-between px-5 py-3 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg border border-white/30 dark:border-slate-700 shadow-xl text-xs">
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">🚗</span> {isRTL ? 'موقف مخصص أمام الحضانة' : 'Parking dépose-minute gratuit'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">🚼</span> {isRTL ? 'ولوج سهل بدون درجات' : 'Accès poussettes plain-pied'}
                      </span>
                    </div>
                    <a
                      href={googleMapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      {isRTL ? 'فتح في خرائط جوجل' : 'Ouvrir dans Google Maps'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 🌟 PROPOSITION 3 : SMART HUB AVEC ONGLETS PRATIQUES (PAGE COMPLÈTE) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'hub') && (
          <section className="space-y-6 pt-2 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-900/80 p-4 rounded-2xl border border-emerald-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">
                  {isRTL ? 'المقترح 3' : 'Proposition 3'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isRTL ? 'المركز الذكي التفاعلي: نموذج اتصال + دليل وصول تفاعلي بـ 3 تبويبات' : 'Smart Hub Interactif : Formulaire Complet + Guide d\'Accès 3 Onglets'}
                </h2>
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {isRTL ? 'أقصى قدر من المعلومات العملية للأولياء' : 'Le plus complet pour guider les familles'}
              </span>
            </div>

            {/* Cadre simulant la page de contact complète */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 lg:p-10 space-y-10">

              {/* 1. HERO HEADER */}
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {isRTL ? 'تواصل وزيارة روضة ميما الغالية' : 'Contact & Visite de la Crèche'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isRTL
                    ? 'أرسل لنا استفسارك أو خطط لزيارتك الميدانية في وسط مدينة مدنين'
                    : 'Envoyez-nous votre demande d\'information ou préparez votre visite au cœur de Médenine.'}
                </p>
              </div>

              {/* 2. SECTION HAUTE : FORMULAIRE DE CONTACT + BLOC RAPPEL IMMÉDIAT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 bg-slate-50/70 dark:bg-slate-800/40 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-500" />
                      <span>{isRTL ? 'نموذج التواصل السريع' : 'Formulaire de contact express'}</span>
                    </h4>
                    <span className="text-xs text-slate-400">
                      {isRTL ? 'الحقول المشار إليها بـ * إجبارية' : 'Champs marqués d\'un * obligatoires'}
                    </span>
                  </div>

                  <ContactFormPreview isRTL={isRTL} variant="card" />
                </div>

                <div className="lg:col-span-4 space-y-4">
                  {/* Carte d'accueil crèche avec logo */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src="/images/logo.jpg"
                        alt={contactData.nursery_name}
                        className="w-12 h-12 rounded-xl object-cover shadow-lg border-2 border-white/40"
                      />
                      <div>
                        <h5 className="font-extrabold text-base leading-tight">
                          {contactData.nursery_name}
                        </h5>
                        <p className="text-xs text-emerald-100">
                          {isRTL ? 'مدنين - تونس' : 'Médenine - Tunisie'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/20 space-y-2 text-xs">
                      <p className="flex items-center gap-2 text-emerald-50">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span dir="ltr" className="font-bold">{contactData.phone}</span>
                      </p>
                      <p className="flex items-center gap-2 text-emerald-50">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{contactData.email}</span>
                      </p>
                      <p className="flex items-center gap-2 text-emerald-50">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{contactData.hours}</span>
                      </p>
                    </div>

                    <a
                      href={`tel:${contactData.phone}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-md"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{isRTL ? 'اتصل بالإدارة الآن' : 'Appeler la direction'}</span>
                    </a>
                  </div>

                  {/* Boîte d'astuce parents */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-xs font-bold">
                      <Info className="w-4 h-4" />
                      <span>{isRTL ? 'معلومة للأولياء' : 'Bon à savoir'}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isRTL
                        ? 'يتم قبول التسجيلات طوال السنة حسب الأماكن الشاغرة. يمكنكم حجز موعد زيارة للتعرف على الفضاء.'
                        : 'Les visites de découverte sont possibles tous les matins de 09h à 11h sur rendez-vous.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. SECTION BASSE : SMART HUB À 3 ONGLETS AVEC REPÈRE LOGO */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-emerald-500" />
                      <span>{isRTL ? 'دليل الوصول الشامل إلى الروضة' : 'Guide Pratique d\'Accès & Localisation'}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{contactData.address}</p>
                  </div>

                  {/* Sélecteur d'onglets du Smart Hub */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setHubTab('map')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        hubTab === 'map'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isRTL ? '🗺️ الخريطة وGPS' : '🗺️ Carte & GPS'}
                    </button>
                    <button
                      onClick={() => setHubTab('directions')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        hubTab === 'directions'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isRTL ? '🚗 كيفية الوصول' : '🚗 Comment venir ?'}
                    </button>
                    <button
                      onClick={() => setHubTab('access')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        hubTab === 'access'
                          ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isRTL ? '🅿️ إنزال الأطفال' : '🅿️ Dépose-minute & Sécurité'}
                    </button>
                  </div>
                </div>

                {/* Contenu selon l'onglet choisi */}
                {hubTab === 'map' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="relative h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                      {renderMapIframe()}
                      {/* Repère officiel crèche */}
                      <NurseryLogoPin nurseryName={contactData.nursery_name} addressCode="8FRR+77" />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyAddressToClipboard}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          <span>{copied ? (isRTL ? 'تم النسخ!' : 'Adresse copiée !') : (isRTL ? 'نسخ العنوان' : 'Copier l\'adresse')}</span>
                        </button>
                        <a
                          href={wazeDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          Waze
                        </a>
                      </div>

                      <a
                        href={googleMapsDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-primary-500/20 flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>{isRTL ? 'بدء الإرشاد الصوتي (Google Maps)' : 'Démarrer le guidage GPS'}</span>
                      </a>
                    </div>
                  </div>
                )}

                {hubTab === 'directions' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-2xl">🚗</span>
                      <h5 className="font-bold text-sm">{isRTL ? 'بالسيارة من وسط المدينة' : 'En voiture depuis le centre'}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {isRTL
                          ? 'على بعد دقيقتين فقط من شارع الحبيب بورقيبة، مسلك مباشر وسهل مع إمكانية الوصول السريع.'
                          : 'À 2 minutes du centre de Médenine, accès direct via voie goudronnée sans embouteillage.'}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-2xl">🚶</span>
                      <h5 className="font-bold text-sm">{isRTL ? 'مشياً على الأقدام مع الأطفال' : 'Accès piéton & poussette'}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {isRTL
                          ? 'أرصفة عريضة وآمنة ومدخل بدون مدارج متعبة لتسهيل عبور عربات الأطفال بكل راحة.'
                          : 'Trottoirs sécurisés, entrée de plain-pied sans marches conçue spécialement pour poussettes.'}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-2xl">📍</span>
                      <h5 className="font-bold text-sm">{isRTL ? 'الموقع والعنوان الدقيق' : 'Adresse & Localisation'}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {isRTL
                          ? '9 نهج لطيف الكسيكسي، في حي هادئ بمدنين مع سهولة تامة للوصول إلى باب الحضانة.'
                          : '9 Rue Latif Ksiksi, dans un quartier calme et facilement accessible de Médenine.'}
                      </p>
                    </div>
                  </div>
                )}

                {hubTab === 'access' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                      <span className="text-2xl">🅿️</span>
                      <h5 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                        {isRTL ? 'موقف Dépose-Minute مخصص' : 'Zone Dépose-Minute sécurisée'}
                      </h5>
                      <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                        {isRTL
                          ? 'أماكن مجهزة أمام مدخل الروضة مباشرة لإنزال واستلام طفلك دون تعطيل حركة السير.'
                          : 'Places aménagées devant le portail pour stationner quelques minutes le temps de confier votre enfant à l\'équipe.'}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                      <span className="text-2xl">🛡️</span>
                      <h5 className="font-bold text-sm text-blue-900 dark:text-blue-200">
                        {isRTL ? 'أمان وسرعة الإجراءات' : 'Sécurité & Accueil personnalisé'}
                      </h5>
                      <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                        {isRTL
                          ? 'باب مؤمن مع كاميرات مراقبة وحضور متواصل للمربيات عند المدخل من الساعة 07:00.'
                          : 'Portail sécurisé avec contrôle visuel et présence d\'éducatrices dès l\'ouverture à 07h00.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default LocationShowcasePage;
