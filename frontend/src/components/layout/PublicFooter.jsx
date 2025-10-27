import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useState, useEffect } from 'react'
import api from '../../services/api'

const PublicFooter = () => {
  const { isRTL } = useLanguage();
  const [nurserySettings, setNurserySettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Charger les paramètres de la crèche
  useEffect(() => {
    const loadNurserySettings = async () => {
      try {
        console.log('🏢 Footer: Chargement des paramètres crèche...');
        const response = await api.get('/api/contact');
        console.log('📋 Footer: Réponse API:', response.data);
        
        // Adapter au format de l'API contact
        if (response.data && response.data.success && response.data.contact) {
          const contactData = response.data.contact;
          setNurserySettings({
            nursery_name: { value: 'Crèche Mima Elghalia', fr: 'Crèche Mima Elghalia' },
            address: { value: contactData.address, fr: contactData.address },
            phone: { value: contactData.phone, fr: contactData.phone },
            email: { value: contactData.email, fr: contactData.email },
            hours_formatted: { value: contactData.hours, fr: contactData.hours } // Utiliser les horaires déjà formatés
          });
        }
        
        console.log('✅ Footer: Paramètres chargés');
      } catch (error) {
        console.warn('⚠️ Footer: API non disponible, utilisation des données de fallback');
        // En cas d'erreur, utiliser les valeurs par défaut robustes
        setNurserySettings({
          nursery_name: { value: isRTL ? 'حضانة ميما الغالية' : 'Crèche Mima Elghalia' },
          nursery_description: { value: isRTL ? 'بيئة آمنة ومحبة لنمو طفلك وتطوره' : 'Un environnement sûr et bienveillant pour l\'épanouissement de votre enfant' },
          address: { value: isRTL ? '8 شارع بنزرت، مدنين 4100، تونس' : '8 Rue Bizerte, Medenine 4100, Tunisie' },
          phone: { value: '+216 25 95 35 32' },
          email: { value: 'contact@mimaelghalia.tn' },
          working_hours_weekdays: { value: '{"start": "07:00", "end": "18:00"}' },
          working_hours_saturday: { value: '{"start": "08:00", "end": "14:00"}' },
          saturday_open: { value: 'true' },
          hours_formatted: { value: isRTL ? 'الإثنين-الجمعة: 07:00-18:00 | السبت: 08:00-14:00' : 'Lun-Ven: 07:00-18:00 | Sam: 08:00-14:00' }
        });
      } finally {
        setLoading(false);
      }
    };

    loadNurserySettings();
  }, [isRTL]);

  // Valeurs par défaut si pas encore chargées
  const getSettingValue = (key, defaultValue = '') => {
    try {
      return nurserySettings[key]?.value || defaultValue;
    } catch (error) {
      console.error('Erreur récupération setting:', key, error);
      return defaultValue;
    }
  };

  // Formater les horaires d'ouverture
  const formatOpeningHours = () => {
    try {
      // Récupérer les horaires de semaine
      const weekdaysRaw = getSettingValue('working_hours_weekdays', '{"start": "07:00", "end": "18:00"}');
      let weekdaysFormatted = '07:00-18:00';
      
      try {
        const weekdaysObj = JSON.parse(weekdaysRaw);
        weekdaysFormatted = `${weekdaysObj.start}-${weekdaysObj.end}`;
      } catch (e) {
        // Si ce n'est pas du JSON, utiliser tel quel
        weekdaysFormatted = weekdaysRaw;
      }

      // Vérifier si le samedi est ouvert
      const saturdayOpen = getSettingValue('saturday_open', 'true') === 'true';
      
      if (!saturdayOpen) {
        // Samedi fermé
        if (isRTL) {
          return `الإثنين - الجمعة: ${weekdaysFormatted}، السبت: مغلق`;
        } else {
          return `Lun - Ven: ${weekdaysFormatted}`;
        }
      }

      // Samedi ouvert - récupérer les horaires
      const saturdayRaw = getSettingValue('working_hours_saturday', '{"start": "08:00", "end": "14:00"}');
      let saturdayFormatted = '08:00-14:00';
      
      try {
        const saturdayObj = JSON.parse(saturdayRaw);
        saturdayFormatted = `${saturdayObj.start}-${saturdayObj.end}`;
      } catch (e) {
        // Si ce n'est pas du JSON, utiliser tel quel
        saturdayFormatted = saturdayRaw;
      }

      if (isRTL) {
        return `الإثنين - الجمعة: ${weekdaysFormatted}، السبت: ${saturdayFormatted}`;
      } else {
        return `Lun - Ven: ${weekdaysFormatted}, Sam: ${saturdayFormatted}`;
      }
    } catch (error) {
      console.error('Erreur formatage horaires:', error);
      return isRTL ? 'الإثنين - السبت' : 'Lun - Sam';
    }
  };

  const quickLinks = [
    { name: isRTL ? 'الرئيسية' : 'Accueil', href: '/' },
    { name: isRTL ? 'التسجيل' : 'Inscription', href: '/inscription' },
    { name: isRTL ? 'اتصل بنا' : 'Contact', href: '/contact' },
    { name: isRTL ? 'تسجيل الدخول' : 'Connexion', href: '/login' },
    { name: isRTL ? 'جولة افتراضية' : 'Visite virtuelle', href: '/visite-virtuelle' },
  ];

  // Définir contactInfo directement dans le rendu pour éviter les erreurs

  // Afficher un placeholder pendant le chargement
  if (loading) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-48 mx-auto mb-4"></div>
              <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">
              {getSettingValue('nursery_name', 'Crèche Mima Elghalia')}
            </h3>
            <p className="text-gray-300 mb-4">
              {getSettingValue('nursery_description', 'Un environnement sûr et bienveillant pour l\'épanouissement de votre enfant')}
            </p>
          </div>

          {/* Liens rapides */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {isRTL ? 'روابط سريعة' : 'Liens rapides'}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations de contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {isRTL ? 'معلومات الاتصال' : 'Contact'}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 rtl:space-x-reverse">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {getSettingValue('address', '8 Rue Bizerte, Medenine 4100, Tunisie')}
                </span>
              </li>
              <li className="flex items-center space-x-3 rtl:space-x-reverse">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm ltr" dir="ltr">
                  {getSettingValue('phone', '+216 25 95 35 32')}
                </span>
              </li>
              <li className="flex items-center space-x-3 rtl:space-x-reverse">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {getSettingValue('email', 'contact@mimaelghalia.tn')}
                </span>
              </li>
              <li className="flex items-center space-x-3 rtl:space-x-reverse">
                <Clock className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {getSettingValue('hours_formatted', isRTL ? 'الإثنين-الجمعة: 07:00-18:00' : 'Lun-Ven: 07:00-18:00')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              {isRTL
                ? `© ${new Date().getFullYear()} ${getSettingValue('nursery_name', 'ميما الغالية')}. جميع الحقوق محفوظة.`
                : `© ${new Date().getFullYear()} ${getSettingValue('nursery_name', 'Crèche Mima Elghalia')}. Tous droits réservés.`
              }
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                >
                  {isRTL ? 'سياسة الخصوصية' : 'Politique de confidentialité'}
                </Link>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                >
                  {isRTL ? 'شروط الاستخدام' : 'Conditions d\'utilisation'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
