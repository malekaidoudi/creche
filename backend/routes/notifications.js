const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications - Obtenir les notifications de l'utilisateur connecté
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = '50', offset = '0', unread_only = 'false' } = req.query;
    
    console.log('📬 Récupération notifications pour utilisateur:', req.user.id);
    
    let whereClause = 'WHERE user_id = ?';
    let params = [req.user.id];
    
    if (unread_only === 'true') {
      whereClause += ' AND is_read = FALSE';
    }

    // Construire la requête avec LIMIT et OFFSET intégrés dans la chaîne
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    const sql = `
      SELECT * FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    console.log('🔍 Requête SQL:', sql);
    console.log('📊 Paramètres:', params);

    const notifications = await query(sql, params);

    // Compter les notifications non lues
    const unreadCountResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    console.log('✅ Notifications trouvées:', notifications.length);
    console.log('🔔 Notifications non lues:', unreadCountResult[0].count);

    res.json({
      success: true,
      notifications: notifications,
      unread_count: unreadCountResult[0].count
    });

  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// PUT /api/notifications/read-all - Marquer toutes les notifications comme lues
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} notifications marquées comme lues`
    });

  } catch (error) {
    console.error('❌ Erreur marquage toutes notifications:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

module.exports = router;
