import { useEffect, useState } from 'react';
import API_CONFIG from '../config/api';

/**
 * Composant qui vérifie si le backend est disponible
 * Redirige vers la page de maintenance si le backend est down
 */
const MaintenanceChecker = ({ children }) => {
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
          method: 'GET',
          timeout: 10000,
        });
        
        if (response.ok) {
          setIsBackendDown(false);
        } else {
          setIsBackendDown(true);
        }
      } catch (error) {
        console.error('Backend indisponible:', error);
        setIsBackendDown(true);
      } finally {
        setChecking(false);
      }
    };

    checkBackendHealth();

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkBackendHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  // Pendant la vérification initiale, afficher un loader minimal
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // Si le backend est down, rediriger vers la page de maintenance
  if (isBackendDown) {
    window.location.href = '/maintenance.html';
    return null;
  }

  // Backend OK, afficher l'application normale
  return children;
};

export default MaintenanceChecker;
