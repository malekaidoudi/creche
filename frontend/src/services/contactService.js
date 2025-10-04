import { apiRequest, getPaginatedData } from './api'

export const contactService = {
  // Obtenir tous les messages de contact
  getContacts: async (params = {}) => {
    return await getPaginatedData('/contacts', params)
  },

  // Obtenir un message de contact par ID
  getContactById: async (id) => {
    const response = await apiRequest.get(`/contacts/${id}`)
    return response.data
  },

  // Créer un message de contact
  createContact: async (contactData) => {
    const response = await apiRequest.post('/contacts', contactData)
    return response.data
  },

  // Mettre à jour le statut d'un message
  updateContactStatus: async (id, status) => {
    const response = await apiRequest.put(`/contacts/${id}/status`, { status })
    return response.data
  },

  // Supprimer un message de contact
  deleteContact: async (id) => {
    const response = await apiRequest.delete(`/contacts/${id}`)
    return response.data
  },

  // Obtenir les statistiques des messages
  getContactStats: async () => {
    const response = await apiRequest.get('/contacts/stats/summary')
    return response.data
  },
}
