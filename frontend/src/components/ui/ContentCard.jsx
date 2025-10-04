import { Link } from 'react-router-dom'
import { Calendar, User, Eye, ArrowRight } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

const ContentCard = ({ 
  id,
  title,
  description,
  image,
  author,
  date,
  type = 'article', // 'article' ou 'news'
  status = 'published',
  views = 0,
  className = ''
}) => {
  const { isRTL } = useLanguage()

  const getTypeInfo = () => {
    switch (type) {
      case 'news':
        return {
          label: isRTL ? 'خبر' : 'Actualité',
          color: 'bg-green-100 text-green-800',
          link: `/actualites/${id}`
        }
      default:
        return {
          label: isRTL ? 'مقال' : 'Article',
          color: 'bg-blue-100 text-blue-800',
          link: `/articles/${id}`
        }
    }
  }

  const typeInfo = getTypeInfo()

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-TN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateText = (text, maxLength = 120) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group ${className}`}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <div className="text-primary-400 text-6xl font-bold">
              {type === 'news' ? '📰' : '📄'}
            </div>
          </div>
        )}
        
        {/* Badge de type */}
        <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        </div>

        {/* Badge de statut (si brouillon) */}
        {status === 'draft' && (
          <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {isRTL ? 'مسودة' : 'Brouillon'}
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-6">
        {/* Titre */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
          <Link to={typeInfo.link} className="hover:underline">
            {title}
          </Link>
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {truncateText(description)}
        </p>

        {/* Métadonnées */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {author && (
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <User className="w-4 h-4" />
                <span>{author}</span>
              </div>
            )}
            
            {date && (
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(date)}</span>
              </div>
            )}
          </div>

          {views > 0 && (
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <Eye className="w-4 h-4" />
              <span>{views}</span>
            </div>
          )}
        </div>

        {/* Bouton Lire plus */}
        <Link
          to={typeInfo.link}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all duration-200"
        >
          {isRTL ? 'اقرأ المزيد' : 'Lire la suite'}
          <ArrowRight className={`w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
      </div>
    </div>
  )
}

export default ContentCard
