const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db_postgres');

// GET /api/attendance/today - Présences d'aujourd'hui
router.get('/today', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT a.id, a.child_id, a.date, a.check_in_time, a.check_out_time, 
             a.notes, a.created_at, a.updated_at,
             c.first_name as child_first_name, c.last_name as child_last_name,
             c.birth_date as child_birth_date, c.gender as child_gender
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE a.date = $1
      ORDER BY a.check_in_time DESC
      LIMIT $2 OFFSET $3
    `;
    
    const offset = (page - 1) * limit;
    const result = await db.query(sql, [today, limit, offset]);
    
    res.json({
      success: true,
      attendance: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Erreur présences aujourd\'hui:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des présences d\'aujourd\'hui' 
    });
  }
});

// GET /api/attendance/currently-present - Enfants actuellement présents
router.get('/currently-present', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT a.id, a.child_id, a.check_in_time, a.notes,
             c.first_name as child_first_name, c.last_name as child_last_name,
             c.birth_date as child_birth_date, c.gender as child_gender
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE a.date = $1 AND a.check_in_time IS NOT NULL AND a.check_out_time IS NULL
      ORDER BY a.check_in_time DESC
    `;
    
    const result = await db.query(sql, [today]);
    
    res.json({
      success: true,
      present: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Erreur enfants présents:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des enfants présents' 
    });
  }
});

// GET /api/attendance/stats - Statistiques de présence
router.get('/stats', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Statistiques de base
    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as present_count,
        COUNT(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN 1 END) as completed_count,
        COUNT(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NULL THEN 1 END) as still_present_count
      FROM attendance 
      WHERE date = $1
    `;
    
    const statsResult = await db.query(statsQuery, [targetDate]);
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      stats: {
        date: targetDate,
        total: parseInt(stats.total_records),
        present: parseInt(stats.present_count),
        completed: parseInt(stats.completed_count),
        stillPresent: parseInt(stats.still_present_count),
        absent: 0 // À calculer selon le nombre total d'enfants inscrits
      }
    });
  } catch (error) {
    console.error('Erreur statistiques présence:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// GET /api/attendance/report - Rapport de présence (route spécifique avant la route générale)
router.get('/report', async (req, res) => {
  try {
    res.json({
      success: true,
      report: {
        totalPresences: 0,
        totalAbsences: 0,
        averageAttendance: 0
      },
      data: [],
      message: 'Fonction en développement'
    });
  } catch (error) {
    console.error('Erreur rapport présence:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération du rapport de présence' 
    });
  }
});

// GET /api/attendance - Récupérer toutes les présences
router.get('/', async (req, res) => {
  try {
    const { child_id, date, start_date, end_date, page = 1, limit = 50 } = req.query;
    
    let sql = `
      SELECT a.id, a.child_id, a.date, a.check_in_time, a.check_out_time, 
             a.notes, a.created_at, a.updated_at,
             c.first_name as child_first_name, c.last_name as child_last_name,
             c.birth_date as child_birth_date, c.gender as child_gender
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    // Filtres
    if (child_id) {
      paramCount++;
      sql += ` AND a.child_id = $${paramCount}`;
      params.push(child_id);
    }
    
    if (date) {
      paramCount++;
      sql += ` AND a.date = $${paramCount}`;
      params.push(date);
    }
    
    if (start_date) {
      paramCount++;
      sql += ` AND a.date >= $${paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      paramCount++;
      sql += ` AND a.date <= $${paramCount}`;
      params.push(end_date);
    }
    
    // Pagination
    sql += ` ORDER BY a.date DESC, a.check_in_time DESC`;
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
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;
    
    if (child_id) {
      countParamCount++;
      countSql += ` AND a.child_id = $${countParamCount}`;
      countParams.push(child_id);
    }
    
    if (date) {
      countParamCount++;
      countSql += ` AND a.date = $${countParamCount}`;
      countParams.push(date);
    }
    
    if (start_date) {
      countParamCount++;
      countSql += ` AND a.date >= $${countParamCount}`;
      countParams.push(start_date);
    }
    
    if (end_date) {
      countParamCount++;
      countSql += ` AND a.date <= $${countParamCount}`;
      countParams.push(end_date);
    }
    
    const countResult = await db.query(countSql, countParams);
    
    res.json({
      success: true,
      attendance: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération présences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des présences' 
    });
  }
});

// Routes spéciales AVANT /:id pour éviter les conflits
// GET /api/attendance/today - Présences d'aujourd'hui
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { page = 1, limit = 50 } = req.query;
    
    const result = await db.query(
      `SELECT a.id, a.child_id, a.date, a.check_in_time, a.check_out_time, 
              a.notes, a.created_at, a.updated_at,
              c.first_name as child_first_name, c.last_name as child_last_name,
              c.birth_date as child_birth_date, c.gender as child_gender
       FROM attendance a
       JOIN children c ON a.child_id = c.id
       WHERE a.date = $1
       ORDER BY a.check_in_time DESC
       LIMIT $2 OFFSET $3`,
      [today, limit, (page - 1) * limit]
    );
    
    res.json({
      success: true,
      attendance: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération présences aujourd\'hui:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des présences d\'aujourd\'hui' 
    });
  }
});

// GET /api/attendance/stats - Statistiques de présence
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_today,
        COUNT(CASE WHEN check_out_time IS NULL THEN 1 END) as currently_present,
        COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as checked_out
       FROM attendance 
       WHERE date = $1`,
      [today]
    );
    
    res.json({
      success: true,
      stats: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// GET /api/attendance/currently-present - Enfants actuellement présents
router.get('/currently-present', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(
      `SELECT a.id, a.child_id, a.date, a.check_in_time, a.check_out_time, 
              a.notes, a.created_at, a.updated_at,
              c.first_name as child_first_name, c.last_name as child_last_name,
              c.birth_date as child_birth_date, c.gender as child_gender
       FROM attendance a
       JOIN children c ON a.child_id = c.id
       WHERE a.date = $1 AND a.check_out_time IS NULL
       ORDER BY a.check_in_time DESC`,
      [today]
    );
    
    res.json({
      success: true,
      currently_present: result.rows
    });
    
  } catch (error) {
    console.error('Erreur récupération présents:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des présents' 
    });
  }
});

// GET /api/attendance/date/:date - Présences par date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await db.query(
      `SELECT a.id, a.child_id, a.date, a.check_in_time, a.check_out_time, 
              a.notes, a.created_at, a.updated_at,
              c.first_name as child_first_name, c.last_name as child_last_name,
              c.birth_date as child_birth_date, c.gender as child_gender
       FROM attendance a
       JOIN children c ON a.child_id = c.id
       WHERE a.date = $1
       ORDER BY a.check_in_time DESC
       LIMIT $2 OFFSET $3`,
      [date, limit, (page - 1) * limit]
    );
    
    res.json({
      success: true,
      attendance: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération présences par date:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des présences par date' 
    });
  }
});

// GET /api/attendance/:id - Récupérer une présence par ID (APRÈS les routes spéciales)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT a.id, a.child_id, a.date, a.check_in_time, a.check_out_time, 
              a.notes, a.created_at, a.updated_at,
              c.first_name as child_first_name, c.last_name as child_last_name,
              c.birth_date as child_birth_date, c.gender as child_gender
       FROM attendance a
       JOIN children c ON a.child_id = c.id
       WHERE a.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Présence non trouvée' 
      });
    }
    
    res.json({
      success: true,
      attendance: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur récupération présence:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la présence' 
    });
  }
});

// POST /api/attendance - Créer une nouvelle présence (check-in)
router.post('/', [
  body('child_id').isInt().withMessage('ID enfant requis'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('check_in_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure d\'arrivée invalide (HH:MM)')
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
    
    const { child_id, date, check_in_time, notes } = req.body;
    
    // Vérifier si l'enfant existe
    const childExists = await db.query('SELECT id FROM children WHERE id = $1 AND is_active = TRUE', [child_id]);
    if (childExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Enfant non trouvé ou inactif' 
      });
    }
    
    // Vérifier s'il n'y a pas déjà une présence pour cet enfant à cette date
    const existingAttendance = await db.query(
      'SELECT id FROM attendance WHERE child_id = $1 AND date = $2', 
      [child_id, date]
    );
    if (existingAttendance.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Une présence existe déjà pour cet enfant à cette date' 
      });
    }
    
    // Insérer la nouvelle présence
    const result = await db.query(
      `INSERT INTO attendance (child_id, date, check_in_time, notes) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, child_id, date, check_in_time, notes, created_at`,
      [child_id, date, check_in_time, notes]
    );
    
    res.status(201).json({
      success: true,
      message: 'Arrivée enregistrée avec succès',
      attendance: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur création présence:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'enregistrement de l\'arrivée' 
    });
  }
});

// PUT /api/attendance/:id/checkout - Enregistrer le départ (check-out)
router.put('/:id/checkout', [
  body('check_out_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure de départ invalide (HH:MM)')
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
    const { check_out_time, notes } = req.body;
    
    // Vérifier si la présence existe et n'a pas déjà de check-out
    const existingAttendance = await db.query(
      'SELECT id, check_in_time, check_out_time FROM attendance WHERE id = $1', 
      [id]
    );
    if (existingAttendance.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Présence non trouvée' 
      });
    }
    
    if (existingAttendance.rows[0].check_out_time) {
      return res.status(409).json({ 
        success: false,
        error: 'Le départ a déjà été enregistré pour cette présence' 
      });
    }
    
    // Vérifier que l'heure de départ est après l'heure d'arrivée
    const checkInTime = existingAttendance.rows[0].check_in_time;
    if (check_out_time <= checkInTime) {
      return res.status(400).json({ 
        success: false,
        error: 'L\'heure de départ doit être après l\'heure d\'arrivée' 
      });
    }
    
    // Mettre à jour avec l'heure de départ
    const result = await db.query(
      `UPDATE attendance 
       SET check_out_time = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, child_id, date, check_in_time, check_out_time, notes, updated_at`,
      [check_out_time, notes, id]
    );
    
    res.json({
      success: true,
      message: 'Départ enregistré avec succès',
      attendance: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur enregistrement départ:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'enregistrement du départ' 
    });
  }
});

// PUT /api/attendance/:id - Mettre à jour une présence
router.put('/:id', [
  body('check_in_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure d\'arrivée invalide (HH:MM)'),
  body('check_out_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure de départ invalide (HH:MM)')
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
    const { check_in_time, check_out_time, notes } = req.body;
    
    // Vérifier si la présence existe
    const existingAttendance = await db.query('SELECT id FROM attendance WHERE id = $1', [id]);
    if (existingAttendance.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Présence non trouvée' 
      });
    }
    
    // Vérifier la cohérence des heures si les deux sont fournies
    if (check_in_time && check_out_time && check_out_time <= check_in_time) {
      return res.status(400).json({ 
        success: false,
        error: 'L\'heure de départ doit être après l\'heure d\'arrivée' 
      });
    }
    
    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (check_in_time !== undefined) {
      paramCount++;
      updates.push(`check_in_time = $${paramCount}`);
      params.push(check_in_time);
    }
    
    if (check_out_time !== undefined) {
      paramCount++;
      updates.push(`check_out_time = $${paramCount}`);
      params.push(check_out_time);
    }
    
    if (notes !== undefined) {
      paramCount++;
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
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
      UPDATE attendance 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, child_id, date, check_in_time, check_out_time, notes, updated_at
    `;
    
    const result = await db.query(sql, params);
    
    res.json({
      success: true,
      message: 'Présence mise à jour avec succès',
      attendance: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur mise à jour présence:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour de la présence' 
    });
  }
});

// DELETE /api/attendance/:id - Supprimer une présence
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la présence existe
    const existingAttendance = await db.query('SELECT id FROM attendance WHERE id = $1', [id]);
    if (existingAttendance.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Présence non trouvée' 
      });
    }
    
    // Supprimer la présence
    await db.query('DELETE FROM attendance WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Présence supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression présence:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression de la présence' 
    });
  }
});

// GET /api/attendance/child/:child_id/calendar - Calendrier de présence d'un enfant
router.get('/child/:child_id/calendar', async (req, res) => {
  try {
    const { child_id } = req.params;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false,
        error: 'Année et mois requis' 
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
    
    // Récupérer les présences du mois
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    const result = await db.query(
      `SELECT date, check_in_time, check_out_time, notes
       FROM attendance 
       WHERE child_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date`,
      [child_id, startDate, endDate]
    );
    
    res.json({
      success: true,
      child_id: parseInt(child_id),
      year: parseInt(year),
      month: parseInt(month),
      attendance: result.rows
    });
    
  } catch (error) {
    console.error('Erreur calendrier présence:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération du calendrier' 
    });
  }
});

// GET /api/attendance/stats - Statistiques des présences
router.get('/stats/overview', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramCount = 0;
    
    if (start_date) {
      paramCount++;
      dateFilter += ` AND date >= $${paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      paramCount++;
      dateFilter += ` AND date <= $${paramCount}`;
      params.push(end_date);
    }
    
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_attendance,
        COUNT(*) FILTER (WHERE check_out_time IS NOT NULL) as completed_attendance,
        COUNT(*) FILTER (WHERE check_out_time IS NULL) as ongoing_attendance,
        COUNT(DISTINCT child_id) as unique_children,
        COUNT(DISTINCT date) as unique_days,
        AVG(EXTRACT(EPOCH FROM (check_out_time::time - check_in_time::time))/3600) as avg_hours_per_day
      FROM attendance
      WHERE 1=1 ${dateFilter}
    `, params);
    
    res.json({
      success: true,
      stats: stats.rows[0],
      period: { start_date, end_date }
    });
    
  } catch (error) {
    console.error('Erreur statistiques présences:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

module.exports = router;
