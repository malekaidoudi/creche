import { apiRequest, getPaginatedData } from './api'

export const enrollmentService = {
  // Obtenir toutes les inscriptions
  getEnrollments: async (params = {}) => {
    return await getPaginatedData('/enrollments', params)
  },

  // Obtenir toutes les inscriptions (alias pour compatibilité)
  getAllEnrollments: async (params = {}) => {
    const defaultParams = {
      page: 1,
      limit: 50,
      ...params
    }
    return await getPaginatedData('/enrollments', defaultParams)
  },

  // Obtenir une inscription par ID
  getEnrollmentById: async (id) => {
    const response = await apiRequest.get(`/enrollments/${id}`)
    return response.data
  },

  // Créer une inscription
  createEnrollment: async (enrollmentData) => {
    const response = await apiRequest.post('/enrollments', enrollmentData)
    return response.data
  },

  // Mettre à jour une inscription
  updateEnrollment: async (id, enrollmentData) => {
    const response = await apiRequest.put(`/enrollments/${id}`, enrollmentData)
    return response.data
  },

  // Supprimer une inscription
  deleteEnrollment: async (id) => {
    const response = await apiRequest.delete(`/enrollments/${id}`)
    return response.data
  },

  // Mettre à jour le statut d'une inscription
  updateEnrollmentStatus: async (id, status) => {
    const response = await apiRequest.put(`/enrollments/${id}/status`, { status })
    return response.data
  },
}
