import api from './api.js'

const attendanceService = {
  // Obtenir les présences d'aujourd'hui
  getTodayAttendance: async (params = {}) => {
    try {
      const { page = 1, limit = 50 } = params
      const response = await api.get('/attendance/today', {
        params: { page, limit }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des présences d\'aujourd\'hui:', error)
      throw error
    }
  },

  // Obtenir les présences pour une date donnée
  getAttendanceByDate: async (date, params = {}) => {
    try {
      const { page = 1, limit = 50 } = params
      const response = await api.get(`/attendance/date/${date}`, {
        params: { page, limit }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des présences par date:', error)
      throw error
    }
  },

  // Obtenir les statistiques de présence
  getAttendanceStats: async (date = null) => {
    try {
      const params = date ? { date } : {}
      const response = await api.get('/attendance/stats', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  },

  // Obtenir les enfants actuellement présents
  getCurrentlyPresent: async () => {
    try {
      const response = await api.get('/attendance/currently-present')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des présents:', error)
      throw error
    }
  },

  // Enregistrer l'arrivée d'un enfant (check-in)
  checkIn: async (childId, notes = null) => {
    try {
      const response = await api.post('/attendance/check-in', {
        child_id: childId,
        notes
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'arrivée:', error)
      throw error
    }
  },

  // Enregistrer le départ d'un enfant (check-out)
  checkOut: async (childId, notes = null) => {
    try {
      const response = await api.post('/attendance/check-out', {
        child_id: childId,
        notes
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du départ:', error)
      throw error
    }
  },

  // Obtenir l'historique des présences d'un enfant
  getChildAttendanceHistory: async (childId, params = {}) => {
    try {
      const { page = 1, limit = 30 } = params
      const response = await api.get(`/attendance/child/${childId}`, {
        params: { page, limit }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }
  },

  // Obtenir la présence d'aujourd'hui pour un enfant
  getChildTodayAttendance: async (childId) => {
    try {
      const response = await api.get(`/attendance/child/${childId}/today`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la présence du jour:', error)
      throw error
    }
  }
}

export default attendanceService
