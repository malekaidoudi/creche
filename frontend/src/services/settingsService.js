import api from './api.js'

const settingsService = {
  // Obtenir tous les paramètres
  getAllSettings: async () => {
    try {
      const response = await api.get('/settings')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error)
      throw error
    }
  },

  // Obtenir un paramètre spécifique
  getSetting: async (key) => {
    try {
      const response = await api.get(`/settings/${key}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du paramètre:', error)
      throw error
    }
  },

  // Mettre à jour ou créer un paramètre
  updateSetting: async (key, settingData) => {
    try {
      const response = await api.put(`/settings/${key}`, settingData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error)
      throw error
    }
  },

  // Supprimer un paramètre
  deleteSetting: async (key) => {
    try {
      const response = await api.delete(`/settings/${key}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la suppression du paramètre:', error)
      throw error
    }
  },

  // Mettre à jour plusieurs paramètres
  updateMultipleSettings: async (settings) => {
    try {
      const response = await api.put('/settings', { settings })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour multiple:', error)
      throw error
    }
  }
}

export default settingsService
