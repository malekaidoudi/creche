const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

// Fonction utilitaire pour les requêtes authentifiées
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers
  });
};

// Service pour gérer les paramètres de la crèche
export const settingsService = {
  // Récupérer tous les paramètres publics
  async getPublicSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/public`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres publics:', error);
      // Retourner des paramètres par défaut en cas d'erreur
      return {
        success: true,
        data: {
          nursery_name: 'Mima Elghalia',
          nursery_logo: '/images/logo.png',
          director_name: 'Mme Fatima Ben Ali',
          nursery_address: '123 Rue de la Paix, 1000 Tunis, Tunisie',
          nursery_phone: '+216 71 123 456',
          nursery_email: 'contact@mimaelghalia.tn',
          total_capacity: 30,
          available_spots: 5,
          min_age_months: 3,
          max_age_months: 48,
          welcome_message_fr: 'Bienvenue à la crèche Mima Elghalia',
          welcome_message_ar: 'مرحباً بكم في حضانة ميما الغالية',
          site_theme: 'light',
          primary_color: '#3B82F6',
          secondary_color: '#8B5CF6',
          accent_color: '#F59E0B'
        }
      };
    }
  },

  // Récupérer tous les paramètres (admin seulement)
  async getAll() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les paramètres:', error);
      throw error;
    }
  },

  // Récupérer les catégories
  async getCategories() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  },

  // Récupérer par catégorie
  async getByCategory(category) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings/category/${category}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la catégorie ${category}:`, error);
      throw error;
    }
  },

  // Récupérer un paramètre spécifique
  async getByKey(key) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/${key}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du paramètre ${key}:`, error);
      throw error;
    }
  },

  // Mettre à jour un paramètre
  async updateByKey(key, value, type = 'string') {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value, type })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du paramètre ${key}:`, error);
      throw error;
    }
  },

  // Mettre à jour plusieurs paramètres
  async updateMultiple(settings) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour multiple:', error);
      throw error;
    }
  },

  // Créer un nouveau paramètre
  async create(key, value, type = 'string', category = 'general', description = '', isPublic = true) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        body: JSON.stringify({ key, value, type, category, description, isPublic })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du paramètre:', error);
      throw error;
    }
  },

  // Supprimer un paramètre
  async delete(key) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings/${key}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du paramètre ${key}:`, error);
      throw error;
    }
  },

  // Upload d'image
  async uploadImage(key, file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/settings/upload/${key}`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erreur lors de l'upload d'image pour ${key}:`, error);
      throw error;
    }
  }
};
