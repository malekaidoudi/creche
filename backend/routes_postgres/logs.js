const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

// GET /api/logs - Récupérer les logs récents
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await db.query(`
      SELECT 
        l.id,
        l.user_id,
        l.action,
        l.category,
        l.severity,
        l.description,
        l.target_type,
        l.target_id,
        l.ip_address,
        l.request_method,
        l.request_path,
        l.metadata,
        l.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      success: true,
      logs: result.rows
    });
  } catch (error) {
    console.error('❌ Erreur récupération logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des logs'
    });
  }
});

// POST /api/logs - Créer un nouveau log
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    const { action, description, category, severity } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'L\'action est requise'
      });
    }

    const result = await db.query(`
      INSERT INTO activity_logs (user_id, action, category, severity, description, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [userId, action, category || 'other', severity || 'info', description || null]);

    res.status(201).json({
      success: true,
      log: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur création log:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du log'
    });
  }
});

// Fonction helper pour créer un log (utilisable par d'autres routes)
const createLog = async (userId, action, description, options = {}) => {
  try {
    const { category = 'other', severity = 'info', targetType = null, targetId = null, metadata = {} } = options;
    await db.query(`
      INSERT INTO activity_logs (user_id, action, category, severity, description, target_type, target_id, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [userId, action, category, severity, description, targetType, targetId, JSON.stringify(metadata)]);
    return true;
  } catch (error) {
    console.error('❌ Erreur création log:', error);
    return false;
  }
};

module.exports = router;
module.exports.createLog = createLog;
