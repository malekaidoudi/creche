const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db_postgres');

// GET /api/enrollments - Récupérer toutes les inscriptions
router.get('/', async (req, res) => {
  try {
    const { status, parent_id, child_id, page = 1, limit = 50 } = req.query;
    
    let sql = `
      SELECT e.id, e.parent_id, e.child_id, e.enrollment_date, e.status, 
             e.lunch_assistance, e.regulation_accepted, e.appointment_date, 
             e.appointment_time, e.admin_notes, e.created_at, e.updated_at,
             u.first_name as parent_first_name, u.last_name as parent_last_name, 
             u.email as parent_email, u.phone as parent_phone,
             c.first_name as child_first_name, c.last_name as child_last_name,
             c.birth_date as child_birth_date, c.gender as child_gender
      FROM enrollments e
      JOIN users u ON e.parent_id = u.id
      JOIN children c ON e.child_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    // Filtres
    if (status) {
      paramCount++;
      sql += ` AND e.status = $${paramCount}`;
      params.push(status);
    }
    
    if (parent_id) {
      paramCount++;
      sql += ` AND e.parent_id = $${paramCount}`;
      params.push(parent_id);
    }
    
    if (child_id) {
      paramCount++;
      sql += ` AND e.child_id = $${paramCount}`;
      params.push(child_id);
    }
    
    // Pagination
    sql += ` ORDER BY e.created_at DESC`;
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
      FROM enrollments e
      JOIN users u ON e.parent_id = u.id
      JOIN children c ON e.child_id = c.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;
    
    if (status) {
      countParamCount++;
      countSql += ` AND e.status = $${countParamCount}`;
      countParams.push(status);
    }
    
    if (parent_id) {
      countParamCount++;
      countSql += ` AND e.parent_id = $${countParamCount}`;
      countParams.push(parent_id);
    }
    
    if (child_id) {
      countParamCount++;
      countSql += ` AND e.child_id = $${countParamCount}`;
      countParams.push(child_id);
    }
    
    const countResult = await db.query(countSql, countParams);
    
    res.json({
      success: true,
      enrollments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération inscriptions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des inscriptions' 
    });
  }
});

// GET /api/enrollments/:id - Récupérer une inscription par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT e.id, e.parent_id, e.child_id, e.enrollment_date, e.status, 
              e.lunch_assistance, e.regulation_accepted, e.appointment_date, 
              e.appointment_time, e.admin_notes, e.created_at, e.updated_at,
              u.first_name as parent_first_name, u.last_name as parent_last_name, 
              u.email as parent_email, u.phone as parent_phone,
              c.first_name as child_first_name, c.last_name as child_last_name,
              c.birth_date as child_birth_date, c.gender as child_gender,
              c.medical_info as child_medical_info, 
              c.emergency_contact_name, c.emergency_contact_phone
       FROM enrollments e
       JOIN users u ON e.parent_id = u.id
       JOIN children c ON e.child_id = c.id
       WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Inscription non trouvée' 
      });
    }
    
    res.json({
      success: true,
      enrollment: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur récupération inscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'inscription' 
    });
  }
});

// POST /api/enrollments - Créer une nouvelle inscription
router.post('/', [
  body('parent_id').isInt().withMessage('ID parent requis'),
  body('child_id').isInt().withMessage('ID enfant requis'),
  body('enrollment_date').isISO8601().withMessage('Date d\'inscription invalide'),
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Statut invalide')
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
    
    const { 
      parent_id, 
      child_id, 
      enrollment_date, 
      status = 'pending', 
      lunch_assistance = false, 
      regulation_accepted = false, 
      appointment_date, 
      appointment_time, 
      admin_notes 
    } = req.body;
    
    // Vérifier si le parent existe
    const parentExists = await db.query('SELECT id FROM users WHERE id = $1 AND role = $2', [parent_id, 'parent']);
    if (parentExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Parent non trouvé' 
      });
    }
    
    // Vérifier si l'enfant existe
    const childExists = await db.query('SELECT id FROM children WHERE id = $1', [child_id]);
    if (childExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Enfant non trouvé' 
      });
    }
    
    // Vérifier s'il n'y a pas déjà une inscription pour cet enfant
    const existingEnrollment = await db.query(
      'SELECT id FROM enrollments WHERE child_id = $1 AND status IN ($2, $3)', 
      [child_id, 'pending', 'approved']
    );
    if (existingEnrollment.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Une inscription existe déjà pour cet enfant' 
      });
    }
    
    // Insérer la nouvelle inscription
    const result = await db.query(
      `INSERT INTO enrollments (parent_id, child_id, enrollment_date, status, 
                               lunch_assistance, regulation_accepted, appointment_date, 
                               appointment_time, admin_notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, parent_id, child_id, enrollment_date, status, 
                 lunch_assistance, regulation_accepted, appointment_date, 
                 appointment_time, admin_notes, created_at`,
      [parent_id, child_id, enrollment_date, status, lunch_assistance, 
       regulation_accepted, appointment_date, appointment_time, admin_notes]
    );
    
    res.status(201).json({
      success: true,
      message: 'Inscription créée avec succès',
      enrollment: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur création inscription:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création de l\'inscription' 
    });
  }
});

// PUT /api/enrollments/:id - Mettre à jour une inscription
router.put('/:id', [
  body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Statut invalide'),
  body('enrollment_date').optional().isISO8601().withMessage('Date d\'inscription invalide')
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
    
    const { id } = req.params;
    const { 
      enrollment_date, 
      status, 
      lunch_assistance, 
      regulation_accepted, 
      appointment_date, 
      appointment_time, 
      admin_notes 
    } = req.body;
    
    // Vérifier si l'inscription existe
    const existingEnrollment = await db.query('SELECT id FROM enrollments WHERE id = $1', [id]);
    if (existingEnrollment.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Inscription non trouvée' 
      });
    }
    
    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (enrollment_date !== undefined) {
      paramCount++;
      updates.push(`enrollment_date = $${paramCount}`);
      params.push(enrollment_date);
    }
    
    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }
    
    if (lunch_assistance !== undefined) {
      paramCount++;
      updates.push(`lunch_assistance = $${paramCount}`);
      params.push(lunch_assistance);
    }
    
    if (regulation_accepted !== undefined) {
      paramCount++;
      updates.push(`regulation_accepted = $${paramCount}`);
      params.push(regulation_accepted);
    }
    
    if (appointment_date !== undefined) {
      paramCount++;
      updates.push(`appointment_date = $${paramCount}`);
      params.push(appointment_date);
    }
    
    if (appointment_time !== undefined) {
      paramCount++;
      updates.push(`appointment_time = $${paramCount}`);
      params.push(appointment_time);
    }
    
    if (admin_notes !== undefined) {
      paramCount++;
      updates.push(`admin_notes = $${paramCount}`);
      params.push(admin_notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucune donnée à mettre à jour' 
      });
    }
    
    // Ajouter updated_at
    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());
    
    // Ajouter l'ID pour la clause WHERE
    paramCount++;
    params.push(id);
    
    const sql = `
      UPDATE enrollments 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, parent_id, child_id, enrollment_date, status, 
                lunch_assistance, regulation_accepted, appointment_date, 
                appointment_time, admin_notes, updated_at
    `;
    
    const result = await db.query(sql, params);
    
    res.json({
      success: true,
      message: 'Inscription mise à jour avec succès',
      enrollment: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur mise à jour inscription:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour de l\'inscription' 
    });
  }
});

// PUT /api/enrollments/:id/status - Changer le statut d'une inscription (approve/reject)
router.put('/:id/status', [
  body('status').isIn(['approved', 'rejected']).withMessage('Statut invalide'),
  body('admin_notes').optional().isString().withMessage('Notes admin invalides')
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
    
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    // Vérifier si l'inscription existe
    const existingEnrollment = await db.query('SELECT id, status FROM enrollments WHERE id = $1', [id]);
    if (existingEnrollment.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Inscription non trouvée' 
      });
    }
    
    // Mettre à jour le statut
    const result = await db.query(
      `UPDATE enrollments 
       SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, parent_id, child_id, status, admin_notes, updated_at`,
      [status, admin_notes, id]
    );
    
    res.json({
      success: true,
      message: `Inscription ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
      enrollment: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur changement statut inscription:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du changement de statut' 
    });
  }
});

// DELETE /api/enrollments/:id - Supprimer une inscription
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'inscription existe
    const existingEnrollment = await db.query('SELECT id FROM enrollments WHERE id = $1', [id]);
    if (existingEnrollment.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Inscription non trouvée' 
      });
    }
    
    // Supprimer l'inscription
    await db.query('DELETE FROM enrollments WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Inscription supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression inscription:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression de l\'inscription' 
    });
  }
});

// GET /api/enrollments/stats - Statistiques des inscriptions
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_enrollments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_enrollments,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_enrollments,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_enrollments,
        COUNT(*) FILTER (WHERE lunch_assistance = true) as with_lunch,
        COUNT(*) FILTER (WHERE regulation_accepted = true) as regulation_accepted_count
      FROM enrollments
    `);
    
    res.json({
      success: true,
      stats: stats.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur statistiques inscriptions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

module.exports = router;
