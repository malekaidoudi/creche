import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

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
        const response = await api.get('/api/user/has-children');
        setHasChildren(response.data.hasChildren);
        setChildrenCount(response.data.childrenCount);
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
