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

// GET /api/logs/email - Récupérer les logs d'emails (admin uniquement)
router.get('/email', auth.authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux administrateurs'
      });
    }

    const { limit = 50, status = 'all' } = req.query;
    const limitNum = parseInt(limit);

    let whereClause = '1=1';
    const params = [limitNum];

    if (status !== 'all') {
      whereClause += ' AND status = $2';
      params.push(status);
    }

    const result = await db.query(`
      SELECT
        id,
        email_type,
        recipient_email,
        sender_email,
        subject,
        status,
        resend_id,
        error_message,
        metadata,
        created_at
      FROM email_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1
    `, status !== 'all' ? [limitNum, status] : [limitNum]);

    res.json({
      success: true,
      logs: result.rows
    });
  } catch (error) {
    console.error('Erreur récupération email logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des logs d\'emails'
    });
  }
});

// DELETE /api/logs/email/:id - Supprimer un log email (admin uniquement)
router.delete('/email/:id', auth.authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;
    await db.query('DELETE FROM email_logs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Log email supprimé'
    });
  } catch (error) {
    console.error('Erreur suppression email log:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du log email'
    });
  }
});

module.exports = router;
module.exports.createLog = createLog;
