import api from './api.js'

const enrollmentsService = {
  // Obtenir toutes les inscriptions avec pagination et filtres
  getAllEnrollments: async (params = {}) => {
    try {
      const { page = 1, limit = 20, status = 'all' } = params
      const response = await api.get('/enrollments', {
        params: { page, limit, status }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des inscriptions:', error)
      throw error
    }
  },

  // Obtenir une inscription par ID
  getEnrollmentById: async (id) => {
    try {
      const response = await api.get(`/enrollments/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'inscription:', error)
      throw error
    }
  },

  // Obtenir les statistiques des inscriptions
  getEnrollmentStats: async () => {
    try {
      const response = await api.get('/enrollments/stats')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  },

  // Créer une nouvelle inscription (public)
  createEnrollment: async (enrollmentData, files = []) => {
    try {
      const formData = new FormData()
      
      // Ajouter les données de l'inscription
      Object.keys(enrollmentData).forEach(key => {
        if (enrollmentData[key] !== null && enrollmentData[key] !== undefined) {
          formData.append(key, enrollmentData[key])
        }
      })
      
      // Ajouter les fichiers
      files.forEach(file => {
        formData.append('documents', file)
      })
      
      const response = await api.post('/enrollments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de l\'inscription:', error)
      throw error
    }
  },

  // Approuver une inscription
  approveEnrollment: async (id, data = {}) => {
    try {
      const response = await api.put(`/enrollments/${id}/approve`, data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'approbation de l\'inscription:', error)
      throw error
    }
  },

  // Rejeter une inscription
  rejectEnrollment: async (id, data = {}) => {
    try {
      const response = await api.put(`/enrollments/${id}/reject`, data)
      return response.data
    } catch (error) {
      console.error('Erreur lors du rejet de l\'inscription:', error)
      throw error
    }
  }
}

export default enrollmentsService
