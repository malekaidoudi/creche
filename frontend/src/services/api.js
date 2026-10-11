import axios from 'axios'
import dialogHelper from '../utils/dialogHelper'
import API_CONFIG from '../config/api.js'

// Configuration de base d'Axios avec la nouvelle config centralisée
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000, // 30s pour Render free tier (cold start)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur de requête pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Si c'est un FormData, supprimer le Content-Type et augmenter le timeout pour les uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      // Timeout de 5 minutes pour les uploads de fichiers volumineux (vidéos)
      config.timeout = 300000;
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Libellés des rôles en français, pour des messages compréhensibles par tous
const ROLE_LABELS = {
  admin: 'administrateur',
  developer: 'développeur',
  staff: 'personnel',
  parent: 'parent',
};

const formatRoleLabel = (role) => ROLE_LABELS[role] || role || 'inconnu';

// Anti-spam: éviter d'afficher plusieurs dialogs 403 identiques si plusieurs
// requêtes échouent en même temps (ex: plusieurs appels parallèles au chargement d'une page)
let last403DialogAt = 0;
const FORBIDDEN_DIALOG_THROTTLE_MS = 3000;

// Intercepteur de réponse pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Log des erreurs API pour le debugging
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data?.message || error.message);
    } else {
      console.error('Network Error:', error.message);
    }

    // Gestion du rate limit (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      const minutes = Math.ceil(retryAfter / 60);
      dialogHelper.error(
        `Trop de requêtes. Veuillez patienter ${minutes} minute${minutes > 1 ? 's' : ''} avant de réessayer.`
      );
      console.warn('⚠️ Rate limit atteint. Retry après:', retryAfter, 'secondes');
      return Promise.reject(error);
    }

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      // Ne pas intercepter les erreurs de login
      const isLoginRequest = error.config?.url?.includes('/auth/login')

      if (!isLoginRequest) {
        localStorage.removeItem('token')
        window.location.href = '/'
        dialogHelper.error('Session expirée, veuillez vous reconnecter')
      }

      return Promise.reject(error)
    }

    // Gestion des erreurs d'autorisation (403) - message élégant et compréhensible
    // pour tous les rôles, quelle que soit la fonctionnalité concernée
    if (error.response?.status === 403) {
      const now = Date.now();
      if (now - last403DialogAt > FORBIDDEN_DIALOG_THROTTLE_MS) {
        last403DialogAt = now;

        const data = error.response.data || {};
        const requiredRoles = Array.isArray(data.required_roles) ? data.required_roles : null;

        let message = "Vous n'avez pas les autorisations nécessaires pour accéder à cette fonctionnalité.";
        if (requiredRoles && requiredRoles.length > 0) {
          const rolesText = requiredRoles.map(formatRoleLabel).join(' ou ');
          message = `Cette fonctionnalité est réservée au rôle : ${rolesText}. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.`;
        } else if (data.error && typeof data.error === 'string') {
          message = data.error;
        }

        dialogHelper.warning(message, 'Accès restreint');
      }

      return Promise.reject(error)
    }

    // Gestion des erreurs de serveur
    if (error.response?.status >= 500) {
      dialogHelper.error('Erreur serveur, veuillez réessayer plus tard')
    }

    // Gestion des erreurs réseau
    if (!error.response) {
      dialogHelper.error('Erreur de connexion, vérifiez votre connexion internet')
    }

    return Promise.reject(error)
  }
)

// Fonctions utilitaires pour les requêtes API
export const apiRequest = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
}

// ─────────────────────────────────────────────────────────────────────────
// Cache mémoire léger pour les GET (opt-in) — évite de refetch des données
// qui changent peu (paramètres crèche, infos contact, jours fériés...) à
// chaque navigation entre pages. Ne touche pas aux requêtes non-cachées.
// ─────────────────────────────────────────────────────────────────────────
const getCache = new Map() // clé -> { promise, expiry }
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const STORAGE_CACHE_PREFIX = 'creche_api_cache:'

const buildCacheKey = (url, params) => `${url}?${JSON.stringify(params || {})}`

/**
 * Lit une entrée depuis le localStorage du navigateur
 */
export const getStoredCache = (url, params) => {
  if (typeof window === 'undefined' || !window.localStorage) return null
  const storageKey = STORAGE_CACHE_PREFIX + buildCacheKey(url, params)
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.warn('[Cache Storage] Erreur lecture:', err)
    return null
  }
}

/**
 * Enregistre une entrée dans le localStorage du navigateur
 */
export const setStoredCache = (url, params, data, ttlMs = DEFAULT_CACHE_TTL_MS) => {
  if (typeof window === 'undefined' || !window.localStorage) return
  const storageKey = STORAGE_CACHE_PREFIX + buildCacheKey(url, params)
  try {
    const entry = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs
    }
    window.localStorage.setItem(storageKey, JSON.stringify(entry))
  } catch (err) {
    console.warn('[Cache Storage] Erreur écriture:', err)
  }
}

/**
 * GET avec cache hybride (mémoire RAM + persistance localStorage navigateur).
 * - Réduit les requêtes réseau redondantes entre pages et rechargements
 * - Si le cache est valide (expiry > now), résolution instantanée
 * - Si le réseau échoue (panne, offline), bascule automatiquement sur les
 *   dernières données réelles de la BD stockées dans le navigateur
 *
 * @param {string} url
 * @param {object} config - config axios (params, headers...)
 * @param {number} ttlMs - durée de fraîcheur du cache (défaut 5 min)
 */
export const cachedGet = (url, config = {}, ttlMs = DEFAULT_CACHE_TTL_MS) => {
  const key = buildCacheKey(url, config.params)
  const cached = getCache.get(key)

  if (cached && cached.expiry > Date.now()) {
    return cached.promise
  }

  // Vérifier d'abord le cache persistant dans le localStorage
  const stored = getStoredCache(url, config.params)
  if (stored && stored.expiry > Date.now()) {
    const resolvedPromise = Promise.resolve({
      data: stored.data,
      status: 200,
      fromCache: true,
      timestamp: stored.timestamp
    })
    getCache.set(key, { promise: resolvedPromise, expiry: stored.expiry })
    return resolvedPromise
  }

  // Effectuer la requête réseau réelle
  const promise = api
    .get(url, config)
    .then((response) => {
      // Persister dans le stockage du navigateur
      setStoredCache(url, config.params, response.data, ttlMs)
      return response
    })
    .catch((error) => {
      // En cas d'erreur réseau, vérifier si on a une version précédente en localStorage (offline/stale fallback)
      if (stored && stored.data) {
        console.warn(`[Cache Storage] Réseau indisponible pour ${url}, utilisation des dernières données de la base en cache navigateur`)
        return {
          data: stored.data,
          status: 200,
          fromCache: true,
          isStale: true,
          timestamp: stored.timestamp
        }
      }
      // Ne pas garder une promesse rejetée en cache mémoire
      getCache.delete(key)
      throw error
    })

  getCache.set(key, { promise, expiry: Date.now() + ttlMs })
  return promise
}

/**
 * Invalide le cache en mémoire ET dans le localStorage du navigateur.
 * À appeler après une mutation (ex: mise à jour des paramètres dans Dashboard)
 * pour forcer un refetch frais de la base de données.
 */
export const clearApiCache = (urlPrefix) => {
  // 1. Invalidation du cache mémoire
  if (!urlPrefix) {
    getCache.clear()
  } else {
    for (const key of getCache.keys()) {
      if (key.startsWith(urlPrefix)) {
        getCache.delete(key)
      }
    }
  }

  // 2. Invalidation du cache persistant localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(STORAGE_CACHE_PREFIX)) {
          const apiPart = k.slice(STORAGE_CACHE_PREFIX.length)
          if (!urlPrefix || apiPart.startsWith(urlPrefix)) {
            keysToRemove.push(k)
          }
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k))
    } catch (err) {
      console.warn('[Cache Storage] Erreur invalidation localStorage:', err)
    }
  }
}

// Fonction pour uploader des fichiers (endpoint générique /api/uploads)
export const uploadFile = (file, onProgress = null) => {
  const formData = new FormData()
  formData.append('file', file)

  return api.post('/api/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress(percentCompleted)
      }
    },
  })
}

/**
 * Fonction utilitaire générique pour uploader un fichier vers n'importe quel endpoint
 * @param {string} endpoint - L'URL de l'endpoint (ex: '/api/documents/children/5')
 * @param {File} file - Le fichier à uploader
 * @param {Object} additionalData - Données supplémentaires à envoyer (ex: { document_type: 'carnet_medical' })
 * @param {string} fileFieldName - Nom du champ pour le fichier (défaut: 'document')
 * @param {Function} onProgress - Callback pour la progression
 * @returns {Promise} - Réponse de l'API
 */
export const uploadToEndpoint = (endpoint, file, additionalData = {}, fileFieldName = 'document', onProgress = null) => {
  const formData = new FormData()
  formData.append(fileFieldName, file)

  // Ajouter les données supplémentaires
  Object.keys(additionalData).forEach(key => {
    if (additionalData[key] !== null && additionalData[key] !== undefined) {
      formData.append(key, additionalData[key])
    }
  })

  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress(percentCompleted)
      }
    },
  })
}

// Fonction pour uploader plusieurs fichiers
export const uploadMultipleFiles = (files, onProgress = null) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  return api.post('/api/uploads/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress(percentCompleted)
      }
    },
  })
}

// Fonction pour construire les paramètres de requête
export const buildQueryParams = (params) => {
  const searchParams = new URLSearchParams()

  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value)
    }
  })

  return searchParams.toString()
}

// Fonction pour gérer la pagination
export const getPaginatedData = async (endpoint, params = {}) => {
  const queryString = buildQueryParams(params)
  const url = queryString ? `${endpoint}?${queryString}` : endpoint

  const response = await api.get(url)
  return response.data
}

// Fonction pour gérer les erreurs de validation
export const handleValidationErrors = (error) => {
  if (error.response?.data?.details) {
    // Erreurs de validation avec détails
    const errors = {}
    error.response.data.details.forEach((detail) => {
      const field = detail.path || detail.param
      errors[field] = detail.msg || detail.message
    })
    return errors
  }

  return {}
}

// Fonction pour formater les données avant envoi
export const formatDataForAPI = (data) => {
  const formattedData = { ...data }

  // Supprimer les champs vides ou null
  Object.keys(formattedData).forEach((key) => {
    if (formattedData[key] === '' || formattedData[key] === null) {
      delete formattedData[key]
    }
  })

  return formattedData
}

// Fonction pour gérer les téléchargements
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    dialogHelper.error('Erreur lors du téléchargement')
    throw error
  }
}

// Configuration pour les requêtes avec retry
export const apiWithRetry = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
})

// Ajouter un mécanisme de retry
apiWithRetry.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error

    if (!config || !config.retry) {
      return Promise.reject(error)
    }

    config.retryCount = config.retryCount || 0

    if (config.retryCount >= config.retry) {
      return Promise.reject(error)
    }

    config.retryCount += 1

    // Attendre avant de réessayer
    await new Promise((resolve) => {
      setTimeout(resolve, config.retryDelay || 1000)
    })

    return apiWithRetry(config)
  }
)

export default api
