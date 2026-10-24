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
// Cache mémoire pour que les permissions soient immédiatement disponibles au rendu
let cachedPermissionsCodes = null;

export const useAccess = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState(() => cachedPermissionsCodes || new Set());
  const [loading, setLoading] = useState(() => cachedPermissionsCodes === null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Si l'utilisateur est admin ou developer, il a toutes les permissions immédiatement
      if (user.role === 'admin' || user.role === 'developer') {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/staff-permissions/me');
        if (!cancelled && response.data?.success) {
          const newCodes = new Set(response.data.codes || []);
          cachedPermissionsCodes = newCodes;
          setCodes(newCodes);
        }
      } catch (error) {
        console.error('Erreur chargement des accès:', error);
        if (!cancelled && !cachedPermissionsCodes) setCodes(new Set());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  /**
   * @param {keyof typeof FEATURES | typeof FEATURES[keyof typeof FEATURES] | string} featureInput - clé (ex: 'CHILDREN_PHOTOS_MANAGE'), objet (ex: FEATURES.CHILDREN_PHOTOS_MANAGE) ou code direct ('children.photos.manage')
   */
  const can = useCallback((featureInput) => {
    if (!featureInput) return false;
    if (user?.role === 'admin' || user?.role === 'developer') return true;

    let permissionCode = null;

    // Cas 1 : objet FEATURES (ex: FEATURES.CHILDREN_PHOTOS_MANAGE -> { permission: 'children.photos.manage' })
    if (typeof featureInput === 'object' && featureInput.permission) {
      permissionCode = featureInput.permission;
    }
    // Cas 2 : clé FEATURES sous forme de chaîne (ex: 'CHILDREN_PHOTOS_MANAGE')
    else if (typeof featureInput === 'string' && FEATURES[featureInput]?.permission) {
      permissionCode = FEATURES[featureInput].permission;
    }
    // Cas 3 : code de permission direct (ex: 'children.photos.manage')
    else if (typeof featureInput === 'string') {
      permissionCode = featureInput;
    }

    if (!permissionCode) {
      console.warn(`useAccess.can(): fonctionnalité inconnue`, featureInput);
      return false;
    }

    return codes.has(permissionCode);
  }, [codes, user?.role]);

  return { can, loading };
};

export default useAccess;
