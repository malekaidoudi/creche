/**
 * Configuration API pour l'application Crèche
 * 
 * Ce fichier gère automatiquement les différentes URLs d'API :
 * - Développement local : https://creche-backend.onrender.com
 * - Production : URL depuis variable d'environnement
 */

// Configuration API pour différents environnements
const API_CONFIG = {
  // URL de base pour les requêtes API
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://creche-backend.onrender.com'
    : 'https://creche-backend.onrender.com',
  
  // Endpoints de l'API
  ENDPOINTS: {
    // Authentification
    AUTH: '/api/auth',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REGISTER: '/api/auth/register',
    AUTH_ME: '/api/auth/me',
    
    // Utilisateurs
    USERS: '/api/users',
    PROFILE: '/api/profile',
    PROFILE_UPLOAD: '/api/profile/upload',
    
    // Enfants
    CHILDREN: '/api/children',
    CHILDREN_ADD: '/api/children/add',
    
    // Inscriptions
    ENROLLMENTS: '/api/enrollments',
    PUBLIC_ENROLLMENTS: '/api/public/enrollments',
    
    // Présences
    ATTENDANCE: '/api/attendance',
    ATTENDANCE_REPORT: '/api/attendance/report',
    
    // Paramètres
    NURSERY_SETTINGS: '/api/nursery-settings',
    HOLIDAYS: '/api/holidays',
    
    // Santé
    HEALTH: '/api/health'
  },
  
  // Configuration des timeouts
  TIMEOUT: 30000, // 30 secondes
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export default API_CONFIG;
