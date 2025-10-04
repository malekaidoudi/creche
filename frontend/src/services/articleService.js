import { apiRequest, getPaginatedData } from './api'

export const articleService = {
  // Obtenir tous les articles
  getArticles: async (params = {}) => {
    return await getPaginatedData('/articles', params)
  },

  // Obtenir un article par ID
  getArticleById: async (id) => {
    const response = await apiRequest.get(`/articles/${id}`)
    return response.data
  },

  // Créer un article
  createArticle: async (articleData) => {
    const response = await apiRequest.post('/articles', articleData)
    return response.data
  },

  // Mettre à jour un article
  updateArticle: async (id, articleData) => {
    const response = await apiRequest.put(`/articles/${id}`, articleData)
    return response.data
  },

  // Supprimer un article
  deleteArticle: async (id) => {
    const response = await apiRequest.delete(`/articles/${id}`)
    return response.data
  },
}
