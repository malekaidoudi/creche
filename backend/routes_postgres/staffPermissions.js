/**
 * ROUTES PERMISSIONS DU STAFF
 * Permet à l'admin de consulter/modifier les accès accordés à chaque
 * membre du personnel (éducatrices, etc.)
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const db = require('../config/db_postgres');
const permissionsService = require('../services/permissionsService');

/**
 * GET /api/staff-permissions/catalog - Catalogue complet des permissions disponibles
 */
router.get('/catalog', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
  try {
    const catalog = await permissionsService.getCatalogForUser(null);
    res.json({ success: true, catalog });
  } catch (error) {
    logger.error('❌ Erreur GET /api/staff-permissions/catalog:', error.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du catalogue de permissions' });
  }
});

/**
 * GET /api/staff-permissions/:userId - Permissions accordées à un utilisateur
 */
router.get('/:userId', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    const userCheck = await db.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const catalog = await permissionsService.getCatalogForUser(userId);
    res.json({ success: true, catalog });
  } catch (error) {
    logger.error('❌ Erreur GET /api/staff-permissions/:userId:', error.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des permissions' });
  }
});

/**
 * PUT /api/staff-permissions/:userId - Met à jour les permissions accordées à un utilisateur
 * Body: { codes: string[] }
 */
router.put('/:userId', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { codes } = req.body;

    if (!Array.isArray(codes)) {
      return res.status(400).json({ success: false, error: 'Le champ "codes" doit être une liste' });
    }

    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const grantedBy = req.user.id || req.user.userId;
    const catalog = await permissionsService.setUserPermissions(userId, codes, grantedBy);

    res.json({
      success: true,
      message: 'Permissions mises à jour avec succès',
      catalog
    });
  } catch (error) {
    logger.error('❌ Erreur PUT /api/staff-permissions/:userId:', error.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour des permissions' });
  }
});

module.exports = router;
