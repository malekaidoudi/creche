import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../ui/LoadingSpinner'

const ProtectedRoute = ({ children, roles = null }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Afficher le spinner pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Vérifier les rôles si spécifiés
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-gray-600 mb-8">
            Accès refusé - Privilèges insuffisants
          </p>
          <button 
            onClick={() => window.history.back()}
            className="btn-primary"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
