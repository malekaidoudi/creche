import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, Users, CheckCircle, XCircle, LogIn, LogOut, Search, Filter } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { attendanceService } from '../../services/attendanceService'
import { childrenService } from '../../services/childrenService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader'
import toast from 'react-hot-toast'

const AttendancePage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [children, setChildren] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [childrenResponse, attendanceResponse] = await Promise.all([
        childrenService.getAllChildren(),
        attendanceService.getAttendanceByDate(selectedDate)
      ])
      
      setChildren(childrenResponse.children || [])
      setAttendanceRecords(attendanceResponse.attendance || [])
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (childId) => {
    try {
      await attendanceService.checkIn(childId, selectedDate)
      toast.success(isRTL ? 'تم تسجيل الدخول بنجاح' : 'Entrée enregistrée avec succès')
      loadData()
    } catch (error) {
      console.error('Erreur check-in:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const handleCheckOut = async (childId) => {
    try {
      await attendanceService.checkOut(childId, selectedDate)
      toast.success(isRTL ? 'تم تسجيل الخروج بنجاح' : 'Sortie enregistrée avec succès')
      loadData()
    } catch (error) {
      console.error('Erreur check-out:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const getAttendanceStatus = (childId) => {
    const record = attendanceRecords.find(r => r.child_id === childId)
    if (!record) return 'absent'
    if (record.check_in_time && !record.check_out_time) return 'present'
    if (record.check_in_time && record.check_out_time) return 'left'
    return 'absent'
  }

  const getAttendanceRecord = (childId) => {
    return attendanceRecords.find(r => r.child_id === childId)
  }

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    
    const status = getAttendanceStatus(child.id)
    return matchesSearch && status === statusFilter
  })

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        text: isRTL ? 'حاضر' : 'Présent'
      },
      absent: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle,
        text: isRTL ? 'غائب' : 'Absent'
      },
      left: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: LogOut,
        text: isRTL ? 'غادر' : 'Parti'
      }
    }
    return statusConfig[status] || statusConfig.absent
  }

  const getGenderIcon = (gender) => {
    return gender === 'M' ? '👦' : '👧'
  }

  const formatTime = (timeString) => {
    if (!timeString) return '-'
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const todayStats = {
    total: children.length,
    present: attendanceRecords.filter(r => r.check_in_time && !r.check_out_time).length,
    absent: children.length - attendanceRecords.filter(r => r.check_in_time).length,
    left: attendanceRecords.filter(r => r.check_in_time && r.check_out_time).length
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.attendance')}
        subtitle={isRTL ? 'تسجيل وإدارة حضور الأطفال' : 'Enregistrer et gérer la présence des enfants'}
      />

      {/* Date et statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="card">
          <div className="card-body">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isRTL ? 'التاريخ' : 'Date'}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {[
          { 
            label: isRTL ? 'إجمالي الأطفال' : 'Total enfants', 
            value: todayStats.total, 
            color: 'bg-blue-500',
            icon: Users
          },
          { 
            label: isRTL ? 'حاضرون' : 'Présents', 
            value: todayStats.present, 
            color: 'bg-green-500',
            icon: CheckCircle
          },
          { 
            label: isRTL ? 'غائبون' : 'Absents', 
            value: todayStats.absent, 
            color: 'bg-red-500',
            icon: XCircle
          },
          { 
            label: isRTL ? 'غادروا' : 'Partis', 
            value: todayStats.left, 
            color: 'bg-blue-500',
            icon: LogOut
          }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4 rtl:ml-0 rtl:mr-4">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={isRTL ? 'البحث عن الأطفال...' : 'Rechercher des enfants...'}
                className="form-input pl-10 rtl:pl-4 rtl:pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'Tous les statuts'}</option>
              <option value="present">{isRTL ? 'حاضرون' : 'Présents'}</option>
              <option value="absent">{isRTL ? 'غائبون' : 'Absents'}</option>
              <option value="left">{isRTL ? 'غادروا' : 'Partis'}</option>
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {filteredChildren.length} {isRTL ? 'طفل' : 'enfant(s)'}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des enfants */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isRTL ? 'لا يوجد أطفال' : 'Aucun enfant trouvé'}
              </h3>
              <p className="text-gray-500">
                {isRTL ? 'لم يتم العثور على أطفال مطابقين لمعايير البحث' : 'Aucun enfant ne correspond aux critères de recherche'}
              </p>
            </div>
          ) : (
            <>
            {/* Table view for md+ */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الطفل' : 'Enfant'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'وقت الدخول' : 'Heure d\'entrée'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'وقت الخروج' : 'Heure de sortie'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredChildren.map((child) => {
                    const status = getAttendanceStatus(child.id)
                    const record = getAttendanceRecord(child.id)
                    const statusConfig = getStatusBadge(status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <tr key={child.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg">
                                {getGenderIcon(child.gender)}
                              </div>
                            </div>
                            <div className="ml-4 rtl:ml-0 rtl:mr-4">
                              <div className="text-sm font-medium text-gray-900">
                                {child.first_name} {child.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {child.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StatusIcon className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                              {statusConfig.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-gray-400" />
                            {formatTime(record?.check_in_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-gray-400" />
                            {formatTime(record?.check_out_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            {status === 'absent' && (
                              <button
                                onClick={() => handleCheckIn(child.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <LogIn className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'دخول' : 'Entrée'}
                              </button>
                            )}
                            {status === 'present' && (
                              <button
                                onClick={() => handleCheckOut(child.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <LogOut className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'خروج' : 'Sortie'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Card view for mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredChildren.map((child) => {
                const status = getAttendanceStatus(child.id)
                const record = getAttendanceRecord(child.id)
                const statusConfig = getStatusBadge(status)
                const StatusIcon = statusConfig.icon
                return (
                  <div key={child.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg">
                          {getGenderIcon(child.gender)}
                        </div>
                        <div className="ml-3 rtl:ml-0 rtl:mr-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {child.first_name} {child.last_name}
                          </div>
                          <div className="text-xs text-gray-500">ID: {child.id}</div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                        {statusConfig.text}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-gray-400" />
                        {formatTime(record?.check_in_time)}
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-gray-400" />
                        {formatTime(record?.check_out_time)}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      {status === 'absent' && (
                        <button
                          onClick={() => handleCheckIn(child.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <LogIn className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" /> {isRTL ? 'دخول' : 'Entrée'}
                        </button>
                      )}
                      {status === 'present' && (
                        <button
                          onClick={() => handleCheckOut(child.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <LogOut className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" /> {isRTL ? 'خروج' : 'Sortie'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendancePage
