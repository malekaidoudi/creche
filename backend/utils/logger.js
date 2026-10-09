/**
 * Logger utilitaire avec gestion des environnements et niveaux de log
 * 
 * Niveaux supportés : error (0), warn (1), info (2), debug (3)
 * Configurable via la variable d'environnement LOG_LEVEL (défaut : 'info' en dev et prod)
 * Pour activer le debug détaillé de la base de données : DEBUG_DB=true ou LOG_LEVEL=debug
 */

const isProduction = process.env.NODE_ENV === 'production';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const getLogLevel = () => {
  if (process.env.LOG_LEVEL && LOG_LEVELS[process.env.LOG_LEVEL.toLowerCase()] !== undefined) {
    return LOG_LEVELS[process.env.LOG_LEVEL.toLowerCase()];
  }
  return process.env.NODE_ENV === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug;
};

const logger = {
  /**
   * Log d'erreur (toujours affiché)
   */
  error: (...args) => {
    if (getLogLevel() >= LOG_LEVELS.error) {
      console.error('[ERROR]', ...args);
    }
  },

  /**
   * Log d'avertissement
   */
  warn: (...args) => {
    if (getLogLevel() >= LOG_LEVELS.warn) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log d'information général
   */
  info: (...args) => {
    if (getLogLevel() >= LOG_LEVELS.info) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log de succès
   */
  success: (...args) => {
    if (getLogLevel() >= LOG_LEVELS.info) {
      console.log('[SUCCESS]', ...args);
    }
  },

  /**
   * Log de debug
   */
  debug: (...args) => {
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && getLogLevel() >= LOG_LEVELS.debug) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log de debug de la base de données (actif si DEBUG_DB=true ou LOG_LEVEL=debug)
   */
  dbDebug: (...args) => {
    const isProd = process.env.NODE_ENV === 'production';
    const isDbDebugActive = process.env.DEBUG_DB === 'true' || process.env.LOG_LEVEL === 'debug';
    if (!isProd && isDbDebugActive) {
      console.log('[DB-DEBUG]', ...args);
    }
  },

  /**
   * Log des requêtes anormalement lentes (> 500 ms)
   */
  slowQuery: (text, duration) => {
    const cleanText = (text || '').substring(0, 120).replace(/\s+/g, ' ');
    console.warn(`⚠️ [SLOW QUERY] (${duration}ms) : ${cleanText}...`);
  },

  /**
   * Log sensible (désactivé en production, actif uniquement si DEBUG_AUTH=true ou DEBUG_SENSITIVE=true en dev)
   */
  sensitive: (...args) => {
    const isProd = process.env.NODE_ENV === 'production';
    const isSensitiveAllowed = !isProd && (process.env.DEBUG_AUTH === 'true' || process.env.DEBUG_SENSITIVE === 'true');
    if (isSensitiveAllowed) {
      console.log('[SENSITIVE]', ...args);
    }
  },

  /**
   * Log de requête HTTP (version réduite en production)
   */
  request: (req, message = '') => {
    if (isProduction) {
      console.log(`[REQUEST] ${req.method} ${req.path} ${message}`);
    } else if (currentLevel >= LOG_LEVELS.debug) {
      console.log(`[REQUEST] ${req.method} ${req.path} ${message}`, {
        query: req.query,
        params: req.params,
        userId: req.user?.id
      });
    }
  },

  /**
   * Log de sécurité (sans données sensibles)
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
   * Log général de base de données
   */
  db: (operation, details = '') => {
    if (isProduction) {
      console.log(`[DB] ${operation}`);
    } else if (isDbDebug) {
      console.log(`[DB] ${operation}`, details);
    }
  }
};

module.exports = logger;
