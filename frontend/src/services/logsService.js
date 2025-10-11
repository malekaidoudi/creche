import api from './api.js'

const logsService = {
  // Obtenir tous les logs avec pagination et filtres
  getAllLogs: async (params = {}) => {
    try {
      const response = await api.get('/logs', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error)
      throw error
    }
  },

  // Obtenir les statistiques des logs
  getLogsStats: async (params = {}) => {
    try {
      const response = await api.get('/logs/stats', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  },

  // Obtenir les actions disponibles
  getAvailableActions: async () => {
    try {
      const response = await api.get('/logs/actions')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des actions:', error)
      throw error
    }
  },

  // Obtenir un log spécifique
  getLogById: async (id) => {
    try {
      const response = await api.get(`/logs/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du log:', error)
      throw error
    }
  },

  // Nettoyer les anciens logs
  cleanOldLogs: async (days = 90) => {
    try {
      const response = await api.delete('/logs/cleanup', {
        data: { days }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error)
      throw error
    }
  }
}

export default logsService
