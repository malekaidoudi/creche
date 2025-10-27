const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db_postgres');

// GET /api/notifications - Récupérer toutes les notifications
router.get('/', async (req, res) => {
  try {
    const { user_id, type, is_read, page = 1, limit = 50 } = req.query;
    
    let sql = `
      SELECT n.id, n.user_id, n.title, n.message, n.type, n.is_read, n.created_at,
             u.first_name as user_first_name, u.last_name as user_last_name, 
             u.email as user_email, u.role as user_role
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    // Filtres
    if (user_id) {
      paramCount++;
      sql += ` AND n.user_id = $${paramCount}`;
      params.push(user_id);
    }
    
    if (type) {
      paramCount++;
      sql += ` AND n.type = $${paramCount}`;
      params.push(type);
    }
    
    if (is_read !== undefined) {
      paramCount++;
      sql += ` AND n.is_read = $${paramCount}`;
      params.push(is_read === 'true');
    }
    
    // Pagination
    sql += ` ORDER BY n.created_at DESC`;
    const offset = (page - 1) * limit;
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await db.query(sql, params);
    
    // Compter le total
    let countSql = `
      SELECT COUNT(*) as total 
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;
    
    if (user_id) {
      countParamCount++;
      countSql += ` AND n.user_id = $${countParamCount}`;
      countParams.push(user_id);
    }
    
    if (type) {
      countParamCount++;
      countSql += ` AND n.type = $${countParamCount}`;
      countParams.push(type);
    }
    
    if (is_read !== undefined) {
      countParamCount++;
      countSql += ` AND n.is_read = $${countParamCount}`;
      countParams.push(is_read === 'true');
    }
    
    const countResult = await db.query(countSql, countParams);
    
    res.json({
      success: true,
      notifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des notifications' 
    });
  }
});

// GET /api/notifications/:id - Récupérer une notification par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT n.id, n.user_id, n.title, n.message, n.type, n.is_read, n.created_at,
              u.first_name as user_first_name, u.last_name as user_last_name, 
              u.email as user_email, u.role as user_role
       FROM notifications n
       JOIN users u ON n.user_id = u.id
       WHERE n.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification non trouvée' 
      });
    }
    
    res.json({
      success: true,
      notification: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur récupération notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la notification' 
    });
  }
});

// POST /api/notifications - Créer une nouvelle notification
router.post('/', [
  body('user_id').isInt().withMessage('ID utilisateur requis'),
  body('title').notEmpty().withMessage('Titre requis'),
  body('message').notEmpty().withMessage('Message requis'),
  body('type').isIn(['info', 'success', 'warning', 'error', 'enrollment', 'attendance', 'system']).withMessage('Type invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Données invalides', 
        details: errors.array() 
      });
    }
    
    const { user_id, title, message, type = 'info' } = req.body;
    
    // Vérifier si l'utilisateur existe
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Insérer la nouvelle notification
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id, title, message, type, is_read, created_at`,
      [user_id, title, message, type, false]
    );
    
    res.status(201).json({
      success: true,
      message: 'Notification créée avec succès',
      notification: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur création notification:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création de la notification' 
    });
  }
});

// POST /api/notifications/broadcast - Envoyer une notification à plusieurs utilisateurs
router.post('/broadcast', [
  body('user_ids').isArray().withMessage('Liste d\'IDs utilisateurs requise'),
  body('title').notEmpty().withMessage('Titre requis'),
  body('message').notEmpty().withMessage('Message requis'),
  body('type').isIn(['info', 'success', 'warning', 'error', 'enrollment', 'attendance', 'system']).withMessage('Type invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Données invalides', 
        details: errors.array() 
      });
    }
    
    const { user_ids, title, message, type = 'info' } = req.body;
    
    if (user_ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Au moins un utilisateur requis' 
      });
    }
    
    // Vérifier que tous les utilisateurs existent
    const placeholders = user_ids.map((_, index) => `$${index + 1}`).join(',');
    const existingUsers = await db.query(
      `SELECT id FROM users WHERE id IN (${placeholders})`,
      user_ids
    );
    
    if (existingUsers.rows.length !== user_ids.length) {
      return res.status(404).json({ 
        success: false,
        error: 'Certains utilisateurs n\'existent pas' 
      });
    }
    
    // Créer les notifications pour tous les utilisateurs
    const notifications = [];
    for (const user_id of user_ids) {
      const result = await db.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, user_id, title, message, type, is_read, created_at`,
        [user_id, title, message, type, false]
      );
      notifications.push(result.rows[0]);
    }
    
    res.status(201).json({
      success: true,
      message: `${notifications.length} notifications créées avec succès`,
      notifications
    });
    
  } catch (error) {
    console.error('Erreur broadcast notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'envoi des notifications' 
    });
  }
});

// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la notification existe
    const existingNotification = await db.query('SELECT id, is_read FROM notifications WHERE id = $1', [id]);
    if (existingNotification.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Notification non trouvée' 
      });
    }
    
    if (existingNotification.rows[0].is_read) {
      return res.status(409).json({ 
        success: false,
        error: 'Notification déjà marquée comme lue' 
      });
    }
    
    // Marquer comme lue
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = TRUE
       WHERE id = $1
       RETURNING id, user_id, title, message, type, is_read, created_at`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Notification marquée comme lue',
      notification: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du marquage de la notification' 
    });
  }
});

// PUT /api/notifications/user/:user_id/read-all - Marquer toutes les notifications d'un utilisateur comme lues
router.put('/user/:user_id/read-all', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Vérifier si l'utilisateur existe
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Marquer toutes les notifications non lues comme lues
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING id`,
      [user_id]
    );
    
    res.json({
      success: true,
      message: `${result.rows.length} notifications marquées comme lues`,
      updated_count: result.rows.length
    });
    
  } catch (error) {
    console.error('Erreur marquage toutes notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du marquage des notifications' 
    });
  }
});

// DELETE /api/notifications/:id - Supprimer une notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la notification existe
    const existingNotification = await db.query('SELECT id FROM notifications WHERE id = $1', [id]);
    if (existingNotification.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Notification non trouvée' 
      });
    }
    
    // Supprimer la notification
    await db.query('DELETE FROM notifications WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Notification supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression de la notification' 
    });
  }
});

// GET /api/notifications/user/:user_id/unread-count - Compter les notifications non lues d'un utilisateur
router.get('/user/:user_id/unread-count', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Vérifier si l'utilisateur existe
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Compter les notifications non lues
    const result = await db.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [user_id]
    );
    
    res.json({
      success: true,
      user_id: parseInt(user_id),
      unread_count: parseInt(result.rows[0].unread_count)
    });
    
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du comptage des notifications' 
    });
  }
});

// GET /api/notifications/stats - Statistiques des notifications
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE is_read = true) as read_notifications,
        COUNT(*) FILTER (WHERE is_read = false) as unread_notifications,
        COUNT(*) FILTER (WHERE type = 'info') as info_notifications,
        COUNT(*) FILTER (WHERE type = 'success') as success_notifications,
        COUNT(*) FILTER (WHERE type = 'warning') as warning_notifications,
        COUNT(*) FILTER (WHERE type = 'error') as error_notifications,
        COUNT(*) FILTER (WHERE type = 'enrollment') as enrollment_notifications,
        COUNT(*) FILTER (WHERE type = 'attendance') as attendance_notifications,
        COUNT(*) FILTER (WHERE type = 'system') as system_notifications,
        COUNT(DISTINCT user_id) as unique_users
      FROM notifications
    `);
    
    res.json({
      success: true,
      stats: stats.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur statistiques notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

module.exports = router;
