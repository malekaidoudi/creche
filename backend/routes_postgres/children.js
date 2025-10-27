const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db_postgres');

// GET /api/children/available - Enfants disponibles (sans parent)
router.get('/available', async (req, res) => {
  try {
    const sql = `
      SELECT c.id, c.first_name, c.last_name, c.birth_date, c.gender, 
             c.medical_info, c.emergency_contact_name, c.emergency_contact_phone, 
             c.photo_url, c.is_active, c.created_at,
             EXTRACT(YEAR FROM AGE(c.birth_date)) as age
      FROM children c
      LEFT JOIN enrollments e ON c.id = e.child_id
      WHERE c.is_active = true AND (e.id IS NULL OR e.status != 'approved')
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(sql);
    
    res.json({
      success: true,
      children: result.rows
    });
  } catch (error) {
    console.error('Erreur enfants disponibles:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des enfants disponibles' 
    });
  }
});

// GET /api/children/orphans - Enfants orphelins (sans parent)
router.get('/orphans', async (req, res) => {
  try {
    const sql = `
      SELECT c.id, c.first_name, c.last_name, c.birth_date, c.gender, 
             c.medical_info, c.emergency_contact_name, c.emergency_contact_phone, 
             c.photo_url, c.is_active, c.created_at,
             EXTRACT(YEAR FROM AGE(c.birth_date)) as age
      FROM children c
      LEFT JOIN enrollments e ON c.id = e.child_id
      WHERE c.is_active = true AND e.id IS NULL
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(sql);
    
    res.json({
      success: true,
      children: result.rows
    });
  } catch (error) {
    console.error('Erreur enfants orphelins:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des enfants orphelins' 
    });
  }
});

// GET /api/children/parent/:parentId - Enfants d'un parent spécifique
router.get('/parent/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const sql = `
      SELECT c.id, c.first_name, c.last_name, c.birth_date, c.gender, 
             c.medical_info, c.emergency_contact_name, c.emergency_contact_phone, 
             c.photo_url, c.is_active, c.created_at,
             e.status as enrollment_status,
             EXTRACT(YEAR FROM AGE(c.birth_date)) as age
      FROM children c
      JOIN enrollments e ON c.id = e.child_id
      WHERE e.parent_id = $1 AND c.is_active = true
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(sql, [parentId]);
    
    res.json({
      success: true,
      children: result.rows
    });
  } catch (error) {
    console.error('Erreur enfants du parent:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des enfants du parent' 
    });
  }
});

// GET /api/children/stats - Statistiques des enfants
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_children,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_children,
        COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_count,
        AVG(EXTRACT(YEAR FROM AGE(birth_date))) as average_age
      FROM children
    `;
    
    const result = await db.query(statsQuery);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      stats: {
        total: parseInt(stats.total_children),
        active: parseInt(stats.active_children),
        male: parseInt(stats.male_count),
        female: parseInt(stats.female_count),
        averageAge: parseFloat(stats.average_age) || 0
      }
    });
  } catch (error) {
    console.error('Erreur statistiques enfants:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// PUT /api/children/:id/associate-parent - Associer un enfant à un parent
router.put('/:id/associate-parent', async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;
    
    // Créer ou mettre à jour l'inscription
    const sql = `
      INSERT INTO enrollments (child_id, parent_id, status, created_at)
      VALUES ($1, $2, 'approved', NOW())
      ON CONFLICT (child_id) 
      DO UPDATE SET parent_id = $2, status = 'approved', updated_at = NOW()
      RETURNING *
    `;
    
    const result = await db.query(sql, [id, parentId]);
    
    res.json({
      success: true,
      enrollment: result.rows[0],
      message: 'Enfant associé au parent avec succès'
    });
  } catch (error) {
    console.error('Erreur association enfant-parent:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'association enfant-parent' 
    });
  }
});

// PUT /api/children/:id/deactivate-parent - Désactiver le compte parent d'un enfant
router.put('/:id/deactivate-parent', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Désactiver l'inscription
    const sql = `
      UPDATE enrollments 
      SET status = 'rejected', updated_at = NOW()
      WHERE child_id = $1
      RETURNING *
    `;
    
    const result = await db.query(sql, [id]);
    
    res.json({
      success: true,
      message: 'Compte parent désactivé avec succès'
    });
  } catch (error) {
    console.error('Erreur désactivation parent:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la désactivation du parent' 
    });
  }
});

// GET /api/children/unassociated - Enfants non associés (route spécifique avant la route générale)
router.get('/unassociated', async (req, res) => {
  try {
    res.json({
      success: true,
      children: [],
      message: 'Fonction en développement'
    });
  } catch (error) {
    console.error('Erreur enfants non associés:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des enfants non associés' 
    });
  }
});

// GET /api/children - Récupérer tous les enfants
router.get('/', async (req, res) => {
  try {
    const { active, search, gender, age_min, age_max, page = 1, limit = 50 } = req.query;
    
    let sql = `
      SELECT id, first_name, last_name, birth_date, gender, medical_info, 
             emergency_contact_name, emergency_contact_phone, photo_url, 
             is_active, created_at, updated_at,
             EXTRACT(YEAR FROM AGE(birth_date)) as age
      FROM children 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    // Filtres
    if (active !== undefined) {
      paramCount++;
      sql += ` AND is_active = $${paramCount}`;
      params.push(active === 'true');
    }
    
    if (search) {
      paramCount++;
      sql += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (gender) {
      paramCount++;
      sql += ` AND gender = $${paramCount}`;
      params.push(gender);
    }
    
    if (age_min) {
      paramCount++;
      sql += ` AND EXTRACT(YEAR FROM AGE(birth_date)) >= $${paramCount}`;
      params.push(parseInt(age_min));
    }
    
    if (age_max) {
      paramCount++;
      sql += ` AND EXTRACT(YEAR FROM AGE(birth_date)) <= $${paramCount}`;
      params.push(parseInt(age_max));
    }
    
    // Pagination
    sql += ` ORDER BY first_name, last_name`;
    const offset = (page - 1) * limit;
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);
    
    const result = await db.query(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM children WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;
    
    if (active !== undefined) {
      countParamCount++;
      countSql += ` AND is_active = $${countParamCount}`;
      countParams.push(active === 'true');
    }
    
    if (search) {
      countParamCount++;
      countSql += ` AND (first_name ILIKE $${countParamCount} OR last_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }
    
    if (gender) {
      countParamCount++;
      countSql += ` AND gender = $${countParamCount}`;
      countParams.push(gender);
    }
    
    if (age_min) {
      countParamCount++;
      countSql += ` AND EXTRACT(YEAR FROM AGE(birth_date)) >= $${countParamCount}`;
      countParams.push(parseInt(age_min));
    }
    
    if (age_max) {
      countParamCount++;
      countSql += ` AND EXTRACT(YEAR FROM AGE(birth_date)) <= $${countParamCount}`;
      countParams.push(parseInt(age_max));
    }
    
    const countResult = await db.query(countSql, countParams);
    
    res.json({
      success: true,
      children: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération enfants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des enfants' 
    });
  }
});

// GET /api/children/:id - Récupérer un enfant par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT id, first_name, last_name, birth_date, gender, medical_info, 
              emergency_contact_name, emergency_contact_phone, photo_url, 
              is_active, created_at, updated_at,
              EXTRACT(YEAR FROM AGE(birth_date)) as age
       FROM children WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Enfant non trouvé' 
      });
    }
    
    // Récupérer les inscriptions de cet enfant
    const enrollments = await db.query(
      `SELECT e.*, u.first_name as parent_first_name, u.last_name as parent_last_name, u.email as parent_email
       FROM enrollments e
       JOIN users u ON e.parent_id = u.id
       WHERE e.child_id = $1
       ORDER BY e.created_at DESC`,
      [id]
    );
    
    // Récupérer les présences récentes
    const attendance = await db.query(
      `SELECT date, check_in_time, check_out_time, notes
       FROM attendance 
       WHERE child_id = $1 
       ORDER BY date DESC 
       LIMIT 10`,
      [id]
    );
    
    res.json({
      success: true,
      child: {
        ...result.rows[0],
        enrollments: enrollments.rows,
        recent_attendance: attendance.rows
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération enfant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'enfant' 
    });
  }
});

// POST /api/children - Créer un nouvel enfant
router.post('/', [
  body('first_name').notEmpty().withMessage('Prénom requis'),
  body('last_name').notEmpty().withMessage('Nom requis'),
  body('birth_date').isISO8601().withMessage('Date de naissance invalide'),
  body('gender').isIn(['male', 'female']).withMessage('Genre invalide')
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
      first_name, 
      last_name, 
      birth_date, 
      gender, 
      medical_info, 
      emergency_contact_name, 
      emergency_contact_phone, 
      photo_url 
    } = req.body;
    
    // Insérer le nouvel enfant
    const result = await db.query(
      `INSERT INTO children (first_name, last_name, birth_date, gender, medical_info, 
                            emergency_contact_name, emergency_contact_phone, photo_url, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, first_name, last_name, birth_date, gender, medical_info, 
                 emergency_contact_name, emergency_contact_phone, photo_url, 
                 is_active, created_at`,
      [first_name, last_name, birth_date, gender, medical_info, 
       emergency_contact_name, emergency_contact_phone, photo_url, true]
    );
    
    res.status(201).json({
      success: true,
      message: 'Enfant créé avec succès',
      child: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur création enfant:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création de l\'enfant' 
    });
  }
});

// PUT /api/children/:id - Mettre à jour un enfant
router.put('/:id', [
  body('first_name').optional().notEmpty().withMessage('Prénom requis'),
  body('last_name').optional().notEmpty().withMessage('Nom requis'),
  body('birth_date').optional().isISO8601().withMessage('Date de naissance invalide'),
  body('gender').optional().isIn(['male', 'female']).withMessage('Genre invalide')
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
      first_name, 
      last_name, 
      birth_date, 
      gender, 
      medical_info, 
      emergency_contact_name, 
      emergency_contact_phone, 
      photo_url, 
      is_active 
    } = req.body;
    
    // Vérifier si l'enfant existe
    const existingChild = await db.query('SELECT id FROM children WHERE id = $1', [id]);
    if (existingChild.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Enfant non trouvé' 
      });
    }
    
    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (first_name !== undefined) {
      paramCount++;
      updates.push(`first_name = $${paramCount}`);
      params.push(first_name);
    }
    
    if (last_name !== undefined) {
      paramCount++;
      updates.push(`last_name = $${paramCount}`);
      params.push(last_name);
    }
    
    if (birth_date !== undefined) {
      paramCount++;
      updates.push(`birth_date = $${paramCount}`);
      params.push(birth_date);
    }
    
    if (gender !== undefined) {
      paramCount++;
      updates.push(`gender = $${paramCount}`);
      params.push(gender);
    }
    
    if (medical_info !== undefined) {
      paramCount++;
      updates.push(`medical_info = $${paramCount}`);
      params.push(medical_info);
    }
    
    if (emergency_contact_name !== undefined) {
      paramCount++;
      updates.push(`emergency_contact_name = $${paramCount}`);
      params.push(emergency_contact_name);
    }
    
    if (emergency_contact_phone !== undefined) {
      paramCount++;
      updates.push(`emergency_contact_phone = $${paramCount}`);
      params.push(emergency_contact_phone);
    }
    
    if (photo_url !== undefined) {
      paramCount++;
      updates.push(`photo_url = $${paramCount}`);
      params.push(photo_url);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
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
      UPDATE children 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, first_name, last_name, birth_date, gender, medical_info, 
                emergency_contact_name, emergency_contact_phone, photo_url, 
                is_active, updated_at
    `;
    
    const result = await db.query(sql, params);
    
    res.json({
      success: true,
      message: 'Enfant mis à jour avec succès',
      child: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur mise à jour enfant:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour de l\'enfant' 
    });
  }
});

// DELETE /api/children/:id - Supprimer un enfant (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'enfant existe
    const existingChild = await db.query('SELECT id, first_name, last_name FROM children WHERE id = $1', [id]);
    if (existingChild.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Enfant non trouvé' 
      });
    }
    
    // Soft delete - désactiver l'enfant
    await db.query(
      'UPDATE children SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Enfant désactivé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression enfant:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression de l\'enfant' 
    });
  }
});

// GET /api/children/stats - Statistiques des enfants
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_children,
        COUNT(*) FILTER (WHERE is_active = true) as active_children,
        COUNT(*) FILTER (WHERE gender = 'male') as boys,
        COUNT(*) FILTER (WHERE gender = 'female') as girls,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(birth_date)) < 2) as babies,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(birth_date)) BETWEEN 2 AND 3) as toddlers,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM AGE(birth_date)) > 3) as preschoolers
      FROM children
    `);
    
    res.json({
      success: true,
      stats: stats.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur statistiques enfants:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

module.exports = router;
