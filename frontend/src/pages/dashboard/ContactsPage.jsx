import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Search, Filter, Mail, Phone, Calendar, Eye, Reply, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ContactsPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Données simulées pour la démonstration
  const mockMessages = [
    {
      id: 1,
      name: 'Ahmed Ben Ali',
      email: 'ahmed.benali@email.com',
      phone: '+216 12 345 678',
      subject: isRTL ? 'استفسار عن التسجيل' : 'Demande d\'inscription',
      message: isRTL ? 'مرحباً، أود الاستفسار عن إمكانية تسجيل طفلي في الحضانة. طفلي عمره سنتان ونصف.' : 'Bonjour, je souhaiterais me renseigner sur les possibilités d\'inscription pour mon enfant de 2 ans et demi.',
      status: 'new',
      created_at: '2024-01-22T10:30:00',
      replied_at: null
    },
    {
      id: 2,
      name: 'Fatima Trabelsi',
      email: 'fatima.trabelsi@email.com',
      phone: '+216 98 765 432',
      subject: isRTL ? 'سؤال عن الأنشطة' : 'Question sur les activités',
      message: isRTL ? 'هل يمكنكم إخباري بالأنشطة المتاحة للأطفال في سن الثلاث سنوات؟' : 'Pourriez-vous me renseigner sur les activités disponibles pour les enfants de 3 ans ?',
      status: 'replied',
      created_at: '2024-01-20T14:15:00',
      replied_at: '2024-01-20T16:30:00'
    },
    {
      id: 3,
      name: 'Mohamed Sassi',
      email: 'mohamed.sassi@email.com',
      phone: '+216 55 123 456',
      subject: isRTL ? 'شكوى' : 'Réclamation',
      message: isRTL ? 'لدي بعض الملاحظات حول خدمة النقل المدرسي.' : 'J\'ai quelques remarques concernant le service de transport scolaire.',
      status: 'pending',
      created_at: '2024-01-19T09:45:00',
      replied_at: null
    },
    {
      id: 4,
      name: 'Leila Khelifi',
      email: 'leila.khelifi@email.com',
      phone: '+216 22 987 654',
      subject: isRTL ? 'طلب معلومات عن الرسوم' : 'Demande d\'informations sur les tarifs',
      message: isRTL ? 'أرجو إرسال قائمة بالرسوم والخدمات المتاحة.' : 'Merci de m\'envoyer la liste des tarifs et services disponibles.',
      status: 'replied',
      created_at: '2024-01-18T11:20:00',
      replied_at: '2024-01-18T15:45:00'
    }
  ]

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      // Simulation d'un appel API
      setTimeout(() => {
        setMessages(mockMessages)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      toast.error('Erreur lors du chargement des messages')
      setLoading(false)
    }
  }

  const handleStatusChange = async (messageId, newStatus) => {
    try {
      setMessages(messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: newStatus, replied_at: newStatus === 'replied' ? new Date().toISOString() : null }
          : msg
      ))
      toast.success(isRTL ? 'تم تحديث حالة الرسالة' : 'Statut du message mis à jour')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return
    }

    try {
      setMessages(messages.filter(msg => msg.id !== messageId))
      toast.success(isRTL ? 'تم حذف الرسالة بنجاح' : 'Message supprimé avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { 
        color: 'bg-blue-100 text-blue-800', 
        text: isRTL ? 'جديد' : 'Nouveau',
        icon: AlertCircle
      },
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        text: isRTL ? 'قيد المراجعة' : 'En attente',
        icon: Clock
      },
      replied: { 
        color: 'bg-green-100 text-green-800', 
        text: isRTL ? 'تم الرد' : 'Répondu',
        icon: CheckCircle
      }
    }
    
    const config = statusConfig[status] || statusConfig.new
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRTL ? 'إدارة الرسائل' : 'Gestion des messages'}
          </h1>
          <p className="mt-1 text-gray-600">
            {isRTL ? 'إدارة رسائل الاتصال والاستفسارات' : 'Gérer les messages de contact et demandes'}
          </p>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse mt-4 sm:mt-0">
          <div className="text-sm text-gray-600">
            {filteredMessages.filter(m => m.status === 'new').length} {isRTL ? 'رسالة جديدة' : 'nouveaux messages'}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={isRTL ? 'البحث في الرسائل...' : 'Rechercher des messages...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 rtl:pl-3 rtl:pr-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full sm:w-auto"
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'Tous les statuts'}</option>
              <option value="new">{isRTL ? 'جديد' : 'Nouveau'}</option>
              <option value="pending">{isRTL ? 'قيد المراجعة' : 'En attente'}</option>
              <option value="replied">{isRTL ? 'تم الرد' : 'Répondu'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="card">
        <div className="card-body p-0">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isRTL ? 'لا توجد رسائل' : 'Aucun message'}
              </h3>
              <p className="text-gray-500">
                {isRTL ? 'لا توجد رسائل تطابق البحث' : 'Aucun message ne correspond à votre recherche'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'المرسل' : 'Expéditeur'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الموضوع' : 'Sujet'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {message.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {message.email}
                          </div>
                          {message.phone && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {message.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {message.subject}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {message.message.substring(0, 100)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(message.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          {formatDate(message.created_at)}
                        </div>
                        {message.replied_at && (
                          <div className="text-xs text-green-600 mt-1">
                            {isRTL ? 'تم الرد:' : 'Répondu:'} {formatDate(message.replied_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => {
                              setSelectedMessage(message)
                              setShowModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title={isRTL ? 'عرض' : 'Voir'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {message.status !== 'replied' && (
                            <button
                              onClick={() => handleStatusChange(message.id, 'replied')}
                              className="text-green-600 hover:text-green-900"
                              title={isRTL ? 'رد' : 'Répondre'}
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-red-600 hover:text-red-900"
                            title={isRTL ? 'حذف' : 'Supprimer'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détail du message */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {isRTL ? 'تفاصيل الرسالة' : 'Détails du message'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'الاسم' : 'Nom'}
                  </label>
                  <p className="text-gray-900">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'الحالة' : 'Statut'}
                  </label>
                  {getStatusBadge(selectedMessage.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <p className="text-gray-900">{selectedMessage.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'الهاتف' : 'Téléphone'}
                  </label>
                  <p className="text-gray-900">{selectedMessage.phone || '-'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الموضوع' : 'Sujet'}
                </label>
                <p className="text-gray-900">{selectedMessage.subject}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'الرسالة' : 'Message'}
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'تاريخ الإرسال' : 'Date d\'envoi'}
                </label>
                <p className="text-gray-600">{formatDate(selectedMessage.created_at)}</p>
              </div>

              {selectedMessage.replied_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'تاريخ الرد' : 'Date de réponse'}
                  </label>
                  <p className="text-green-600">{formatDate(selectedMessage.replied_at)}</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 rtl:space-x-reverse mt-6 pt-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {isRTL ? 'إغلاق' : 'Fermer'}
              </button>
              {selectedMessage.status !== 'replied' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedMessage.id, 'replied')
                    setShowModal(false)
                  }}
                  className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {isRTL ? 'تم الرد' : 'Marquer comme répondu'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactsPage
