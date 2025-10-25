import { Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import { Heart, Shield, GraduationCap, Star, ArrowRight } from 'lucide-react'

const HomePage = () => {
  const { isRTL } = useLanguage()
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-indigo-950 dark:via-purple-950 dark:to-blue-950">
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mr-3">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {isRTL ? 'الحضانة الأولى في المنطقة' : 'Crèche #1 dans la région'}
                </span>
              </div>

              {/* Title */}
              <div className="space-y-6">
                <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {isRTL ? 'ميما الغالية' : 'Mima Elghalia'}
                  </span>
                  <br />
                  <span className="inline-block text-gray-900 dark:text-white">
                    {isRTL ? 'مستقبل أطفالكم' : 'L\'avenir de vos enfants'}
                  </span>
                  <br />
                  <span className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                    {isRTL ? 'يبدأ هنا' : 'commence ici'}
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                {isRTL ? 'مرحباً بكم في ميما الغالية حيث ينمو كل طفل في بيئة محبة ومحفزة.' : 'Bienvenue chez Mima Elghalia où chaque enfant grandit dans un environnement bienveillant et stimulant.'}
              </p>

              {/* Features List */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                {[
                  { icon: Shield, text: isRTL ? 'بيئة آمنة 100%' : 'Environnement 100% sécurisé', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
                  { icon: Heart, text: isRTL ? 'رعاية شخصية' : 'Soins personnalisés', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/30' },
                  { icon: GraduationCap, text: isRTL ? 'تعليم مبكر' : 'Éducation précoce', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' }
                ].map((item, index) => (
                  <div key={index} className={`flex items-center space-x-2 rtl:space-x-reverse ${item.bg} backdrop-blur-sm px-5 py-3 rounded-full shadow-lg`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/inscription"
                      className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 inline-flex items-center justify-center"
                    >
                      <span className="relative z-10">{isRTL ? 'سجل الآن' : 'Inscription gratuite'}</span>
                      <ArrowRight className={`relative z-10 w-6 h-6 ${isRTL ? 'mr-3 rotate-180' : 'ml-3'} group-hover:translate-x-2 transition-transform duration-300`} />
                    </Link>

                    <Link
                      to="/login"
                      className="group bg-white/90 backdrop-blur-md text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 inline-flex items-center justify-center border border-white/50"
                    >
                      {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
                    </Link>
                  </>
                ) : (
                  <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-2xl shadow-xl">
                    <p className="text-gray-700 font-semibold">
                      {isRTL ? `مرحباً ${user?.first_name}!` : `Bonjour ${user?.first_name} !`}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {user?.role === 'parent' ? (
                        <Link to="/mon-espace" className="text-blue-600 hover:underline">
                          {isRTL ? 'انتقل إلى مساحتك' : 'Accéder à votre espace'}
                        </Link>
                      ) : (
                        <Link to="/dashboard" className="text-blue-600 hover:underline">
                          {isRTL ? 'انتقل إلى لوحة التحكم' : 'Accéder au dashboard'}
                        </Link>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800 rounded-3xl p-8 shadow-2xl">
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      {isRTL ? 'ميما الغالية' : 'Mima Elghalia'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {isRTL ? 'حضانة متميزة' : 'Crèche d\'excellence'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section d'accueil pour utilisateurs connectés */}
      {isAuthenticated && (
        <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {isRTL
                ? `مرحباً بك ${user?.first_name || ''}`
                : `Bienvenue ${user?.first_name || ''}`
              }
            </h2>
            <p className="text-xl text-blue-100 dark:text-gray-300 mb-8">
              {isRTL
                ? 'اكتشف جميع الخدمات المتاحة لك ولطفلك'
                : 'Découvrez tous les services disponibles pour vous et votre enfant'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Dashboard seulement pour admin et staff */}
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <Link
                  to="/dashboard"
                  className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-300"
                >
                  {isRTL ? 'لوحة التحكم' : 'Accéder au Dashboard'}
                </Link>
              )}
              {/* Mon Espace pour les parents */}
              {user?.role === 'parent' && (
                <Link
                  to="/mon-espace"
                  className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-300"
                >
                  {isRTL ? 'مساحتي' : 'Mon Espace'}
                </Link>
              )}
              <Link
                to="/contact"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-300"
              >
                {isRTL ? 'تواصل معنا' : 'Nous contacter'}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'خدماتنا المتميزة' : 'Nos services d\'excellence'}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {isRTL
                ? 'نقدم خدمات شاملة لضمان نمو صحي وسعيد لأطفالكم'
                : 'Nous offrons des services complets pour assurer un développement sain et heureux de vos enfants'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                title: isRTL ? 'التعليم المبكر' : 'Éducation précoce',
                description: isRTL ? 'برامج تعليمية متطورة' : 'Programmes éducatifs avancés',
                color: 'text-blue-600'
              },
              {
                icon: Heart,
                title: isRTL ? 'الرعاية المحبة' : 'Soins attentionnés',
                description: isRTL ? 'بيئة آمنة ومحبة' : 'Environnement sûr et aimant',
                color: 'text-pink-600'
              },
              {
                icon: Shield,
                title: isRTL ? 'الأمان والحماية' : 'Sécurité',
                description: isRTL ? 'أقصى درجات الأمان' : 'Sécurité maximale',
                color: 'text-green-600'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 ${feature.color} mb-6`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action pour non-connectés seulement */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {isRTL
                ? 'هل أنت مستعد لبدء رحلة طفلك معنا؟'
                : 'Prêt à commencer l\'aventure de votre enfant avec nous ?'
              }
            </h2>
            <p className="text-xl text-blue-100 dark:text-gray-300 mb-8">
              {isRTL
                ? 'انضموا إلى عائلتنا الكبيرة واكتشفوا الفرق'
                : 'Rejoignez notre grande famille et découvrez la différence'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/inscription"
                className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-300"
              >
                {isRTL ? 'سجل الآن' : 'Inscription gratuite'}
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-300"
              >
                {isRTL ? 'تواصل معنا' : 'Nous contacter'}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage
