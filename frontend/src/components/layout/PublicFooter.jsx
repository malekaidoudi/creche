import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

const PublicFooter = () => {
  const { isRTL } = useLanguage();
  
  // Informations par défaut de la crèche
  const nurseryInfo = {
    name: 'Mima Elghalia',
    nameAr: 'ميما الغالية',
    address: '8 Rue Bizerte, Medenine 4100, Tunisie',
    addressAr: '8 نهج بنزرت، مدنين 4100، تونس',
    phone: '+216 25 95 35 32',
    email: 'contact@mimaelghalia.tn'
  };
  
  const contentMessages = {
    welcomeMessageFr: 'Bienvenue chez Mima Elghalia où chaque enfant grandit dans un environnement bienveillant et stimulant.',
    welcomeMessageAr: 'مرحباً بكم في ميما الغالية حيث ينمو كل طفل في بيئة محبة ومحفزة.',
    openingHours: isRTL ? 'الإثنين - الجمعة: 7:00 - 18:00، السبت: 8:00 - 12:00' : 'Lun - Ven: 7h00 - 18h00, Sam: 8h00 - 12h00'
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
      isPhone: true
    },
    {
      icon: Mail,
      text: nurseryInfo.email
    },
    {
      icon: Clock,
      text: contentMessages.openingHours
    }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">
              {isRTL ? nurseryInfo.nameAr || nurseryInfo.name : nurseryInfo.name}
            </h3>
            <p className="text-gray-300 mb-4">
              {isRTL ? contentMessages.welcomeMessageAr : contentMessages.welcomeMessageFr}
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
