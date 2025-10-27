/**
 * 🦶 FOOTER PUBLIC OPTIMISÉ
 * 
 * Version optimisée du footer utilisant le nouveau système de cache
 * et les hooks intelligents pour éviter les requêtes redondantes.
 * 
 * @author Ingénieur Full Stack Senior
 * @version 2.0.0
 */

import React from 'react';
import { useFooterData } from '../../hooks/useOptimizedSettings';
import { useLanguage } from '../../hooks/useLanguage';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

const OptimizedPublicFooter = () => {
  const { isRTL } = useLanguage();
  const currentLang = isRTL ? 'ar' : 'fr';
  
  // Hook optimisé avec cache intelligent
  const { 
    data: footerSettings, 
    isLoading, 
    isError,
    error 
  } = useFooterData(currentLang);

  // Données de fallback en cas d'erreur
  const fallbackData = {
    nursery_name: { 
      value: isRTL ? 'حضانة ميما الغالية' : 'Crèche Mima Elghalia' 
    },
    nursery_description: { 
      value: isRTL 
        ? 'بيئة آمنة ومحبة لنمو طفلك وتطوره' 
        : 'Un environnement sûr et bienveillant pour l\'épanouissement de votre enfant' 
    },
    address: { 
      value: isRTL 
        ? '8 شارع بنزرت، مدنين 4100، تونس' 
        : '8 Rue Bizerte, Medenine 4100, Tunisie' 
    },
    phone: { value: '+216 25 95 35 32' },
    email: { value: 'contact@mimaelghalia.tn' },
    working_hours_weekdays: { 
      value: isRTL ? 'الإثنين-الجمعة: 07:00-18:00' : 'Lun-Ven: 07:00-18:00' 
    },
    facebook_url: { value: 'https://facebook.com/crechemimaelghalia' },
    instagram_url: { value: 'https://instagram.com/crechemimaelghalia' }
  };

  // Utiliser les données du cache ou le fallback
  const settings = isError ? fallbackData : (footerSettings || fallbackData);

  // Affichage de l'état de chargement
  if (isLoading) {
    return (
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-white py-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 🏢 Informations de la crèche */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">
              {settings.nursery_name?.value || fallbackData.nursery_name.value}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {settings.nursery_description?.value || fallbackData.nursery_description.value}
            </p>
            
            {/* Indicateur de cache */}
            {!isError && (
              <div className="flex items-center text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {isRTL ? 'محدث من الذاكرة المؤقتة' : 'Données mises en cache'}
              </div>
            )}
            
            {isError && (
              <div className="flex items-center text-xs text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                {isRTL ? 'وضع عدم الاتصال' : 'Mode hors ligne'}
              </div>
            )}
          </div>

          {/* 📞 Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {isRTL ? 'معلومات الاتصال' : 'Contact'}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <MapPin className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm leading-relaxed">
                  {settings.address?.value || fallbackData.address.value}
                </span>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a 
                  href={`tel:${settings.phone?.value || fallbackData.phone.value}`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                  dir="ltr"
                >
                  {settings.phone?.value || fallbackData.phone.value}
                </a>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a 
                  href={`mailto:${settings.email?.value || fallbackData.email.value}`}
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {settings.email?.value || fallbackData.email.value}
                </a>
              </div>
            </div>
          </div>

          {/* 🕒 Horaires */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {isRTL ? 'ساعات العمل' : 'Horaires'}
            </h4>
            
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <Clock className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
              <div className="text-gray-300 text-sm leading-relaxed">
                {settings.working_hours_weekdays?.value || fallbackData.working_hours_weekdays.value}
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="pt-4">
              <h5 className="text-sm font-medium text-white mb-3">
                {isRTL ? 'تابعونا' : 'Suivez-nous'}
              </h5>
              <div className="flex space-x-4 rtl:space-x-reverse">
                {settings.facebook_url?.value && (
                  <a
                    href={settings.facebook_url.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings.instagram_url?.value && (
                  <a
                    href={settings.instagram_url.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-pink-400 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 {settings.nursery_name?.value || fallbackData.nursery_name.value}. {' '}
            {isRTL ? 'جميع الحقوق محفوظة.' : 'Tous droits réservés.'}
          </p>
          
          {/* Debug info en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-500">
              Cache: {isError ? 'Fallback' : 'Active'} | 
              Lang: {currentLang} | 
              Keys: {Object.keys(settings).length}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default OptimizedPublicFooter;
