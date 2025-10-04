const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireStaff, requireChildAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance - Obtenir toutes les présences
router.get('/', [
  authenticateToken,
  requireStaff,
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
  query('date').optional().isISO8601().withMessage('Date invalide (format YYYY-MM-DD)'),
  query('child_id').optional().isInt({ min: 1 }).withMessage('ID enfant invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: errors.array()
      });
    }

    // Valeurs par défaut robustes pour la pagination
    let page = 1;
    let limit = 10;
    
    if (req.query.page && !isNaN(req.query.page)) {
      page = Math.max(1, parseInt(req.query.page));
    }
    
    if (req.query.limit && !isNaN(req.query.limit)) {
      limit = Math.max(1, Math.min(100, parseInt(req.query.limit)));
    }
    
    const date = req.query.date;
    const childId = req.query.child_id;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT a.*, 
             c.first_name as child_first_name, c.last_name as child_last_name,
             s.first_name as staff_first_name, s.last_name as staff_last_name
      FROM attendance a
      INNER JOIN children c ON a.child_id = c.id
      INNER JOIN users s ON a.staff_id = s.id
      WHERE 1=1
    `;
    let params = [];

    if (date) {
      sql += ' AND DATE(a.check_in_time) = ?';
      params.push(date);
    }

    if (childId) {
      sql += ' AND a.child_id = ?';
      params.push(childId);
    }

    sql += ` ORDER BY a.check_in_time DESC LIMIT ${limit} OFFSET ${offset}`;
    // Ne pas ajouter limit et offset aux params

    const attendance = await dbQuery(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM attendance a WHERE 1=1';
    let countParams = [];
    
    if (date) {
      countSql += ' AND DATE(a.check_in_time) = ?';
      countParams.push(date);
    }
    
    if (childId) {
      countSql += ' AND a.child_id = ?';
      countParams.push(childId);
    }
    
    const countResult = await dbQuery(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      message: 'Présences récupérées avec succès',
      attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des présences'
    });
  }
});

// POST /api/attendance/checkin - Enregistrer l'arrivée d'un enfant
router.post('/checkin', [
  authenticateToken,
  requireStaff,
  body('child_id')
    .isInt({ min: 1 })
    .withMessage('ID enfant invalide'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes trop longues')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { child_id, notes } = req.body;
    const staff_id = req.user.id;

    // Vérifier si l'enfant existe et est actif
    const childCheck = await dbQuery(
      'SELECT id, first_name, last_name FROM children WHERE id = ? AND is_active = TRUE',
      [child_id]
    );
    
    if (childCheck.length === 0) {
      return res.status(404).json({
        error: 'Enfant non trouvé ou inactif'
      });
    }

    // Vérifier si l'enfant n'est pas déjà présent aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = await dbQuery(
      'SELECT id FROM attendance WHERE child_id = ? AND DATE(check_in_time) = ? AND check_out_time IS NULL',
      [child_id, today]
    );

    if (existingAttendance.length > 0) {
      return res.status(409).json({
        error: 'L\'enfant est déjà présent aujourd\'hui'
      });
    }

    const sql = `
      INSERT INTO attendance (child_id, staff_id, check_in_time, notes)
      VALUES (?, ?, NOW(), ?)
    `;
    
    const result = await dbQuery(sql, [child_id, staff_id, notes]);
    
    // Récupérer l'enregistrement créé
    const attendanceSql = `
      SELECT a.*, 
             c.first_name as child_first_name, c.last_name as child_last_name,
             s.first_name as staff_first_name, s.last_name as staff_last_name
      FROM attendance a
      INNER JOIN children c ON a.child_id = c.id
      INNER JOIN users s ON a.staff_id = s.id
      WHERE a.id = ?
    `;
    
    const attendance = await dbQuery(attendanceSql, [result.insertId]);

    res.status(201).json({
      message: 'Arrivée enregistrée avec succès',
      attendance: attendance[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'arrivée:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'enregistrement de l\'arrivée'
    });
  }
});

// POST /api/attendance/checkout - Enregistrer le départ d'un enfant
router.post('/checkout', [
  authenticateToken,
  requireStaff,
  body('child_id')
    .isInt({ min: 1 })
    .withMessage('ID enfant invalide'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes trop longues')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { child_id, notes } = req.body;

    // Trouver l'enregistrement de présence actuel (sans checkout)
    const today = new Date().toISOString().split('T')[0];
    const attendanceCheck = await dbQuery(
      'SELECT id FROM attendance WHERE child_id = ? AND DATE(check_in_time) = ? AND check_out_time IS NULL',
      [child_id, today]
    );

    if (attendanceCheck.length === 0) {
      return res.status(404).json({
        error: 'Aucune présence active trouvée pour cet enfant aujourd\'hui'
      });
    }

    const attendanceId = attendanceCheck[0].id;

    // Mettre à jour avec l'heure de sortie
    const updateSql = `
      UPDATE attendance 
      SET check_out_time = NOW(), notes = COALESCE(CONCAT(COALESCE(notes, ''), ' - Sortie: ', ?), notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await dbQuery(updateSql, [notes || '', attendanceId]);
    
    // Récupérer l'enregistrement mis à jour
    const attendanceSql = `
      SELECT a.*, 
             c.first_name as child_first_name, c.last_name as child_last_name,
             s.first_name as staff_first_name, s.last_name as staff_last_name
      FROM attendance a
      INNER JOIN children c ON a.child_id = c.id
      INNER JOIN users s ON a.staff_id = s.id
      WHERE a.id = ?
    `;
    
    const attendance = await dbQuery(attendanceSql, [attendanceId]);

    res.json({
      message: 'Départ enregistré avec succès',
      attendance: attendance[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du départ:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'enregistrement du départ'
    });
  }
});

// GET /api/attendance/today - Obtenir les présences d'aujourd'hui
router.get('/today', [
  authenticateToken,
  requireStaff
], async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT a.*, 
             c.first_name as child_first_name, c.last_name as child_last_name,
             s.first_name as staff_first_name, s.last_name as staff_last_name
      FROM attendance a
      INNER JOIN children c ON a.child_id = c.id
      INNER JOIN users s ON a.staff_id = s.id
      WHERE DATE(a.check_in_time) = ?
      ORDER BY a.check_in_time DESC
    `;
    
    const attendance = await dbQuery(sql, [today]);

    // Séparer les enfants présents et partis
    const present = attendance.filter(a => !a.check_out_time);
    const departed = attendance.filter(a => a.check_out_time);

    res.json({
      message: 'Présences d\'aujourd\'hui récupérées avec succès',
      date: today,
      summary: {
        total: attendance.length,
        present: present.length,
        departed: departed.length
      },
      attendance: {
        present,
        departed,
        all: attendance
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des présences d\'aujourd\'hui:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des présences d\'aujourd\'hui'
    });
  }
});

// GET /api/attendance/child/:id - Obtenir les présences d'un enfant
router.get('/child/:id', [
  authenticateToken,
  requireChildAccess,
  query('start_date').optional().isISO8601().withMessage('Date de début invalide'),
  query('end_date').optional().isISO8601().withMessage('Date de fin invalide'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: errors.array()
      });
    }

    const childId = parseInt(req.params.id);
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (isNaN(childId)) {
      return res.status(400).json({
        error: 'ID enfant invalide'
      });
    }

    let sql = `
      SELECT a.*, 
             c.first_name as child_first_name, c.last_name as child_last_name,
             s.first_name as staff_first_name, s.last_name as staff_last_name
      FROM attendance a
      INNER JOIN children c ON a.child_id = c.id
      INNER JOIN users s ON a.staff_id = s.id
      WHERE a.child_id = ?
    `;
    let params = [childId];

    if (startDate) {
      sql += ' AND DATE(a.check_in_time) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND DATE(a.check_in_time) <= ?';
      params.push(endDate);
    }

    sql += ` ORDER BY a.check_in_time DESC LIMIT ${limit} OFFSET ${offset}`;
    // Ne pas ajouter limit et offset aux params

    const attendance = await dbQuery(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM attendance WHERE child_id = ?';
    let countParams = [childId];
    
    if (startDate) {
      countSql += ' AND DATE(check_in_time) >= ?';
      countParams.push(startDate);
    }
    
    if (endDate) {
      countSql += ' AND DATE(check_in_time) <= ?';
      countParams.push(endDate);
    }
    
    const countResult = await dbQuery(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      message: 'Présences de l\'enfant récupérées avec succès',
      child_id: childId,
      attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des présences de l\'enfant:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des présences de l\'enfant'
    });
  }
});

module.exports = router;
