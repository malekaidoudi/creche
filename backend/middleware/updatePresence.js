/**
 * Middleware: Met à jour last_active de l'utilisateur à chaque requête authentifiée
 */
const { pool } = require('../config/database');

const updatePresence = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (userId && pool) {
      // Mise à jour asynchrone sans bloquer la requête
      pool.query(
        'UPDATE users SET last_active = NOW() WHERE id = $1',
        [userId]
      ).catch(err => console.error('Erreur updatePresence:', err));
    }
  } catch (error) {
    // Silencieux - ne pas bloquer la requête
  }
  next();
};

module.exports = { updatePresence };
