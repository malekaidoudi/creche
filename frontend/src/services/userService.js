import { apiRequest, getPaginatedData } from './api'

export const userService = {
  // Obtenir tous les utilisateurs
  getUsers: async (params = {}) => {
    return await getPaginatedData('/users', params)
  },

  // Obtenir tous les utilisateurs (alias pour compatibilité)
  getAllUsers: async (params = {}) => {
    const defaultParams = {
      page: 1,
      limit: 50,
      ...params
    }
    return await getPaginatedData('/users', defaultParams)
  },

  // Obtenir un utilisateur par ID
  getUserById: async (id) => {
    const response = await apiRequest.get(`/users/${id}`)
    return response.data
  },

  // Créer un utilisateur
  createUser: async (userData) => {
    const response = await apiRequest.post('/users', userData)
    return response.data
  },

  // Mettre à jour un utilisateur
  updateUser: async (id, userData) => {
    const response = await apiRequest.put(`/users/${id}`, userData)
    return response.data
  },

  // Supprimer un utilisateur
  deleteUser: async (id) => {
    const response = await apiRequest.delete(`/users/${id}`)
    return response.data
  },
}
