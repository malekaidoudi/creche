const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/enrollments - Obtenir toutes les inscriptions
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']).withMessage('Statut invalide')
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
    
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT e.*, 
             u.first_name as parent_first_name, u.last_name as parent_last_name, u.email as parent_email,
             c.first_name as child_first_name, c.last_name as child_last_name, c.birth_date,
             (SELECT COUNT(*) FROM enrollment_documents ed WHERE ed.enrollment_id = e.id) as documents_count
      FROM enrollments e
      INNER JOIN users u ON e.parent_id = u.id
      INNER JOIN children c ON e.child_id = c.id
      WHERE 1=1
    `;
    let params = [];

    // Si l'utilisateur est un parent, ne montrer que ses inscriptions
    if (req.user.role === 'parent') {
      sql += ' AND e.parent_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }

    sql += ` ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    // Ne pas ajouter limit et offset aux params

    const enrollments = await dbQuery(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM enrollments e WHERE 1=1';
    let countParams = [];
    
    if (req.user.role === 'parent') {
      countSql += ' AND e.parent_id = ?';
      countParams.push(req.user.id);
    }
    
    if (status) {
      countSql += ' AND e.status = ?';
      countParams.push(status);
    }
    
    const countResult = await dbQuery(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      message: 'Inscriptions récupérées avec succès',
      enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des inscriptions'
    });
  }
});

// POST /api/enrollments/:id/documents - Attacher des documents à une inscription (staff seulement)
router.post('/:id/documents', [
  authenticateToken,
  requireStaff,
  body('documents')
    .isArray({ min: 1 })
    .withMessage('documents doit être un tableau non vide'),
  body('documents.*.document_type')
    .isIn(['CARNET_MEDICAL', 'ACTE_NAISSANCE', 'CERTIFICAT_MEDICAL'])
    .withMessage('Type de document invalide'),
  body('documents.*.upload_id')
    .isInt({ min: 1 })
    .withMessage('upload_id invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Données invalides', details: errors.array() });
    }

    const enrollmentId = parseInt(req.params.id);
    if (isNaN(enrollmentId)) {
      return res.status(400).json({ error: 'ID inscription invalide' });
    }

    // Vérifier l'inscription
    const exists = await dbQuery('SELECT id FROM enrollments WHERE id = ?', [enrollmentId]);
    if (exists.length === 0) {
      return res.status(404).json({ error: "Inscription non trouvée" });
    }

    const documents = req.body.documents || [];
    let inserted = 0;
    for (const doc of documents) {
      const { document_type, upload_id } = doc;
      const up = await dbQuery('SELECT id FROM uploads WHERE id = ?', [upload_id]);
      if (up.length === 0) continue;
      await dbQuery(
        'INSERT INTO enrollment_documents (enrollment_id, document_type, upload_id) VALUES (?, ?, ?)',
        [enrollmentId, document_type, upload_id]
      );
      inserted++;
    }

    res.status(201).json({ message: 'Documents attachés', count: inserted });
  } catch (error) {
    console.error('Erreur ajout documents inscription:', error);
    res.status(500).json({ error: "Erreur lors de l'ajout des documents" });
  }
});
// PUT /api/enrollments/:id/status - Mettre à jour uniquement le statut (staff seulement)
router.put('/:id/status', [
  authenticateToken,
  requireStaff,
  body('status')
    .exists()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Statut invalide')
], async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    if (isNaN(enrollmentId)) {
      return res.status(400).json({ error: 'ID inscription invalide' });
    }

    const { status } = req.body;
    const sql = 'UPDATE enrollments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await dbQuery(sql, [status, enrollmentId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }
    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

// GET /api/enrollments/:id - Obtenir une inscription par ID (avec documents)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    if (isNaN(enrollmentId)) {
      return res.status(400).json({ error: 'ID inscription invalide' });
    }

    const sql = `
      SELECT e.*, 
             u.first_name as parent_first_name, u.last_name as parent_last_name, u.email as parent_email, u.phone as parent_phone,
             c.first_name as child_first_name, c.last_name as child_last_name, c.birth_date, c.gender
      FROM enrollments e
      INNER JOIN users u ON e.parent_id = u.id
      INNER JOIN children c ON e.child_id = c.id
      WHERE e.id = ?
    `;
    const rows = await dbQuery(sql, [enrollmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    // Documents liés
    const docsSql = `
      SELECT ed.id, ed.document_type, up.filename, up.mimetype, up.size, up.created_at,
             CONCAT('/media/', up.filename) as url
      FROM enrollment_documents ed
      INNER JOIN uploads up ON ed.upload_id = up.id
      WHERE ed.enrollment_id = ?
      ORDER BY ed.created_at DESC
    `;
    const documents = await dbQuery(docsSql, [enrollmentId]);

    res.json({
      enrollment: rows[0],
      documents
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'inscription' });
  }
});

// POST /api/enrollments - Créer une nouvelle inscription
router.post('/', [
  authenticateToken,
  body('child_id')
    .isInt({ min: 1 })
    .withMessage('ID enfant invalide'),
  body('enrollment_date')
    .isISO8601()
    .withMessage('Date d\'inscription invalide (format YYYY-MM-DD)'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
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

    const { child_id, enrollment_date, notes } = req.body;
    const parent_id = req.user.role === 'parent' ? req.user.id : req.body.parent_id;

    if (!parent_id) {
      return res.status(400).json({
        error: 'ID parent requis'
      });
    }

    // Vérifier si l'enfant existe
    const childCheck = await dbQuery('SELECT id FROM children WHERE id = ? AND is_active = TRUE', [child_id]);
    if (childCheck.length === 0) {
      return res.status(404).json({
        error: 'Enfant non trouvé'
      });
    }

    // Vérifier si une inscription existe déjà
    const existingEnrollment = await dbQuery(
      'SELECT id FROM enrollments WHERE parent_id = ? AND child_id = ?',
      [parent_id, child_id]
    );
    
    if (existingEnrollment.length > 0) {
      return res.status(409).json({
        error: 'Une inscription existe déjà pour cet enfant et ce parent'
      });
    }

    const sql = `
      INSERT INTO enrollments (parent_id, child_id, enrollment_date, notes)
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await dbQuery(sql, [parent_id, child_id, enrollment_date, notes]);
    
    // Récupérer l'inscription créée
    const enrollmentSql = `
      SELECT e.*, 
             u.first_name as parent_first_name, u.last_name as parent_last_name,
             c.first_name as child_first_name, c.last_name as child_last_name
      FROM enrollments e
      INNER JOIN users u ON e.parent_id = u.id
      INNER JOIN children c ON e.child_id = c.id
      WHERE e.id = ?
    `;
    
    const enrollment = await dbQuery(enrollmentSql, [result.insertId]);

    res.status(201).json({
      message: 'Inscription créée avec succès',
      enrollment: enrollment[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'inscription:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'inscription'
    });
  }
});

// PUT /api/enrollments/:id - Mettre à jour une inscription (staff seulement)
router.put('/:id', [
  authenticateToken,
  requireStaff,
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Statut invalide'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
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

    const enrollmentId = parseInt(req.params.id);
    
    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        error: 'ID inscription invalide'
      });
    }

    const { status, notes } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée à mettre à jour'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(enrollmentId);

    const sql = `UPDATE enrollments SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await dbQuery(sql, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Inscription non trouvée'
      });
    }

    res.json({
      message: 'Inscription mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'inscription:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'inscription'
    });
  }
});

module.exports = router;
