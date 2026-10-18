/**
 * Configuration API pour l'application Crèche
 * 
 * Ce fichier gère automatiquement les différentes URLs d'API :
 * - Développement local : http://localhost:3003
 * - Production : Variable VITE_API_URL (Render : https://creche-lx4u.onrender.com)
 */

// Déterminer l'URL du backend en fonction de l'environnement
const getBaseUrl = () => {
  let url = '';

  // Si une variable d'environnement est définie, l'utiliser
  if (import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL;
  } else {
    const hostname = window.location.hostname;
    const isDev = import.meta.env.DEV;

    // En développement uniquement: Si on accède via une IP locale (192.168.x.x), utiliser cette même IP pour le backend
    if (isDev && hostname.startsWith('192.168.')) {
      url = `http://${hostname}:3003`;
    } else if (isDev && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      url = 'http://localhost:3003';
    } else {
      // Repli de production : conservé pour compatibilité avec les builds
      // existants, mais VITE_API_URL doit toujours être définie explicitement
      // dans la configuration Vercel (cf. documentsV2/23_ANOMALIES_ET_RECOMMANDATIONS.md, anomalie #19).
      url = 'https://creche-lx4u.onrender.com';
      console.error(
        '⚠️ [CONFIG] VITE_API_URL non définie — repli sur l\'URL de production codée en dur. ' +
        'Définissez VITE_API_URL dans les variables d\'environnement Vercel.'
      );
    }
  }

  // Normalisation : retirer tout '/api' ou '/' final car les routes Axios / services commencent par /api
  return url.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

// Configuration API pour différents environnements
const API_CONFIG = {
  // URL de base pour les requêtes API
  BASE_URL: getBaseUrl(),

  // Endpoints de l'API
  ENDPOINTS: {
    // Authentification
    AUTH: '/api/auth',
    AUTH_LOGIN: '/api/auth/login',
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
    PUBLIC_ENROLLMENTS: '/api/enrollments',

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
