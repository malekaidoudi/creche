import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useState, useEffect } from 'react'
import { cachedGet } from '../../services/api'

const PublicFooter = () => {
  const { isRTL } = useLanguage();
  const [nurserySettings, setNurserySettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Charger les paramètres de la crèche
  useEffect(() => {
    const loadNurserySettings = async () => {
      try {
        // Utiliser le client API centralisé avec cache (le footer est monté sur
        // chaque page publique, ce cache évite de refetch à chaque navigation)
        const response = await cachedGet('/api/contact/info');
        const data = response.data;

        // Adapter au format de l'API contact
        if (data && data.success && data.contact) {
          const contactData = data.contact;
          // Utiliser les horaires et l'adresse selon la langue
          const hoursValue = isRTL ? (contactData.hours_ar || contactData.hours) : (contactData.hours || contactData.hours_ar);
          const addressValue = isRTL ? (contactData.address_ar || contactData.address) : (contactData.address || contactData.address_ar);
          const nameValue = isRTL ? (contactData.nursery_name_ar || 'روضة ميما الغالية') : (contactData.nursery_name || 'Crèche Mima Elghalia');

          setNurserySettings({
            nursery_name: { value: nameValue },
            address: { value: addressValue || (isRTL ? 'غير محددة' : 'Non définie') },
            phone: { value: contactData.phone || '+216 25 95 35 32' },
            email: { value: contactData.email || 'contact@mimaelghalia.tn' },
            hours_formatted: { value: hoursValue }
          });
        }

      } catch (error) {
        // En cas d'erreur réseau, utiliser les valeurs par défaut harmonisées
        setNurserySettings({
          nursery_name: { value: isRTL ? 'روضة ميما الغالية' : 'Crèche Mima Elghalia' },
          nursery_description: { value: isRTL ? 'بيئة آمنة ومحبة لنمو طفلك وتطوره' : 'Un environnement sûr et bienveillant pour l\'épanouissement de votre enfant' },
          address: { value: isRTL ? '9 نهج لطيف الكسيكسي, مدنين 4100' : '9 Rue Latif Ksiksi, Médenine 4100' },
          phone: { value: '+216 25 95 35 32' },
          email: { value: 'contact@mimaelghalia.tn' },
          hours_formatted: { value: isRTL ? 'الإثنين - الجمعة: 07:00-18:00، السبت: مغلق' : 'Lun - Ven: 07:00-18:00, Sam: Fermé' }
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

  const quickLinks = [
    { name: isRTL ? 'الرئيسية' : 'Accueil', href: '/' },
    { name: isRTL ? 'التسجيل' : 'Inscription', href: '/inscription' },
    { name: isRTL ? 'اتصل بنا' : 'Contact', href: '/contact' },
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
                  {getSettingValue('address', isRTL ? '8 نهج بنزرت، مدنين 4100، تونس' : '8 Rue Bizerte, Medenine 4100, Tunisie')}
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
                  {getSettingValue('hours_formatted', isRTL ? 'الإثنين - الجمعة: 07:00-18:00، السبت: مغلق' : 'Lun - Ven: 07:00-18:00, Sam: Fermé')}
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
                ? `© ${new Date().getFullYear()} ${getSettingValue('nursery_name', 'روضة ميما الغالية')}. جميع الحقوق محفوظة.`
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
