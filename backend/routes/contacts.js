const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/contacts - Obtenir tous les messages de contact (staff seulement)
router.get('/', [
  authenticateToken,
  requireStaff,
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
  query('status').optional().isIn(['new', 'read', 'replied']).withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT c.*, u.first_name as replied_by_first_name, u.last_name as replied_by_last_name
      FROM contacts c
      LEFT JOIN users u ON c.replied_by = u.id
      WHERE 1=1
    `;
    let params = [];

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ` ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    // Ne pas ajouter limit et offset aux params

    const contacts = await dbQuery(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM contacts WHERE 1=1';
    let countParams = [];
    
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    
    const countResult = await dbQuery(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      message: 'Messages de contact récupérés avec succès',
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages de contact:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des messages de contact'
    });
  }
});

// GET /api/contacts/:id - Obtenir un message de contact par ID (staff seulement)
router.get('/:id', [
  authenticateToken,
  requireStaff
], async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    
    if (isNaN(contactId)) {
      return res.status(400).json({
        error: 'ID message invalide'
      });
    }

    const sql = `
      SELECT c.*, u.first_name as replied_by_first_name, u.last_name as replied_by_last_name
      FROM contacts c
      LEFT JOIN users u ON c.replied_by = u.id
      WHERE c.id = ?
    `;
    
    const results = await dbQuery(sql, [contactId]);
    
    if (results.length === 0) {
      return res.status(404).json({
        error: 'Message de contact non trouvé'
      });
    }

    // Marquer le message comme lu s'il ne l'était pas déjà
    const contact = results[0];
    if (contact.status === 'new') {
      await dbQuery(
        'UPDATE contacts SET status = "read", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [contactId]
      );
      contact.status = 'read';
    }

    res.json({
      message: 'Message de contact récupéré avec succès',
      contact
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du message de contact:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du message de contact'
    });
  }
});

// POST /api/contacts - Créer un nouveau message de contact (public)
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Le nom doit contenir entre 2 et 200 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numéro de téléphone invalide'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Le sujet doit contenir entre 5 et 255 caractères'),
  body('message')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Le message doit contenir au moins 20 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { name, email, phone, subject, message } = req.body;

    const sql = `
      INSERT INTO contacts (name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await dbQuery(sql, [name, email, phone, subject, message]);
    
    res.status(201).json({
      message: 'Message de contact envoyé avec succès',
      contact: {
        id: result.insertId,
        name,
        email,
        phone,
        subject,
        message,
        status: 'new',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message de contact:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'envoi du message de contact'
    });
  }
});

// PUT /api/contacts/:id/status - Mettre à jour le statut d'un message (staff seulement)
router.put('/:id/status', [
  authenticateToken,
  requireStaff,
  body('status')
    .isIn(['new', 'read', 'replied'])
    .withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const contactId = parseInt(req.params.id);
    
    if (isNaN(contactId)) {
      return res.status(400).json({
        error: 'ID message invalide'
      });
    }

    const { status } = req.body;
    const replied_by = status === 'replied' ? req.user.id : null;
    const replied_at = status === 'replied' ? new Date() : null;

    const sql = `
      UPDATE contacts 
      SET status = ?, replied_by = ?, replied_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await dbQuery(sql, [status, replied_by, replied_at, contactId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Message de contact non trouvé'
      });
    }

    res.json({
      message: 'Statut du message mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// DELETE /api/contacts/:id - Supprimer un message de contact (staff seulement)
router.delete('/:id', [
  authenticateToken,
  requireStaff
], async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    
    if (isNaN(contactId)) {
      return res.status(400).json({
        error: 'ID message invalide'
      });
    }

    const result = await dbQuery('DELETE FROM contacts WHERE id = ?', [contactId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Message de contact non trouvé'
      });
    }

    res.json({
      message: 'Message de contact supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du message de contact:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression du message de contact'
    });
  }
});

// GET /api/contacts/stats - Obtenir les statistiques des messages (staff seulement)
router.get('/stats/summary', [
  authenticateToken,
  requireStaff
], async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_messages,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_messages,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_messages,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_messages,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_messages
      FROM contacts
    `;
    
    const results = await dbQuery(sql);
    const stats = results[0];

    res.json({
      message: 'Statistiques récupérées avec succès',
      stats: {
        total: parseInt(stats.total),
        new: parseInt(stats.new_messages),
        read: parseInt(stats.read_messages),
        replied: parseInt(stats.replied_messages),
        today: parseInt(stats.today_messages),
        thisWeek: parseInt(stats.week_messages)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
