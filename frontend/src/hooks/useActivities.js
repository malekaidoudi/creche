/**
 * Hook personnalisé pour la gestion des activités
 */

import { useState, useCallback, useEffect } from 'react';
import activityService from '../services/activityService';

export const useActivities = (initialPage = 1, limit = 10) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Charger les activités
  const fetchActivities = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await activityService.getActivities(pageNum, limit);
      
      if (result.success) {
        if (append) {
          setActivities(prev => [...prev, ...result.activities]);
        } else {
          setActivities(result.activities);
        }
        setHasMore(result.pagination.hasMore);
        setTotal(result.pagination.total);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Charger plus d'activités
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(page + 1, true);
    }
  }, [loading, hasMore, page, fetchActivities]);

  // Rafraîchir
  const refresh = useCallback(() => {
    fetchActivities(1, false);
  }, [fetchActivities]);

  // Créer une activité
  const createActivity = useCallback(async (formData) => {
    try {
      const result = await activityService.createActivity(formData);
      if (result.success) {
        // Ajouter en haut de la liste
        setActivities(prev => [result.activity, ...prev]);
        setTotal(prev => prev + 1);
      }
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  // Supprimer une activité
  const deleteActivity = useCallback(async (id) => {
    try {
      const result = await activityService.deleteActivity(id);
      if (result.success) {
        setActivities(prev => prev.filter(a => a.id !== id));
        setTotal(prev => prev - 1);
      }
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  // Toggle réaction
  const toggleReaction = useCallback(async (activityId, reactionType) => {
    try {
      const result = await activityService.toggleReaction(activityId, reactionType);
      if (result.success) {
        setActivities(prev => prev.map(activity => {
          if (activity.id === activityId) {
            const reactions = { ...activity.reactions };
            
            // Retirer l'ancienne réaction si elle existe
            if (activity.reactions.userReaction) {
              reactions[activity.reactions.userReaction] = Math.max(0, (reactions[activity.reactions.userReaction] || 1) - 1);
              reactions.total = Math.max(0, (reactions.total || 1) - 1);
            }
            
            // Ajouter la nouvelle réaction si ce n'est pas une suppression
            if (result.reactionType) {
              reactions[result.reactionType] = (reactions[result.reactionType] || 0) + 1;
              reactions.total = (reactions.total || 0) + 1;
            }
            
            reactions.userReaction = result.reactionType;
            
            return { ...activity, reactions };
          }
          return activity;
        }));
      }
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    page,
    hasMore,
    total,
    loadMore,
    refresh,
    createActivity,
    deleteActivity,
    toggleReaction
  };
};

export default useActivities;

