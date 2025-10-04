import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Shield, Heart, GraduationCap, Users, Clock, Award, Star, Play, CheckCircle, Baby, Utensils, Gamepad2, User } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useSettings } from '../../contexts/SettingsContext'
//import { useAuth } from '../../hooks/useAuth'

const HomePage = () => {
  const { t } = useTranslation()
  const { isRTL, getLocalizedText } = useLanguage()
  //const { user, isAuthenticated } = useAuth()

  const features = [
    {
      icon: GraduationCap,
      title: t('home.features.education.title'),
      description: t('home.features.education.description'),
      color: 'text-blue-600'
    },
    {
      icon: Heart,
      title: t('home.features.care.title'),
      description: t('home.features.care.description'),
      color: 'text-pink-600'
    },
    {
      icon: Shield,
      title: t('home.features.safety.title'),
      description: t('home.features.safety.description'),
      color: 'text-green-600'
    }
  ]

  const { getNurseryInfo, getCapacityInfo, getWelcomeMessages } = useSettings();
  const nurseryInfo = getNurseryInfo();
  const capacityInfo = getCapacityInfo();
  const welcomeMessages = getWelcomeMessages();

  const stats = [
    { number: capacityInfo.available.toString(), label: isRTL ? 'مكان متاح' : 'Places disponibles' },
    { number: '2025', label: isRTL ? 'سنة الافتتاح' : 'Année d\'ouverture' },
    { number: '4', label: isRTL ? 'موظف مؤهل' : 'Personnel qualifié' },
    { number: '100%', label: isRTL ? 'معايير الأمان' : 'Normes de sécurité' }
  ]

  const services = [
    {
      icon: Baby,
      title: isRTL ? 'رعاية الأطفال' : 'Garde d\'enfants',
      description: isRTL
        ? 'رعاية شاملة للأطفال من عمر شهرين إلى 3 سنوات مع فريق مؤهل ومتخصص'
        : 'Garde complète pour enfants de 2 mois à 3 ans avec une équipe qualifiée et spécialisée',
      features: [
        isRTL ? 'إشراف طبي مستمر' : 'Surveillance médicale continue',
        isRTL ? 'أنشطة تعليمية متنوعة' : 'Activités éducatives variées',
        isRTL ? 'بيئة آمنة ومحفزة' : 'Environnement sûr et stimulant'
      ],
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600'
    },
    {
      icon: Utensils,
      title: isRTL ? 'مساعدة في تناول الطعام' : 'Assistance aux repas',
      description: isRTL
        ? 'نساعد الأطفال على تناول وجباتهم التي يحضرونها من المنزل في بيئة نظيفة وآمنة مع تعليم آداب الطعام'
        : 'Nous aidons les enfants à prendre leurs repas apportés de la maison dans un environnement propre et sûr tout en enseignant les bonnes manières à table',
      features: [
        isRTL ? 'مساعدة في تناول الطعام' : 'Aide pour manger',
        isRTL ? 'تعليم آداب المائدة' : 'Apprentissage des bonnes manières',
        isRTL ? 'بيئة نظيفة وآمنة' : 'Environnement propre et sûr'
      ],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Gamepad2,
      title: isRTL ? 'الأنشطة التعليمية' : 'Activités éducatives',
      description: isRTL
        ? 'برامج تعليمية متطورة تساعد على تنمية المهارات الحركية والذهنية والاجتماعية'
        : 'Programmes éducatifs avancés pour développer les compétences motrices, mentales et sociales',
      features: [
        isRTL ? 'ألعاب تفاعلية ذكية' : 'Jeux interactifs intelligents',
        isRTL ? 'ورش فنية وإبداعية' : 'Ateliers artistiques et créatifs',
        isRTL ? 'أنشطة رياضية مناسبة' : 'Activités sportives adaptées'
      ],
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-indigo-950 dark:via-purple-950 dark:to-blue-950 overflow-hidden">
        {/* Ciel magique adaptatif */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient atmosphérique */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-purple-900/10 dark:from-indigo-900/30 dark:via-purple-900/40 dark:to-blue-900/50"></div>
          
          {/* Thème CLAIR - Particules magiques et nuages */}
          <div className="dark:hidden">
            {/* Nuages flottants plus visibles */}
            <div className="absolute top-16 right-1/4 w-24 h-16 bg-white/70 rounded-full blur-md animate-pulse delay-300 shadow-lg shadow-white/30"></div>
            <div className="absolute top-32 left-1/5 w-20 h-12 bg-white/60 rounded-full blur-md animate-pulse delay-700 shadow-md shadow-white/25"></div>
            <div className="absolute top-1/3 right-1/6 w-28 h-18 bg-white/65 rounded-full blur-md animate-pulse delay-1100 shadow-lg shadow-white/35"></div>
            <div className="absolute bottom-1/3 left-1/3 w-22 h-14 bg-white/55 rounded-full blur-md animate-pulse delay-1500 shadow-md shadow-white/20"></div>
            <div className="absolute bottom-1/4 right-1/3 w-26 h-16 bg-white/70 rounded-full blur-md animate-pulse delay-1900 shadow-lg shadow-white/30"></div>
            
            {/* Particules dorées plus brillantes */}
            <div className="absolute top-20 left-1/4 w-3 h-3 bg-yellow-400/90 rounded-full animate-bounce delay-400 shadow-lg shadow-yellow-400/60"></div>
            <div className="absolute top-1/5 right-1/3 w-2.5 h-2.5 bg-orange-400/80 rounded-full animate-pulse delay-800 shadow-md shadow-orange-400/50"></div>
            <div className="absolute top-2/5 left-1/6 w-4 h-4 bg-yellow-500/70 rounded-full animate-bounce delay-1200 shadow-xl shadow-yellow-500/40"></div>
            <div className="absolute bottom-2/5 right-1/4 w-3 h-3 bg-amber-400/80 rounded-full animate-pulse delay-1600 shadow-lg shadow-amber-400/50"></div>
            <div className="absolute bottom-1/5 left-2/3 w-2 h-2 bg-yellow-300/90 rounded-full animate-bounce delay-2000 shadow-md shadow-yellow-300/60"></div>
            <div className="absolute top-1/6 left-1/8 w-2.5 h-2.5 bg-gold-400/85 rounded-full animate-pulse delay-2200 shadow-lg shadow-yellow-400/55"></div>
            <div className="absolute bottom-1/6 right-1/8 w-3.5 h-3.5 bg-yellow-400/75 rounded-full animate-bounce delay-2400 shadow-xl shadow-yellow-400/45"></div>
            
            {/* Bulles magiques plus colorées */}
            <div className="absolute top-1/4 left-1/2 w-5 h-5 bg-blue-300/60 rounded-full animate-ping delay-600 shadow-xl shadow-blue-300/40"></div>
            <div className="absolute top-1/2 right-1/5 w-4 h-4 bg-purple-300/55 rounded-full animate-pulse delay-1000 shadow-lg shadow-purple-300/35"></div>
            <div className="absolute bottom-1/3 left-1/8 w-6 h-6 bg-pink-300/50 rounded-full animate-ping delay-1400 shadow-xl shadow-pink-300/30"></div>
            <div className="absolute top-3/5 right-2/3 w-3 h-3 bg-indigo-300/65 rounded-full animate-pulse delay-1800 shadow-md shadow-indigo-300/45"></div>
            <div className="absolute top-1/8 right-1/2 w-4.5 h-4.5 bg-cyan-300/55 rounded-full animate-ping delay-2600 shadow-lg shadow-cyan-300/35"></div>
            <div className="absolute bottom-1/8 left-1/4 w-3.5 h-3.5 bg-violet-300/60 rounded-full animate-pulse delay-2800 shadow-md shadow-violet-300/40"></div>
            
            {/* Rayons de soleil plus visibles */}
            <div className="absolute top-10 right-10 w-2 h-12 bg-yellow-300/50 rotate-45 animate-pulse delay-500 shadow-md shadow-yellow-300/30"></div>
            <div className="absolute top-12 right-12 w-1.5 h-10 bg-yellow-300/40 rotate-12 animate-pulse delay-700 shadow-sm shadow-yellow-300/25"></div>
            <div className="absolute top-14 right-8 w-2 h-14 bg-yellow-300/55 -rotate-12 animate-pulse delay-900 shadow-md shadow-yellow-300/35"></div>
            <div className="absolute top-8 right-14 w-1.5 h-8 bg-yellow-300/45 rotate-75 animate-pulse delay-1100 shadow-sm shadow-yellow-300/25"></div>
            
            {/* Paillettes supplémentaires */}
            <div className="absolute top-3/8 left-3/4 w-2 h-2 bg-gold-300/80 rounded-full animate-ping delay-3000 shadow-md shadow-yellow-300/50"></div>
            <div className="absolute bottom-3/8 right-3/4 w-2.5 h-2.5 bg-yellow-400/70 rounded-full animate-bounce delay-3200 shadow-lg shadow-yellow-400/40"></div>
            <div className="absolute top-5/8 left-1/12 w-1.5 h-1.5 bg-orange-300/85 rounded-full animate-pulse delay-3400 shadow-sm shadow-orange-300/55"></div>
          </div>
          
          {/* Thème SOMBRE - Étoiles scintillantes */}
          <div className="hidden dark:block">
            {/* Étoiles scintillantes - Petites */}
            <div className="absolute top-10 left-10 text-yellow-200 animate-pulse">
              <Star className="w-3 h-3 fill-current drop-shadow-sm" />
            </div>
            <div className="absolute top-16 right-20 text-blue-200 animate-ping delay-300">
              <Star className="w-2 h-2 fill-current drop-shadow-sm" />
            </div>
            <div className="absolute top-24 left-1/3 text-white animate-pulse delay-700">
              <Star className="w-2 h-2 fill-current" />
            </div>
            <div className="absolute top-32 right-1/4 text-yellow-100 animate-ping delay-1000">
              <Star className="w-3 h-3 fill-current drop-shadow-md" />
            </div>
            <div className="absolute top-40 left-2/3 text-blue-100 animate-pulse delay-1500">
              <Star className="w-2 h-2 fill-current" />
            </div>
            
            {/* Étoiles moyennes */}
            <div className="absolute top-20 right-1/3 text-yellow-200 animate-pulse delay-500">
              <Star className="w-4 h-4 fill-current drop-shadow-md" />
            </div>
            <div className="absolute top-1/4 left-1/4 text-blue-200 animate-ping delay-800">
              <Star className="w-4 h-4 fill-current drop-shadow-md" />
            </div>
            <div className="absolute top-1/3 right-1/5 text-white animate-pulse delay-1200">
              <Star className="w-3 h-3 fill-current" />
            </div>
            <div className="absolute top-2/5 left-1/6 text-yellow-100 animate-ping delay-1800">
              <Star className="w-4 h-4 fill-current drop-shadow-md" />
            </div>
            
            {/* Étoiles brillantes */}
            <div className="absolute top-1/5 left-1/2 text-yellow-200 animate-pulse delay-400">
              <Star className="w-5 h-5 fill-current drop-shadow-lg" />
              <div className="absolute inset-0 text-yellow-200/60 animate-ping">
                <Star className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div className="absolute top-1/3 right-1/3 text-blue-200 animate-pulse delay-900">
              <Star className="w-5 h-5 fill-current drop-shadow-lg" />
              <div className="absolute inset-0 text-blue-200/60 animate-ping delay-500">
                <Star className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div className="absolute top-2/3 left-1/5 text-yellow-100 animate-pulse delay-1600">
              <Star className="w-5 h-5 fill-current drop-shadow-lg" />
              <div className="absolute inset-0 text-yellow-100/60 animate-ping delay-800">
                <Star className="w-5 h-5 fill-current" />
              </div>
            </div>
            
            {/* Constellation d'étoiles supplémentaires */}
            <div className="absolute bottom-1/4 left-1/3 text-blue-100 animate-pulse delay-600">
              <Star className="w-3 h-3 fill-current" />
            </div>
            <div className="absolute bottom-1/3 right-1/4 text-yellow-200 animate-ping delay-1100">
              <Star className="w-4 h-4 fill-current drop-shadow-md" />
            </div>
            <div className="absolute bottom-2/5 left-2/3 text-white animate-pulse delay-1400">
              <Star className="w-3 h-3 fill-current" />
            </div>
            <div className="absolute top-1/6 left-3/4 text-white animate-pulse delay-200">
              <Star className="w-2 h-2 fill-current" />
            </div>
            <div className="absolute top-1/2 right-1/2 text-yellow-100 animate-ping delay-1300">
              <Star className="w-3 h-3 fill-current" />
            </div>
            <div className="absolute bottom-1/6 left-1/2 text-blue-100 animate-pulse delay-1900">
              <Star className="w-3 h-3 fill-current" />
            </div>
            <div className="absolute top-3/5 left-1/8 text-white animate-pulse delay-100">
              <Star className="w-2 h-2 fill-current" />
            </div>
            <div className="absolute bottom-3/5 right-1/8 text-yellow-200 animate-ping delay-2000">
              <Star className="w-3 h-3 fill-current drop-shadow-sm" />
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mr-3">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
                  {isRTL ? 'الحضانة الأولى في المنطقة' : 'Crèche #1 dans la région'}
                </span>
              </div>

              {/* Title */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                    {nurseryInfo.name}
                  </span>
                  <br />
                  <span className="inline-block text-gray-900 dark:text-white hover:scale-105 transition-transform duration-300">
                    {isRTL ? 'مستقبل أطفالكم' : 'L\'avenir de vos enfants'}
                  </span>
                  <br />
                  <span className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent hover:from-rose-500 hover:to-pink-500 transition-all duration-300">
                    {isRTL ? 'يبدأ هنا' : 'commence ici'}
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                {isRTL ? welcomeMessages.ar : welcomeMessages.fr}
              </p>

              {/* Features List */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                {[
                  { icon: CheckCircle, text: isRTL ? 'بيئة آمنة 100%' : 'Environnement 100% sécurisé', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
                  { icon: Heart, text: isRTL ? 'رعاية شخصية' : 'Soins personnalisés', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/30' },
                  { icon: GraduationCap, text: isRTL ? 'تعليم مبكر' : 'Éducation précoce', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' }
                ].map((item, index) => (
                  <div key={index} className={`flex items-center space-x-2 rtl:space-x-reverse ${item.bg} backdrop-blur-sm px-5 py-3 rounded-full border border-white/30 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <Link
                  to="/inscription"
                  className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 inline-flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative z-10">{isRTL ? 'سجل الآن' : 'Inscription gratuite'}</span>
                  <ArrowRight className={`relative z-10 w-6 h-6 ${isRTL ? 'mr-3 rotate-180' : 'ml-3'} group-hover:translate-x-2 transition-transform duration-300`} />
                </Link>

                <Link
                  to="/visite-virtuelle"
                  className="group bg-white/90 backdrop-blur-md text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 inline-flex items-center justify-center border border-white/50 hover:border-blue-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  {isRTL ? 'جولة افتراضية' : 'Visite virtuelle'}
                </Link>
              </div>

              {/* Trust Indicators 
              <div className="flex items-center justify-center lg:justify-start space-x-8 rtl:space-x-reverse pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">150+</div>
                  <div className="text-sm text-gray-600">{isRTL ? 'طفل سعيد' : 'Enfants heureux'}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">15+</div>
                  <div className="text-sm text-gray-600">{isRTL ? 'سنة خبرة' : 'Ans d\'expérience'}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">{isRTL ? 'رضا الأهالي' : 'Satisfaction'}</div>
                </div>
              </div>*/}
            </div>

            {/* Visual */}
            <div className="relative">
              {/* Main Image Container */}
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800 rounded-3xl p-8 shadow-2xl">
                  <div className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
                    
                    <img
                      src={`${import.meta.env.BASE_URL}images/hero.jpg`}
                      alt="Enfants heureux à la crèche"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-6 -left-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-float border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">5.0</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{isRTL ? 'تقييم ممتاز' : 'Excellent'}</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-float-delayed border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{isRTL ? 'آمن' : 'Sécurisé'}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{isRTL ? '24/7' : '24h/24'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {isRTL
                ? 'نقدم خدمات شاملة لضمان نمو صحي وسعيد لأطفالكم'
                : 'Nous offrons des services complets pour assurer un développement sain et heureux de vos enfants'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="card hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="card-body text-center space-y-4">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 ${feature.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      {/* Statistiques */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-white/50">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stat.number}
                  </div>
                  <div className="text-gray-700 text-sm md:text-base font-semibold">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nos Points Forts */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full mb-6">
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                {isRTL ? 'نقاط قوتنا' : 'Nos Points Forts'}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-gray-100 dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                {isRTL ? 'ما يميزنا عن الآخرين' : 'Ce qui nous distingue'}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {isRTL
                ? 'نقدم مجموعة شاملة من الخدمات المصممة خصيصاً لضمان نمو وتطور أطفالكم في بيئة آمنة ومحبة مع أحدث المعايير العالمية'
                : 'Nous offrons une gamme complète de services conçus spécialement pour assurer la croissance et le développement de vos enfants dans un environnement sûr et aimant avec les dernières normes internationales'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:scale-105 hover:-translate-y-2"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-bl-3xl opacity-50"></div>

                  <div className="relative p-10">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl ${service.bgColor} mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                      <Icon className={`w-10 h-10 ${service.iconColor}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                          <CheckCircle className={`w-4 h-4 ${service.iconColor} mr-3 rtl:ml-3 rtl:mr-0 flex-shrink-0`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="mt-8">
                      <Link
                        to="/contact"
                        className={`inline-flex items-center text-sm font-semibold ${service.iconColor} hover:underline group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform duration-300`}
                      >
                        {isRTL ? 'اعرف المزيد' : 'En savoir plus'}
                        <ArrowRight className={`w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2 ${isRTL ? 'rotate-180' : ''}`} />
                      </Link>
                    </div>
                  </div>

                  {/* Decorative Element */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${service.color} opacity-10 rounded-bl-full transform translate-x-6 -translate-y-6`}></div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* Services */}


      {/* Témoignages 
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {isRTL ? 'ماذا يقول الأهالي' : 'Ce que disent les parents'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <div key={index} className="card">
                <div className="card-body space-y-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 italic">
                    {isRTL
                      ? `"حضانة رائعة، طفلي سعيد جداً هنا. الموظفون محترفون ومحبون للأطفال."`
                      : `"Excellente crèche, mon enfant est très heureux ici. Le personnel est professionnel et bienveillant."`
                    }
                  </p>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isRTL ? `والد ${index}` : `Parent ${index}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {isRTL ? 'ولي أمر' : 'Parent d\'élève'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
*/}
      {/* Call to Action */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-secondary-600 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {isRTL
              ? 'هل أنت مستعد لبدء رحلة طفلك معنا؟'
              : 'Prêt à commencer l\'aventure de votre enfant avec nous ?'
            }
          </h2>
          <p className="text-xl text-primary-100 dark:text-gray-300 mb-8">
            {isRTL
              ? 'انضموا إلى عائلتنا الكبيرة واكتشفوا الفرق'
              : 'Rejoignez notre grande famille et découvrez la différence'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/inscription"
              className="btn bg-white text-primary-600 hover:bg-gray-50 btn-lg"
            >
              {t('home.cta')}
            </Link>
            <Link
              to="/contact"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 btn-lg"
            >
              {isRTL ? 'تواصل معنا' : 'Nous contacter'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage