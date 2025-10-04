import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ArrowLeft,
  ArrowRight,
  Home,
  Baby,
  Utensils,
  Gamepad2
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

const VirtualTourPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [currentRoom, setCurrentRoom] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const rooms = [
    {
      id: 'accueil',
      name: isRTL ? 'منطقة الاستقبال' : 'Zone d\'accueil',
      description: isRTL 
        ? 'مكان دافئ ومرحب لاستقبال الأطفال والأهالي'
        : 'Un espace chaleureux et accueillant pour recevoir enfants et parents',
      image: 'https://images.unsplash.com/photo-1559455800-c0c5c3d9b8c3?w=800',
      icon: Home,
      features: [
        isRTL ? 'مكتب الاستقبال' : 'Bureau d\'accueil',
        isRTL ? 'منطقة انتظار مريحة' : 'Zone d\'attente confortable',
        isRTL ? 'خزائن شخصية للأطفال' : 'Casiers personnels pour enfants'
      ]
    },
    {
      id: 'jeux',
      name: isRTL ? 'منطقة اللعب' : 'Espace de jeux',
      description: isRTL 
        ? 'مساحة واسعة مخصصة للعب والأنشطة الترفيهية'
        : 'Un grand espace dédié aux jeux et activités ludiques',
      image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800',
      icon: Gamepad2,
      features: [
        isRTL ? 'ألعاب تعليمية متنوعة' : 'Jeux éducatifs variés',
        isRTL ? 'منطقة لعب آمنة' : 'Zone de jeu sécurisée',
        isRTL ? 'أنشطة حركية' : 'Activités motrices'
      ]
    },
    {
      id: 'repos',
      name: isRTL ? 'غرفة النوم' : 'Dortoir',
      description: isRTL 
        ? 'مكان هادئ ومريح لراحة الأطفال'
        : 'Un lieu calme et confortable pour le repos des enfants',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      icon: Baby,
      features: [
        isRTL ? 'أسرّة مريحة وآمنة' : 'Lits confortables et sécurisés',
        isRTL ? 'إضاءة خافتة' : 'Éclairage tamisé',
        isRTL ? 'تهوية طبيعية' : 'Ventilation naturelle'
      ]
    },
    {
      id: 'repas',
      name: isRTL ? 'قاعة الطعام' : 'Salle de repas',
      description: isRTL 
        ? 'مساحة نظيفة وصحية لتناول الوجبات'
        : 'Un espace propre et hygiénique pour les repas',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      icon: Utensils,
      features: [
        isRTL ? 'طاولات وكراسي مناسبة للأطفال' : 'Tables et chaises adaptées aux enfants',
        isRTL ? 'مطبخ مجهز بالكامل' : 'Cuisine entièrement équipée',
        isRTL ? 'معايير النظافة العالية' : 'Standards d\'hygiène élevés'
      ]
    }
  ]

  const nextRoom = () => {
    setCurrentRoom((prev) => (prev + 1) % rooms.length)
  }

  const prevRoom = () => {
    setCurrentRoom((prev) => (prev - 1 + rooms.length) % rooms.length)
  }

  const currentRoomData = rooms[currentRoom]
  const CurrentIcon = currentRoomData.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isRTL ? 'جولة افتراضية' : 'Visite Virtuelle'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isRTL 
                  ? 'اكتشف مرافق حضانتنا من منزلك'
                  : 'Découvrez nos installations depuis chez vous'
                }
              </p>
            </div>
            
            {/* Navigation des salles */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <button
                onClick={prevRoom}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  {currentRoom + 1} / {rooms.length}
                </div>
              </div>
              
              <button
                onClick={nextRoom}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visite principale */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Image/Vidéo principale */}
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={currentRoomData.image}
                  alt={currentRoomData.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Contrôles de lecture */}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
                    >
                      {isMuted ? (
                        <VolumeX className="w-6 h-6" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                    </button>
                    
                    <button className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all">
                      <Maximize className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Indicateur de salle */}
                <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <CurrentIcon className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-gray-900">
                      {currentRoomData.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {currentRoomData.name}
                </h2>
                <p className="text-gray-600 mb-6">
                  {currentRoomData.description}
                </p>

                {/* Caractéristiques */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {isRTL ? 'المميزات' : 'Caractéristiques'}
                  </h3>
                  <ul className="space-y-2">
                    {currentRoomData.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-primary-600 rounded-full mr-3 rtl:ml-3 rtl:mr-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Navigation des salles */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isRTL ? 'استكشف المرافق' : 'Explorer les espaces'}
              </h3>
              
              <div className="space-y-3">
                {rooms.map((room, index) => {
                  const RoomIcon = room.icon
                  return (
                    <button
                      key={room.id}
                      onClick={() => setCurrentRoom(index)}
                      className={`w-full flex items-center p-3 rounded-lg text-left rtl:text-right transition-all ${
                        currentRoom === index
                          ? 'bg-primary-100 text-primary-700 border-primary-200'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <RoomIcon className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm opacity-75 truncate">
                          {room.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Informations pratiques */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isRTL ? 'معلومات مفيدة' : 'Informations pratiques'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="font-medium text-gray-900">
                    {isRTL ? 'ساعات العمل' : 'Horaires'}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {isRTL ? 'الاثنين - الجمعة: 7:00 - 18:00' : 'Lundi - Vendredi: 7h00 - 18h00'}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900">
                    {isRTL ? 'السعة' : 'Capacité'}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {isRTL ? '50 طفل كحد أقصى' : '50 enfants maximum'}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900">
                    {isRTL ? 'الفئة العمرية' : 'Âge'}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {isRTL ? '3 أشهر - 6 سنوات' : '3 mois - 6 ans'}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full btn-primary">
                  {isRTL ? 'احجز زيارة' : 'Réserver une visite'}
                </button>
              </div>
            </div>

            {/* Contact rapide */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">
                {isRTL ? 'هل لديك أسئلة؟' : 'Des questions ?'}
              </h3>
              <p className="text-primary-100 text-sm mb-4">
                {isRTL 
                  ? 'فريقنا متاح للإجابة على جميع استفساراتكم'
                  : 'Notre équipe est disponible pour répondre à toutes vos questions'
                }
              </p>
              <button className="w-full bg-white text-primary-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                {isRTL ? 'اتصل بنا' : 'Nous contacter'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VirtualTourPage
