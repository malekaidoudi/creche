import { apiRequest, getPaginatedData } from './api'

export const newsService = {
  // Obtenir toutes les actualités
  getNews: async (params = {}) => {
    return await getPaginatedData('/news', params)
  },

  // Obtenir une actualité par ID
  getNewsById: async (id) => {
    const response = await apiRequest.get(`/news/${id}`)
    return response.data
  },

  // Créer une actualité
  createNews: async (newsData) => {
    const response = await apiRequest.post('/news', newsData)
    return response.data
  },

  // Mettre à jour une actualité
  updateNews: async (id, newsData) => {
    const response = await apiRequest.put(`/news/${id}`, newsData)
    return response.data
  },

  // Supprimer une actualité
  deleteNews: async (id) => {
    const response = await apiRequest.delete(`/news/${id}`)
    return response.data
  },
}
