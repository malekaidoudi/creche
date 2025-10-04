import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

const PublicFooter = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  const quickLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.articles'), href: '/articles' },
    { name: t('nav.news'), href: '/actualites' },
    { name: t('nav.enrollment'), href: '/inscription' },
    { name: t('nav.contact'), href: '/contact' },
  ]

  const contactInfo = [
    {
      icon: MapPin,
      text: isRTL ? '8 نهج بنزرت، مدنين 4100، تونس' : '8 Rue Bizerte, Medenine 4100, Tunisie'
    },
    {
      icon: Phone,
      text: '+216 25 95 35 32'
    },
    {
      icon: Mail,
      text: 'contact@mimaelghalia.tn'
    },
    {
      icon: Clock,
      text: isRTL ? 'الإثنين - الجمعة: 7:00 - 18:00، السبت: 8:00 - 12:00' : 'Lun - Ven: 7h00 - 18h00, Sam: 8h00 - 12h00'
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
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="ml-2 rtl:ml-0 rtl:mr-2 text-xl font-bold">
                {isRTL ? 'ميما الغالية' : 'Mima Elghalia'}
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {isRTL 
                ? 'نوفر بيئة آمنة ومحبة لنمو وتطور أطفالكم في جو من الأمان والراحة.'
                : 'Nous offrons un environnement sûr et bienveillant pour la croissance et le développement de vos enfants.'
              }
            </p>
          </div>

          {/* Liens rapides */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {isRTL ? 'روابط سريعة' : 'Liens rapides'}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
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
                  <span className="text-gray-300 text-sm">{info.text}</span>
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
                ? `© ${new Date().getFullYear()} ميما الغالية. جميع الحقوق محفوظة.`
                : `© ${new Date().getFullYear()} Mima Elghalia. Tous droits réservés.`
              }
            </p>
            <div className="flex space-x-6 rtl:space-x-reverse">
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
    </footer>
  )
}

export default PublicFooter
