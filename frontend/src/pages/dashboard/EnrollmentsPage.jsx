import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, Search, Filter, CheckCircle, XCircle, Clock, Eye, Calendar, Utensils, Heart } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { enrollmentService } from '../../services/enrollmentService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader'
import toast from 'react-hot-toast'

const EnrollmentsPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    loadEnrollments()
  }, [])

  const loadEnrollments = async () => {
    try {
      setLoading(true)
      const response = await enrollmentService.getAllEnrollments()
      setEnrollments(response.enrollments || [])
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error)
      toast.error('Erreur lors du chargement des inscriptions')
    } finally {
      setLoading(false)
    }

  const openDetails = async (enrollment) => {
    try {
      setSelectedEnrollment(enrollment)
      setDetailsLoading(true)
      const res = await enrollmentService.getEnrollmentById(enrollment.id)
      setSelectedDetails(res)
    } catch (error) {
      console.error('Erreur chargement détails:', error)
      toast.error(isRTL ? 'تعذر تحميل التفاصيل' : 'Impossible de charger les détails')
    } finally {
      setDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    setSelectedEnrollment(null)
    setSelectedDetails(null)
  }
  }

  const handleStatusChange = async (enrollmentId, newStatus) => {
    try {
      await enrollmentService.updateEnrollmentStatus(enrollmentId, newStatus)
      toast.success(isRTL ? 'تم تحديث حالة التسجيل' : 'Statut de l\'inscription mis à jour')
      loadEnrollments()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    const childName = `${enrollment.child?.first_name || ''} ${enrollment.child?.last_name || ''}`.toLowerCase()
    const matchesSearch = childName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock,
        text: isRTL ? 'في الانتظار' : 'En attente'
      },
      approved: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        text: isRTL ? 'مقبول' : 'Approuvé'
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle,
        text: isRTL ? 'مرفوض' : 'Rejeté'
      }
    }
    return statusConfig[status] || statusConfig.pending
  }

  const getGenderIcon = (gender) => {
    return gender === 'M' ? '👦' : '👧'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.enrollments')}
        subtitle={isRTL ? 'إدارة طلبات التسجيل وموافقتها' : 'Gérer et approuver les demandes d\'inscription'}
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            label: isRTL ? 'إجمالي الطلبات' : 'Total des demandes', 
            value: enrollments.length, 
            color: 'bg-blue-500',
            icon: UserPlus
          },
          { 
            label: isRTL ? 'في الانتظار' : 'En attente', 
            value: enrollments.filter(e => e.status === 'pending').length, 
            color: 'bg-yellow-500',
            icon: Clock
          },
          { 
            label: isRTL ? 'مقبولة' : 'Approuvées', 
            value: enrollments.filter(e => e.status === 'approved').length, 
            color: 'bg-green-500',
            icon: CheckCircle
          },
          { 
            label: isRTL ? 'مرفوضة' : 'Rejetées', 
            value: enrollments.filter(e => e.status === 'rejected').length, 
            color: 'bg-red-500',
            icon: XCircle
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
              <option value="pending">{isRTL ? 'في الانتظار' : 'En attente'}</option>
              <option value="approved">{isRTL ? 'مقبولة' : 'Approuvées'}</option>
              <option value="rejected">{isRTL ? 'مرفوضة' : 'Rejetées'}</option>
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {filteredEnrollments.length} {isRTL ? 'طلب' : 'demande(s)'}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des inscriptions */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isRTL ? 'لا توجد طلبات تسجيل' : 'Aucune demande d\'inscription'}
              </h3>
              <p className="text-gray-500">
                {isRTL ? 'لم يتم العثور على طلبات مطابقة لمعايير البحث' : 'Aucune demande ne correspond aux critères de recherche'}
              </p>
            </div>
          ) : (
            <>
            {/* Table for md+ screens */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الطفل' : 'Enfant'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'تاريخ التسجيل' : 'Date d\'inscription'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الخيارات' : 'Options'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEnrollments.map((enrollment) => {
                    const statusConfig = getStatusBadge(enrollment.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg">
                                {getGenderIcon(enrollment.child?.gender)}
                              </div>
                            </div>
                            <div className="ml-4 rtl:ml-0 rtl:mr-4">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.child?.first_name} {enrollment.child?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {enrollment.child?.birth_date && new Date(enrollment.child.birth_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-gray-400" />
                            {new Date(enrollment.enrollment_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {enrollment.lunch_assistance && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <Utensils className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'غداء' : 'Repas'}
                              </span>
                            )}
                            {enrollment.regulation_accepted && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'قوانين' : 'Règlement'}
                              </span>
                            )}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => openDetails(enrollment)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title={isRTL ? 'عرض' : 'Voir'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {enrollment.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(enrollment.id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                  title={isRTL ? 'قبول' : 'Approuver'}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStatusChange(enrollment.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                  title={isRTL ? 'رفض' : 'Rejeter'}
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards for mobile screens */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredEnrollments.map((enrollment) => {
                const statusConfig = getStatusBadge(enrollment.status)
                const StatusIcon = statusConfig.icon
                return (
                  <div key={enrollment.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg">
                          {getGenderIcon(enrollment.child?.gender)}
                        </div>
                        <div className="ml-3 rtl:ml-0 rtl:mr-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {enrollment.child?.first_name} {enrollment.child?.last_name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1 text-gray-400" />
                            {new Date(enrollment.enrollment_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                        {statusConfig.text}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {enrollment.lunch_assistance && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Utensils className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'غداء' : 'Repas'}
                        </span>
                      )}
                      {enrollment.regulation_accepted && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                          {isRTL ? 'قوانين' : 'Règlement'}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <button onClick={() => openDetails(enrollment)} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center text-sm">
                        <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" /> {isRTL ? 'عرض' : 'Voir'}
                      </button>
                      {enrollment.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusChange(enrollment.id, 'approved')} className="text-green-600 hover:text-green-900 text-sm inline-flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" /> {isRTL ? 'قبول' : 'Approuver'}
                          </button>
                          <button onClick={() => handleStatusChange(enrollment.id, 'rejected')} className="text-red-600 hover:text-red-900 text-sm inline-flex items-center">
                            <XCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" /> {isRTL ? 'رفض' : 'Rejeter'}
                          </button>
                        </>
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

      {/* Modal Voir */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetails}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isRTL ? 'تفاصيل الطلب' : 'Détails de la demande'}
              </h3>
              <button onClick={closeDetails} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {detailsLoading ? (
              <div className="py-8 flex justify-center"><LoadingSpinner /></div>
            ) : selectedDetails ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">{isRTL ? 'الطفل' : 'Enfant'}</div>
                    <div className="text-gray-700">{selectedDetails.enrollment.child_first_name} {selectedDetails.enrollment.child_last_name}</div>
                    <div className="text-gray-500">{selectedDetails.enrollment.birth_date && new Date(selectedDetails.enrollment.birth_date).toLocaleDateString()}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="font-medium text-gray-900 mb-1">{isRTL ? 'الوالد' : 'Parent'}</div>
                    <div className="text-gray-700">{selectedDetails.enrollment.parent_first_name} {selectedDetails.enrollment.parent_last_name}</div>
                    <div className="text-gray-500">{selectedDetails.enrollment.parent_email}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-2">{isRTL ? 'الوثائق' : 'Documents'}</div>
                  {selectedDetails.documents?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedDetails.documents.map(doc => (
                        <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border rounded p-2 hover:bg-gray-50">
                          <div className="truncate text-gray-700">
                            {doc.document_type} — {doc.filename}
                          </div>
                          <span className="text-primary-600 text-xs">{isRTL ? 'فتح' : 'Ouvrir'}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">{isRTL ? 'لا توجد وثائق' : 'Aucun document'}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">{isRTL ? 'لا توجد بيانات' : 'Pas de données'}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnrollmentsPage
