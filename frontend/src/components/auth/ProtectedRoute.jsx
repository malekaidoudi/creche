import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';
import ForbiddenPage from '../../pages/errors/ForbiddenPage';

const ProtectedRoute = ({ children, roles = [], redirectTo = '/' }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Afficher le spinner pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Rediriger vers la page d'accueil si non authentifié
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Vérifier les rôles si spécifiés (le rôle interne developer a accès bypass à toutes les pages)
  const effectiveRole = user?.role === 'developer' ? 'admin' : user?.role;
  const isAllowed = roles.includes(user?.role) || roles.includes(effectiveRole) || user?.role === 'developer';
  if (roles.length > 0 && !isAllowed) {
    return <ForbiddenPage />;
  }

  return children;
};

export default ProtectedRoute;
