import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Users, Baby, Calendar, UserPlus, TrendingUp, Clock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { dashboardService } from '../../services/dashboardService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const DashboardHome = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isRTL } = useLanguage()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalChildren: 0,
    todayAttendance: 0,
    pendingEnrollments: 0,
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Charger les statistiques selon le rôle de l'utilisateur
      let statsData
      if (user?.role === 'admin') {
        statsData = await dashboardService.getAdminStats()
      } else if (user?.role === 'staff') {
        statsData = await dashboardService.getStaffStats()
        // Adapter les données pour l'affichage
        statsData = {
          totalChildren: statsData.totalChildren,
          todayAttendance: statsData.presentToday,
          pendingEnrollments: 0, // Staff ne voit pas les inscriptions
          attendanceRate: statsData.attendanceRate
        }
      } else {
        // Pour les parents, on affiche des stats différentes
        statsData = {
          totalChildren: 0,
          todayAttendance: 0,
          pendingEnrollments: 0,
          attendanceRate: 0
        }
      }

      setStats(statsData)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      // Fallback sur des données vides en cas d'erreur
      setStats({
        totalChildren: 0,
        todayAttendance: 0,
        pendingEnrollments: 0,
        attendanceRate: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: t('dashboard.stats.totalChildren'),
      value: stats.totalChildren,
      icon: Baby,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: t('dashboard.stats.todayAttendance'),
      value: stats.todayAttendance,
      icon: Calendar,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: user?.role === 'admin' ? t('dashboard.stats.pendingEnrollments') : t('dashboard.stats.attendanceRate'),
      value: user?.role === 'admin' ? stats.pendingEnrollments : `${stats.attendanceRate}%`,
      icon: user?.role === 'admin' ? UserPlus : TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'enrollment',
      message: isRTL ? 'طلب تسجيل جديد من أحمد بنعلي' : 'Nouvelle demande d\'inscription de Ahmed Benali',
      time: '2h',
      icon: UserPlus,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'attendance',
      message: isRTL ? 'وصول لينا دوبوا' : 'Arrivée de Lina Dubois',
      time: '3h',
      icon: Clock,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'user',
      message: isRTL ? 'إضافة موظف جديد' : 'Nouvel employé ajouté',
      time: '5h',
      icon: Users,
      color: 'text-purple-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.welcome', { name: user?.first_name })}
          </h1>
          <p className="mt-1 text-gray-600">
            {isRTL 
              ? 'إليكم نظرة عامة على نشاط اليوم'
              : 'Voici un aperçu de l\'activité d\'aujourd\'hui'
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 rtl:mr-0 rtl:ml-2"></div>
            {isRTL ? 'متصل' : 'En ligne'}
          </span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <div className="ml-4 rtl:ml-0 rtl:mr-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités récentes */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              {isRTL ? 'الأنشطة الأخيرة' : 'Activités récentes'}
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className={`p-2 rounded-lg bg-gray-100`}>
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isRTL ? `منذ ${activity.time}` : `Il y a ${activity.time}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Graphique rapide (placeholder) */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              {isRTL ? 'إحصائيات الحضور' : 'Statistiques de présence'}
            </h2>
          </div>
          <div className="card-body">
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">
                  {isRTL ? 'الرسم البياني قريباً' : 'Graphique bientôt disponible'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            {isRTL ? 'إجراءات سريعة' : 'Actions rapides'}
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/dashboard/users')}
                className="btn-outline-primary text-left rtl:text-right hover:scale-105 transition-transform"
              >
                <Users className="w-5 h-5 mb-2" />
                <div>
                  <div className="font-medium">
                    {isRTL ? 'إدارة المستخدمين' : 'Gérer les utilisateurs'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {isRTL ? 'إضافة وتعديل المستخدمين' : 'Ajouter et modifier'}
                  </div>
                </div>
              </button>
            )}
            
            {['admin', 'staff'].includes(user?.role) && (
              <>
                <button 
                  onClick={() => navigate('/dashboard/children')}
                  className="btn-outline-primary text-left rtl:text-right hover:scale-105 transition-transform"
                >
                  <Baby className="w-5 h-5 mb-2" />
                  <div>
                    <div className="font-medium">
                      {isRTL ? 'إدارة الأطفال' : 'Gérer les enfants'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isRTL ? 'عرض وتعديل بيانات الأطفال' : 'Voir et modifier'}
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => navigate('/dashboard/attendance')}
                  className="btn-outline-primary text-left rtl:text-right hover:scale-105 transition-transform"
                >
                  <Calendar className="w-5 h-5 mb-2" />
                  <div>
                    <div className="font-medium">
                      {isRTL ? 'تسجيل الحضور' : 'Marquer présence'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isRTL ? 'وصول ومغادرة الأطفال' : 'Arrivées et départs'}
                    </div>
                  </div>
                </button>
              </>
            )}
            
            <button 
              onClick={() => navigate('/dashboard/enrollments')}
              className="btn-outline-primary text-left rtl:text-right hover:scale-105 transition-transform"
            >
              <UserPlus className="w-5 h-5 mb-2" />
              <div>
                <div className="font-medium">
                  {isRTL ? 'طلبات التسجيل' : 'Demandes d\'inscription'}
                </div>
                <div className="text-sm text-gray-500">
                  {stats.pendingEnrollments} {isRTL ? 'في الانتظار' : 'en attente'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
