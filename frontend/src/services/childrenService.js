import api from './api.js'

const childrenService = {
  // Obtenir tous les enfants avec pagination et filtres
  getAllChildren: async (params = {}) => {
    try {
      const { page = 1, limit = 20, search = '', status = 'all', age = 'all' } = params
      const response = await api.get('/api/children', {
        params: { page, limit, search, status, age }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des enfants:', error)
      throw error
    }
  },

  // Obtenir un enfant par ID
  getChildById: async (id) => {
    try {
      const response = await api.get(`/api/children/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'enfant:', error)
      throw error
    }
  },

  // Créer un nouvel enfant
  createChild: async (childData) => {
    try {
      const response = await api.post('/api/children', childData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de l\'enfant:', error)
      throw error
    }
  },

  // Mettre à jour un enfant
  updateChild: async (id, childData) => {
    try {
      const response = await api.put(`/api/children/${id}`, childData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'enfant:', error)
      throw error
    }
  },

  // Supprimer un enfant (soft delete)
  deleteChild: async (id) => {
    try {
      const response = await api.delete(`/api/children/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'enfant:', error)
      throw error
    }
  },

  // Obtenir les statistiques des enfants
  getChildrenStats: async () => {
    try {
      const response = await api.get('/api/children/stats')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  },

  // Obtenir les enfants d'un parent spécifique
  getChildrenByParent: async (parentId) => {
    try {
      const response = await api.get(`/api/children/parent/${parentId}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des enfants du parent:', error)
      throw error
    }
  },

  // Obtenir les enfants disponibles (sans parent)
  getAvailableChildren: async () => {
    try {
      const response = await api.get('/api/children/available')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des enfants disponibles:', error)
      throw error
    }
  },

  // Obtenir les enfants orphelins (sans parent)
  getOrphanChildren: async () => {
    try {
      const response = await api.get('/api/children/orphans')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des enfants orphelins:', error)
      throw error
    }
  },

  // Associer un enfant à un parent existant
  associateChildToParent: async (childId, parentId) => {
    try {
      const response = await api.put(`/api/children/${childId}/associate-parent`, {
        parentId
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'association enfant-parent:', error)
      throw error
    }
  }
}

export default childrenService
