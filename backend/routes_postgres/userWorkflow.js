/**
 * Routes pour le workflow de création d'utilisateurs (Parent/Staff)
 * 
 * Workflow Parent:
 * 1. Admin crée un enfant (statut: inscrit, orphelin)
 * 2. Admin crée un compte parent avec sélection d'enfant orphelin
 * 3. Email envoyé au parent avec lien de création de mot de passe
 * 4. Parent crée son mot de passe et accède à son compte
 * 
 * Workflow Staff:
 * 1. Admin crée un compte personnel avec poste
 * 2. Email envoyé au personnel avec lien de création de mot de passe
 * 3. Personnel crée son mot de passe et accède à son compte
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { pool } = require('../config/db_postgres');
const auth = require('../middleware/auth');
const emailService = require('../emails/emailService');

// =====================================================
// CRÉATION DE COMPTE PARENT PAR L'ADMIN
// =====================================================

/**
 * POST /api/user-workflow/create-parent
 * Crée un compte parent et l'associe à un enfant orphelin
 * Envoie un email avec lien de création de mot de passe
 */
router.post('/create-parent', auth.authenticateToken, auth.requireRole('admin'), [
    body('first_name').notEmpty().withMessage('Prénom requis'),
    body('last_name').notEmpty().withMessage('Nom requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('phone').notEmpty().withMessage('Téléphone requis'),
    body('child_ids').isArray({ min: 1 }).withMessage('Au moins un enfant requis')
], async (req, res) => {
    const client = await pool.connect();

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
            email,
            phone,
            child_ids // Tableau d'IDs d'enfants
        } = req.body;

        await client.query('BEGIN');

        // 1. Vérifier que l'email n'existe pas déjà
        const emailCheck = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                error: 'Cet email est déjà utilisé'
            });
        }

        // 2. Vérifier que tous les enfants existent et sont orphelins
        for (const child_id of child_ids) {
            const childCheck = await client.query(
                'SELECT id, first_name, last_name, parent_id FROM children WHERE id = $1 AND is_active = true',
                [child_id]
            );

            if (childCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    error: `Enfant ID ${child_id} non trouvé`
                });
            }

            if (childCheck.rows[0].parent_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: `L'enfant ${childCheck.rows[0].first_name} ${childCheck.rows[0].last_name} est déjà associé à un parent`
                });
            }
        }

        // 3. Générer un mot de passe temporaire
        const tempPasswordPlain = crypto.randomBytes(8).toString('hex');
        const tempPassword = await bcrypt.hash(tempPasswordPlain, 10);

        // 4. Créer le compte parent
        const userResult = await client.query(`
            INSERT INTO users (email, password, first_name, last_name, phone, role, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, 'parent', true, NOW())
            RETURNING id, email, first_name, last_name, phone, role
        `, [email, tempPassword, first_name, last_name, phone]);

        const newUser = userResult.rows[0];

        // 5. Associer tous les enfants au parent
        for (const child_id of child_ids) {
            await client.query(
                'UPDATE children SET parent_id = $1, updated_at = NOW() WHERE id = $2',
                [newUser.id, child_id]
            );

            // Créer l'inscription si elle n'existe pas
            await client.query(`
                INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, created_at)
                VALUES ($1, $2, 'approved', CURRENT_DATE, NOW())
                ON CONFLICT DO NOTHING
            `, [child_id, newUser.id]);
        }

        // 6. Mettre à jour le contact d'urgence des enfants
        await client.query(`
            UPDATE children 
            SET emergency_contact_name = $1, emergency_contact_phone = $2, updated_at = NOW()
            WHERE id = ANY($3) AND emergency_contact_name IS NULL
        `, [`${first_name} ${last_name}`, phone, child_ids]);

        await client.query('COMMIT');

        // 7. Récupérer les enfants associés
        const childrenResult = await pool.query(
            'SELECT id, first_name, last_name FROM children WHERE id = ANY($1)',
            [child_ids]
        );
        const children = childrenResult.rows;

        // 8. Générer un token pour la création de mot de passe
        const passwordToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

        // Sauvegarder le token dans la base
        await pool.query(`
            UPDATE users 
            SET password_token = $1, password_token_expires = $2, password_set = false
            WHERE id = $3
        `, [passwordToken, tokenExpires, newUser.id]);

        // 9. Envoyer l'email avec le lien de création de mot de passe
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const createPasswordUrl = `${frontendUrl}/create-password?token=${passwordToken}&email=${encodeURIComponent(email)}`;
        const childName = children.map(c => `${c.first_name} ${c.last_name}`).join(', ');

        try {
            await emailService.sendEmail('PARENT_WELCOME', email, {
                parentName: `${first_name} ${last_name}`,
                childName: childName,
                createPasswordUrl: createPasswordUrl,
                expiresIn: '7 jours'
            });
            console.log(`✅ Email envoyé à ${email}`);
        } catch (emailError) {
            console.error('⚠️ Erreur envoi email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Compte parent créé avec succès. Un email avec le lien de création de mot de passe a été envoyé.',
            user: newUser,
            children: children,
            passwordLink: createPasswordUrl // Pour affichage admin si besoin
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur création parent:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du compte parent'
        });
    } finally {
        client.release();
    }
});

// =====================================================
// CRÉATION DE COMPTE PERSONNEL PAR L'ADMIN
// =====================================================

/**
 * POST /api/user-workflow/create-staff
 * Crée un compte personnel avec poste
 * Envoie un email avec lien de création de mot de passe
 */
router.post('/create-staff', auth.authenticateToken, auth.requireRole('admin'), [
    body('first_name').notEmpty().withMessage('Prénom requis'),
    body('last_name').notEmpty().withMessage('Nom requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('phone').notEmpty().withMessage('Téléphone requis'),
    body('gender').isIn(['male', 'female']).withMessage('Sexe invalide'),
    body('staff_position').isIn(['director', 'educator', 'health', 'cleaning', 'security', 'kitchen', 'other']).withMessage('Poste invalide')
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
            email,
            phone,
            gender,
            staff_position
        } = req.body;

        // 1. Vérifier que l'email n'existe pas déjà
        const emailCheck = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Cet email est déjà utilisé'
            });
        }

        // 2. Générer un token pour la création du mot de passe
        const passwordToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

        // 3. Créer le compte personnel (sans mot de passe)
        const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

        const userResult = await pool.query(`
      INSERT INTO users (
        email, password, first_name, last_name, phone, gender, role, staff_position,
        password_token, password_token_expires, password_set,
        is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'staff', $7, $8, $9, false, true, NOW())
      RETURNING id, email, first_name, last_name, phone, role, staff_position
    `, [
            email, tempPassword, first_name, last_name, phone, gender, staff_position,
            passwordToken, tokenExpires
        ]);

        const newUser = userResult.rows[0];

        // 4. Envoyer l'email de création de mot de passe
        const createPasswordUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/create-password?token=${passwordToken}&email=${encodeURIComponent(email)}`;

        const positionLabels = {
            director: 'Directeur/Directrice',
            educator: 'Éducateur/Éducatrice',
            health: 'Personnel de santé',
            cleaning: 'Personnel d\'entretien',
            security: 'Agent de sécurité',
            kitchen: 'Personnel de cuisine',
            other: 'Autre'
        };

        try {
            // Utiliser la bonne signature: sendEmail(emailType, recipient, variables)
            await emailService.sendEmail('STAFF_WELCOME', email, {
                staffName: `${first_name} ${last_name}`,
                position: positionLabels[staff_position] || staff_position,
                createPasswordUrl,
                expiresIn: '7 jours'
            });
            console.log(`✅ Email envoyé à ${email}`);
        } catch (emailError) {
            console.error('⚠️ Erreur envoi email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Compte personnel créé avec succès',
            user: newUser,
            passwordLink: createPasswordUrl // Pour debug/test uniquement
        });

    } catch (error) {
        console.error('Erreur création personnel:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du compte personnel'
        });
    }
});

// =====================================================
// CRÉATION DE MOT DE PASSE (PARENT/STAFF)
// =====================================================

/**
 * POST /api/user-workflow/set-password
 * Permet à un utilisateur de définir son mot de passe via le token reçu par email
 */
router.post('/set-password', [
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

        // 1. Vérifier le token et récupérer l'utilisateur
        const userResult = await pool.query(`
      SELECT id, email, first_name, last_name, role, password_token_expires, password_set
      FROM users 
      WHERE password_token = $1 AND email = $2 AND is_active = true
    `, [token, email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Token invalide ou expiré'
            });
        }

        const user = userResult.rows[0];

        // 2. Vérifier si le token n'est pas expiré
        if (new Date() > new Date(user.password_token_expires)) {
            return res.status(400).json({
                success: false,
                error: 'Token expiré. Veuillez contacter la crèche pour obtenir un nouveau lien.'
            });
        }

        // 3. Vérifier si le mot de passe n'a pas déjà été défini
        if (user.password_set) {
            return res.status(400).json({
                success: false,
                error: 'Le mot de passe a déjà été défini. Utilisez la fonction "Mot de passe oublié" si nécessaire.'
            });
        }

        // 4. Hasher et mettre à jour le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(`
      UPDATE users 
      SET password = $1, password_token = NULL, password_token_expires = NULL, password_set = true, updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, user.id]);

        res.json({
            success: true,
            message: 'Mot de passe créé avec succès. Vous pouvez maintenant vous connecter.',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Erreur définition mot de passe:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la définition du mot de passe'
        });
    }
});

// =====================================================
// INSCRIPTION PARENT DEPUIS LE SITE (SELF-SERVICE)
// =====================================================

/**
 * POST /api/user-workflow/register-parent
 * Permet à un parent de créer son compte et de s'associer à un enfant orphelin
 * Option: "Mon enfant est déjà inscrit"
 */
router.post('/register-parent', [
    body('first_name').notEmpty().withMessage('Prénom requis'),
    body('last_name').notEmpty().withMessage('Nom requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('phone').notEmpty().withMessage('Téléphone requis'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
    body('child_already_enrolled').isBoolean().withMessage('Indication enfant inscrit requise')
], async (req, res) => {
    const client = await pool.connect();

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
            email,
            phone,
            password,
            child_already_enrolled,
            child_id // Optionnel: si l'enfant est déjà sélectionné
        } = req.body;

        await client.query('BEGIN');

        // 1. Vérifier que l'email n'existe pas déjà
        const emailCheck = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                error: 'Cet email est déjà utilisé'
            });
        }

        // 2. Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Créer le compte parent
        const userResult = await client.query(`
      INSERT INTO users (
        email, password, first_name, last_name, phone, role, password_set, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'parent', true, true, NOW())
      RETURNING id, email, first_name, last_name, phone, role
    `, [email, hashedPassword, first_name, last_name, phone]);

        const newUser = userResult.rows[0];

        // 4. Si un enfant est sélectionné, l'associer
        let associatedChild = null;
        if (child_already_enrolled && child_id) {
            const childCheck = await client.query(
                'SELECT id, first_name, last_name, parent_id FROM children WHERE id = $1 AND is_active = true AND parent_id IS NULL',
                [child_id]
            );

            if (childCheck.rows.length > 0) {
                // Associer l'enfant
                await client.query(
                    'UPDATE children SET parent_id = $1, updated_at = NOW() WHERE id = $2',
                    [newUser.id, child_id]
                );

                await client.query(`
          INSERT INTO parent_children (parent_id, child_id, relationship, is_primary, created_at)
          VALUES ($1, $2, 'parent', true, NOW())
        `, [newUser.id, child_id]);

                await client.query(`
          INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, created_at)
          VALUES ($1, $2, 'approved', CURRENT_DATE, NOW())
        `, [child_id, newUser.id]);

                associatedChild = childCheck.rows[0];
            }
        }

        await client.query('COMMIT');

        // 5. Envoyer email de confirmation
        try {
            // Utiliser la bonne signature: sendEmail(emailType, recipient, variables)
            await emailService.sendEmail('PARENT_REGISTRATION_CONFIRMATION', email, {
                parentName: `${first_name} ${last_name}`,
                childName: associatedChild ? `${associatedChild.first_name} ${associatedChild.last_name}` : null,
                needsChildAssociation: child_already_enrolled && !associatedChild
            });
        } catch (emailError) {
            console.error('⚠️ Erreur envoi email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: associatedChild
                ? `Compte créé et associé à ${associatedChild.first_name} ${associatedChild.last_name}`
                : 'Compte créé avec succès',
            user: newUser,
            child: associatedChild,
            needsChildAssociation: child_already_enrolled && !associatedChild
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur inscription parent:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'inscription'
        });
    } finally {
        client.release();
    }
});

// =====================================================
// RENVOYER LE LIEN DE CRÉATION DE MOT DE PASSE
// =====================================================

/**
 * POST /api/user-workflow/resend-password-link
 * Renvoie le lien de création de mot de passe à un utilisateur
 */
router.post('/resend-password-link', auth.authenticateToken, auth.requireRole('admin'), [
    body('user_id').isInt().withMessage('ID utilisateur requis')
], async (req, res) => {
    try {
        const { user_id } = req.body;

        // 1. Récupérer l'utilisateur
        const userResult = await pool.query(
            'SELECT id, email, first_name, last_name, role, password_set FROM users WHERE id = $1 AND is_active = true',
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        const user = userResult.rows[0];

        if (user.password_set) {
            return res.status(400).json({
                success: false,
                error: 'L\'utilisateur a déjà défini son mot de passe'
            });
        }

        // 2. Générer un nouveau token
        const passwordToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await pool.query(`
      UPDATE users SET password_token = $1, password_token_expires = $2, updated_at = NOW()
      WHERE id = $3
    `, [passwordToken, tokenExpires, user_id]);

        // 3. Envoyer l'email
        const createPasswordUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/create-password?token=${passwordToken}&email=${encodeURIComponent(user.email)}`;

        try {
            // Utiliser la bonne signature: sendEmail(emailType, recipient, variables)
            await emailService.sendEmail('RESEND_PASSWORD_LINK', user.email, {
                userName: `${user.first_name} ${user.last_name}`,
                createPasswordUrl,
                expiresIn: '7 jours'
            });
            console.log(`✅ Email de renvoi de lien envoyé à ${user.email}`);
        } catch (emailError) {
            console.error('⚠️ Erreur envoi email:', emailError);
        }

        res.json({
            success: true,
            message: 'Nouveau lien envoyé avec succès',
            passwordLink: createPasswordUrl
        });

    } catch (error) {
        console.error('Erreur renvoi lien:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du renvoi du lien'
        });
    }
});

module.exports = router;
