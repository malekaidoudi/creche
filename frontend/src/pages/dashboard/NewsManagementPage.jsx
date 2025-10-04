import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Newspaper, Plus, Search, Filter, Edit, Trash2, Eye, Calendar, AlertCircle } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const NewsManagementPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedNews, setSelectedNews] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    status: 'draft'
  })

  // Données simulées pour la démonstration
  const mockNews = [
    {
      id: 1,
      title: isRTL ? 'إغلاق الحضانة يوم الجمعة القادم' : 'Fermeture de la crèche vendredi prochain',
      content: isRTL ? 'ستكون الحضانة مغلقة يوم الجمعة القادم بسبب التدريب المهني للموظفين' : 'La crèche sera fermée vendredi prochain pour formation du personnel',
      priority: 'high',
      author: 'Admin',
      created_at: '2024-01-20',
      views: 156,
      status: 'published'
    },
    {
      id: 2,
      title: isRTL ? 'نشاط جديد: ورشة الرسم' : 'Nouvelle activité : Atelier peinture',
      content: isRTL ? 'نحن سعداء لإعلان بدء ورشة الرسم الجديدة للأطفال كل يوم ثلاثاء' : 'Nous sommes heureux d\'annoncer le lancement de notre nouvel atelier peinture chaque mardi',
      priority: 'medium',
      author: 'Staff',
      created_at: '2024-01-18',
      views: 89,
      status: 'published'
    },
    {
      id: 3,
      title: isRTL ? 'تحديث قائمة الطعام' : 'Mise à jour du menu',
      content: isRTL ? 'تم تحديث قائمة الطعام لتشمل المزيد من الخيارات الصحية والمتنوعة' : 'Le menu a été mis à jour pour inclure plus d\'options saines et variées',
      priority: 'low',
      author: 'Admin',
      created_at: '2024-01-15',
      views: 67,
      status: 'draft'
    }
  ]

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      setLoading(true)
      // Simulation d'un appel API
      setTimeout(() => {
        setNews(mockNews)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Erreur lors du chargement des actualités:', error)
      toast.error('Erreur lors du chargement des actualités')
      setLoading(false)
    }
  }

  const handleDeleteNews = async (newsId) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الخبر؟' : 'Êtes-vous sûr de vouloir supprimer cette actualité ?')) {
      return
    }

    try {
      // Simulation de suppression
      setNews(news.filter(item => item.id !== newsId))
      toast.success(isRTL ? 'تم حذف الخبر بنجاح' : 'Actualité supprimée avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleOpenModal = (newsItem = null) => {
    if (newsItem) {
      setSelectedNews(newsItem)
      setFormData({
        title: newsItem.title,
        content: newsItem.content,
        priority: newsItem.priority,
        status: newsItem.status
      })
    } else {
      setSelectedNews(null)
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        status: 'draft'
      })
    }
    setShowModal(true)
  }

  const handleSaveNews = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis')
      return
    }

    try {
      if (selectedNews) {
        // Modification
        setNews(news.map(item => 
          item.id === selectedNews.id 
            ? { ...item, ...formData, updated_at: new Date().toISOString() }
            : item
        ))
        toast.success(isRTL ? 'تم تحديث الخبر بنجاح' : 'Actualité mise à jour avec succès')
      } else {
        // Création
        const newNewsItem = {
          id: Date.now(),
          ...formData,
          author: 'Admin',
          created_at: new Date().toISOString(),
          views: 0
        }
        setNews([newNewsItem, ...news])
        toast.success(isRTL ? 'تم إنشاء الخبر بنجاح' : 'Actualité créée avec succès')
      }
      setShowModal(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
    return matchesSearch && matchesPriority
  })

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { 
        color: 'bg-red-100 text-red-800', 
        text: isRTL ? 'عالية' : 'Haute',
        icon: AlertCircle
      },
      medium: { 
        color: 'bg-yellow-100 text-yellow-800', 
        text: isRTL ? 'متوسطة' : 'Moyenne',
        icon: AlertCircle
      },
      low: { 
        color: 'bg-green-100 text-green-800', 
        text: isRTL ? 'منخفضة' : 'Basse',
        icon: AlertCircle
      }
    }
    
    const config = priorityConfig[priority] || priorityConfig.medium
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { 
        color: 'bg-green-100 text-green-800', 
        text: isRTL ? 'منشور' : 'Publié' 
      },
      draft: { 
        color: 'bg-gray-100 text-gray-800', 
        text: isRTL ? 'مسودة' : 'Brouillon' 
      }
    }
    
    const config = statusConfig[status] || statusConfig.draft
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
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
            {isRTL ? 'إدارة الأخبار' : 'Gestion des actualités'}
          </h1>
          <p className="mt-1 text-gray-600">
            {isRTL ? 'إنشاء وإدارة الأخبار والإعلانات المهمة' : 'Créer et gérer les actualités et annonces importantes'}
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary mt-4 sm:mt-0"
        >
          <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {isRTL ? 'إضافة خبر' : 'Nouvelle actualité'}
        </button>
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
                  placeholder={isRTL ? 'البحث في الأخبار...' : 'Rechercher des actualités...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 rtl:pl-3 rtl:pr-10"
                />
              </div>
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input w-full sm:w-auto"
            >
              <option value="all">{isRTL ? 'جميع الأولويات' : 'Toutes les priorités'}</option>
              <option value="high">{isRTL ? 'عالية' : 'Haute'}</option>
              <option value="medium">{isRTL ? 'متوسطة' : 'Moyenne'}</option>
              <option value="low">{isRTL ? 'منخفضة' : 'Basse'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des actualités */}
      <div className="card">
        <div className="card-body p-0">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isRTL ? 'لا توجد أخبار' : 'Aucune actualité'}
              </h3>
              <p className="text-gray-500">
                {isRTL ? 'ابدأ بإنشاء أول خبر' : 'Commencez par créer votre première actualité'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'العنوان' : 'Titre'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الأولوية' : 'Priorité'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'المؤلف' : 'Auteur'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'المشاهدات' : 'Vues'}
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
                  {filteredNews.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {item.content.substring(0, 80)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getPriorityBadge(item.priority)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.author}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 text-gray-400 mr-1" />
                          {item.views}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          {new Date(item.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="text-red-600 hover:text-red-900"
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

      {/* Modal de création/édition d'actualité */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedNews 
                  ? (isRTL ? 'تعديل الخبر' : 'Modifier l\'actualité')
                  : (isRTL ? 'إضافة خبر جديد' : 'Nouvelle actualité')
                }
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isRTL ? 'العنوان' : 'Titre'} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isRTL ? 'أدخل عنوان الخبر' : 'Entrez le titre de l\'actualité'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isRTL ? 'المحتوى' : 'Contenu'} *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isRTL ? 'أدخل محتوى الخبر' : 'Entrez le contenu de l\'actualité'}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'الأولوية' : 'Priorité'}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">{isRTL ? 'منخفضة' : 'Basse'}</option>
                    <option value="medium">{isRTL ? 'متوسطة' : 'Moyenne'}</option>
                    <option value="high">{isRTL ? 'عالية' : 'Haute'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRTL ? 'الحالة' : 'Statut'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">{isRTL ? 'مسودة' : 'Brouillon'}</option>
                    <option value="published">{isRTL ? 'منشور' : 'Publié'}</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 rtl:space-x-reverse mt-6 pt-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={handleSaveNews}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedNews 
                  ? (isRTL ? 'تحديث' : 'Mettre à jour')
                  : (isRTL ? 'إنشاء' : 'Créer')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsManagementPage
