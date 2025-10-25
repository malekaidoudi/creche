import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useMySpaceAccess = () => {
  const { user, isAuthenticated } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated || !user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Les parents ont toujours accès à Mon Espace
      if (user.role === 'parent') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Pour admin/staff, vérifier s'ils ont des enfants
      if (user.role === 'admin' || user.role === 'staff') {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/user/has-children', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const result = await response.json();
            setHasAccess(result.hasChildren);
          } else {
            setHasAccess(false);
          }
        } catch (error) {
          console.error('Erreur vérification accès Mon Espace:', error);
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
      }

      setLoading(false);
    };

    checkAccess();
  }, [user, isAuthenticated]);

  return { hasAccess, loading };
};
