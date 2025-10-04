import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Eye,
  Camera,
  Navigation
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ImageWithFallback, defaultImages } from '../../utils/imageUtils.jsx'

const VirtualTourPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [currentRoom, setCurrentRoom] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  // Rooms data
  const rooms = [
    {
      id: 'entrance',
      name: isRTL ? 'المدخل الرئيسي' : 'Hall d\'entrée',
      description: isRTL 
        ? 'مدخل واسع ومضيء مع استقبال ودود وبيئة آمنة'
        : 'Hall spacieux et lumineux avec accueil chaleureux et environnement sécurisé',
      image: '/images/tour/entrance.jpg',
      highlights: [
        isRTL ? 'نظام أمان متطور' : 'Système de sécurité avancé',
        isRTL ? 'استقبال دافئ' : 'Accueil chaleureux',
        isRTL ? 'مساحة واسعة' : 'Espace spacieux'
      ]
    },
    {
      id: 'classroom',
      name: isRTL ? 'قاعة التعلم' : 'Salle de classe',
      description: isRTL
        ? 'قاعة مجهزة بأحدث الوسائل التعليمية والألعاب التطويرية'
        : 'Salle équipée avec les derniers outils pédagogiques et jeux de développement',
      image: '/images/tour/classroom.jpg',
      highlights: [
        isRTL ? 'ألعاب تعليمية' : 'Jeux éducatifs',
        isRTL ? 'إضاءة طبيعية' : 'Éclairage naturel',
        isRTL ? 'أثاث آمن' : 'Mobilier sécurisé'
      ]
    },
    {
      id: 'playground',
      name: isRTL ? 'منطقة اللعب' : 'Aire de jeux',
      description: isRTL
        ? 'منطقة لعب آمنة ومحفزة مع ألعاب متنوعة لتطوير المهارات الحركية'
        : 'Aire de jeux sécurisée et stimulante avec jeux variés pour le développement moteur',
      image: '/images/tour/playground.jpg',
      highlights: [
        isRTL ? 'ألعاب آمنة' : 'Jeux sécurisés',
        isRTL ? 'أرضية مطاطية' : 'Sol en caoutchouc',
        isRTL ? 'مراقبة مستمرة' : 'Surveillance continue'
      ]
    },
    {
      id: 'dining',
      name: isRTL ? 'قاعة الطعام' : 'Salle à manger',
      description: isRTL
        ? 'قاعة طعام نظيفة ومريحة حيث يتناول الأطفال وجباتهم الصحية'
        : 'Salle à manger propre et confortable où les enfants prennent leurs repas sains',
      image: '/images/tour/dining.jpg',
      highlights: [
        isRTL ? 'وجبات صحية' : 'Repas sains',
        isRTL ? 'طاولات مناسبة' : 'Tables adaptées',
        isRTL ? 'بيئة نظيفة' : 'Environnement propre'
      ]
    },
    {
      id: 'nap',
      name: isRTL ? 'غرفة النوم' : 'Salle de sieste',
      description: isRTL
        ? 'غرفة هادئة ومريحة للراحة والنوم مع أسرة مريحة وبيئة مهدئة'
        : 'Salle calme et confortable pour le repos avec lits douillets et ambiance apaisante',
      image: '/images/tour/nap.jpg',
      highlights: [
        isRTL ? 'أسرة مريحة' : 'Lits confortables',
        isRTL ? 'إضاءة خافتة' : 'Éclairage tamisé',
        isRTL ? 'هدوء تام' : 'Calme absolu'
      ]
    },
    {
      id: 'garden',
      name: isRTL ? 'الحديقة' : 'Jardin',
      description: isRTL
        ? 'حديقة جميلة وآمنة للأنشطة الخارجية والاستكشاف'
        : 'Beau jardin sécurisé pour les activités extérieures et l\'exploration',
      image: '/images/tour/garden.jpg',
      highlights: [
        isRTL ? 'نباتات طبيعية' : 'Plantes naturelles',
        isRTL ? 'هواء نقي' : 'Air pur',
        isRTL ? 'أنشطة خارجية' : 'Activités extérieures'
      ]
    }
  ]

  const nextRoom = () => {
    setCurrentRoom((prev) => (prev + 1) % rooms.length)
  }

  const prevRoom = () => {
    setCurrentRoom((prev) => (prev - 1 + rooms.length) % rooms.length)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {isRTL ? 'جولة افتراضية' : 'Visite virtuelle'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {isRTL
              ? 'اكتشف مرافق حضانة ميما الغالية من خلال جولة افتراضية شاملة'
              : 'Découvrez les installations de la crèche Mima Elghalia à travers une visite virtuelle complète'
            }
          </p>
        </motion.div>

        {/* Virtual Tour Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto mb-12"
        >
          <Card className="overflow-hidden border-0 bg-white dark:bg-gray-800 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {rooms[currentRoom].name}
                  </CardTitle>
                  <CardDescription className="text-primary-100">
                    {rooms[currentRoom].description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-sm opacity-90">
                    {currentRoom + 1} / {rooms.length}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 relative">
              {/* Main Image/360 Viewer */}
              <div className="relative h-[500px] md:h-[600px] bg-gray-100 dark:bg-gray-700">
                <ImageWithFallback
                  src={rooms[currentRoom].image}
                  alt={rooms[currentRoom].name}
                  fallback={defaultImages.placeholder}
                  className="w-full h-full object-cover"
                />
                
                {/* 360 Overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <p className="text-lg font-medium">
                      {isRTL ? 'منظر 360 درجة' : 'Vue 360°'}
                    </p>
                    <p className="text-sm opacity-80">
                      {isRTL ? 'انقر واسحب للاستكشاف' : 'Cliquez et glissez pour explorer'}
                    </p>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevRoom}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={nextRoom}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg"
                >
                  <ArrowRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>

                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white/90 dark:bg-gray-800/90 rounded-full px-4 py-2 shadow-lg">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <button className="w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button className="w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button className="w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button className="w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Room Highlights */}
                <div className="absolute top-4 right-4">
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                      {isRTL ? 'المميزات' : 'Points forts'}
                    </h4>
                    <ul className="space-y-1">
                      {rooms[currentRoom].highlights.map((highlight, index) => (
                        <li key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                          <div className="w-2 h-2 bg-primary-600 rounded-full mr-2 rtl:mr-0 rtl:ml-2"></div>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Room Navigation */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-6xl mx-auto mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {isRTL ? 'استكشف جميع المرافق' : 'Explorez toutes nos installations'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {rooms.map((room, index) => (
              <motion.div key={room.id} variants={fadeInUp}>
                <button
                  onClick={() => setCurrentRoom(index)}
                  className={`w-full p-3 rounded-xl transition-all duration-300 ${
                    currentRoom === index
                      ? 'bg-primary-600 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 shadow-md'
                  }`}
                >
                  <div className="aspect-square mb-2 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={room.image}
                      alt={room.name}
                      fallback={defaultImages.placeholder}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-sm font-medium text-center">
                    {room.name}
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'لماذا تختار حضانة ميما الغالية؟' : 'Pourquoi choisir la crèche Mima Elghalia ?'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: isRTL ? 'شفافية كاملة' : 'Transparence totale',
                description: isRTL
                  ? 'يمكن للوالدين زيارة الحضانة في أي وقت والاطلاع على جميع المرافق'
                  : 'Les parents peuvent visiter la crèche à tout moment et voir toutes les installations'
              },
              {
                icon: Navigation,
                title: isRTL ? 'مرافق حديثة' : 'Installations modernes',
                description: isRTL
                  ? 'مرافق مجهزة بأحدث التقنيات والمعايير العالمية للسلامة'
                  : 'Installations équipées des dernières technologies et normes de sécurité internationales'
              },
              {
                icon: MapPin,
                title: isRTL ? 'موقع مثالي' : 'Emplacement idéal',
                description: isRTL
                  ? 'موقع استراتيجي سهل الوصول مع مواقف سيارات آمنة'
                  : 'Emplacement stratégique facilement accessible avec parking sécurisé'
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center border-0 bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Card className="max-w-2xl mx-auto border-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                {isRTL ? 'مقتنع؟ احجز زيارة حقيقية!' : 'Convaincu ? Réservez une visite réelle !'}
              </h3>
              <p className="text-lg mb-6 opacity-90">
                {isRTL
                  ? 'تعال وزر حضانتنا شخصياً لتتعرف على فريقنا وتشاهد المرافق عن قرب'
                  : 'Venez visiter notre crèche en personne pour rencontrer notre équipe et voir les installations de près'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <a href="/contact">
                    {isRTL ? 'احجز موعد زيارة' : 'Réserver une visite'}
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
                  <a href="/inscription">
                    {isRTL ? 'سجل الآن' : 'S\'inscrire maintenant'}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default VirtualTourPage
