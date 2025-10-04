import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Calendar, ArrowRight, Grid, List } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { articleService } from '../../services/articleService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ContentCard from '../../components/ui/ContentCard'

const ArticlesPage = () => {
  const { t } = useTranslation()
  const { isRTL, getLocalizedText } = useLanguage()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState('grid') // 'grid' ou 'list'

  useEffect(() => {
    fetchArticles()
  }, [currentPage, searchTerm])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 6,
        status: 'published'
      }
      
      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await articleService.getArticles(params)
      setArticles(response.articles || [])
      setTotalPages(response.pagination?.pages || 1)
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchArticles()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? 'ar-MA' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('nav.articles')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {isRTL 
                ? 'اكتشفوا مقالاتنا التعليمية والنصائح المفيدة لتربية الأطفال'
                : 'Découvrez nos articles éducatifs et conseils utiles pour l\'éducation des enfants'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de recherche et contrôles */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder={isRTL ? 'البحث في المقالات...' : 'Rechercher dans les articles...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </form>

            {/* Contrôles d'affichage */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
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
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isRTL ? 'لا توجد مقالات' : 'Aucun article trouvé'}
            </h3>
            <p className="text-gray-500">
              {isRTL 
                ? 'لم نجد أي مقالات تطابق بحثك'
                : 'Nous n\'avons trouvé aucun article correspondant à votre recherche'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Affichage des articles */}
            <div className={`mb-8 ${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-6'
            }`}>
              {articles.map((article) => (
                <ContentCard
                  key={article.id}
                  id={article.id}
                  title={getLocalizedText({
                    fr: article.title_fr,
                    ar: article.title_ar
                  })}
                  description={getLocalizedText({
                    fr: article.description_fr || article.content_fr,
                    ar: article.description_ar || article.content_ar
                  })}
                  image={article.image_url}
                  author={`${article.author_first_name || ''} ${article.author_last_name || ''}`.trim()}
                  date={article.published_at || article.created_at}
                  type="article"
                  status={article.status}
                  views={article.views || 0}
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

export default ArticlesPage
