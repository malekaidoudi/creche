import { apiRequest, getPaginatedData } from './api'

export const childrenService = {
  // Obtenir tous les enfants
  getChildren: async (params = {}) => {
    return await getPaginatedData('/children', params)
  },

  // Obtenir tous les enfants (alias pour compatibilité)
  getAllChildren: async (params = {}) => {
    const defaultParams = {
      page: 1,
      limit: 50,
      ...params
    }
    return await getPaginatedData('/children', defaultParams)
  },

  // Obtenir un enfant par ID
  getChildById: async (id) => {
    const response = await apiRequest.get(`/children/${id}`)
    return response.data
  },

  // Créer un enfant
  createChild: async (childData) => {
    const response = await apiRequest.post('/children', childData)
    return response.data
  },

  // Mettre à jour un enfant
  updateChild: async (id, childData) => {
    const response = await apiRequest.put(`/children/${id}`, childData)
    return response.data
  },

  // Supprimer un enfant
  deleteChild: async (id) => {
    const response = await apiRequest.delete(`/children/${id}`)
    return response.data
  },

  // Obtenir les présences d'un enfant
  getChildAttendance: async (id, params = {}) => {
    return await getPaginatedData(`/children/${id}/attendance`, params)
  },
}
