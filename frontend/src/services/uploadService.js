import api from './api'

class UploadService {
  // Upload d'une photo de profil
  async uploadProfilePicture(file) {
    try {
      const formData = new FormData()
      formData.append('profile_picture', file)

      const response = await api.post('/api/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error) {
      console.error('Erreur upload photo de profil:', error)
      throw error
    }
  }

  // Supprimer une photo de profil
  async deleteProfilePicture() {
    try {
      const response = await api.delete('/api/upload/profile-picture')
      return response.data
    } catch (error) {
      console.error('Erreur suppression photo de profil:', error)
      throw error
    }
  }

  // Upload de médias génériques
  async uploadMedia(file, type = 'general') {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await api.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error) {
      console.error('Erreur upload média:', error)
      throw error
    }
  }

  // Obtenir l'URL complète d'un fichier
  getFileUrl(path) {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${path}`
  }
}

export const uploadService = new UploadService()
export default uploadService
