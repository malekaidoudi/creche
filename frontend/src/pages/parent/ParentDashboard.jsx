import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Calendar, MessageSquare, Edit3, CheckCircle, XCircle, Clock, AlertCircle, Camera, Download, Baby } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'
import { dashboardService } from '../../services/dashboardService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ParentDashboard = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [myChildren, setMyChildren] = useState([])
  const [todayAttendance, setTodayAttendance] = useState([])
  const [weekAttendance, setWeekAttendance] = useState([])
  const [showAbsenceForm, setShowAbsenceForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [unreadMessages, setUnreadMessages] = useState(3)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    photo: null
  })

  useEffect(() => {
    loadParentData()
  }, [user])

  const loadParentData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Utiliser le service dashboard pour récupérer les données du parent
      const parentData = await dashboardService.getParentData(user.id, user.email)
      
      setMyChildren(parentData.children)
      setTodayAttendance(parentData.todayAttendance)
      setWeekAttendance(parentData.weekAttendance)
      
    } catch (error) {
      console.error('Erreur lors du chargement des données parent:', error)
      toast.error('Erreur lors du chargement des données')
      
      // Fallback sur des données vides
      setMyChildren([])
      setTodayAttendance([])
      setWeekAttendance([])
    } finally {
      setLoading(false)
    }
  }

  // Données simulées pour la démonstration
  const todayReport = {
    date: new Date().toLocaleDateString('fr-FR'),
    message: isRTL ? 'أمس، لعب بول في الخارج وكان سعيداً جداً' : 'Hier, Paul a bien joué dehors et était très heureux',
    hasActivity: true
  }

  // Calendrier 7 jours
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - 3 + i)
    return {
      date: date,
      status: i < 3 ? 'present' : i === 3 ? 'today' : 'planned',
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNumber: date.getDate()
    }
  })

  // Messages récents
  const recentMessages = [
    {
      id: 1,
      from: isRTL ? 'المربية سارة' : 'Éducatrice Sarah',
      message: isRTL ? 'بول رسم تنيناً جميلاً اليوم!' : 'Paul a dessiné un beau dragon aujourd\'hui !',
      time: '14:30',
      unread: true
    },
    {
      id: 2,
      from: isRTL ? 'المربية ليلى' : 'Éducatrice Leila',
      message: isRTL ? 'تذكير: اجتماع الأهالي غداً' : 'Rappel : réunion parents demain',
      time: '10:15',
      unread: true
    }
  ]

  // Dernières activités
  const recentActivities = [
    {
      id: 1,
      title: isRTL ? 'بول رسم تنيناً' : 'Paul a dessiné un dragon',
      description: isRTL ? 'نشاط فني إبداعي' : 'Activité artistique créative',
      time: '2h',
      photos: [`${import.meta.env.BASE_URL}images/drawing1.jpg`, `${import.meta.env.BASE_URL}images/drawing2.jpg`]
    },
    {
      id: 2,
      title: isRTL ? 'لعب في الحديقة' : 'Jeu dans le jardin',
      description: isRTL ? 'وقت اللعب في الهواء الطلق' : 'Temps de jeu en extérieur',
      time: '4h',
      photos: [`${import.meta.env.BASE_URL}images/garden1.jpg`]
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header personnalisé avec photo du parent - sous le header du site */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                {isRTL ? `مرحباً ${user?.first_name || 'ولي الأمر'}` : `Bonjour ${user?.first_name || 'Parent'}`}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {/* Photo ronde du parent */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - scroll vertical */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        
        {/* Section 0: Mes enfants */}
        {myChildren.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Baby className="w-6 h-6 mr-3 text-blue-600" />
              {isRTL ? 'أطفالي' : 'Mes enfants'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myChildren.map((child) => {
                const isPresent = todayAttendance.some(att => att.child_id === child.id)
                return (
                  <div key={child.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {child.first_name} {child.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {isRTL ? 'العمر:' : 'Âge:'} {child.birth_date ? 
                            Math.floor((new Date() - new Date(child.birth_date)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} 
                          {isRTL ? ' سنة' : ' ans'}
                        </p>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isPresent 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isPresent 
                          ? (isRTL ? 'حاضر' : 'Présent') 
                          : (isRTL ? 'غائب' : 'Absent')
                        }
                      </div>
                    </div>
                    
                    {child.medical_info && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {child.medical_info}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Message si aucun enfant */}
        {myChildren.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Baby className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isRTL ? 'لا توجد أطفال مسجلون' : 'Aucun enfant enregistré'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isRTL ? 'لم يتم العثور على أطفال مرتبطين بحسابك' : 'Aucun enfant n\'est associé à votre compte'}
            </p>
            <button 
              onClick={() => window.location.href = '/enrollment'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isRTL ? 'تسجيل طفل جديد' : 'Inscrire un enfant'}
            </button>
          </div>
        )}
        
        {/* Section 1: Récap du jour */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isRTL ? 'ملخص اليوم' : 'Récap\' du jour'}
          </h2>
          <div className="flex items-start space-x-4 rtl:space-x-reverse">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800 text-lg">
                {todayReport.message}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {todayReport.date}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Mini-calendrier 7 jours */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isRTL ? 'الحضور هذا الأسبوع' : 'Présence cette semaine'}
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <button
                key={index}
                onClick={() => day.status === 'planned' && setShowAbsenceForm(true)}
                className={`p-3 rounded-xl text-center transition-all duration-200 ${
                  day.status === 'present' 
                    ? 'bg-green-100 text-green-800 border-2 border-green-200' 
                    : day.status === 'today'
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-gray-200'
                }`}
              >
                <div className="text-xs font-medium mb-1">{day.dayName}</div>
                <div className="text-lg font-bold">{day.dayNumber}</div>
                <div className="mt-1">
                  {day.status === 'present' && <CheckCircle className="w-4 h-4 mx-auto text-green-600" />}
                  {day.status === 'today' && <Clock className="w-4 h-4 mx-auto text-blue-600" />}
                  {day.status === 'planned' && <div className="w-2 h-2 bg-gray-400 rounded-full mx-auto"></div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Messages */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isRTL ? 'الرسائل' : 'Messages'}
            </h2>
            {unreadMessages > 0 && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unreadMessages} {isRTL ? 'غير مقروءة' : 'non lus'}
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {recentMessages.slice(0, 3).map((message) => (
              <div key={message.id} className={`p-4 rounded-xl border-l-4 ${message.unread ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{message.from}</span>
                  <span className="text-sm text-gray-500">{message.time}</span>
                </div>
                <p className="text-gray-700">{message.message}</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                  {isRTL ? 'رد' : 'Répondre'}
                </button>
              </div>
            ))}
          </div>
          
          <button className="mt-4 w-full text-center py-2 text-blue-600 hover:text-blue-800 font-medium">
            {isRTL ? 'عرض جميع الرسائل' : 'Voir tous les messages'}
          </button>
        </div>

        {/* Section 4: Dernières infos personnalisées */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isRTL ? 'آخر الأنشطة' : 'Dernières activités'}
          </h2>
          
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                    <p className="text-gray-600 text-sm">{activity.description}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {isRTL ? `منذ ${activity.time}` : `Il y a ${activity.time}`}
                  </span>
                </div>
                
                {activity.photos && activity.photos.length > 0 && (
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    {activity.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                        <button className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Download className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal formulaire d'absence */}
      {showAbsenceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'إبلاغ عن غياب' : 'Signaler une absence'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isRTL ? 'التاريخ' : 'Date'}
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isRTL ? 'سبب الغياب' : 'Motif d\'absence'}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>{isRTL ? 'مرض' : 'Maladie'}</option>
                  <option>{isRTL ? 'عطلة عائلية' : 'Vacances familiales'}</option>
                  <option>{isRTL ? 'موعد طبي' : 'Rendez-vous médical'}</option>
                  <option>{isRTL ? 'أخرى' : 'Autre'}</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 rtl:space-x-reverse mt-6">
              <button
                onClick={() => setShowAbsenceForm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={() => setShowAbsenceForm(false)}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isRTL ? 'إرسال' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal modification de profil */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRTL ? 'تعديل الملف الشخصي' : 'Modifier le profil'}
            </h3>
            
            <div className="space-y-4">
              {/* Photo de profil */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileData({...profileData, photo: e.target.files[0]})}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isRTL ? 'تغيير الصورة' : 'Changer la photo'}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  {isRTL ? 'سيتم مراجعة الصورة من قبل الموظفين' : 'Photo validée par le staff'}
                </p>
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isRTL ? 'الاسم الأول' : 'Prénom'}
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isRTL ? 'اسم العائلة' : 'Nom'}
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 rtl:space-x-reverse mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={() => {
                  // Ici on ajouterait la logique de sauvegarde
                  console.log('Sauvegarde profil:', profileData)
                  setShowProfileModal(false)
                }}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isRTL ? 'حفظ' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParentDashboard
