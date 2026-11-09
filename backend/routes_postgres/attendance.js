const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');
const { autoCloseExpiredAttendances } = require('../services/attendanceAutoCheckoutService');
const pushNotificationService = require('../services/pushNotificationService');

/**
 * Récupère le mode de pointage configuré dans nursery_settings ('hourly' ou 'daily')
 */
const getAttendanceMode = async () => {
  try {
    const res = await db.query("SELECT value_fr FROM nursery_settings WHERE setting_key = 'attendance_mode' LIMIT 1");
    return res.rows[0]?.value_fr || 'hourly';
  } catch (e) {
    return 'hourly';
  }
};

// GET /api/attendance/today - Présences d'aujourd'hui
router.get('/today', auth.authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Réconciliation : corriger les pointages créés avec une fausse heure de sortie immédiate
    await db.query(`
      UPDATE attendance 
      SET check_out_time = NULL 
      WHERE date = $1 
        AND status = 'present' 
        AND check_in_time IS NOT NULL 
        AND check_out_time IS NOT NULL 
        AND (notes IS NULL OR (notes NOT LIKE '%[Départ automatique%' AND notes NOT LIKE '%[Départ enregistré%'))
        AND (check_out_time::time = '13:00:00'::time OR check_out_time::time = '18:00:00'::time)
    `, [today]);

    // Clôturer automatiquement tout enfant non pointé si la crèche est fermée
    await autoCloseExpiredAttendances();

    const { page = 1, limit = 50 } = req.query;
    const attendanceMode = await getAttendanceMode();

    const sql = `
      SELECT a.id, a.child_id, a.date, a.check_in_time, a.check_out_time, 
             COALESCE(a.status, 'present') as status,
             COALESCE(a.is_exceptional_saturday, false) as is_exceptional_saturday,
             a.notes, a.created_at, a.updated_at,
             c.first_name as child_first_name, c.last_name as child_last_name,
             c.birth_date as child_birth_date, c.gender as child_gender,
             c.care_schedule, c.saturday_attendance
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE a.date = $1
      ORDER BY a.check_in_time DESC NULLS LAST, a.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const offset = (page - 1) * limit;
    const result = await db.query(sql, [today, limit, offset]);

    res.json({
      success: true,
      attendance: result.rows,
      settings: {
        attendance_mode: attendanceMode
      },
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
    const mode = await getAttendanceMode();
    const isDaily = mode === 'daily';

    // Réconciliation : tout pointage du jour qui avait reçu à tort une heure de départ anticipée est remis à NULL
    await db.query(`
      UPDATE attendance 
      SET check_out_time = NULL 
      WHERE date = $1 
        AND status = 'present' 
        AND check_in_time IS NOT NULL 
        AND check_out_time IS NOT NULL 
        AND (notes IS NULL OR (notes NOT LIKE '%[Départ automatique%' AND notes NOT LIKE '%[Départ enregistré%'))
        AND (check_out_time::time = '13:00:00'::time OR check_out_time::time = '18:00:00'::time)
    `, [today]);

    // En mode horaire, clôturer automatiquement les départs expirés si la crèche est fermée
    if (!isDaily) {
      await autoCloseExpiredAttendances();
    }

    let sql;
    if (isDaily) {
      // En mode journalier, tout enfant pointé présent aujourd'hui est actuellement présent
      sql = `
        SELECT a.id as attendance_id, a.child_id, a.check_in_time, a.check_out_time, a.notes,
               COALESCE(a.status, 'present') as status,
               COALESCE(a.is_exceptional_saturday, false) as is_exceptional_saturday,
               c.id, c.first_name, c.last_name,
               c.birth_date, c.gender, c.care_schedule
        FROM attendance a
        JOIN children c ON a.child_id = c.id
        WHERE a.date = $1 
          AND COALESCE(a.status, 'present') = 'present' 
          AND a.check_in_time IS NOT NULL
        ORDER BY a.check_in_time DESC
      `;
    } else {
      sql = `
        SELECT a.id as attendance_id, a.child_id, a.check_in_time, a.check_out_time, a.notes,
               COALESCE(a.status, 'present') as status,
               COALESCE(a.is_exceptional_saturday, false) as is_exceptional_saturday,
               c.id, c.first_name, c.last_name,
               c.birth_date, c.gender, c.care_schedule
        FROM attendance a
        JOIN children c ON a.child_id = c.id
        WHERE a.date = $1 
          AND a.check_in_time IS NOT NULL 
          AND a.check_out_time IS NULL
          AND COALESCE(a.status, 'present') = 'present'
        ORDER BY a.check_in_time DESC
      `;
    }

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
    const mode = await getAttendanceMode();
    const isDaily = mode === 'daily';

    if (!isDaily) {
      await autoCloseExpiredAttendances();
    }

    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Calcul du jour de la semaine (0 = Dimanche, 6 = Samedi)
    const [year, month, day] = targetDate.split('-').map(Number);
    const targetDayOfWeek = new Date(year, month - 1, day).getDay();
    const isSaturday = targetDayOfWeek === 6;

    // 1. Récupérer tous les enfants actifs et approuvés
    const childrenRes = await db.query(
      `SELECT id, COALESCE(saturday_attendance, false) as saturday_attendance
       FROM children
       WHERE is_active = true AND status = 'approved'`
    );
    const activeChildren = childrenRes.rows;

    // 2. Récupérer les présences enregistrées pour la date cible
    const attendanceRes = await db.query(
      `SELECT a.id, a.child_id, a.check_in_time, a.check_out_time, 
              COALESCE(a.status, 'present') as status,
              COALESCE(a.is_exceptional_saturday, false) as is_exceptional_saturday
       FROM attendance a
       WHERE a.date = $1`,
      [targetDate]
    );
    const attendanceRows = attendanceRes.rows;

    // 3. Identifier les enfants exceptionnels du samedi non inscrits d'office au samedi
    const exceptionalChildIds = new Set(
      attendanceRows
        .filter(a => a.is_exceptional_saturday)
        .map(a => a.child_id)
    );

    // 4. Calcul de l'effectif attendu (Total)
    let totalEligible = 0;
    if (isSaturday) {
      // Inscrits au samedi régulier + cas exceptionnels accueillis ce samedi
      totalEligible = activeChildren.filter(c => c.saturday_attendance || exceptionalChildIds.has(c.id)).length;
    } else {
      totalEligible = activeChildren.length;
    }

    // 5. Calcul des présents et terminés
    let presentCount = 0;
    let completedCount = 0;

    if (isDaily) {
      // En mode journalier : tout enregistrement présent avec heure d'arrivée
      presentCount = attendanceRows.filter(a => a.status === 'present' && a.check_in_time).length;
      completedCount = 0;
    } else {
      // En mode horaire :
      // Présents actuels : arrivés et pas encore repartis
      presentCount = attendanceRows.filter(a => a.status !== 'absent' && a.check_in_time && !a.check_out_time).length;
      // Terminés : ont effectué leur départ
      completedCount = attendanceRows.filter(a => a.check_in_time && a.check_out_time).length;
    }

    // 6. Absents = effectif attendu - ceux qui sont venus (présents ou terminés)
    const absentCount = Math.max(0, totalEligible - presentCount - (isDaily ? 0 : completedCount));

    res.json({
      success: true,
      stats: {
        date: targetDate,
        total: totalEligible,
        present: presentCount,
        completed: completedCount,
        stillPresent: presentCount,
        absent: absentCount,
        isSaturday: isSaturday,
        mode: mode
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
    // Clôturer automatiquement tout enfant non pointé si la date est passée ou la crèche fermée
    await autoCloseExpiredAttendances();

    const { date } = req.params;
    const { page = 1, limit = 100 } = req.query;

    const sql = `
      SELECT a.id, a.child_id, a.date, a.check_in_time, a.check_out_time, 
             COALESCE(a.status, 'present') as status,
             COALESCE(a.is_exceptional_saturday, false) as is_exceptional_saturday,
             a.notes, a.created_at, a.updated_at,
             c.first_name as child_first_name, c.last_name as child_last_name,
             c.birth_date as child_birth_date, c.gender as child_gender,
             c.care_schedule, c.saturday_attendance
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE a.date = $1
      ORDER BY a.check_in_time DESC NULLS LAST, a.created_at DESC
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
    // Clôturer automatiquement tout enfant non pointé si la crèche est fermée
    await autoCloseExpiredAttendances();

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

// POST /api/attendance/check-in - Enregistrer une arrivée / présence
router.post('/check-in', auth.authenticateToken, auth.requirePermission('attendance.manage'), async (req, res) => {
  try {
    const { child_id, notes, date, check_in_time, check_out_time } = req.body;
    const today = date || new Date().toISOString().split('T')[0];
    const now = new Date();

    // Vérifier si l'enfant existe et récupérer sa formule
    const childCheck = await db.query(
      'SELECT id, first_name, last_name, care_schedule, saturday_attendance FROM children WHERE id = $1 AND is_active = true',
      [child_id]
    );
    if (childCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }
    const child = childCheck.rows[0];

    const mode = await getAttendanceMode();
    const isDaily = mode === 'daily';

    const dayOfWeek = new Date(`${today}T12:00:00`).getDay(); // 0 = Dimanche, 6 = Samedi
    const isSaturday = dayOfWeek === 6;

    let checkInTime = check_in_time || now;
    let checkOutTime = check_out_time || null;

    if (isDaily && !check_in_time) {
      // Mode forfaitaire : heure contractuelle de début 07h00.
      // Le départ reste NULL tant que l'enfant est présent à la crèche (pas de départ anticipé à l'arrivée).
      checkInTime = `${today} 07:00:00`;
      checkOutTime = null;
    }

    // Vérifier s'il y a déjà un enregistrement pour aujourd'hui
    const existing = await db.query(
      'SELECT id, check_in_time, check_out_time, status FROM attendance WHERE child_id = $1 AND date = $2',
      [child_id, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].check_in_time && existing.rows[0].status === 'present' && !isDaily && !check_in_time) {
      return res.status(400).json({ success: false, error: 'L\'enfant est déjà arrivé aujourd\'hui' });
    }

    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE attendance 
         SET check_in_time = $1, check_out_time = $2, notes = COALESCE($3, notes), status = 'present', updated_by = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 
         RETURNING *`,
        [checkInTime, checkOutTime, notes || null, req.user.id || req.user.userId, existing.rows[0].id]
      );
    } else {
      result = await db.query(
        `INSERT INTO attendance (child_id, date, check_in_time, check_out_time, notes, status, updated_by) 
         VALUES ($1, $2, $3, $4, $5, 'present', $6) 
         RETURNING *`,
        [child_id, today, checkInTime, checkOutTime, notes || null, req.user.id || req.user.userId]
      );
    }

    res.json({
      success: true,
      message: isDaily ? 'Présence enregistrée avec succès' : 'Arrivée enregistrée avec succès',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur check-in:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement de l\'arrivée' });
  }
});

// POST /api/attendance/check-out - Enregistrer un départ (mode horaire)
router.post('/check-out', auth.authenticateToken, auth.requirePermission('attendance.manage'), async (req, res) => {
  try {
    const { child_id, notes, date } = req.body;
    const today = date || new Date().toISOString().split('T')[0];
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
    const result = await db.query(
      `UPDATE attendance 
       SET check_out_time = $1, notes = COALESCE($2, notes), updated_by = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4
       RETURNING *`,
      [now, notes || null, req.user.id || req.user.userId, existing.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Départ enregistré avec succès',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur check-out:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement du départ' });
  }
});

// POST /api/attendance/toggle - Basculer directement Présent / Absent (1 clic)
router.post('/toggle', auth.authenticateToken, auth.requirePermission('attendance.manage'), async (req, res) => {
  try {
    const { child_id, date, target_status, notes } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const now = new Date();

    const childCheck = await db.query(
      'SELECT id, first_name, last_name, care_schedule, saturday_attendance FROM children WHERE id = $1 AND is_active = true',
      [child_id]
    );
    if (childCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }
    const child = childCheck.rows[0];

    const existing = await db.query(
      'SELECT * FROM attendance WHERE child_id = $1 AND date = $2',
      [child_id, targetDate]
    );

    const mode = await getAttendanceMode();
    const isDaily = mode === 'daily';
    const dayOfWeek = new Date(`${targetDate}T12:00:00`).getDay();
    const isSaturday = dayOfWeek === 6;
    const isHalfDay = child.care_schedule === 'half_day';
    const closeHour = (isSaturday || isHalfDay) ? '13:00:00' : '18:00:00';

    const isCurrentlyPresent = existing.rows.length > 0 && (existing.rows[0].status === 'present' || existing.rows[0].check_in_time !== null);

    // Si on veut marquer l'enfant absent (ou bascule vers absent)
    if (target_status === 'absent' || (!target_status && isCurrentlyPresent)) {
      if (existing.rows.length > 0) {
        await db.query('DELETE FROM attendance WHERE id = $1', [existing.rows[0].id]);
      }
      return res.json({
        success: true,
        message: 'Enfant marqué absent pour cette journée',
        status: 'absent',
        child_id
      });
    }

    // Sinon, marquer présent : le départ reste NULL tant que l'enfant est présent
    const checkInTime = isDaily ? `${targetDate} 07:00:00` : now;
    const checkOutTime = null;

    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE attendance 
         SET check_in_time = $1, check_out_time = $2, notes = COALESCE($3, notes), status = 'present', updated_by = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 
         RETURNING *`,
        [checkInTime, checkOutTime, notes || null, req.user.id || req.user.userId, existing.rows[0].id]
      );
    } else {
      result = await db.query(
        `INSERT INTO attendance (child_id, date, check_in_time, check_out_time, notes, status, updated_by) 
         VALUES ($1, $2, $3, $4, $5, 'present', $6) 
         RETURNING *`,
        [child_id, targetDate, checkInTime, checkOutTime, notes || null, req.user.id || req.user.userId]
      );
    }

    res.json({
      success: true,
      message: 'Présence enregistrée avec succès',
      status: 'present',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur toggle présence:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de présence' });
  }
});

// PUT /api/attendance/:id - Rectifier / corriger un pointage (Heure non obligatoire)
router.put('/:id', auth.authenticateToken, auth.requirePermission('attendance.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in_time, check_out_time, status, notes } = req.body;

    const check = await db.query(`
      SELECT a.*, c.care_schedule, c.first_name, c.last_name 
      FROM attendance a 
      JOIN children c ON a.child_id = c.id 
      WHERE a.id = $1
    `, [id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enregistrement de présence introuvable' });
    }

    const existing = check.rows[0];
    const recordDate = existing.date instanceof Date ? existing.date.toISOString().split('T')[0] : String(existing.date).split('T')[0];
    const dayOfWeek = new Date(`${recordDate}T12:00:00`).getDay();
    const isSaturday = dayOfWeek === 6;
    const isHalfDay = existing.care_schedule === 'half_day';
    const defaultCloseTime = (isSaturday || isHalfDay) ? '13:00:00' : '18:00:00';

    // Si on le passe en absent : suppression du pointage
    if (status === 'absent') {
      await db.query('DELETE FROM attendance WHERE id = $1', [id]);
      return res.json({ success: true, message: 'Pointage annulé (enfant marqué absent)' });
    }

    let finalCheckIn = check_in_time !== undefined ? check_in_time : existing.check_in_time;
    let finalCheckOut = check_out_time !== undefined ? check_out_time : existing.check_out_time;

    // Si l'utilisateur rectifie la présence sans spécifier d'heure (heure non obligatoire)
    if (!finalCheckIn || String(finalCheckIn).trim() === '') {
      finalCheckIn = `${recordDate} 07:00:00`;
      finalCheckOut = `${recordDate} ${defaultCloseTime}`;
    }

    const result = await db.query(`
      UPDATE attendance 
      SET check_in_time = $1,
          check_out_time = $2,
          notes = COALESCE($3, notes),
          status = COALESCE($4, 'present'),
          updated_by = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [finalCheckIn, finalCheckOut || null, notes || null, status || 'present', req.user.id || req.user.userId, id]);

    res.json({
      success: true,
      message: 'Pointage rectifié avec succès',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur rectification pointage:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la rectification' });
  }
});

// DELETE /api/attendance/:id - Annuler un pointage (Droit à l'erreur / Remise à l'état absent)
router.delete('/:id', auth.authenticateToken, auth.requirePermission('attendance.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT id FROM attendance WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pointage non trouvé' });
    }

    await db.query('DELETE FROM attendance WHERE id = $1', [id]);

    res.json({ success: true, message: 'Pointage annulé avec succès' });
  } catch (error) {
    console.error('Erreur annulation pointage:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'annulation du pointage' });
  }
});

// POST /api/attendance/exceptional-saturday - Accueil exceptionnel du samedi avec notification parent
router.post('/exceptional-saturday', auth.authenticateToken, auth.requirePermission('attendance.manage'), async (req, res) => {
  try {
    const { child_id, notes, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const childRes = await db.query(`
      SELECT c.id, c.first_name, c.last_name, c.parent_id, u.id as user_parent_id, u.first_name as parent_first_name
      FROM children c
      LEFT JOIN users u ON c.parent_id = u.id
      WHERE c.id = $1 AND c.is_active = true
    `, [child_id]);

    if (childRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }
    const child = childRes.rows[0];

    const mode = await getAttendanceMode();
    const isDaily = mode === 'daily';
    const now = new Date();

    const checkInTime = isDaily ? `${targetDate} 07:00:00` : now;
    const checkOutTime = null; // Présent à la crèche, départ NULL
    const auditNote = notes ? `${notes} | [Accueil exceptionnel samedi]` : `[Accueil exceptionnel samedi]`;

    const result = await db.query(`
      INSERT INTO attendance (child_id, date, check_in_time, check_out_time, notes, status, is_exceptional_saturday, updated_by)
      VALUES ($1, $2, $3, $4, $5, 'present', true, $6)
      ON CONFLICT (child_id, date)
      DO UPDATE SET
        check_in_time = EXCLUDED.check_in_time,
        check_out_time = EXCLUDED.check_out_time,
        notes = EXCLUDED.notes,
        status = 'present',
        is_exceptional_saturday = true,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [child_id, targetDate, checkInTime, checkOutTime, auditNote, req.user.id || req.user.userId]);

    // Notification immédiate au parent (In-App + Push)
    const parentUserId = child.parent_id || child.user_parent_id;
    if (parentUserId) {
      const notifTitle = 'ℹ️ Accueil exceptionnel du samedi';
      const notifMsg = `Votre enfant ${child.first_name} ${child.last_name} a été accueilli(e) exceptionnellement aujourd'hui (Samedi).`;

      try {
        await db.query(`
          INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
          VALUES ($1, $2, $3, 'saturday_exception', false, NOW())
        `, [parentUserId, notifTitle, notifMsg]);

        await pushNotificationService.sendPushToUser(parentUserId, {
          title: notifTitle,
          message: notifMsg,
          url: '/mon-espace'
        });
      } catch (notifErr) {
        console.warn('⚠️ Erreur notification parent samedi exceptionnel:', notifErr.message);
      }
    }

    res.json({
      success: true,
      message: `Accueil exceptionnel enregistré pour ${child.first_name} et parent notifié`,
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur accueil exceptionnel samedi:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement de l\'accueil exceptionnel' });
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
