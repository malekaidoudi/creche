import api from './api.js'

const attendanceService = {
  // Obtenir les présences d'aujourd'hui
  getTodayAttendance: async (params = {}) => {
    try {
      const { page = 1, limit = 50 } = params
      const response = await api.get('/api/attendance/today', {
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
      const response = await api.get(`/api/attendance/date/${date}`, {
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
      const response = await api.get('/api/attendance/stats', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  },

  // Obtenir les enfants actuellement présents
  getCurrentlyPresent: async () => {
    try {
      const response = await api.get('/api/attendance/currently-present')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des présents:', error)
      throw error
    }
  },

  // Enregistrer l'arrivée d'un enfant (check-in)
  checkIn: async (childId, options = null) => {
    try {
      const payload = typeof options === 'string'
        ? { child_id: childId, notes: options }
        : { child_id: childId, ...(options || {}) };
      const response = await api.post('/api/attendance/check-in', payload);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'arrivée:', error);
      throw error;
    }
  },

  // Enregistrer le départ d'un enfant (check-out)
  checkOut: async (childId, notes = null) => {
    try {
      const response = await api.post('/api/attendance/check-out', {
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
      const response = await api.get(`/api/attendance/child/${childId}/history`, {
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
      const response = await api.get(`/api/attendance/child/${childId}/today`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la présence du jour:', error)
      throw error
    }
  },

  // Basculer l'état de présence (mode journalier en 1 clic ou toggle)
  togglePresence: async (childId, options = {}) => {
    try {
      const { date, target_status, notes } = options;
      const response = await api.post('/api/attendance/toggle', {
        child_id: childId,
        date,
        target_status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du basculement de la présence:', error);
      throw error;
    }
  },

  // Rectifier / corriger un pointage (heures optionnelles)
  updateAttendance: async (attendanceId, data = {}) => {
    try {
      const response = await api.put(`/api/attendance/${attendanceId}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la modification du pointage:', error);
      throw error;
    }
  },

  // Annuler / supprimer un pointage (droit à l'erreur / remise à l'état absent)
  deleteAttendance: async (attendanceId) => {
    try {
      const response = await api.delete(`/api/attendance/${attendanceId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation du pointage:', error);
      throw error;
    }
  },

  // Enregistrer un accueil exceptionnel le samedi avec notification parent
  recordExceptionalSaturday: async (childId, notes = null, date = null) => {
    try {
      const response = await api.post('/api/attendance/exceptional-saturday', {
        child_id: childId,
        notes,
        date
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'accueil exceptionnel du samedi:', error);
      throw error;
    }
  }
}

export default attendanceService
