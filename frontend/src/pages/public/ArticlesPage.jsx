import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Search, Calendar, ArrowRight, Grid, List, Clock, User, Tag } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { articleService } from '../../services/articleService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ImageWithFallback, defaultImages } from '../../utils/imageUtils.jsx'

const ArticlesPage = () => {
  const { t } = useTranslation()
  const { isRTL, getLocalizedText } = useLanguage()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  // Mock data pour la démonstration
  const mockArticles = [
    {
      id: 1,
      title: isRTL ? 'أهمية التعليم المبكر للأطفال' : 'L\'importance de l\'éducation précoce',
      excerpt: isRTL 
        ? 'التعليم المبكر يلعب دوراً حاسماً في تطوير قدرات الطفل المعرفية والاجتماعية'
        : 'L\'éducation précoce joue un rôle crucial dans le développement cognitif et social de l\'enfant',
      content: isRTL
        ? 'محتوى المقال باللغة العربية...'
        : 'Contenu de l\'article en français...',
      image: '/images/article1.jpg',
      author: isRTL ? 'د. فاطمة أحمد' : 'Dr. Fatima Ahmed',
      publishedAt: '2024-01-15',
      category: isRTL ? 'التعليم' : 'Éducation',
      readTime: 5,
      tags: isRTL ? ['تعليم', 'أطفال', 'تطوير'] : ['éducation', 'enfants', 'développement']
    },
    {
      id: 2,
      title: isRTL ? 'نصائح للتغذية الصحية للأطفال' : 'Conseils pour une alimentation saine',
      excerpt: isRTL
        ? 'التغذية السليمة أساس نمو الطفل الصحي وتطوير مناعته'
        : 'Une alimentation équilibrée est la base d\'une croissance saine et du développement immunitaire',
      content: isRTL
        ? 'محتوى المقال باللغة العربية...'
        : 'Contenu de l\'article en français...',
      image: '/images/article2.jpg',
      author: isRTL ? 'أ. محمد الكريم' : 'M. Mohamed Karim',
      publishedAt: '2024-01-10',
      category: isRTL ? 'الصحة' : 'Santé',
      readTime: 7,
      tags: isRTL ? ['تغذية', 'صحة', 'أطفال'] : ['nutrition', 'santé', 'enfants']
    },
    {
      id: 3,
      title: isRTL ? 'كيفية التعامل مع نوبات الغضب عند الأطفال' : 'Gérer les crises de colère chez l\'enfant',
      excerpt: isRTL
        ? 'استراتيجيات فعالة للتعامل مع نوبات الغضب وتعليم الطفل التحكم في انفعالاته'
        : 'Stratégies efficaces pour gérer les crises et enseigner la régulation émotionnelle',
      content: isRTL
        ? 'محتوى المقال باللغة العربية...'
        : 'Contenu de l\'article en français...',
      image: '/images/article3.jpg',
      author: isRTL ? 'د. عائشة بن علي' : 'Dr. Aicha Ben Ali',
      publishedAt: '2024-01-05',
      category: isRTL ? 'علم النفس' : 'Psychologie',
      readTime: 6,
      tags: isRTL ? ['سلوك', 'تربية', 'نفسية'] : ['comportement', 'éducation', 'psychologie']
    },
    {
      id: 4,
      title: isRTL ? 'أنشطة ترفيهية تعليمية للأطفال' : 'Activités ludiques et éducatives',
      excerpt: isRTL
        ? 'مجموعة من الأنشطة الممتعة التي تساعد على تطوير مهارات الطفل'
        : 'Une collection d\'activités amusantes qui aident au développement des compétences',
      content: isRTL
        ? 'محتوى المقال باللغة العربية...'
        : 'Contenu de l\'article en français...',
      image: '/images/article4.jpg',
      author: isRTL ? 'أ. سارة محمد' : 'Mme. Sara Mohamed',
      publishedAt: '2024-01-01',
      category: isRTL ? 'أنشطة' : 'Activités',
      readTime: 4,
      tags: isRTL ? ['أنشطة', 'تعلم', 'لعب'] : ['activités', 'apprentissage', 'jeu']
    }
  ]

  const categories = [
    { id: 'all', name: isRTL ? 'الكل' : 'Tous' },
    { id: 'education', name: isRTL ? 'التعليم' : 'Éducation' },
    { id: 'health', name: isRTL ? 'الصحة' : 'Santé' },
    { id: 'psychology', name: isRTL ? 'علم النفس' : 'Psychologie' },
    { id: 'activities', name: isRTL ? 'أنشطة' : 'Activités' }
  ]

  useEffect(() => {
    // Simuler le chargement des articles
    setLoading(true)
    setTimeout(() => {
      setArticles(mockArticles)
      setLoading(false)
    }, 500)
  }, [currentPage]) // Retiré searchTerm et selectedCategory pour éviter les recherches à chaque lettre

  const filteredArticles = articles.filter(article => {
    // Recherche améliorée dans titre, extrait, contenu et tags
    const searchLower = searchTerm.toLowerCase().trim()
    const matchesSearch = searchLower === '' || 
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.content.toLowerCase().includes(searchLower) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchLower))
    
    // Filtrage par catégorie amélioré - correspondance exacte ou traduction
    const matchesCategory = selectedCategory === 'all' || 
      article.category.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === 'education' && (
        article.category.toLowerCase().includes('éducation') || 
        article.category.toLowerCase().includes('تعليم')
      )) ||
      (selectedCategory === 'health' && (
        article.category.toLowerCase().includes('santé') || 
        article.category.toLowerCase().includes('صحة')
      )) ||
      (selectedCategory === 'psychology' && (
        article.category.toLowerCase().includes('psychologie') || 
        article.category.toLowerCase().includes('علم النفس')
      )) ||
      (selectedCategory === 'activities' && (
        article.category.toLowerCase().includes('activités') || 
        article.category.toLowerCase().includes('أنشطة')
      ))
    
    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return isRTL 
      ? date.toLocaleDateString('ar-SA')
      : date.toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {isRTL ? 'مقالاتنا' : 'Nos Articles'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {isRTL
              ? 'اكتشف مجموعة من المقالات المفيدة حول رعاية وتربية الأطفال'
              : 'Découvrez une collection d\'articles utiles sur les soins et l\'éducation des enfants'
            }
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={isRTL ? 'ابحث في المقالات...' : 'Rechercher dans les articles...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Results indicator */}
          {(searchTerm || selectedCategory !== 'all') && (
            <div className="mt-4 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {filteredArticles.length === 0 
                  ? (isRTL ? 'لم يتم العثور على مقالات' : 'Aucun article trouvé')
                  : (isRTL 
                      ? `تم العثور على ${filteredArticles.length} مقال${filteredArticles.length > 1 ? 'ات' : ''}`
                      : `${filteredArticles.length} article${filteredArticles.length > 1 ? 's' : ''} trouvé${filteredArticles.length > 1 ? 's' : ''}`)
                }
                {searchTerm && (
                  <span className="ml-2 rtl:ml-0 rtl:mr-2">
                    {isRTL ? `للبحث: "${searchTerm}"` : `pour "${searchTerm}"`}
                  </span>
                )}
              </p>
            </div>
          )}
        </motion.div>

        {/* Articles Grid/List */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className={`${
            viewMode === 'grid'
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8'
              : 'space-y-6'
          }`}
        >
          {filteredArticles.map((article, index) => (
            <motion.div key={article.id} variants={fadeInUp}>
              {viewMode === 'grid' ? (
                <Card className="h-full group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="relative overflow-hidden">
                    <ImageWithFallback
                      src={article.image}
                      alt={article.title}
                      fallback={defaultImages.article}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                      <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2 space-x-4 rtl:space-x-reverse">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {formatDate(article.publishedAt)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {article.readTime} {isRTL ? 'دقائق' : 'min'}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <CardDescription className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                      {article.excerpt}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <User className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        {article.author}
                      </div>
                      <Button asChild variant="ghost" size="sm" className="group/btn">
                        <Link to={`/articles/${article.id}`}>
                          {isRTL ? 'اقرأ المزيد' : 'Lire plus'}
                          <ArrowRight className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3">
                        <div className="relative overflow-hidden rounded-lg">
                          <ImageWithFallback
                            src={article.image}
                            alt={article.title}
                            fallback={defaultImages.article}
                            className="w-full h-48 md:h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2">
                            <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                              {article.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:w-2/3 space-y-3">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4 rtl:space-x-reverse">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {formatDate(article.publishedAt)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {article.readTime} {isRTL ? 'دقائق' : 'min'}
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            {article.author}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {article.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                          {article.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {article.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <Button asChild variant="ghost" size="sm" className="group/btn">
                            <Link to={`/articles/${article.id}`}>
                              {isRTL ? 'اقرأ المزيد' : 'Lire plus'}
                              <ArrowRight className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'لم يتم العثور على مقالات' : 'Aucun article trouvé'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {isRTL
                ? 'جرب تغيير مصطلحات البحث أو الفئة'
                : 'Essayez de modifier les termes de recherche ou la catégorie'
              }
            </p>
          </motion.div>
        )}

        {/* Load More Button */}
        {filteredArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Button size="lg" variant="outline">
              {isRTL ? 'تحميل المزيد' : 'Charger plus d\'articles'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ArticlesPage
