/**
 * Routes pour la gestion des alertes de paiement
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db_postgres');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token manquant' });
  }

  req.user = { id: req.headers['x-user-id'] || 1 };
  next();
};

/**
 * POST /api/payment-alerts
 * Envoyer une alerte de paiement
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipient_type, parent_ids, amount, due_date, message } = req.body;
    const createdBy = req.user.id;

    // Validation
    if (!amount || !due_date) {
      return res.status(400).json({
        success: false,
        error: 'Le montant et la date d\'échéance sont requis'
      });
    }

    // Déterminer les destinataires
    let recipientIds = [];
    if (recipient_type === 'all') {
      // Récupérer tous les parents
      const result = await pool.query(
        'SELECT id FROM users WHERE role = $1 AND deleted_at IS NULL',
        ['parent']
      );
      recipientIds = result.rows.map(row => row.id);
    } else {
      // Utiliser les IDs fournis
      recipientIds = parent_ids || [];
    }

    if (recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun destinataire sélectionné'
      });
    }

    // Créer une notification pour chaque parent
    const notifications = [];
    for (const parentId of recipientIds) {
      const title = '💰 Alerte de Paiement';
      const notificationMessage = message
        ? `Montant à payer: ${amount} TND avant le ${new Date(due_date).toLocaleDateString('fr-FR')}. ${message}`
        : `Vous avez un paiement de ${amount} TND à effectuer avant le ${new Date(due_date).toLocaleDateString('fr-FR')}.`;

      const result = await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
        VALUES ($1, $2, $3, $4, false, NOW())
        RETURNING *
      `, [parentId, title, notificationMessage, 'payment_alert']);

      notifications.push(result.rows[0]);
    }

    // Logger l'action dans la table logs
    await pool.query(`
      INSERT INTO logs (user_id, action, description, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [
      createdBy,
      'payment_alert_sent',
      `Alerte de paiement envoyée à ${recipientIds.length} parent(s) - Montant: ${amount} TND`
    ]);

    res.status(201).json({
      success: true,
      message: `Alerte envoyée à ${recipientIds.length} parent(s)`,
      notifications_sent: notifications.length
    });

  } catch (error) {
    console.error('❌ Erreur POST /api/payment-alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de l\'alerte de paiement'
    });
  }
});

/**
 * GET /api/payment-alerts/history
 * Historique des alertes envoyées
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.id,
        l.action,
        l.description,
        l.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.action = 'payment_alert_sent'
      ORDER BY l.created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      alerts: result.rows
    });

  } catch (error) {
    console.error('❌ Erreur GET /api/payment-alerts/history:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

module.exports = router;
