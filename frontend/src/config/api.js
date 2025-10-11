/**
 * Configuration des URLs d'API selon l'environnement
 * 
 * Ce fichier gère automatiquement les différentes URLs d'API :
 * - Développement local : http://localhost:3001
 * - Production Railway : URL Railway générée
 * - Fallback GitHub Pages : Mode lecture seule
 */

// Détection de l'environnement
const isProduction = window.location.hostname === 'malekaidoudi.github.io';
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Configuration des URLs d'API
const API_CONFIG = {
  // URL de base selon l'environnement
  BASE_URL: (() => {
    if (isDevelopment) {
      // Développement local - Backend local
      return 'http://localhost:3003';
    } else if (isProduction) {
      // Production GitHub Pages - Backend Railway
      // TODO: Remplacer par votre URL Railway réelle après déploiement
      return 'https://rare-emotion-production.up.railway.app';
    } else {
      // Autre environnement (preview, staging, etc.)
      return process.env.VITE_API_URL || 'http://localhost:3003';
    }
  })(),
  
  // Endpoints de l'API
  ENDPOINTS: {
    // Authentification
    AUTH: '/api/auth',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REGISTER: '/api/auth/register',
    AUTH_ME: '/api/auth/me',
    
    // Gestion
    USERS: '/api/users',
    CHILDREN: '/api/children',
    ENROLLMENTS: '/api/enrollments',
    ATTENDANCE: '/api/attendance',
    
    // Public
    PUBLIC_ENROLLMENTS: '/api/public/enrollments',
    HEALTH: '/api/health',
    CONTACTS: '/api/contacts',
    ARTICLES: '/api/articles',
    NEWS: '/api/news',
    UPLOAD: '/api/upload',
    
    // Legacy (à supprimer plus tard)
    SETTINGS: '/api/settings',
    SETTINGS_UPLOAD: '/api/settings/upload'
  },
  
  // Configuration des timeouts
  TIMEOUT: 10000, // 10 secondes
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Construit une URL complète pour un endpoint
 * @param {string} endpoint - L'endpoint (ex: '/api/settings')
 * @returns {string} URL complète
 */
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Construit une URL complète pour une image uploadée
 * @param {string} imagePath - Le chemin de l'image (ex: '/uploads/settings/logo.jpg')
 * @returns {string} URL complète de l'image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (imagePath.startsWith('http')) return imagePath;
  
  // Si c'est un chemin relatif, utiliser le backend Railway
  return `${API_CONFIG.BASE_URL}${imagePath}`;
};

/**
 * Vérifie si l'API est disponible
 * @returns {Promise<boolean>} True si l'API répond
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH), {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.warn('🔍 API non disponible:', error.message);
    return false;
  }
};

/**
 * Détermine si on est en mode lecture seule
 * (GitHub Pages sans backend disponible)
 * @returns {boolean} True si mode lecture seule
 */
export const isReadOnlyMode = () => {
  // Maintenant que Railway est opérationnel, désactiver le mode lecture seule
  return false; // Railway backend disponible pour la sauvegarde
};

/**
 * Configuration d'environnement pour debugging
 */
export const ENV_INFO = {
  isDevelopment,
  isProduction,
  hostname: window.location.hostname,
  baseUrl: API_CONFIG.BASE_URL,
  readOnlyMode: isReadOnlyMode()
};

// Log de la configuration (seulement en développement)
if (isDevelopment) {
  console.log('🔧 Configuration API:', ENV_INFO);
}

export default API_CONFIG;
