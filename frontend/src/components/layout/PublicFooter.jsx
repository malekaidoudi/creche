import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock, Settings } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useSettings } from '../../contexts/SettingsContext'

const PublicFooter = () => {
  const { isRTL } = useLanguage();
  const { getNurseryInfo, getSetting, getFormattedOpeningHours } = useSettings();
  
  const nurseryInfo = getNurseryInfo();
  const welcomeMessages = {
    fr: getSetting('welcome_message_fr', 'Bienvenue à la crèche Mima Elghalia'),
    ar: getSetting('welcome_message_ar', 'مرحباً بكم في حضانة ميما الغالية')
  };

  const quickLinks = [
    { name: isRTL ? 'الرئيسية' : 'Accueil', href: '/' },
    { name: isRTL ? 'المقالات' : 'Articles', href: '/articles' },
    { name: isRTL ? 'الأخبار' : 'Actualités', href: '/actualites' },
    { name: isRTL ? 'التسجيل' : 'Inscription', href: '/inscription' },
    { name: isRTL ? 'اتصل بنا' : 'Contact', href: '/contact' },
  ];

  const contactInfo = [
    {
      icon: MapPin,
      text: isRTL ? (nurseryInfo.addressAr || nurseryInfo.address) : nurseryInfo.address
    },
    {
      icon: Phone,
      text: nurseryInfo.phone,
      isPhone: true // Marqueur pour le traitement spécial RTL
    },
    {
      icon: Mail,
      text: nurseryInfo.email
    },
    {
      icon: Clock,
      text: getFormattedOpeningHours(isRTL)
    }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {isRTL ? (nurseryInfo.nameAr || nurseryInfo.name).charAt(0) : nurseryInfo.name.charAt(0)}
                </span>
              </div>
              <span className="ml-2 rtl:ml-0 rtl:mr-2 text-xl font-bold">
                {isRTL ? (nurseryInfo.nameAr || nurseryInfo.name) : nurseryInfo.name}
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {isRTL ? welcomeMessages.ar : welcomeMessages.fr}
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
              {contactInfo.map((info, index) => (
                <li key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                  <info.icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span 
                    className={`text-gray-300 text-sm ${info.isPhone ? 'ltr' : ''}`}
                    dir={info.isPhone ? 'ltr' : undefined}
                  >
                    {info.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              {isRTL 
                ? `© ${new Date().getFullYear()} ${nurseryInfo.nameAr || nurseryInfo.name}. جميع الحقوق محفوظة.`
                : `© ${new Date().getFullYear()} ${nurseryInfo.name}. Tous droits réservés.`
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
              
              {/* Icône admin */}
              <Link
                to="/admin/settings"
                className="text-gray-500 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-gray-800"
                title={isRTL ? 'إعدادات الإدارة' : 'Administration'}
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
