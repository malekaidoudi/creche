/**
 * Logger utilitaire avec gestion des environnements
 * 
 * En production, les logs sensibles sont désactivés
 * En développement, tous les logs sont affichés
 */

const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  /**
   * Log d'information général (toujours affiché)
   */
  info: (...args) => {
    console.log('[INFO]', ...args);
  },

  /**
   * Log de succès (toujours affiché)
   */
  success: (...args) => {
    console.log('[SUCCESS]', ...args);
  },

  /**
   * Log d'erreur (toujours affiché)
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log d'avertissement (toujours affiché)
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log de debug (désactivé en production)
   * Utilisé pour les logs de développement/débogage
   */
  debug: (...args) => {
    if (!isProduction) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log sensible (désactivé en production)
   * Utilisé pour les données sensibles comme tokens, passwords, req.body
   */
  sensitive: (...args) => {
    if (!isProduction) {
      console.log('[SENSITIVE]', ...args);
    }
  },

  /**
   * Log de requête HTTP (version réduite en production)
   */
  request: (req, message = '') => {
    if (isProduction) {
      // En production: juste la méthode et le path
      console.log(`[REQUEST] ${req.method} ${req.path} ${message}`);
    } else {
      // En dev: plus de détails
      console.log(`[REQUEST] ${req.method} ${req.path} ${message}`, {
        query: req.query,
        params: req.params,
        userId: req.user?.id
      });
    }
  },

  /**
   * Log de sécurité (toujours affiché mais sans données sensibles)
   */
  security: (event, details = {}) => {
    const safeDetails = {
      userId: details.userId,
      role: details.role,
      ip: details.ip,
      event: event,
      timestamp: new Date().toISOString()
    };
    console.log('[SECURITY]', JSON.stringify(safeDetails));
  },

  /**
   * Log de base de données (version réduite en production)
   */
  db: (operation, details = '') => {
    if (isProduction) {
      console.log(`[DB] ${operation}`);
    } else {
      console.log(`[DB] ${operation}`, details);
    }
  }
};

module.exports = logger;

