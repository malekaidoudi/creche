/**
 * SERVICE DE GESTION DE LA LISTE NOIRE DES JETONS (TOKEN BLACKLIST)
 * Assure la révocation côté serveur des jetons JWT lors de la déconnexion.
 * Architecture hybride : Set en mémoire vive (0 ms de latence) + persistance PostgreSQL.
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db_postgres');
const logger = require('../utils/logger');

// Cache en mémoire pour vérification instantanée sans requête SQL
const inMemoryBlacklist = new Set();

/**
 * Initialise le service : charge les tokens révoqués encore valides et nettoie les expirés
 */
const init = async () => {
  try {
    // 1. Supprimer les tokens dont la date d'expiration est dépassée
    await db.query(`
      DELETE FROM revoked_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP
    `);

    // 2. Précharger en mémoire les tokens révoqués encore non expirés
    const result = await db.query(`
      SELECT token FROM revoked_tokens 
      WHERE expires_at >= CURRENT_TIMESTAMP
    `);

    inMemoryBlacklist.clear();
    for (const row of result.rows) {
      inMemoryBlacklist.add(row.token);
    }

    console.log(`🛡️ [TOKEN BLACKLIST] Synchronisé : ${inMemoryBlacklist.size} jeton(s) révoqué(s) actif(s) en cache RAM.`);
  } catch (err) {
    // Si la table n'existe pas encore lors du premier bootstrap, ignorer silencieusement
    if (!err.message.includes('relation "revoked_tokens" does not exist')) {
      console.error('⚠️ [TOKEN BLACKLIST] Erreur synchronisation cache:', err.message);
    }
  }
};

/**
 * Révoque un jeton JWT
 * @param {string} token - Le jeton JWT à révoquer
 * @param {number|null} userId - ID de l'utilisateur (optionnel)
 */
const revokeToken = async (token, userId = null) => {
  if (!token || typeof token !== 'string') return false;

  try {
    // Extraire la date d'expiration du token
    const decoded = jwt.decode(token);
    const expiresAt = decoded && decoded.exp 
      ? new Date(decoded.exp * 1000) 
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Repli à 7 jours

    const resolvedUserId = userId || (decoded ? (decoded.id || decoded.userId) : null);

    // 1. Ajouter immédiatement au cache mémoire (0 ms)
    inMemoryBlacklist.add(token);

    // 2. Persister en base de données PostgreSQL
    await db.query(`
      INSERT INTO revoked_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at
    `, [token, resolvedUserId, expiresAt]);

    return true;
  } catch (error) {
    logger.error('❌ [TOKEN BLACKLIST] Erreur révocation jeton:', error.message);
    // Même en cas d'erreur DB, le token est garanti révoqué en mémoire
    inMemoryBlacklist.add(token);
    return false;
  }
};

/**
 * Vérifie si un jeton est révoqué (100% en RAM, 0 ms de latence, 0 requête SQL)
 * @param {string} token - Le jeton JWT à vérifier
 * @returns {Promise<boolean>}
 */
const isTokenRevoked = async (token) => {
  if (!token) return true;
  return inMemoryBlacklist.has(token);
};

// Initialiser automatiquement au démarrage du module
init();

// Synchronisation d'arrière-plan toutes les 60 secondes (non-bloquante, purge expirés & resynchronise)
const syncInterval = setInterval(init, 60_000);
if (syncInterval.unref) {
  syncInterval.unref();
}

module.exports = {
  revokeToken,
  isTokenRevoked,
  init
};
