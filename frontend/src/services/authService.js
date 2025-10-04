import { apiRequest } from './api'
import { authenticateDemo } from '../data/demoAccounts'

export const authService = {
  // Connexion
  login: async (credentials) => {
    // FORCER LE MODE DÉMO POUR GITHUB PAGES
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io')
    const isProduction = import.meta.env.PROD
    
    console.log('🔍 Vérification environnement:')
    console.log('- Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'undefined')
    console.log('- GitHub Pages:', isGitHubPages)
    console.log('- Production:', isProduction)
    console.log('- Mode:', import.meta.env.MODE)
    
    // TOUJOURS utiliser le mode démo en production ou sur GitHub Pages
    if (isProduction || isGitHubPages) {
      console.log('🎭 FORCE MODE DÉMO - Utilisation des comptes de démonstration')
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('🔐 Authentification avec:', credentials.email, credentials.password)
          const result = authenticateDemo(credentials.email, credentials.password)
          console.log('📊 Résultat authentification:', result)
          if (result.success) {
            resolve({ data: result.data })
          } else {
            reject(new Error(result.error))
          }
        }, 1000) // Simuler un délai réseau
      })
    }
    
    console.log('🌐 Mode développement - Tentative API backend')
    return await apiRequest.post('/auth/login', credentials)
  },

  // Inscription
  register: async (userData) => {
    return await apiRequest.post('/auth/register', userData)
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser: async () => {
    // FORCER LE MODE DÉMO POUR GITHUB PAGES
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io')
    const isProduction = import.meta.env.PROD
    
    if (isProduction || isGitHubPages) {
      const token = localStorage.getItem('token')
      if (token === 'demo-jwt-token-for-github-pages') {
        const userStr = localStorage.getItem('demoUser')
        if (userStr) {
          return { data: { user: JSON.parse(userStr) } }
        }
      }
      throw new Error('Non authentifié')
    }
    
    return await apiRequest.get('/auth/me')
  },

  // Mettre à jour le profil
  updateProfile: async (profileData) => {
    return await apiRequest.put('/auth/profile', profileData)
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    return await apiRequest.put('/auth/change-password', passwordData)
  },

  // Rafraîchir le token
  refreshToken: async () => {
    return await apiRequest.post('/auth/refresh')
  },

  // Déconnexion (côté client)
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('demoUser')
  },
}
