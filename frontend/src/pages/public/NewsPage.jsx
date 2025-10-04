import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin, Clock, Filter, Grid, List } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { newsService } from '../../services/newsService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ContentCard from '../../components/ui/ContentCard'

const NewsPage = () => {
  const { t } = useTranslation()
  const { isRTL, getLocalizedText } = useLanguage()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'upcoming', 'past'
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState('grid') // 'grid' ou 'list'

  useEffect(() => {
    fetchNews()
  }, [currentPage, filter])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 8,
        status: 'published'
      }
      
      if (filter === 'upcoming') {
        params.upcoming = true
      }

      const response = await newsService.getNews(params)
      setNews(response.news || [])
      setTotalPages(response.pagination?.pages || 1)
    } catch (error) {
      console.error('Erreur lors du chargement des actualités:', error)
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? 'ar-MA' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isUpcoming = (dateString) => {
    if (!dateString) return false
    return new Date(dateString) > new Date()
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('nav.news')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {isRTL 
                ? 'ابقوا على اطلاع بأحدث الأخبار والفعاليات في حضانتنا'
                : 'Restez informés des dernières actualités et événements de notre crèche'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres et contrôles */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filtres */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">
                  {isRTL ? 'تصفية:' : 'Filtrer :'}
                </span>
              </div>
              
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isRTL ? 'الكل' : 'Toutes'}
                </button>
                
                <button
                  onClick={() => handleFilterChange('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'upcoming'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t('news.upcoming')}
                </button>
                
                <button
                  onClick={() => handleFilterChange('past')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'past'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t('news.past')}
                </button>
              </div>
            </div>

            {/* Contrôles d'affichage */}
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
              <span className="text-sm text-gray-600">
                {isRTL ? 'عرض:' : 'Affichage :'}
              </span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isRTL ? 'لا توجد أخبار' : 'Aucune actualité'}
            </h3>
            <p className="text-gray-500">
              {isRTL 
                ? 'لا توجد أخبار متاحة حالياً'
                : 'Aucune actualité disponible pour le moment'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Affichage des actualités */}
            <div className={`mb-8 ${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-6'
            }`}>
              {news.map((item) => (
                <ContentCard
                  key={item.id}
                  id={item.id}
                  title={getLocalizedText({
                    fr: item.title_fr,
                    ar: item.title_ar
                  })}
                  description={getLocalizedText({
                    fr: item.description_fr || item.content_fr,
                    ar: item.description_ar || item.content_ar
                  })}
                  image={item.image_url}
                  author={`${item.author_first_name || ''} ${item.author_last_name || ''}`.trim()}
                  date={item.event_date || item.published_at || item.created_at}
                  type="news"
                  status={item.status}
                  views={item.views || 0}
                  className={viewMode === 'list' ? 'flex flex-col md:flex-row md:items-center' : ''}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex items-center space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.previous')}
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.next')}
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default NewsPage
