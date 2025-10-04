import api from './api'

export const settingsService = {
  // Récupérer tous les paramètres
  getAllSettings: async () => {
    try {
      const response = await api.get('/settings')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error)
      throw error
    }
  },

  // Récupérer une section spécifique
  getSettingsSection: async (section) => {
    try {
      const response = await api.get(`/settings/${section}`)
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la récupération de la section ${section}:`, error)
      throw error
    }
  },

  // Récupérer les informations de base de la crèche
  getCrecheInfo: async () => {
    try {
      const response = await api.get('/settings')
      const settings = response.data.data
      
      return {
        name: settings.name,
        description: settings.description,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        director: settings.director,
        hours: settings.hours,
        theme: settings.theme,
        social: settings.social
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de la crèche:', error)
      throw error
    }
  },

  // Récupérer les services
  getServices: async () => {
    try {
      const response = await api.get('/settings/services')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error)
      throw error
    }
  },

  // Récupérer les statistiques
  getStats: async () => {
    try {
      const response = await api.get('/settings/stats')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  },

  // Récupérer les fonctionnalités
  getFeatures: async () => {
    try {
      const response = await api.get('/settings/features')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des fonctionnalités:', error)
      throw error
    }
  }
}
