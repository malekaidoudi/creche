const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

// GET /api/attendance/today - Présences d'aujourd'hui
router.get('/today', auth.authenticateToken, async (req, res) => {
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

// GET /api/attendance/child/:id/month - Présences d'un enfant pour un mois
router.get('/child/:id/month', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Année et mois requis'
      });
    }

    // Construire les dates de début et fin du mois
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

    const result = await db.query(
      `SELECT 
        a.id,
        a.child_id,
        a.date,
        a.check_in_time,
        a.check_out_time,
        a.notes,
        a.created_at
       FROM attendance a
       WHERE a.child_id = $1 
       AND a.date >= $2 
       AND a.date <= $3
       ORDER BY a.date ASC`,
      [id, startDate, endDate]
    );

    res.json({
      success: true,
      attendance: result.rows,
      child_id: parseInt(id),
      year: parseInt(year),
      month: parseInt(month)
    });

  } catch (error) {
    console.error('Erreur présences enfant mois:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des présences'
    });
  }
});

// GET /api/attendance/currently-present - Enfants actuellement présents
router.get('/currently-present', auth.authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const sql = `
      SELECT a.id as attendance_id, a.child_id, a.check_in_time, a.notes,
             c.id, c.first_name, c.last_name,
             c.birth_date, c.gender
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE a.date = $1 AND a.check_in_time IS NOT NULL AND a.check_out_time IS NULL
      ORDER BY a.check_in_time DESC
    `;

    const result = await db.query(sql, [today]);

    res.json({
      success: true,
      children: result.rows,
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
router.get('/stats', auth.authenticateToken, async (req, res) => {
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

// GET /api/attendance/date/:date - Présences pour une date spécifique
router.get('/date/:date', auth.authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { page = 1, limit = 100 } = req.query;

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
    const result = await db.query(sql, [date, limit, offset]);

    res.json({
      success: true,
      attendances: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Erreur présences par date:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des présences'
    });
  }
});

// GET /api/attendance/report - Rapport de présence (route spécifique avant la route générale)
router.get('/report', auth.authenticateToken, async (req, res) => {
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
router.get('/', auth.authenticateToken, async (req, res) => {
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



// GET /api/attendance/:id - Récupérer une présence par ID
router.get('/:id', auth.authenticateToken, async (req, res) => {
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

// GET /api/attendance/stats/overview - Statistiques des présences
router.get('/stats/overview', auth.authenticateToken, async (req, res) => {
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

// POST /api/attendance/check-in - Enregistrer une arrivée
router.post('/check-in', auth.authenticateToken, auth.requirePermission('attendance.manage'), async (req, res) => {
  try {
    const { child_id, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Vérifier si l'enfant existe
    const childCheck = await db.query('SELECT id FROM children WHERE id = $1 AND is_active = true', [child_id]);
    if (childCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }

    // Vérifier s'il y a déjà un check-in aujourd'hui
    const existing = await db.query(
      'SELECT id, check_in_time FROM attendance WHERE child_id = $1 AND date = $2',
      [child_id, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].check_in_time) {
      return res.status(400).json({ success: false, error: 'L\'enfant est déjà arrivé aujourd\'hui' });
    }

    // Créer ou mettre à jour l'enregistrement
    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE attendance SET check_in_time = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [now, notes, existing.rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO attendance (child_id, date, check_in_time, notes) VALUES ($1, $2, $3, $4)',
        [child_id, today, now, notes]
      );
    }

    res.json({ success: true, message: 'Arrivée enregistrée avec succès' });
  } catch (error) {
    console.error('Erreur check-in:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement de l\'arrivée' });
  }
});

// POST /api/attendance/check-out - Enregistrer un départ
router.post('/check-out', auth.authenticateToken, auth.requirePermission('attendance.manage'), async (req, res) => {
  try {
    const { child_id, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Vérifier s'il y a un check-in aujourd'hui
    const existing = await db.query(
      'SELECT id, check_in_time, check_out_time FROM attendance WHERE child_id = $1 AND date = $2',
      [child_id, today]
    );

    if (existing.rows.length === 0 || !existing.rows[0].check_in_time) {
      return res.status(400).json({ success: false, error: 'L\'enfant n\'est pas encore arrivé aujourd\'hui' });
    }

    if (existing.rows[0].check_out_time) {
      return res.status(400).json({ success: false, error: 'Le départ a déjà été enregistré' });
    }

    // Mettre à jour avec le check-out
    await db.query(
      'UPDATE attendance SET check_out_time = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [now, notes, existing.rows[0].id]
    );

    res.json({ success: true, message: 'Départ enregistré avec succès' });
  } catch (error) {
    console.error('Erreur check-out:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement du départ' });
  }
});

// GET /api/attendance/child/:id/calendar - Calendrier de présence avec jours de fermeture
router.get('/child/:id/calendar', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Année et mois requis'
      });
    }

    // Construire les dates de début et fin du mois
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

    // 1. Récupérer les présences de l'enfant pour ce mois
    const attendanceResult = await db.query(
      `SELECT 
        a.id,
        a.date,
        a.check_in_time,
        a.check_out_time,
        a.notes
       FROM attendance a
       WHERE a.child_id = $1 
       AND a.date >= $2 
       AND a.date <= $3
       ORDER BY a.date ASC`,
      [id, startDate, endDate]
    );

    // 2. Récupérer les jours fériés (holidays) pour ce mois
    const holidaysResult = await db.query(
      `SELECT date, name, is_closed
       FROM holidays
       WHERE date >= $1 AND date <= $2 AND is_closed = TRUE
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    // 3. Récupérer les paramètres (samedi ouvert, vacances annuelles)
    let settingsResult;
    try {
      settingsResult = await db.query(
        `SELECT setting_key, value_fr
         FROM nursery_settings
         WHERE setting_key IN ('saturday_open', 'opening_hours')`
      );
    } catch (e) {
      console.error('Erreur récupération settings:', e);
      settingsResult = { rows: [] };
    }

    // Parser les settings
    let saturdayOpen = false;

    settingsResult.rows.forEach(row => {
      if (row.setting_key === 'saturday_open') {
        saturdayOpen = row.value_fr === 'true' || row.value_fr === '1';
      }
    });

    // 4. Construire le calendrier avec statuts
    const calendar = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = dimanche, 6 = samedi

      let status = 'unknown'; // unknown, present, absent, closed
      let checkIn = null;
      let checkOut = null;
      let closedReason = null;

      // Vérifier si c'est un dimanche (toujours fermé)
      if (dayOfWeek === 0) {
        status = 'closed';
        closedReason = 'Dimanche';
      }
      // Vérifier si c'est un samedi et si la crèche est fermée le samedi
      else if (dayOfWeek === 6 && !saturdayOpen) {
        status = 'closed';
        closedReason = 'Samedi';
      }
      // Vérifier les jours fériés
      else {
        const holiday = holidaysResult.rows.find(h => {
          // Convertir la date de la DB en format local YYYY-MM-DD
          const dbDate = new Date(h.date);
          const hDate = `${dbDate.getFullYear()}-${String(dbDate.getMonth() + 1).padStart(2, '0')}-${String(dbDate.getDate()).padStart(2, '0')}`;
          return hDate === dateStr;
        });

        if (holiday) {
          status = 'closed';
          closedReason = holiday.name;
        }
      }

      // Si pas fermé, vérifier la présence
      if (status !== 'closed') {
        const attendance = attendanceResult.rows.find(a => {
          // Convertir la date de la DB en format local YYYY-MM-DD
          const dbDate = new Date(a.date);
          const aDate = `${dbDate.getFullYear()}-${String(dbDate.getMonth() + 1).padStart(2, '0')}-${String(dbDate.getDate()).padStart(2, '0')}`;
          return aDate === dateStr;
        });

        if (attendance) {
          if (attendance.check_in_time) {
            status = 'present';
            checkIn = attendance.check_in_time;
            checkOut = attendance.check_out_time;
          } else {
            status = 'absent';
          }
        } else {
          // Pas d'enregistrement - si c'est dans le passé, c'est absent
          if (date < today) {
            status = 'absent';
          } else {
            status = 'unknown'; // Futur
          }
        }
      }

      calendar.push({
        date: dateStr,
        day,
        dayOfWeek,
        status,
        checkIn,
        checkOut,
        closedReason
      });
    }

    res.json({
      success: true,
      calendar,
      child_id: parseInt(id),
      year: parseInt(year),
      month: parseInt(month),
      settings: {
        saturdayOpen
      }
    });

  } catch (error) {
    console.error('Erreur calendrier présence:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du calendrier'
    });
  }
});

module.exports = router;
