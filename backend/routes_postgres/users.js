const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/user/children-summary - Résumé des enfants de l'utilisateur connecté
router.get('/children-summary', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT c.id, c.first_name, c.last_name, c.birth_date, c.gender, 
             c.photo_url, c.is_active,
             e.status as enrollment_status,
             EXTRACT(YEAR FROM AGE(c.birth_date)) as age
      FROM children c
      JOIN enrollments e ON c.id = e.child_id
      WHERE e.parent_id = $1 AND c.is_active = true AND e.status = 'approved'
      ORDER BY c.first_name, c.last_name
    `;

    const result = await db.query(sql, [userId]);

    res.json({
      success: true,
      children: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Erreur résumé enfants utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du résumé des enfants'
    });
  }
});

// GET /api/user/has-children - Vérifier si l'utilisateur a des enfants
router.get('/has-children', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT COUNT(*) as children_count
      FROM children c
      JOIN enrollments e ON c.id = e.child_id
      WHERE e.parent_id = $1 AND c.is_active = true AND e.status = 'approved'
    `;

    const result = await db.query(sql, [userId]);
    const count = parseInt(result.rows[0].children_count);

    res.json({
      success: true,
      hasChildren: count > 0,
      count: count
    });
  } catch (error) {
    console.error('Erreur vérification enfants utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification des enfants'
    });
  }
});

// GET /api/user/children-summary - Récupérer le résumé des enfants de l'utilisateur
router.get('/children-summary', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT c.id, c.first_name, c.last_name, c.birth_date, c.gender, 
             c.medical_info, c.photo_url, c.created_at,
             e.status as enrollment_status, e.enrollment_date,
             EXTRACT(YEAR FROM AGE(c.birth_date)) as age
      FROM children c
      JOIN enrollments e ON c.id = e.child_id
      WHERE e.parent_id = $1 AND c.is_active = true
      ORDER BY c.first_name, c.last_name
    `;

    const result = await db.query(sql, [userId]);

    res.json({
      success: true,
      children: result.rows
    });
  } catch (error) {
    console.error('Erreur récupération enfants utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des enfants'
    });
  }
});

// GET /api/users/contacts - Récupérer les contacts pour la messagerie
router.get('/contacts', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT id, email, first_name, last_name, role, profile_image
      FROM users 
      WHERE is_active = true AND id != $1
    `;
    const params = [userId];

    // Parents ne voient que le staff/admin
    if (userRole === 'parent') {
      sql += ` AND role IN ('admin', 'staff')`;
    }

    sql += ` ORDER BY role ASC, first_name ASC`;

    const result = await db.query(sql, params);

    res.json({
      success: true,
      contacts: result.rows
    });

  } catch (error) {
    console.error('❌ Erreur GET /api/users/contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des contacts'
    });
  }
});

// GET /api/users - Récupérer tous les utilisateurs
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const { role, active, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT id, email, first_name, last_name, phone, role, profile_image, 
             is_active, password_set, gender, staff_position, created_at, updated_at
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filtres
    if (role) {
      paramCount++;
      sql += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (active !== undefined) {
      paramCount++;
      sql += ` AND is_active = $${paramCount}`;
      params.push(active === 'true');
    }

    if (search) {
      paramCount++;
      sql += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Pagination
    sql += ` ORDER BY created_at DESC`;
    const offset = (page - 1) * limit;
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await db.query(sql, params);

    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (role) {
      countParamCount++;
      countSql += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    if (active !== undefined) {
      countParamCount++;
      countSql += ` AND is_active = $${countParamCount}`;
      countParams.push(active === 'true');
    }

    if (search) {
      countParamCount++;
      countSql += ` AND (first_name ILIKE $${countParamCount} OR last_name ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countSql, countParams);

    res.json({
      success: true,
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// GET /api/user/has-children - Vérifier si l'utilisateur a des enfants (AVANT la route /:id)
router.get('/has-children', (req, res) => {
  res.json({
    success: true,
    hasChildren: false,
    count: 0,
    message: 'Route fonctionnelle - ordre corrigé'
  });
});

// GET /api/users/:id - Récupérer un utilisateur par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, email, first_name, last_name, phone, role, profile_image, 
              is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

// POST /api/users - Créer un nouvel utilisateur
router.post('/', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('first_name').notEmpty().withMessage('Prénom requis'),
  body('last_name').notEmpty().withMessage('Nom requis'),
  body('role').isIn(['admin', 'staff', 'parent']).withMessage('Rôle invalide')
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

    const { email, password, first_name, last_name, phone, role = 'parent', profile_image } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer le nouvel utilisateur
    const result = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, role, profile_image, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, email, first_name, last_name, phone, role, profile_image, is_active, created_at`,
      [email, hashedPassword, first_name, last_name, phone, role, profile_image, true]
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', [
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('first_name').optional().notEmpty().withMessage('Prénom requis'),
  body('last_name').optional().notEmpty().withMessage('Nom requis'),
  body('role').optional().isIn(['admin', 'staff', 'parent']).withMessage('Rôle invalide')
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
    const { email, first_name, last_name, phone, role, profile_image, is_active, gender, staff_position } = req.body;

    // Vérifier si l'utilisateur existe
    const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Cet email est déjà utilisé par un autre utilisateur'
        });
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }

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

    if (phone !== undefined) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
    }

    if (role !== undefined) {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }

    if (profile_image !== undefined) {
      paramCount++;
      updates.push(`profile_image = $${paramCount}`);
      params.push(profile_image);
    }

    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }

    if (gender !== undefined) {
      paramCount++;
      updates.push(`gender = $${paramCount}`);
      params.push(gender);
    }

    if (staff_position !== undefined) {
      paramCount++;
      updates.push(`staff_position = $${paramCount}`);
      params.push(staff_position);
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
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, phone, role, profile_image, is_active, gender, staff_position, updated_at
    `;

    const result = await db.query(sql, params);

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'utilisateur'
    });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const existingUser = await db.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Soft delete - désactiver l'utilisateur
    await db.query(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
});

// PUT /api/users/:id/password - Changer le mot de passe
router.put('/:id/password', [
  body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe minimum 6 caractères')
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
    const { newPassword } = req.body;

    // Vérifier si l'utilisateur existe
    const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de mot de passe'
    });
  }
});

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
router.get('/profile', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, email, first_name, last_name, phone, role, profile_image, 
              is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// PUT /api/users/profile - Mettre à jour le profil de l'utilisateur connecté
router.put('/profile', auth.authenticateToken, [
  body('first_name').optional().isString().withMessage('Prénom invalide'),
  body('last_name').optional().isString().withMessage('Nom invalide'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('phone').optional().isString().withMessage('Téléphone invalide')
], async (req, res) => {
  try {
    // Log sensible uniquement en dev
    logger.sensitive('📝 Données reçues pour mise à jour profil:', {
      fields: Object.keys(req.body)
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.debug('❌ Erreurs de validation profil:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const { first_name, last_name, email, phone } = req.body;

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

    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }

    if (phone !== undefined) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
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
    params.push(userId);

    const sql = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, phone, role, profile_image, 
                is_active, updated_at
    `;

    const result = await db.query(sql, params);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// PUT /api/users/change-password - Changer le mot de passe de l'utilisateur connecté
router.put('/change-password', auth.authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe minimum 6 caractères')
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

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Vérifier le mot de passe actuel
    const user = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de mot de passe'
    });
  }
});

// POST /api/users/push-token - Enregistrer le token push pour les notifications
router.post('/push-token', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { push_token } = req.body;

    if (!push_token) {
      return res.status(400).json({
        success: false,
        error: 'Token push requis'
      });
    }

    // Vérifier si la colonne push_token existe, sinon la créer
    try {
      await db.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token VARCHAR(255)
      `);
    } catch (alterError) {
      // Ignorer si la colonne existe déjà
    }

    // Mettre à jour le token push de l'utilisateur
    await db.query(
      'UPDATE users SET push_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [push_token, userId]
    );

    console.log(`✅ Token push enregistré pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: 'Token push enregistré avec succès'
    });

  } catch (error) {
    console.error('Erreur enregistrement token push:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement du token push'
    });
  }
});

module.exports = router;
