/**
 * 🚀 HOOK OPTIMISÉ POUR LES PARAMÈTRES
 * 
 * Gère le cache côté client avec React Query et Context API
 * pour éviter les requêtes redondantes et optimiser les performances.
 * 
 * @author Ingénieur Full Stack Senior
 * @version 1.0.0
 */

import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../services/api';

// Context pour partager les settings globalement
const SettingsContext = createContext();

/**
 * 🏗️ PROVIDER POUR LES SETTINGS GLOBAUX
 */
export const SettingsProvider = ({ children }) => {
  const queryClient = useQueryClient();
  
  // Cache intelligent avec React Query
  const settingsQuery = useQuery({
    queryKey: ['settings', 'all'],
    queryFn: async () => {
      console.log('🔄 Chargement settings depuis API...');
      const response = await api.get('/api/settings/all');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Mutation pour mise à jour
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData) => {
      const response = await api.put('/api/settings/bulk-update', {
        settings: settingsData
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalider le cache après mise à jour
      queryClient.invalidateQueries(['settings']);
      queryClient.invalidateQueries(['contact']);
      queryClient.invalidateQueries(['footer']);
      console.log('✅ Cache settings invalidé après mise à jour');
    }
  });

  const value = {
    settings: settingsQuery.data?.settings || {},
    metadata: settingsQuery.data?.metadata || {},
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * 🎯 HOOK PRINCIPAL POUR SETTINGS
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings doit être utilisé dans SettingsProvider');
  }
  return context;
};

/**
 * 🏢 HOOK OPTIMISÉ POUR DONNÉES CONTACT
 */
export const useContactData = (language = 'fr') => {
  return useQuery({
    queryKey: ['contact', language],
    queryFn: async () => {
      console.log(`🏢 Chargement contact data (${language})...`);
      const response = await api.get(`/api/settings/contact?lang=${language}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (données publiques)
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    select: (data) => data.contact // Extraire seulement les données contact
  });
};

/**
 * 🦶 HOOK OPTIMISÉ POUR DONNÉES FOOTER
 */
export const useFooterData = (language = 'fr') => {
  return useQuery({
    queryKey: ['footer', language],
    queryFn: async () => {
      console.log(`🦶 Chargement footer data (${language})...`);
      const response = await api.get(`/api/settings/footer?lang=${language}`);
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (données très statiques)
    cacheTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    select: (data) => data.settings // Extraire seulement les settings
  });
};

/**
 * 🔄 HOOK POUR MISE À JOUR SETTINGS
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value_fr, value_ar, category }) => {
      console.log(`🔄 Mise à jour setting: ${key} = ${value_fr}`);
      const response = await api.put('/api/settings/update', {
        key,
        value_fr,
        value_ar,
        category
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(['settings', 'all'], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          settings: {
            ...oldData.settings,
            [variables.key]: {
              fr: variables.value_fr,
              ar: variables.value_ar || variables.value_fr,
              value: variables.value_fr
            }
          }
        };
      });
      
      // Invalider les caches dépendants
      queryClient.invalidateQueries(['contact']);
      queryClient.invalidateQueries(['footer']);
      
      console.log(`✅ Setting ${variables.key} mis à jour et cache synchronisé`);
    }
  });
};

/**
 * 📊 HOOK POUR STATISTIQUES CACHE
 */
export const useCacheStats = () => {
  return useQuery({
    queryKey: ['cache-stats'],
    queryFn: async () => {
      const response = await api.get('/api/settings/cache-stats');
      return response.data;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    enabled: false // Activé seulement manuellement
  });
};

/**
 * 🧠 HOOK INTELLIGENT AVEC FALLBACKS
 */
export const useSmartSettings = (keys = []) => {
  const { settings, isLoading, isError } = useSettings();
  const [localCache, setLocalCache] = useState({});
  
  // Fallback vers localStorage en cas d'erreur
  useEffect(() => {
    if (isError) {
      const cached = localStorage.getItem('settings-fallback');
      if (cached) {
        try {
          setLocalCache(JSON.parse(cached));
          console.log('📦 Utilisation du cache localStorage comme fallback');
        } catch (e) {
          console.warn('⚠️ Erreur parsing cache localStorage:', e);
        }
      }
    }
  }, [isError]);

  // Sauvegarder en localStorage quand les settings changent
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      localStorage.setItem('settings-fallback', JSON.stringify(settings));
    }
  }, [settings]);

  // Extraire seulement les clés demandées
  const filteredSettings = useCallback(() => {
    const source = isError ? localCache : settings;
    
    if (keys.length === 0) {
      return source;
    }
    
    const filtered = {};
    keys.forEach(key => {
      if (source[key]) {
        filtered[key] = source[key];
      }
    });
    
    return filtered;
  }, [settings, localCache, keys, isError]);

  return {
    settings: filteredSettings(),
    isLoading: isLoading && !isError,
    isError,
    hasFallback: isError && Object.keys(localCache).length > 0
  };
};

/**
 * 🔄 HOOK POUR SYNCHRONISATION TEMPS RÉEL
 */
export const useRealtimeSettings = () => {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Écouter les événements de mise à jour
  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      const { key, value, timestamp } = event.detail;
      
      // Mise à jour optimiste
      queryClient.setQueryData(['settings', 'all'], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          settings: {
            ...oldData.settings,
            [key]: value
          },
          metadata: {
            ...oldData.metadata,
            lastUpdated: timestamp
          }
        };
      });
      
      setLastUpdate(timestamp);
      console.log(`🔄 Mise à jour temps réel: ${key}`);
    };

    // Écouter les événements personnalisés
    window.addEventListener('settings-updated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, [queryClient]);

  // Fonction pour déclencher une mise à jour
  const triggerUpdate = useCallback((key, value) => {
    const event = new CustomEvent('settings-updated', {
      detail: {
        key,
        value,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(event);
  }, []);

  return {
    lastUpdate,
    triggerUpdate
  };
};

export default useSettings;
