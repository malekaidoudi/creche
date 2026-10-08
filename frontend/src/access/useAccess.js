/**
 * useAccess - point d'entrée UNIQUE pour toute vérification d'accès basée
 * sur une permission dans l'application.
 *
 * Composants → useAccess/<Can> → FEATURES → permissions utilisateur (API)
 *
 * N'importe jamais un code de permission en dur : passe toujours une clé
 * de FEATURES (voir ./FEATURES.js). Le backend (GET /api/staff-permissions/me)
 * est la seule source de vérité sur ce que l'utilisateur peut faire, y
 * compris le fait qu'un admin possède implicitement toutes les permissions :
 * ce hook ne contient donc aucune logique de rôle, uniquement de la lecture
 * de permissions.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FEATURES } from './FEATURES';

export const useAccess = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/staff-permissions/me');
        if (!cancelled && response.data?.success) {
          setCodes(new Set(response.data.codes || []));
        }
      } catch (error) {
        console.error('Erreur chargement des accès:', error);
        if (!cancelled) setCodes(new Set()); // Par prudence: aucun accès en cas d'erreur
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  /**
   * @param {keyof typeof FEATURES} featureKey - clé déclarée dans FEATURES
   */
  const can = useCallback((featureKey) => {
    const feature = FEATURES[featureKey];
    if (!feature) {
      console.warn(`useAccess.can(): fonctionnalité inconnue "${featureKey}" (voir access/FEATURES.js)`);
      return false;
    }
    return codes.has(feature.permission);
  }, [codes]);

  return { can, loading };
};

export default useAccess;
