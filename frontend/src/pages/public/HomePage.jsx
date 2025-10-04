import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Shield, Heart, GraduationCap, Users, Clock, Award, Star, Play, CheckCircle, Baby, Utensils, Gamepad2, User } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'

const HomePage = () => {
  const { t } = useTranslation()
  const { isRTL, getLocalizedText } = useLanguage()
  const { user, isAuthenticated } = useAuth()

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

  const stats = [
    { number: '30', label: isRTL ? 'مكان متاح' : 'Places disponibles' },
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
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-yellow-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mr-3">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                  {isRTL ? 'الحضانة الأولى في المنطقة' : 'Crèche #1 dans la région'}
                </span>
              </div>

              {/* Title */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                    {isRTL ? 'مستقبل' : 'L\'avenir'}
                  </span>
                  <br />
                  <span className="inline-block text-gray-900 hover:scale-105 transition-transform duration-300">
                    {isRTL ? 'أطفالكم' : 'de vos enfants'}
                  </span>
                  <br />
                  <span className="inline-block bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent hover:from-rose-500 hover:to-pink-500 transition-all duration-300">
                    {isRTL ? 'يبدأ هنا' : 'commence ici'}
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                {isRTL
                  ? 'بيئة آمنة ومحفزة للنمو والتعلم واللعب. نحن نهتم بكل طفل كأنه طفلنا.'
                  : 'Un environnement sûr et stimulant pour grandir, apprendre et jouer. Nous prenons soin de chaque enfant comme s\'il était le nôtre.'
                }
              </p>

              {/* Features List */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                {[
                  { icon: CheckCircle, text: isRTL ? 'بيئة آمنة 100%' : 'Environnement 100% sécurisé', color: 'text-green-600', bg: 'bg-green-50' },
                  { icon: Heart, text: isRTL ? 'رعاية شخصية' : 'Soins personnalisés', color: 'text-pink-600', bg: 'bg-pink-50' },
                  { icon: GraduationCap, text: isRTL ? 'تعليم مبكر' : 'Éducation précoce', color: 'text-blue-600', bg: 'bg-blue-50' }
                ].map((item, index) => (
                  <div key={index} className={`flex items-center space-x-2 rtl:space-x-reverse ${item.bg} backdrop-blur-sm px-5 py-3 rounded-full border border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-semibold text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                {isAuthenticated && user?.role === 'parent' ? (
                  <Link
                    to="/parent-dashboard"
                    className="group relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 inline-flex items-center justify-center overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <User className={`relative z-10 w-6 h-6 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                    <span className="relative z-10">{isRTL ? 'مساحتي الشخصية' : 'Mon Espace'}</span>
                  </Link>
                ) : (
                  <Link
                    to="/inscription"
                    className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 inline-flex items-center justify-center overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10">{isRTL ? 'سجل الآن' : 'Inscription gratuite'}</span>
                    <ArrowRight className={`relative z-10 w-6 h-6 ${isRTL ? 'mr-3 rotate-180' : 'ml-3'} group-hover:translate-x-2 transition-transform duration-300`} />
                  </Link>
                )}

{isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') ? (
                  <Link
                    to="/dashboard"
                    className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 inline-flex items-center justify-center border border-white/50"
                  >
                    <Settings className="w-6 h-6 mr-3" />
                    {isRTL ? 'لوحة التحكم' : 'Tableau de bord'}
                  </Link>
                ) : (
                  <Link
                    to="/visite-virtuelle"
                    className="group bg-white/90 backdrop-blur-md text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 inline-flex items-center justify-center border border-white/50 hover:border-blue-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    {isRTL ? 'جولة افتراضية' : 'Visite virtuelle'}
                  </Link>
                )}
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
                <div className="aspect-square bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 rounded-3xl p-8 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-xl">
                    {/*
                    <img
                      src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                      alt="Enfants heureux à la crèche"
                      className="w-full h-full object-cover"
                    />
                    */}
                    <img
                      src={`${import.meta.env.BASE_URL}images/affiche.jpg`}
                      alt="Enfants heureux à la crèche"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-6 -left-6 bg-white rounded-2xl p-4 shadow-xl animate-float">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">5.0</div>
                      <div className="text-sm text-gray-600">{isRTL ? 'تقييم ممتاز' : 'Excellent'}</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl animate-float-delayed">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{isRTL ? 'آمن' : 'Sécurisé'}</div>
                      <div className="text-sm text-gray-600">{isRTL ? '24/7' : '24h/24'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
      <section className="py-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
              <span className="text-sm font-semibold text-blue-800">
                {isRTL ? 'نقاط قوتنا' : 'Nos Points Forts'}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                {isRTL ? 'ما يميزنا عن الآخرين' : 'Ce qui nous distingue'}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
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
      <section className="section-padding bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {isRTL
              ? 'هل أنت مستعد لبدء رحلة طفلك معنا؟'
              : 'Prêt à commencer l\'aventure de votre enfant avec nous ?'
            }
          </h2>
          <p className="text-xl text-primary-100 mb-8">
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
