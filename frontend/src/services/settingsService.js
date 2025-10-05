// Import de la configuration API centralisée
import API_CONFIG, { getApiUrl, isReadOnlyMode, ENV_INFO } from '../config/api.js';

console.log('🔧 Configuration Settings Service:', ENV_INFO);

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
  // Login admin temporaire pour les tests
  async loginAdmin() {
    try {
      // Token admin temporaire généré côté backend (valide 24h)
      const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjcmVjaGUuY29tIiwicm9sZSI6ImFkbWluIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiU3lzdGVtIiwiaWF0IjoxNzU5NjU3MTM5LCJleHAiOjE3NTk3NDM1Mzl9.oSagY6YnxOo-0vIT6PTJ4inRdiqCC-wabg_YlwUlgF0';
      
      localStorage.setItem('token', adminToken);
      console.log('✅ Token admin temporaire configuré');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur login admin:', error);
      return { success: false, error: error.message };
    }
  },

  // Récupérer tous les paramètres publics
  async getPublicSettings() {
    try {
      const url = getApiUrl(`${API_CONFIG.ENDPOINTS.SETTINGS}/public`);
      console.log('🔄 Appel API getPublicSettings:', url);
      
      const response = await fetch(url, {
        timeout: API_CONFIG.TIMEOUT
      });
      
      console.log('📡 Réponse reçue:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Données reçues:', Object.keys(data));
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paramètres publics:', error);
      console.error('❌ Type d\'erreur:', error.constructor.name);
      console.error('❌ Message:', error.message);
      
      // En mode lecture seule, retourner des données par défaut
      if (isReadOnlyMode()) {
        console.log('📖 Mode lecture seule - Utilisation des données par défaut');
        return this.getDefaultSettings();
      }
      
      throw error;
    }
  },

  // Récupérer tous les paramètres (admin)
  async getAllSettings() {
    try {
      // En mode lecture seule, utiliser les paramètres publics
      if (isReadOnlyMode()) {
        console.log('📖 Mode lecture seule - Utilisation des paramètres publics');
        return this.getPublicSettings();
      }
      
      const url = getApiUrl(API_CONFIG.ENDPOINTS.SETTINGS);
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les paramètres:', error);
      
      // Fallback vers paramètres publics
      if (isReadOnlyMode()) {
        return this.getPublicSettings();
      }
      
      throw error;
    }
  },

  // Récupérer un paramètre spécifique
  async getSetting(key) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings/${key}`);
      
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
  async updateSetting(key, value, type = 'string') {
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
      // Vérifier si on est en mode lecture seule
      if (isReadOnlyMode()) {
        console.log('📖 Mode lecture seule - Sauvegarde dans localStorage');
        // Sauvegarder dans localStorage comme fallback
        const currentSettings = JSON.parse(localStorage.getItem('creche_settings') || '{}');
        const updatedSettings = { ...currentSettings, ...settings };
        localStorage.setItem('creche_settings', JSON.stringify(updatedSettings));
        
        return {
          success: true,
          message: 'Paramètres sauvegardés localement (mode démo)',
          data: updatedSettings
        };
      }
      
      console.log('🔄 Mise à jour multiple via API:', settings);
      const url = getApiUrl(API_CONFIG.ENDPOINTS.SETTINGS);
      console.log('🔗 URL générée pour mise à jour:', url);
      console.log('🔧 API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify({ settings }),
        timeout: API_CONFIG.TIMEOUT
      });
      
      console.log('📡 Réponse mise à jour:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP mise à jour:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Mise à jour réussie:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour multiple:', error);
      console.error('❌ Type d\'erreur:', error.constructor.name);
      console.error('❌ Message:', error.message);
      
      // Fallback localStorage en cas d'erreur
      if (isReadOnlyMode()) {
        console.log('📖 Fallback localStorage après erreur');
        const currentSettings = JSON.parse(localStorage.getItem('creche_settings') || '{}');
        const updatedSettings = { ...currentSettings, ...settings };
        localStorage.setItem('creche_settings', JSON.stringify(updatedSettings));
        
        return {
          success: true,
          message: 'Paramètres sauvegardés localement (fallback)',
          data: updatedSettings
        };
      }
      
      throw error;
    }
  },

  // Créer un nouveau paramètre
  async createSetting(key, value, type = 'string', category = 'general', description = '', isPublic = true) {
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
  async deleteSetting(key) {
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

  // Upload d'image pour un paramètre
  async uploadImage(key, file) {
    try {
      // En mode lecture seule, désactiver l'upload
      if (isReadOnlyMode()) {
        throw new Error('Upload non disponible en mode démo');
      }
      
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const url = getApiUrl(`${API_CONFIG.ENDPOINTS.SETTINGS_UPLOAD}/${key}`);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        timeout: API_CONFIG.TIMEOUT
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
  },

  // Récupérer les catégories disponibles
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

  // Récupérer les paramètres par catégorie
  async getByCategory(category) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings/category/${category}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des paramètres de la catégorie ${category}:`, error);
      throw error;
    }
  },

  // Données par défaut pour le mode lecture seule
  getDefaultSettings() {
    console.log('📋 Chargement des données par défaut');
    
    // Essayer de récupérer depuis localStorage d'abord
    const localSettings = localStorage.getItem('creche_settings');
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        console.log('✅ Données trouvées dans localStorage');
        return { ...this.getStaticDefaults(), ...parsed };
      } catch (error) {
        console.warn('⚠️ Erreur parsing localStorage, utilisation des défauts');
      }
    }
    
    return this.getStaticDefaults();
  },

  // Données statiques par défaut
  getStaticDefaults() {
    return {
      // Informations générales
      nursery_name: 'Crèche Les Petits Anges',
      nursery_name_ar: 'حضانة الملائكة الصغار',
      nursery_description: 'Une crèche moderne et bienveillante pour l\'épanouissement de vos enfants',
      nursery_description_ar: 'حضانة حديثة ومتفهمة لنمو أطفالكم',
      
      // Contact
      nursery_phone: '+216 25 95 35 32',
      nursery_email: 'contact@creche-anges.tn',
      nursery_address: '8 Rue Bizerte, Medenine 4100, Tunisie',
      nursery_address_ar: '8 نهج بنزرت، مدنين 4100، تونس',
      
      // Capacité
      available_spots: '15',
      total_capacity: '30',
      min_age_months: '3',
      max_age_years: '4',
      
      // Horaires (format JSON string)
      opening_hours: JSON.stringify({
        monday: { open: '07:00', close: '18:00', closed: false },
        tuesday: { open: '07:00', close: '18:00', closed: false },
        wednesday: { open: '07:00', close: '18:00', closed: false },
        thursday: { open: '07:00', close: '18:00', closed: false },
        friday: { open: '07:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '16:00', closed: false },
        sunday: { open: '08:00', close: '16:00', closed: true }
      }),
      
      // Images
      nursery_logo: '/images/logo.jpg',
      hero_image: '/images/hero-default.jpg',
      
      // Couleurs
      primary_color: '#3B82F6',
      secondary_color: '#10B981',
      accent_color: '#F59E0B',
      
      // Réseaux sociaux
      facebook_url: 'https://facebook.com/creche-anges',
      instagram_url: 'https://instagram.com/creche_anges',
      
      // Paramètres système
      site_language: 'fr',
      enable_rtl: 'true',
      maintenance_mode: 'false'
    };
  }
};

export default settingsService;
