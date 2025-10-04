import { Routes, Route } from 'react-router-dom'
import { useLanguage } from './hooks/useLanguage'

// Layouts
import PublicLayout from './layouts/PublicLayout'

// Pages publiques
import HomePage from './pages/public/HomePage'
import ArticlesPage from './pages/public/ArticlesPage'
import ArticleDetailPage from './pages/public/ArticleDetailPage'
import EnrollmentPage from './pages/public/EnrollmentPage'
import ContactPage from './pages/public/ContactPage'
import VirtualTourPage from './pages/public/VirtualTourPage'

function App() {
  const { language, direction } = useLanguage()

  document.documentElement.lang = language
  document.documentElement.dir = direction

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/:id" element={<ArticleDetailPage />} />
        <Route path="inscription" element={<EnrollmentPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="visite-virtuelle" element={<VirtualTourPage />} />
      </Route>

      {/* Route 404 */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Page non trouvée</p>
              <a 
                href="/" 
                className="btn-primary"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        } 
      />
    </Routes>
  )
}

export default App
