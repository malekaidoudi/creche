import axios from 'axios'
import toast from 'react-hot-toast'
import API_CONFIG from '../config/api.js'

// Configuration de base d'Axios avec la nouvelle config centralisée
// Configuration pour GitHub Pages avec redirections
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur de réponse pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      toast.error('Session expirée, veuillez vous reconnecter')
      return Promise.reject(error)
    }

    // Gestion des erreurs de serveur
    if (error.response?.status >= 500) {
      toast.error('Erreur serveur, veuillez réessayer plus tard')
    }

    // Gestion des erreurs réseau
    if (!error.response) {
      toast.error('Erreur de connexion, vérifiez votre connexion internet')
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

// Fonction pour uploader des fichiers
export const uploadFile = (file, onProgress = null) => {
  const formData = new FormData()
  formData.append('file', file)

  return api.post('/uploads', formData, {
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

  return api.post('/uploads/multiple', formData, {
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
    toast.error('Erreur lors du téléchargement')
    throw error
  }
}

// Configuration pour les requêtes avec retry
export const apiWithRetry = axios.create({
  baseURL: API_BASE_URL,
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
