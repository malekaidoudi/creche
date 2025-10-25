import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useHasChildren = () => {
  const { user } = useAuth();
  const [hasChildren, setHasChildren] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkChildren = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/has-children', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setHasChildren(result.hasChildren);
          setChildrenCount(result.childrenCount);
        }
      } catch (error) {
        console.error('Erreur vérification enfants:', error);
      } finally {
        setLoading(false);
      }
    };

    checkChildren();
  }, [user]);

  return { hasChildren, childrenCount, loading };
};
