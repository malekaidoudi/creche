const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { pool } = require('../config/db_postgres');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');
const upload = require('../middleware/upload');
const path = require('path');
const cloudinaryService = require('../services/cloudinaryService');

// GET /api/children/simple - Liste simple des enfants avec parent_id (pour messages)
router.get('/simple', auth.authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.first_name, 
        c.last_name, 
        c.parent_id,
        c.birth_date,
        u.id as parent_user_id,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name
      FROM children c
      LEFT JOIN users u ON c.parent_id = u.id
      WHERE c.is_active = true
      ORDER BY c.first_name, c.last_name
    `;

    const result = await pool.query(sql);

    return apiResponse.success(res, {
      children: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('❌ Erreur récupération enfants simple:', error.message);
    return apiResponse.serverError(res, error, 'Erreur lors de la récupération des enfants');
  }
});

// GET /api/children/my-count - Nombre d'enfants du parent connecté (pour limite 3 enfants)
router.get('/my-count', auth.authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId || req.user.id;

    // Compter les enfants actifs du parent
    const childrenResult = await pool.query(
      'SELECT COUNT(*) as count FROM children WHERE parent_id = $1 AND is_active = true',
      [parentId]
    );
    const childrenCount = parseInt(childrenResult.rows[0].count, 10);

    // Compter les inscriptions en cours (pending/in_progress)
    const pendingResult = await pool.query(
      `SELECT COUNT(*) as count FROM enrollments 
       WHERE parent_id = $1 AND status IN ('pending', 'in_progress')`,
      [parentId]
    );
    const pendingCount = parseInt(pendingResult.rows[0].count, 10);

    const totalCount = childrenCount + pendingCount;
    const maxChildren = 3;
    const canAddChild = totalCount < maxChildren;

    res.json({
      success: true,
      childrenCount,
      pendingCount,
      totalCount,
      maxChildren,
      canAddChild,
      remaining: Math.max(0, maxChildren - totalCount)
    });
  } catch (error) {
    console.error('Erreur comptage enfants:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du comptage des enfants'
    });
  }
});

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

    const result = await pool.query(sql);

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

// GET /api/children/orphans - Enfants orphelins (sans parent associé)
// Utilisé par l'admin pour associer un enfant à un nouveau compte parent
router.get('/orphans', async (req, res) => {
  try {
    const { search } = req.query;

    // Enfants inscrits avec parent_id NULL dans la table children
    let sql = `
      SELECT 
        c.id, 
        c.first_name, 
        c.last_name, 
        c.birth_date, 
        c.gender, 
        c.medical_info, 
        c.emergency_contact_name, 
        c.emergency_contact_phone, 
        c.photo_url, 
        c.is_active, 
        c.created_at,
        'enrolled' as enrollment_status,
        EXTRACT(YEAR FROM AGE(c.birth_date)) as age_years,
        EXTRACT(MONTH FROM AGE(c.birth_date)) % 12 as age_months
      FROM children c
      WHERE c.is_active = true 
        AND c.parent_id IS NULL
    `;

    const params = [];

    // Recherche optionnelle par nom (supporte: prénom, nom, "prénom nom", "nom prénom")
    if (search) {
      const searchTerm = search.trim();
      sql += ` AND (
        c.first_name ILIKE $1 
        OR c.last_name ILIKE $1
        OR CONCAT(c.first_name, ' ', c.last_name) ILIKE $1
        OR CONCAT(c.last_name, ' ', c.first_name) ILIKE $1
      )`;
      params.push(`%${searchTerm}%`);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(sql, params);

    // Formater l'âge pour l'affichage
    const children = result.rows.map(child => ({
      ...child,
      age_display: child.age_years > 0
        ? `${child.age_years} an${child.age_years > 1 ? 's' : ''}${child.age_months > 0 ? ` et ${child.age_months} mois` : ''}`
        : `${child.age_months} mois`
    }));

    res.json({
      success: true,
      children: children,
      count: children.length
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

    // Utiliser directement children.parent_id - simple et efficace
    const sql = `
      SELECT c.id, c.first_name, c.last_name, c.birth_date, c.gender, 
             c.medical_info, c.emergency_contact_name, c.emergency_contact_phone, 
             c.photo_url, c.is_active, c.created_at,
             EXTRACT(YEAR FROM AGE(c.birth_date)) as age
      FROM children c
      WHERE c.parent_id = $1 AND c.is_active = true
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(sql, [parentId]);

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

// GET /api/children/birthdays/month - Anniversaires du mois en cours
router.get('/birthdays/month', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    const sql = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.birth_date,
        c.gender,
        c.photo_url,
        c.parent_id,
        EXTRACT(DAY FROM c.birth_date) as birth_day,
        EXTRACT(YEAR FROM AGE(c.birth_date)) as age,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name
      FROM children c
      LEFT JOIN users u ON c.parent_id = u.id
      WHERE c.is_active = true 
        AND EXTRACT(MONTH FROM c.birth_date) = $1
      ORDER BY EXTRACT(DAY FROM c.birth_date) ASC
    `;

    const result = await pool.query(sql, [currentMonth]);

    // Calculer les jours restants et formater les données
    const children = result.rows.map(child => {
      const birthDay = parseInt(child.birth_day);
      const today = now.getDate();
      let daysUntil = birthDay - today;

      // Si l'anniversaire est passé ce mois, il est dans le passé
      const isPast = daysUntil < 0;
      const isToday = daysUntil === 0;

      return {
        ...child,
        child_name: `${child.first_name} ${child.last_name}`,
        child_gender: child.gender,
        child_photo_url: child.photo_url,
        child_birth_date: child.birth_date,
        child_id: child.id,
        days_until: daysUntil,
        is_today: isToday,
        is_past: isPast,
        start_date: `${now.getFullYear()}-${String(currentMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
      };
    });

    res.json({
      success: true,
      children,
      month: currentMonth,
      year: now.getFullYear()
    });
  } catch (error) {
    console.error('Erreur anniversaires du mois:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des anniversaires'
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

    const result = await pool.query(statsQuery);
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
// Workflow: Admin crée un parent → sélectionne un enfant orphelin → association
router.put('/:id/associate-parent', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId, isPrimary = true } = req.body;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        error: 'ID du parent requis'
      });
    }

    // Vérifier que l'enfant existe et est orphelin
    const childCheck = await pool.query(
      'SELECT id, first_name, last_name, parent_id FROM children WHERE id = $1 AND is_active = true',
      [id]
    );

    if (childCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enfant non trouvé'
      });
    }

    // Vérifier que le parent existe
    const parentCheck = await pool.query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1 AND is_active = true',
      [parentId]
    );

    if (parentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parent non trouvé'
      });
    }

    // Mettre à jour l'enfant avec le parent_id
    await pool.query(
      'UPDATE children SET parent_id = $1, updated_at = NOW() WHERE id = $2',
      [parentId, id]
    );

    // Créer aussi l'entrée dans parent_children pour la relation N-N
    await pool.query(`
      INSERT INTO parent_children (parent_id, child_id, relationship, is_primary, created_at)
      VALUES ($1, $2, 'parent', $3, NOW())
      ON CONFLICT (parent_id, child_id) 
      DO UPDATE SET is_primary = $3, updated_at = NOW()
    `, [parentId, id, isPrimary]);

    // Créer ou mettre à jour l'inscription
    await pool.query(`
      INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, created_at)
      VALUES ($1, $2, 'approved', CURRENT_DATE, NOW())
      ON CONFLICT (child_id) 
      DO UPDATE SET parent_id = $2, status = 'approved', updated_at = NOW()
    `, [id, parentId]);

    const child = childCheck.rows[0];
    const parent = parentCheck.rows[0];

    res.json({
      success: true,
      message: `${child.first_name} ${child.last_name} associé à ${parent.first_name} ${parent.last_name}`,
      child: { id: child.id, first_name: child.first_name, last_name: child.last_name },
      parent: { id: parent.id, first_name: parent.first_name, last_name: parent.last_name }
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
router.put('/:id/deactivate-parent', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Récupérer le parent_id de l'enfant
    const childResult = await pool.query(
      'SELECT parent_id FROM children WHERE id = $1',
      [id]
    );

    if (childResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enfant non trouvé'
      });
    }

    const parentId = childResult.rows[0].parent_id;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        error: 'Aucun parent associé à cet enfant'
      });
    }

    // 2. Désactiver le compte utilisateur du parent
    await pool.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [parentId]
    );

    // Note: Les inscriptions sont déjà archivées dans enrollments_archive lors de l'archivage de l'enfant
    // Pas besoin de modifier la table enrollments ici

    console.log(`✅ Compte parent #${parentId} désactivé suite à l'archivage de l'enfant #${id}`);

    res.json({
      success: true,
      message: 'Compte parent désactivé avec succès',
      parentId: parentId
    });
  } catch (error) {
    console.error('❌ Erreur désactivation parent:', error);
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

// GET /api/children - Récupérer tous les enfants avec leurs parents
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const { status = 'active', search, gender, age, age_min, age_max, page = 1, limit = 50 } = req.query;
    console.log('📊 Paramètres reçus:', { status, search, gender, age, age_min, age_max, page, limit });

    let sql = `
      SELECT 
        c.id, c.first_name, c.last_name, c.birth_date, c.gender, c.medical_info, 
        c.emergency_contact_name, c.emergency_contact_phone, c.photo_url, 
        COALESCE(c.photo_shared_with_staff, true) as photo_shared_with_staff,
        c.is_active, c.created_at, c.updated_at, c.parent_id,
        EXTRACT(YEAR FROM AGE(c.birth_date)) as age,
        u.id as parent_user_id,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name,
        u.email as parent_email,
        u.phone as parent_phone,
        e.enrollment_date,
        e.status as enrollment_status,
        COUNT(cd.id) as documents_count
      FROM children c
      LEFT JOIN users u ON c.parent_id = u.id
      LEFT JOIN enrollments e ON c.id = e.child_id
      LEFT JOIN children_documents cd ON c.id = cd.child_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filtres
    if (status === 'active' || status === 'approved') {
      paramCount++;
      sql += ` AND c.is_active = $${paramCount}`;
      params.push(true);
    } else if (status === 'archived' || status === 'inactive') {
      paramCount++;
      sql += ` AND c.is_active = $${paramCount}`;
      params.push(false);
    }

    if (search) {
      paramCount++;
      sql += ` AND (c.first_name ILIKE $${paramCount} OR c.last_name ILIKE $${paramCount})`;
      params.push(`${search}%`); // Recherche au début du nom seulement
    }

    if (gender) {
      paramCount++;
      sql += ` AND c.gender = $${paramCount}`;
      params.push(gender);
    }

    // Filtre par tranche d'âge
    if (age && age !== 'all') {
      if (age === 'infant') {
        // 2-11 mois
        sql += ` AND c.birth_date >= CURRENT_DATE - INTERVAL '1 year' AND c.birth_date <= CURRENT_DATE - INTERVAL '2 months'`;
      } else if (age === 'toddler') {
        // 1-2 ans
        sql += ` AND c.birth_date >= CURRENT_DATE - INTERVAL '2 years' AND c.birth_date < CURRENT_DATE - INTERVAL '1 year'`;
      } else if (age === 'young') {
        // 2-3 ans
        sql += ` AND c.birth_date >= CURRENT_DATE - INTERVAL '3 years' AND c.birth_date < CURRENT_DATE - INTERVAL '2 years'`;
      }
    }

    if (age_min) {
      paramCount++;
      sql += ` AND EXTRACT(YEAR FROM AGE(c.birth_date)) >= $${paramCount}`;
      params.push(parseInt(age_min));
    }

    if (age_max) {
      paramCount++;
      sql += ` AND EXTRACT(YEAR FROM AGE(c.birth_date)) <= $${paramCount}`;
      params.push(parseInt(age_max));
    }

    // GROUP BY et ORDER BY
    sql += ` GROUP BY c.id, c.first_name, c.last_name, c.birth_date, c.gender, c.medical_info, 
             c.emergency_contact_name, c.emergency_contact_phone, c.photo_url, 
             c.is_active, c.created_at, c.updated_at, c.parent_id,
             u.id, u.first_name, u.last_name, u.email, u.phone,
             e.enrollment_date, e.status`;
    sql += ` ORDER BY c.created_at DESC`;
    const offset = (page - 1) * limit;
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(sql, params);

    // Compter le total
    let countSql = 'SELECT COUNT(DISTINCT c.id) as total FROM children c LEFT JOIN users u ON c.parent_id = u.id WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (status === 'active' || status === 'approved') {
      countParamCount++;
      countSql += ` AND c.is_active = $${countParamCount}`;
      countParams.push(true);
    } else if (status === 'archived' || status === 'inactive') {
      countParamCount++;
      countSql += ` AND c.is_active = $${countParamCount}`;
      countParams.push(false);
    }

    if (search) {
      countParamCount++;
      countSql += ` AND (c.first_name ILIKE $${countParamCount} OR c.last_name ILIKE $${countParamCount})`;
      countParams.push(`${search}%`); // Recherche au début du nom seulement
    }

    if (gender) {
      countParamCount++;
      countSql += ` AND c.gender = $${countParamCount}`;
      countParams.push(gender);
    }

    // Filtre par tranche d'âge dans COUNT
    if (age && age !== 'all') {
      if (age === 'infant') {
        countSql += ` AND c.birth_date >= CURRENT_DATE - INTERVAL '1 year' AND c.birth_date <= CURRENT_DATE - INTERVAL '2 months'`;
      } else if (age === 'toddler') {
        countSql += ` AND c.birth_date >= CURRENT_DATE - INTERVAL '2 years' AND c.birth_date < CURRENT_DATE - INTERVAL '1 year'`;
      } else if (age === 'young') {
        countSql += ` AND c.birth_date >= CURRENT_DATE - INTERVAL '3 years' AND c.birth_date < CURRENT_DATE - INTERVAL '2 years'`;
      }
    }

    if (age_min) {
      countParamCount++;
      countSql += ` AND EXTRACT(YEAR FROM AGE(c.birth_date)) >= $${countParamCount}`;
      countParams.push(parseInt(age_min));
    }

    if (age_max) {
      countParamCount++;
      countSql += ` AND EXTRACT(YEAR FROM AGE(c.birth_date)) <= $${countParamCount}`;
      countParams.push(parseInt(age_max));
    }

    const countResult = await pool.query(countSql, countParams);

    res.json({
      success: true,
      data: {
        children: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
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

    const result = await pool.query(
      `SELECT id, first_name, last_name, birth_date, gender, medical_info, 
              emergency_contact_name, emergency_contact_phone, photo_url, photo_shared_with_staff,
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
    const enrollments = await pool.query(
      `SELECT e.*, u.first_name as parent_first_name, u.last_name as parent_last_name, u.email as parent_email
       FROM enrollments e
       JOIN users u ON e.parent_id = u.id
       WHERE e.child_id = $1
       ORDER BY e.created_at DESC`,
      [id]
    );

    // Récupérer les présences récentes
    const attendance = await pool.query(
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

// POST /api/children - Créer un nouvel enfant (via dashboard admin)
// Utilise le service centralisé childLifecycleService
router.post('/', [
  body('first_name').notEmpty().withMessage('Prénom requis'),
  body('last_name').notEmpty().withMessage('Nom requis'),
  body('birth_date').isISO8601().withMessage('Date de naissance invalide'),
  body('gender').isIn(['male', 'female', 'M', 'F']).withMessage('Genre invalide')
], async (req, res) => {
  const childLifecycleService = require('../services/childLifecycleService');

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
      photo_url,
      parent_id
    } = req.body;

    // Utiliser le service centralisé pour créer l'enfant
    const result = await childLifecycleService.createChild(
      {
        first_name,
        last_name,
        birth_date,
        gender,
        medical_info,
        emergency_contact_name,
        emergency_contact_phone,
        photo_url,
        parent_id
      },
      {
        created_by: req.user?.id,
        transfer_documents: false, // Pas de documents à transférer (création directe)
        create_birthday_event: true,
        create_notification: !!parent_id, // Notification seulement si parent associé
        archive_enrollment: false // Pas d'inscription à archiver
      }
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        duplicate: result.duplicate
      });
    }

    // Créer une entrée dans enrollments_archive pour traçabilité
    try {
      let parentInfo = { first_name: 'Inscription directe', last_name: 'via Dashboard', email: null };
      if (parent_id) {
        const parentResult = await pool.query(
          'SELECT first_name, last_name, email FROM users WHERE id = $1',
          [parent_id]
        );
        if (parentResult.rows[0]) parentInfo = parentResult.rows[0];
      }

      await pool.query(
        `INSERT INTO enrollments_archive (
          child_id, parent_id, enrollment_date, status, new_status,
          applicant_first_name, applicant_last_name, applicant_email,
          admin_notes, created_at, updated_at, approved_by, approved_at
        ) VALUES ($1, $2, NOW(), 'approved', 'approved', $3, $4, $5, $6, NOW(), NOW(), $7, NOW())`,
        [
          result.childId,
          parent_id || null,
          parentInfo.first_name,
          parentInfo.last_name,
          parentInfo.email,
          'Inscription directe à la crèche - Enfant ajouté via le dashboard admin',
          req.user?.id || 1
        ]
      );
    } catch (archiveError) {
      console.warn('⚠️ Erreur création archive inscription:', archiveError.message);
    }

    // Créer une tâche admin pour compléter le dossier
    try {
      const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`);
      const adminId = adminResult.rows.length > 0 ? adminResult.rows[0].id : req.user?.id || 1;

      await pool.query(
        `INSERT INTO tasks (
          title, description, assigned_to, created_by, 
          due_date, priority, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'medium', 'pending', NOW())`,
        [
          `📄 Compléter le dossier de ${first_name} ${last_name}`,
          `Documents manquants pour l'enfant ${first_name} ${last_name} (ID: ${result.childId}).\n\n🔗 Accéder aux documents: /dashboard/documents\n\nDocuments requis:\n- Carnet médical\n- Acte de naissance\n- Certificat médical`,
          adminId,
          req.user?.id || adminId,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ]
      );
    } catch (taskError) {
      console.warn('⚠️ Erreur création tâche documents:', taskError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Enfant créé avec succès',
      child: result.child
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
      allergies,
      medical_notes,
      doctor_name,
      doctor_phone,
      emergency_contact_name,
      emergency_contact_phone,
      photo_url,
      photo_shared_with_staff,
      is_active
    } = req.body;

    // Vérifier si l'enfant existe
    const existingChild = await pool.query('SELECT id FROM children WHERE id = $1', [id]);
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

    if (allergies !== undefined) {
      paramCount++;
      updates.push(`allergies = $${paramCount}`);
      params.push(allergies);
    }

    if (medical_notes !== undefined) {
      paramCount++;
      updates.push(`medical_notes = $${paramCount}`);
      params.push(medical_notes);
    }

    if (doctor_name !== undefined) {
      paramCount++;
      updates.push(`doctor_name = $${paramCount}`);
      params.push(doctor_name);
    }

    if (doctor_phone !== undefined) {
      paramCount++;
      updates.push(`doctor_phone = $${paramCount}`);
      params.push(doctor_phone);
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

    if (photo_shared_with_staff !== undefined) {
      paramCount++;
      updates.push(`photo_shared_with_staff = $${paramCount}`);
      params.push(photo_shared_with_staff);
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
                allergies, medical_notes, doctor_name, doctor_phone,
                emergency_contact_name, emergency_contact_phone, photo_url, 
                photo_shared_with_staff, is_active, updated_at
    `;

    const result = await pool.query(sql, params);

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
// Utilise le service centralisé childLifecycleService
router.delete('/:id', auth.authenticateToken, async (req, res) => {
  const childLifecycleService = require('../services/childLifecycleService');

  try {
    const { id } = req.params;
    const { reason, checkParentDeactivation } = req.body;

    console.log(`🗑️ DELETE /api/children/${id} - Début archivage`);
    console.log(`📋 Body reçu:`, { reason, checkParentDeactivation, rawBody: req.body });

    // Récupérer les infos de l'enfant AVANT l'archivage (incluant parent_id)
    const childResult = await pool.query(`
      SELECT c.first_name, c.last_name, c.parent_id, u.first_name as parent_first_name, u.last_name as parent_last_name
      FROM children c
      LEFT JOIN users u ON c.parent_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (childResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enfant non trouvé'
      });
    }
    const childInfo = childResult.rows[0];
    const parentId = childInfo.parent_id;

    // Récupérer les documents AVANT l'archivage
    const docsResult = await pool.query('SELECT * FROM children_documents WHERE child_id = $1', [id]);

    // Utiliser le service centralisé pour supprimer/archiver l'enfant
    const result = await childLifecycleService.deleteChild(parseInt(id), {
      archive: true,
      deleted_by: req.user?.id,
      reason: reason || 'Archivé via dashboard'
    });

    if (!result.success) {
      console.error('❌ childLifecycleService.deleteChild failed:', result.error);
      return res.status(400).json({
        success: false,
        error: result.error || 'Erreur lors de l\'archivage'
      });
    }

    // Archiver les documents dans archived_documents pour traçabilité
    if (docsResult.rows.length > 0) {
      for (const doc of docsResult.rows) {
        try {
          await pool.query(`
            INSERT INTO archived_documents (
              child_first_name, child_last_name, document_type,
              original_filename, cloudinary_url, cloudinary_public_id,
              file_size, mime_type, archived_by, archived_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          `, [
            childInfo.first_name,
            childInfo.last_name,
            doc.document_type,
            doc.original_filename,
            doc.cloudinary_url,
            doc.cloudinary_public_id,
            doc.file_size,
            doc.mime_type,
            req.user?.id || null
          ]);
        } catch (archiveErr) {
          console.warn('⚠️ Erreur archivage document:', archiveErr.message);
        }
      }
      await pool.query('DELETE FROM children_documents WHERE child_id = $1', [id]);
    }

    console.log(`✅ Enfant #${id} archivé avec succès`);

    // Vérifier si le parent a d'autres enfants actifs
    let parentHasNoOtherChildren = false;
    let parentName = null;

    console.log(`🔍 checkParentDeactivation: ${checkParentDeactivation}, parentId: ${parentId}`);

    if (checkParentDeactivation && parentId) {
      const otherChildrenResult = await pool.query(`
        SELECT COUNT(*) as count FROM children 
        WHERE parent_id = $1 AND id != $2 AND is_active = true
      `, [parentId, id]);

      const otherChildrenCount = parseInt(otherChildrenResult.rows[0].count);
      parentHasNoOtherChildren = otherChildrenCount === 0;
      parentName = `${childInfo.parent_first_name || ''} ${childInfo.parent_last_name || ''}`.trim() || 'Le parent';

      console.log(`👨‍👩‍👧 Parent #${parentId} (${parentName}) a ${otherChildrenCount} autre(s) enfant(s) actif(s)`);
      console.log(`📊 parentHasNoOtherChildren: ${parentHasNoOtherChildren}`);
    } else {
      console.log(`⚠️ Vérification parent ignorée: checkParentDeactivation=${checkParentDeactivation}, parentId=${parentId}`);
    }

    res.json({
      success: true,
      message: `${childInfo.first_name} ${childInfo.last_name} archivé avec succès`,
      parentId: parentId,
      parentName: parentName,
      parentHasNoOtherChildren: parentHasNoOtherChildren
    });

  } catch (error) {
    console.error('❌ Erreur suppression enfant:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression de l\'enfant'
    });
  }
});

// POST /api/children/:id/photo - Upload photo d'un enfant
router.post('/:id/photo', auth.authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'enfant existe
    const existingChild = await pool.query('SELECT id, first_name, last_name FROM children WHERE id = $1', [id]);
    if (existingChild.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enfant non trouvé'
      });
    }

    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucune photo fournie'
      });
    }

    // Construire l'URL de la photo
    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    // Mettre à jour la photo dans la base de données
    const result = await pool.query(
      `UPDATE children 
       SET photo_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, first_name, last_name, photo_url`,
      [photoUrl, id]
    );

    logger.info(`📸 Photo mise à jour pour enfant ${id}: ${photoUrl}`);

    res.json({
      success: true,
      message: 'Photo mise à jour avec succès',
      photo_url: photoUrl,
      child: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur upload photo enfant:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload de la photo'
    });
  }
});

// GET /api/children/stats - Statistiques des enfants
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await pool.query(`
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

// ============================================
// ROUTES DONNÉES MÉDICALES
// ============================================

// GET /api/children/:id/medical - Récupérer les données médicales
router.get('/:id/medical', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'accès (parent de l'enfant ou admin/staff)
    const childCheck = await pool.query(
      'SELECT parent_id FROM children WHERE id = $1',
      [id]
    );

    if (childCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }

    const child = childCheck.rows[0];
    if (req.user.role === 'parent' && child.parent_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    // Récupérer les données médicales
    const result = await pool.query(`
      SELECT medical_info, allergies, medications, conditions, blood_type, 
             doctor_name, doctor_phone, medical_notes
      FROM children WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.json({ success: true, allergies: [], medications: [], conditions: [] });
    }

    const data = result.rows[0];
    res.json({
      success: true,
      allergies: data.allergies || [],
      medications: data.medications || [],
      conditions: data.conditions || [],
      blood_type: data.blood_type || '',
      doctor_name: data.doctor_name || '',
      doctor_phone: data.doctor_phone || '',
      notes: data.medical_notes || data.medical_info || ''
    });

  } catch (error) {
    console.error('Erreur GET medical:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/children/:id/medical - Mettre à jour les données médicales
router.put('/:id/medical', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { allergies, medications, conditions, blood_type, doctor_name, doctor_phone, notes } = req.body;

    // Vérifier l'accès
    const childCheck = await pool.query(
      'SELECT parent_id FROM children WHERE id = $1',
      [id]
    );

    if (childCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }

    const child = childCheck.rows[0];
    if (req.user.role === 'parent' && child.parent_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    // Mettre à jour
    await pool.query(`
      UPDATE children SET 
        allergies = $1,
        medications = $2,
        conditions = $3,
        blood_type = $4,
        doctor_name = $5,
        doctor_phone = $6,
        medical_notes = $7,
        updated_at = NOW()
      WHERE id = $8
    `, [
      JSON.stringify(allergies || []),
      JSON.stringify(medications || []),
      JSON.stringify(conditions || []),
      blood_type || null,
      doctor_name || null,
      doctor_phone || null,
      notes || null,
      id
    ]);

    res.json({ success: true, message: 'Données médicales mises à jour' });

  } catch (error) {
    console.error('Erreur PUT medical:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTES CONTACTS D'URGENCE
// ============================================

// GET /api/children/:id/emergency-contacts
router.get('/:id/emergency-contacts', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'accès
    const childCheck = await pool.query(
      'SELECT parent_id, emergency_contacts FROM children WHERE id = $1',
      [id]
    );

    if (childCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }

    const child = childCheck.rows[0];
    if (req.user.role === 'parent' && child.parent_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    res.json({
      success: true,
      contacts: child.emergency_contacts || []
    });

  } catch (error) {
    console.error('Erreur GET emergency-contacts:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/children/:id/emergency-contacts
router.put('/:id/emergency-contacts', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { contacts } = req.body;

    // Vérifier l'accès
    const childCheck = await pool.query(
      'SELECT parent_id FROM children WHERE id = $1',
      [id]
    );

    if (childCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
    }

    const child = childCheck.rows[0];
    if (req.user.role === 'parent' && child.parent_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    // Mettre à jour
    await pool.query(`
      UPDATE children SET 
        emergency_contacts = $1,
        updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(contacts || []), id]);

    res.json({ success: true, message: 'Contacts d\'urgence mis à jour' });

  } catch (error) {
    console.error('Erreur PUT emergency-contacts:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
