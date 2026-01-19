const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/db_postgres');
const { logLoginSuccess, logLoginFailed } = require('../middleware/activityLogger');
const emailService = require('../emails/emailService');

const router = express.Router();

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/login - Connexion utilisateur
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 1 }).withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Rechercher l'utilisateur dans PostgreSQL
    const result = await db.query(
      'SELECT id, email, password, first_name, last_name, role, phone, profile_image, is_active, gender, staff_position FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier si l'utilisateur est actif
    if (!user.is_active) {
      return res.status(401).json({ error: 'Compte désactivé' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Créer un log de connexion via activityLogger
    logLoginSuccess(user, req).catch(err => {
      console.warn('⚠️ Erreur log connexion:', err.message);
    });

    // Retourner les données utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/auth/register - Inscription utilisateur
router.post('/register', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('first_name').notEmpty().withMessage('Prénom requis'),
  body('last_name').notEmpty().withMessage('Nom requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password, first_name, last_name, phone, role = 'parent' } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer le nouvel utilisateur
    const result = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, role, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, first_name, last_name, role, phone, is_active`,
      [email, hashedPassword, first_name, last_name, phone, role, true]
    );

    const newUser = result.rows[0];

    // Générer le token JWT
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: newUser
    });

  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Récupérer les informations utilisateur
    const result = await db.query(
      'SELECT id, email, first_name, last_name, role, phone, profile_image, is_active, gender, staff_position FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    console.error('Erreur me:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/auth/logout - Déconnexion (côté client principalement)
router.post('/logout', (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

// POST /api/auth/create-password - Création mot de passe après approbation
// Le compte parent est déjà créé lors de l'approbation, cette API met à jour le mot de passe
router.post('/create-password', [
  body('token').notEmpty().withMessage('Token requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères')
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

    const { token, email, password } = req.body;

    // 1. Chercher d'abord dans la table users (nouveau workflow - compte déjà créé)
    const userResult = await db.query(`
      SELECT id, email, first_name, last_name, role, password_token_expires, password_set
      FROM users 
      WHERE password_token = $1 AND email = $2 AND is_active = true
    `, [token, email]);

    if (userResult.rows.length > 0) {
      // Nouveau workflow: le compte existe déjà, on met à jour le mot de passe
      const user = userResult.rows[0];

      // Vérifier si le token n'est pas expiré
      if (user.password_token_expires && new Date() > new Date(user.password_token_expires)) {
        return res.status(400).json({
          success: false,
          error: 'Token expiré. Veuillez contacter la crèche pour obtenir un nouveau lien.'
        });
      }

      // Vérifier si le mot de passe n'a pas déjà été défini
      if (user.password_set) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe a déjà été défini pour ce compte.'
        });
      }

      // Hasher et mettre à jour le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.query(`
        UPDATE users 
        SET password = $1, 
            password_set = true, 
            password_token = NULL, 
            password_token_expires = NULL,
            updated_at = NOW()
        WHERE id = $2
      `, [hashedPassword, user.id]);

      // Générer un JWT pour connexion automatique
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      console.log(`✅ Mot de passe créé pour ${user.email} (ID: ${user.id})`);

      return res.json({
        success: true,
        message: 'Mot de passe créé avec succès',
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
    }

    // 2. Fallback: ancien workflow via enrollments (pour compatibilité)
    const enrollmentResult = await db.query(`
      SELECT id, applicant_email, applicant_first_name, applicant_last_name, 
             applicant_phone, child_first_name, child_last_name, 
             password_token, password_token_expires
      FROM enrollments 
      WHERE password_token = $1 AND applicant_email = $2
    `, [token, email]);

    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    const enrollment = enrollmentResult.rows[0];

    // Vérifier si le token n'est pas expiré
    if (new Date() > new Date(enrollment.password_token_expires)) {
      return res.status(400).json({
        success: false,
        error: 'Token expiré. Veuillez contacter la crèche.'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le compte parent
    const newUserResult = await db.query(`
      INSERT INTO users (
        email, password, first_name, last_name, phone, role, password_set, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'parent', true, true, NOW())
      RETURNING id, email, first_name, last_name, role
    `, [
      email,
      hashedPassword,
      enrollment.applicant_first_name,
      enrollment.applicant_last_name,
      enrollment.applicant_phone
    ]);

    const newUser = newUserResult.rows[0];

    // Invalider le token dans enrollments
    await db.query(`
      UPDATE enrollments 
      SET password_token = NULL, password_token_expires = NULL
      WHERE id = $1
    `, [enrollment.id]);

    // Générer un JWT pour connexion automatique
    const jwtToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Compte créé avec succès',
      token: jwtToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Erreur création mot de passe:', error);

    // Gérer l'erreur de duplication d'email
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Un compte existe déjà avec cet email'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du compte'
    });
  }
});

// POST /api/auth/forgot-password - Demande de réinitialisation de mot de passe
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Email invalide',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Rechercher l'utilisateur
    const result = await db.query(
      'SELECT id, email, first_name, last_name, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Toujours retourner succès pour éviter l'énumération des emails
    if (result.rows.length === 0) {
      console.log(`⚠️ Forgot password: email non trouvé - ${email}`);
      return res.json({
        success: true,
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.'
      });
    }

    const user = result.rows[0];

    // Vérifier si le compte est actif
    if (!user.is_active) {
      console.log(`⚠️ Forgot password: compte désactivé - ${email}`);
      return res.json({
        success: true,
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.'
      });
    }

    // Générer un token sécurisé (64 caractères hex)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Expiration dans 1 heure
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Sauvegarder le token en base
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpires, user.id]
    );

    // Construire le lien de réinitialisation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    // Envoyer l'email
    const emailResult = await emailService.sendResetPasswordEmail(user, resetLink);

    if (emailResult.success) {
      console.log(`✅ Email de réinitialisation envoyé à ${email}`);
    } else {
      console.error(`❌ Erreur envoi email reset: ${emailResult.error}`);
    }

    res.json({
      success: true,
      message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.'
    });

  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la demande de réinitialisation'
    });
  }
});

// POST /api/auth/reset-password - Réinitialisation du mot de passe avec token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requis'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères')
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

    const { token, password } = req.body;

    // Rechercher l'utilisateur avec ce token
    const result = await db.query(
      'SELECT id, email, first_name, last_name, role, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lien de réinitialisation invalide ou expiré'
      });
    }

    const user = result.rows[0];

    // Vérifier si le token n'est pas expiré
    if (new Date() > new Date(user.reset_token_expires)) {
      // Nettoyer le token expiré
      await db.query(
        'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
        [user.id]
      );

      return res.status(400).json({
        success: false,
        error: 'Ce lien de réinitialisation a expiré. Veuillez en demander un nouveau.'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe et effacer le token
    await db.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    console.log(`✅ Mot de passe réinitialisé pour ${user.email}`);

    // Générer un JWT pour connexion automatique
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur reset-password:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
});

// GET /api/auth/verify-reset-token/:token - Vérifier si un token de reset est valide
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      'SELECT id, email, first_name, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        valid: false,
        error: 'Lien invalide'
      });
    }

    const user = result.rows[0];

    // Vérifier expiration
    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({
        valid: false,
        error: 'Ce lien a expiré'
      });
    }

    res.json({
      valid: true,
      email: user.email,
      first_name: user.first_name
    });

  } catch (error) {
    console.error('Erreur verify-reset-token:', error);
    res.status(500).json({
      valid: false,
      error: 'Erreur de vérification'
    });
  }
});

module.exports = router;
