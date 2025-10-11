import api from './api.js'

const documentsService = {
  // Obtenir tous les documents avec pagination et filtres
  getAllDocuments: async (params = {}) => {
    try {
      const { page = 1, limit = 20, type = 'all' } = params
      const response = await api.get('/documents', {
        params: { page, limit, type }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      throw error
    }
  },

  // Obtenir un document par ID
  getDocumentById: async (id) => {
    try {
      const response = await api.get(`/documents/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du document:', error)
      throw error
    }
  },

  // Upload d'un nouveau document
  uploadDocument: async (documentData, file) => {
    try {
      const formData = new FormData()
      
      // Ajouter les données du document
      Object.keys(documentData).forEach(key => {
        if (documentData[key] !== null && documentData[key] !== undefined) {
          formData.append(key, documentData[key])
        }
      })
      
      // Ajouter le fichier
      if (file) {
        formData.append('document', file)
      }
      
      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'upload du document:', error)
      throw error
    }
  },

  // Mettre à jour un document
  updateDocument: async (id, documentData) => {
    try {
      const response = await api.put(`/documents/${id}`, documentData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error)
      throw error
    }
  },

  // Supprimer un document
  deleteDocument: async (id) => {
    try {
      const response = await api.delete(`/documents/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error)
      throw error
    }
  },

  // Télécharger un document
  downloadDocument: async (id) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob'
      })
      return response
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error)
      throw error
    }
  },

  // Obtenir l'URL de téléchargement d'un document
  getDownloadUrl: (id) => {
    return `${api.defaults.baseURL}/documents/${id}/download`
  }
}

export default documentsService
