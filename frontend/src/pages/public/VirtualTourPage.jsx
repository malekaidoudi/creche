import { useState, useEffect, useRef, useCallback } from 'react'
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
import JoinUsModal from '../../components/ui/JoinUsModal'
import api from '../../services/api'
import API_CONFIG from '../../config/api'

const VirtualTourPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [currentRoom, setCurrentRoom] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [tourImages, setTourImages] = useState({})
  const [loadingImages, setLoadingImages] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageRotation, setImageRotation] = useState(0)
  const viewerRef = useRef(null)
  const autoPlayIntervalRef = useRef(null)

  // Durée du défilement automatique (en ms)
  const AUTO_PLAY_INTERVAL = 4000

  // Charger les images depuis le backend
  useEffect(() => {
    const fetchTourImages = async () => {
      try {
        setLoadingImages(true)
        const response = await api.get('/api/virtual-tour/images')
        if (response.data.success) {
          setTourImages(response.data.images || {})
        }
      } catch (error) {
        console.log('Utilisation des images par défaut')
      } finally {
        setLoadingImages(false)
      }
    }

    fetchTourImages()
  }, [])

  // Fonction pour obtenir l'URL de l'image (Cloudinary, backend local ou fallback)
  const getImageUrl = (viewId, defaultPath) => {
    if (tourImages[viewId]) {
      // Si l'URL commence par http(s), c'est une URL Cloudinary complète
      if (tourImages[viewId].startsWith('http')) {
        return tourImages[viewId]
      }
      // Sinon, c'est un chemin relatif local
      return `${API_CONFIG.BASE_URL}${tourImages[viewId]}`
    }
    return defaultPath
  }

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

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  // Effet pour le défilement automatique (Play)
  useEffect(() => {
    if (isPlaying) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentRoom(prev => (prev + 1) % rooms.length)
      }, AUTO_PLAY_INTERVAL)
    } else {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
        autoPlayIntervalRef.current = null
      }
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
      }
    }
  }, [isPlaying, rooms.length])

  // Fonction Zoom In
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
  }, [])

  // Fonction Zoom Out
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 1))
  }, [])

  // Fonction Reset (rotation et zoom)
  const handleReset = useCallback(() => {
    setZoomLevel(1)
    setImageRotation(0)
  }, [])

  // Fonction Rotation
  const handleRotate = useCallback(() => {
    setImageRotation(prev => (prev + 90) % 360)
  }, [])

  // Fonction Fullscreen
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Écouter les changements de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Reset zoom et rotation quand on change de vue
  useEffect(() => {
    setZoomLevel(1)
    setImageRotation(0)
  }, [currentRoom])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Header avec gradient */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 py-16 mb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 backdrop-blur-sm"
            >
              <Camera className="w-10 h-10" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {isRTL ? 'جولة افتراضية' : 'Visite Virtuelle'}
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              {isRTL
                ? 'اكتشف مرافق حضانة ميما الغالية من خلال جولة افتراضية شاملة'
                : 'Découvrez les installations de la crèche Mima Elghalia'
              }
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                🏠 {rooms.length} {isRTL ? 'مناطق' : 'espaces'}
              </span>
              <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                📷 {isRTL ? 'صور حقيقية' : 'Photos réelles'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Virtual Tour Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto mb-12"
        >
          <Card className="overflow-hidden border-0 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl">
            {/* Header avec infos de la vue actuelle */}
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {rooms[currentRoom].name}
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-sm">
                      {rooms[currentRoom].description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                    {rooms.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentRoom(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentRoom ? 'bg-primary-400 w-4' : 'bg-white/40 hover:bg-white/60'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="px-3 py-1.5 bg-primary-500 rounded-full text-sm font-bold">
                    {currentRoom + 1}/{rooms.length}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative">
              {/* Main Image Viewer */}
              <div
                ref={viewerRef}
                className={`relative bg-gray-900 overflow-hidden ${isFullscreen ? 'h-screen' : 'h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px]'}`}
              >
                {/* Image avec animation fade */}
                <motion.div
                  key={currentRoom}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <img
                    src={getImageUrl(rooms[currentRoom].id, rooms[currentRoom].image)}
                    alt={rooms[currentRoom].name}
                    className="w-full h-full object-cover object-bottom"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${imageRotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      e.target.src = defaultImages.placeholder
                    }}
                  />
                  {/* Overlay gradient pour meilleure lisibilité */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />
                </motion.div>

                {/* Indicateur de lecture automatique */}
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 z-10"
                  >
                    <div className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                      {isRTL ? 'تشغيل تلقائي' : 'Lecture auto'}
                    </div>
                  </motion.div>
                )}

                {/* Indicateur de zoom */}
                {zoomLevel > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {Math.round(zoomLevel * 100)}%
                    </div>
                  </motion.div>
                )}

                {/* Barre de progression automatique */}
                {isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300/50">
                    <motion.div
                      key={currentRoom}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: "linear" }}
                      className="h-full bg-primary-500"
                    />
                  </div>
                )}

                {/* Navigation Arrows */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevRoom}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg z-10"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextRoom}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg z-10"
                >
                  <ArrowRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </motion.button>

                {/* Controls - Style identique à la référence */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-5 bg-[#3d4654] rounded-full px-5 py-3 shadow-xl"
                  >
                    {/* Play/Pause - Bouton bleu cyan */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-[#00b4d8] hover:bg-[#0096c7] text-white transition-colors"
                      title={isPlaying ? (isRTL ? 'إيقاف' : 'Pause') : (isRTL ? 'تشغيل' : 'Lecture')}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </motion.button>

                    {/* Reset */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                      className="flex items-center justify-center text-white hover:text-cyan-300 transition-colors"
                      title={isRTL ? 'إعادة تعيين' : 'Réinitialiser'}
                    >
                      <RotateCcw className="w-6 h-6" />
                    </motion.button>

                    {/* Zoom In */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 3}
                      className="flex items-center justify-center text-white hover:text-cyan-300 transition-colors disabled:opacity-40"
                      title={isRTL ? 'تكبير' : 'Zoom +'}
                    >
                      <ZoomIn className="w-6 h-6" />
                    </motion.button>

                    {/* Zoom Out */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1}
                      className="flex items-center justify-center text-white hover:text-cyan-300 transition-colors disabled:opacity-40"
                      title={isRTL ? 'تصغير' : 'Zoom -'}
                    >
                      <ZoomOut className="w-6 h-6" />
                    </motion.button>

                    {/* Fullscreen */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFullscreen}
                      className="flex items-center justify-center text-white hover:text-cyan-300 transition-colors"
                      title={isFullscreen ? (isRTL ? 'خروج من ملء الشاشة' : 'Quitter plein écran') : (isRTL ? 'ملء الشاشة' : 'Plein écran')}
                    >
                      <Maximize className="w-6 h-6" />
                    </motion.button>
                  </motion.div>
                </div>

                {/* Room Highlights */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-4 right-4 z-10"
                >
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg backdrop-blur-sm">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                      {isRTL ? 'المميزات' : 'Points forts'}
                    </h4>
                    <ul className="space-y-1">
                      {rooms[currentRoom].highlights.map((highlight, index) => (
                        <motion.li
                          key={index}
                          initial={{ x: 10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-center text-xs text-gray-600 dark:text-gray-300"
                        >
                          <div className="w-2 h-2 bg-primary-600 rounded-full mr-2 rtl:mr-0 rtl:ml-2"></div>
                          {highlight}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Room Navigation - Galerie des espaces */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-6xl mx-auto mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'استكشف جميع المرافق' : 'Explorez tous nos espaces'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL ? 'انقر على أي صورة للمشاهدة' : 'Cliquez sur une image pour la visualiser'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {rooms.map((room, index) => (
              <motion.button
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
                onClick={() => setCurrentRoom(index)}
                className={`group relative rounded-xl overflow-hidden transition-all duration-300 ${currentRoom === index
                  ? 'ring-4 ring-primary-500 shadow-xl scale-105'
                  : 'shadow-md hover:shadow-xl'
                  }`}
              >
                <div className="aspect-square">
                  <img
                    src={getImageUrl(room.id, room.image)}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.src = defaultImages.placeholder }}
                  />
                </div>
                {/* Overlay avec nom */}
                <div className={`absolute inset-0 flex items-end transition-all duration-300 ${currentRoom === index
                  ? 'bg-gradient-to-t from-primary-600/90 to-transparent'
                  : 'bg-gradient-to-t from-black/70 to-transparent group-hover:from-primary-600/80'
                  }`}>
                  <div className="w-full p-2 md:p-3">
                    <p className="text-white text-xs md:text-sm font-semibold text-center truncate">
                      {room.name}
                    </p>
                  </div>
                </div>
                {/* Badge actif */}
                {currentRoom === index && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  </div>
                )}
              </motion.button>
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
                  ? 'موقع استراتيجي سهل الوصول'
                  : 'Emplacement stratégique facilement accessible'
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
                <Button
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-white/90 border-2 border-white font-bold"
                  onClick={() => setShowJoinModal(true)}
                >
                  {isRTL ? 'انضم إلينا' : 'Rejoignez-nous'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de choix */}
      <JoinUsModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </div>
  )
}

export default VirtualTourPage
