import api from './api.js'

const userService = {
  // Obtenir le profil de l'utilisateur connecté
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      throw error
    }
  },

  // Mettre à jour le profil de l'utilisateur connecté
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      throw error
    }
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/change-password', passwordData)
      return response.data
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error)
      throw error
    }
  },

  // Upload d'une photo de profil
  uploadProfileImage: async (imageFile) => {
    try {
      const formData = new FormData()
      formData.append('profile_image', imageFile)
      
      const response = await api.post('/users/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error)
      throw error
    }
  },

  // Obtenir tous les utilisateurs (admin seulement)
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
      throw error
    }
  },

  // Obtenir un utilisateur par ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      throw error
    }
  },

  // Mettre à jour un utilisateur par ID (admin)
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
      throw error
    }
  },

  // Basculer le statut actif/inactif d'un utilisateur (admin)
  toggleUserStatus: async (id) => {
    try {
      const response = await api.put(`/users/${id}/toggle-status`)
      return response.data
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
      throw error
    }
  }
}

export default userService
