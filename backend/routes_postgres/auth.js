const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/db_postgres');
const { logLoginSuccess, logLoginFailed } = require('../middleware/activityLogger');
const emailService = require('../emails/emailService');
const tokenBlacklistService = require('../services/tokenBlacklistService');
const auth = require('../middleware/auth');

const router = express.Router();

// Configuration JWT
// Sécurité (cf. documentsV2/23_ANOMALIES_ET_RECOMMANDATIONS.md, anomalie #1) :
// plus de valeur par défaut codée en dur. Si JWT_SECRET n'est pas défini, le
// serveur doit s'arrêter immédiatement plutôt que de signer/vérifier des
// jetons avec un secret public et prévisible.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET manquant : définissez cette variable d'environnement avant de démarrer le serveur (voir backend/.env.example)."
  );
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/login - Connexion utilisateur (Email, Téléphone ou Pseudo)
router.post('/login', [
  body('password').isLength({ min: 1 }).withMessage('Mot de passe requis')
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

    const rawIdentifier = (req.body.identifier || req.body.email || '').trim();
    const { password } = req.body;

    if (!rawIdentifier) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez saisir votre numéro de téléphone, email ou pseudo'
      });
    }

    // Normalisation intelligente pour numéros de téléphone (notamment Tunisie 8 chiffres ex: 98..., 20..., 50...)
    const cleanPhone = rawIdentifier.replace(/[\s.-]/g, '');
    const phoneVariants = Array.from(new Set([rawIdentifier, cleanPhone]));

    // Détection format tunisien (8 chiffres)
    if (/^\d{8}$/.test(cleanPhone)) {
      phoneVariants.push(`+216${cleanPhone}`);
      phoneVariants.push(`216${cleanPhone}`);
      phoneVariants.push(`00216${cleanPhone}`);
      phoneVariants.push(`+216 ${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5)}`);
      phoneVariants.push(`${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5)}`);
    } else if (/^(\+216|00216|216)(\d{8})$/.test(cleanPhone)) {
      const local8 = cleanPhone.replace(/^(\+216|00216|216)/, '');
      phoneVariants.push(local8);
      phoneVariants.push(`+216${local8}`);
      phoneVariants.push(`+216 ${local8.slice(0, 2)} ${local8.slice(2, 5)} ${local8.slice(5)}`);
      phoneVariants.push(`${local8.slice(0, 2)} ${local8.slice(2, 5)} ${local8.slice(5)}`);
    }

    // Rechercher l'utilisateur dans PostgreSQL par email, téléphone ou username (Direction, Staff et Parents)
    const result = await db.query(
      `SELECT id, email, password, first_name, last_name, role, phone, username, profile_image, is_active, gender, staff_position 
       FROM users 
       WHERE (email IS NOT NULL AND LOWER(email) = LOWER($1))
          OR (username IS NOT NULL AND LOWER(username) = LOWER($1))
          OR (phone IS NOT NULL AND (
              phone = ANY($2::text[]) 
              OR REPLACE(REPLACE(phone, ' ', ''), '-', '') = ANY($2::text[])
          ))`,
      [rawIdentifier, phoneVariants]
    );

    if (result.rows.length === 0) {
      logLoginFailed(rawIdentifier, 'Utilisateur introuvable', req).catch(err => {
        console.warn('⚠️ Erreur log échec connexion:', err.message);
      });
      return res.status(401).json({ success: false, error: 'Identifiant ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier si l'utilisateur est actif
    if (!user.is_active) {
      logLoginFailed(rawIdentifier, 'Compte désactivé', req).catch(err => {
        console.warn('⚠️ Erreur log échec connexion:', err.message);
      });
      return res.status(401).json({ success: false, error: 'Compte désactivé' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logLoginFailed(email, 'Mot de passe incorrect', req).catch(err => {
        console.warn('⚠️ Erreur log échec connexion:', err.message);
      });
      return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect' });
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
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
  }
});

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
// Passe par authenticateToken : vérifie la signature JWT, l'expiration ET la
// liste de révocation (tokenBlacklistService) — cf. audit documentsV2, anomalie #8.
router.get('/me', auth.authenticateToken, async (req, res) => {
  try {
    // Récupérer les informations utilisateur incluant username
    const result = await db.query(
      'SELECT id, email, username, first_name, last_name, role, phone, profile_image, is_active, gender, staff_position FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];

    // Vérifier si un parent a un dossier contacts incomplet (pour afficher la bannière persistante sur mobile)
    let hasIncompleteContacts = false;
    if (user.role === 'parent') {
      const childrenCheck = await db.query(
        `SELECT emergency_contact_choice, emergency_contact_name, emergency_contact_phone,
                father_name, father_phone, mother_name, mother_phone
         FROM children
         WHERE parent_id = $1 AND (is_active = true OR is_active IS NULL)
         LIMIT 5`,
        [user.id]
      );

      if (childrenCheck.rows.length > 0) {
        hasIncompleteContacts = childrenCheck.rows.some(child => {
          // Contact urgence manquant si pas de choix père/mère ET pas de custom renseigné
          const hasEmergency = ['father', 'mother'].includes(child.emergency_contact_choice) ||
                               Boolean(child.emergency_contact_phone && child.emergency_contact_phone.trim() !== '');
          // 2ème parent manquant si titulaire père sans mère ou titulaire mère sans père
          const isMother = user.gender === 'female';
          const hasSecondParent = isMother 
            ? Boolean(child.father_name && child.father_name.trim() !== '')
            : Boolean(child.mother_name && child.mother_name.trim() !== '');

          return !hasEmergency || !hasSecondParent;
        });
      }
    }

    user.has_incomplete_contacts = hasIncompleteContacts;

    res.json({ user });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Token invalide' });
    }
    console.error('Erreur me:', error);
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
  }
});

// GET /api/auth/check-username - Vérifier l'unicité du pseudo parmi les comptes actifs
router.get('/check-username', async (req, res) => {
  try {
    const rawUsername = (req.query.username || '').trim().toLowerCase();
    if (!rawUsername || rawUsername.length < 3) {
      return res.json({ available: false, error: 'Le pseudo doit comporter au moins 3 caractères' });
    }

    // Unicité uniquement parmi les comptes actifs (is_active = true)
    const checkResult = await db.query(
      'SELECT id FROM users WHERE LOWER(username) = $1 AND is_active = true LIMIT 1',
      [rawUsername]
    );

    res.json({
      success: true,
      available: checkResult.rows.length === 0,
      username: rawUsername
    });
  } catch (error) {
    console.error('Erreur check-username:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la vérification du pseudo' });
  }
});

// POST /api/auth/logout - Déconnexion sécurisée côté serveur (Révocation du jeton)
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.body?.token;

    if (token) {
      await tokenBlacklistService.revokeToken(token);
    }

    res.json({ success: true, message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);
    res.json({ success: true, message: 'Déconnexion réussie' });
  }
});

// POST /api/auth/create-password - Création mot de passe & pseudo après invitation (WhatsApp/Email)
router.post('/create-password', [
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

    const { token, email, username, password } = req.body;

    // 1. Chercher dans la table users par token (avec email si fourni, sinon par token seul)
    let userResult;
    if (email && email.trim() !== '') {
      userResult = await db.query(`
        SELECT id, email, username, first_name, last_name, role, password_token_expires, password_set
        FROM users 
        WHERE password_token = $1 AND (LOWER(email) = LOWER($2) OR email LIKE '%noemail%') AND is_active = true
      `, [token, email.trim()]);
    } else {
      userResult = await db.query(`
        SELECT id, email, username, first_name, last_name, role, password_token_expires, password_set
        FROM users 
        WHERE password_token = $1 AND is_active = true
      `, [token]);
    }

    if (userResult.rows.length > 0) {
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

      // Si un username est choisi, vérifier qu'il est disponible parmi les comptes actifs
      let cleanUsername = null;
      if (username && typeof username === 'string' && username.trim().length >= 3) {
        cleanUsername = username.trim().toLowerCase();
        const usernameCheck = await db.query(
          'SELECT id FROM users WHERE LOWER(username) = $1 AND is_active = true AND id != $2',
          [cleanUsername, user.id]
        );
        if (usernameCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ce pseudo est déjà utilisé par un autre compte actif'
          });
        }
      }

      // Hasher et mettre à jour le mot de passe (et le username si renseigné)
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.query(`
        UPDATE users 
        SET password = $1, 
            username = COALESCE($2, username),
            password_set = true, 
            password_token = NULL, 
            password_token_expires = NULL,
            updated_at = NOW()
        WHERE id = $3
      `, [hashedPassword, cleanUsername, user.id]);

      // Générer un JWT pour connexion automatique
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      console.log(`✅ Mot de passe créé pour ${user.first_name} ${user.last_name} (ID: ${user.id})`);

      return res.json({
        success: true,
        message: 'Compte activé avec succès',
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          username: cleanUsername || user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Lien d\'activation invalide ou expiré'
    });

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
