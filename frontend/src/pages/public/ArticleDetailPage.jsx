import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { articleService } from '../../services/articleService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const ArticleDetailPage = () => {
  const { t } = useTranslation()
  const { isRTL, getLocalizedText } = useLanguage()
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchArticle()
  }, [id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await articleService.getArticleById(id)
      setArticle(response.article)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'article:', error)
      setError(error.response?.status === 404 ? 'Article non trouvé' : 'Erreur de chargement')
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: getLocalizedText({
            fr: article.title_fr,
            ar: article.title_ar
          }),
          url: window.location.href
        })
      } catch (error) {
        console.log('Partage annulé')
      }
    } else {
      // Fallback: copier l'URL
      navigator.clipboard.writeText(window.location.href)
      // Vous pourriez ajouter une notification toast ici
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-8">
            {error || (isRTL ? 'المقال غير موجود' : 'Article non trouvé')}
          </p>
          <Link to="/articles" className="btn-primary">
            {isRTL ? 'العودة إلى المقالات' : 'Retour aux articles'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/articles"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {isRTL ? 'العودة إلى المقالات' : 'Retour aux articles'}
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {getLocalizedText({
              fr: article.title_fr,
              ar: article.title_ar
            })}
          </h1>
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-6 rtl:space-x-reverse text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>
              
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                <span>{article.author_first_name} {article.author_last_name}</span>
              </div>
            </div>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 hover:text-primary-600 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span>{isRTL ? 'مشاركة' : 'Partager'}</span>
            </button>
          </div>
        </header>

        {/* Image principale */}
        {article.image_url && (
          <div className="mb-8">
            <img
              src={article.image_url}
              alt={getLocalizedText({
                fr: article.title_fr,
                ar: article.title_ar
              })}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Contenu */}
        <div className="prose prose-lg max-w-none">
          <div 
            className={`text-gray-700 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}
            dangerouslySetInnerHTML={{
              __html: getLocalizedText({
                fr: article.content_fr,
                ar: article.content_ar
              }).replace(/\n/g, '<br>')
            }}
          />
        </div>

        {/* Actions */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              to="/articles"
              className="btn-outline-primary"
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
              {isRTL ? 'المزيد من المقالات' : 'Plus d\'articles'}
            </Link>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <span className="text-gray-500">
                {isRTL ? 'شارك هذا المقال:' : 'Partager cet article :'}
              </span>
              <button
                onClick={handleShare}
                className="btn-primary btn-sm"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Articles similaires (placeholder) */}
      <section className="bg-white py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {isRTL ? 'مقالات ذات صلة' : 'Articles similaires'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="card">
                <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                <div className="card-body">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {isRTL ? `مقال مشابه ${index}` : `Article similaire ${index}`}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {isRTL 
                      ? 'وصف مختصر للمقال المشابه...'
                      : 'Description courte de l\'article similaire...'
                    }
                  </p>
                  <Link
                    to={`/articles/${index}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    {t('articles.readMore')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ArticleDetailPage
