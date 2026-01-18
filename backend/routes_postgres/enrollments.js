const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const enrollmentsController = require('../controllers/enrollmentsController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../config/db_postgres');
const path = require('path');
const fs = require('fs');
const taskService = require('../services/taskService');

// =====================================================
// ROUTES PUBLIQUES (VISITEURS)
// Version: 2025-11-03 - Fix 404 route not found
// =====================================================

/**
 * POST /api/enrollments
 * Création d'un dossier d'inscription par un visiteur
 * Aucune authentification requise
 */
router.post('/', [
  // Validation applicant
  body('applicant_first_name').notEmpty().withMessage('Prénom du candidat requis'),
  body('applicant_last_name').notEmpty().withMessage('Nom du candidat requis'),
  body('applicant_email').isEmail().withMessage('Email valide requis'),
  body('applicant_phone').optional().isLength({ min: 8, max: 20 }),

  // Validation enfant
  body('child_first_name').notEmpty().withMessage('Prénom de l\'enfant requis'),
  body('child_last_name').notEmpty().withMessage('Nom de l\'enfant requis'),
  body('child_birth_date').isDate().withMessage('Date de naissance valide requise'),
  body('child_gender').isIn(['M', 'F', 'Autre']).withMessage('Genre invalide'),

  // Validation optionnelle
  body('regulation_accepted').isBoolean().optional(),
  body('lunch_assistance').isBoolean().optional()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array()
    });
  }
  next();
}, enrollmentsController.createEnrollment);

/**
 * POST /api/enrollments/check-child
 * Vérifier si un enfant existe déjà dans enrollments (étape 1)
 * Vérifie par nom + prénom + date de naissance
 * Route publique pour validation en temps réel du formulaire
 */
router.post('/check-child', [
  body('child_first_name').notEmpty().withMessage('Prénom de l\'enfant requis'),
  body('child_last_name').notEmpty().withMessage('Nom de l\'enfant requis'),
  body('child_birth_date').notEmpty().withMessage('Date de naissance requise')
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

    const { child_first_name, child_last_name, child_birth_date } = req.body;
    const normalizedFirstName = child_first_name.toLowerCase().trim();
    const normalizedLastName = child_last_name.toLowerCase().trim();

    console.log('👶 Check-child reçu:', { child_first_name, child_last_name, child_birth_date });

    // Vérifier dans la table enrollments si un enfant avec même nom/prénom/date existe
    // Utiliser COALESCE pour gérer les deux colonnes status possibles (migration)
    const enrollmentCheck = await db.query(
      `SELECT id, child_first_name, child_last_name, child_birth_date, 
              applicant_first_name, applicant_last_name, applicant_email, 
              COALESCE(new_status::text, status) as status 
       FROM enrollments 
       WHERE LOWER(TRIM(COALESCE(child_first_name, ''))) = $1 
         AND LOWER(TRIM(COALESCE(child_last_name, ''))) = $2 
         AND child_birth_date IS NOT NULL
         AND child_birth_date::date = $3::date
         AND (COALESCE(new_status::text, status) IN ('pending', 'in_progress'))`,
      [normalizedFirstName, normalizedLastName, child_birth_date]
    );

    if (enrollmentCheck.rows.length > 0) {
      const existingEnrollment = enrollmentCheck.rows[0];
      console.log('📋 Dossier existant trouvé:', existingEnrollment.id);

      return res.json({
        success: true,
        exists: true,
        type: 'pending_child',
        message: 'Un dossier d\'inscription pour cet enfant est déjà en cours de traitement. Veuillez patienter, nous vous contacterons prochainement.',
        suggestion: 'redirect_home',
        enrollmentId: existingEnrollment.id,
        parentName: `${existingEnrollment.applicant_first_name} ${existingEnrollment.applicant_last_name}`
      });
    }

    // Vérifier aussi dans la table children (enfants déjà inscrits)
    // Note: la colonne peut être date_of_birth ou birth_date selon la migration
    const childCheck = await db.query(
      `SELECT c.id, c.first_name, c.last_name, 
              COALESCE(c.date_of_birth, c.birth_date) as birth_date
       FROM children c
       WHERE LOWER(TRIM(COALESCE(c.first_name, ''))) = $1 
         AND LOWER(TRIM(COALESCE(c.last_name, ''))) = $2 
         AND COALESCE(c.date_of_birth, c.birth_date) IS NOT NULL
         AND COALESCE(c.date_of_birth, c.birth_date)::date = $3::date
         AND c.is_active = true`,
      [normalizedFirstName, normalizedLastName, child_birth_date]
    );

    if (childCheck.rows.length > 0) {
      console.log('👶 Enfant déjà inscrit trouvé:', childCheck.rows[0].id);

      return res.json({
        success: true,
        exists: true,
        type: 'already_enrolled',
        message: 'Cet enfant est déjà inscrit à la crèche. Si vous êtes le parent, connectez-vous à votre espace.',
        suggestion: 'login',
        childId: childCheck.rows[0].id
      });
    }

    // Enfant non trouvé - peut continuer
    res.json({
      success: true,
      exists: false,
      message: 'Enfant disponible pour inscription'
    });

  } catch (error) {
    console.error('❌ Erreur vérification enfant:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification',
      details: error.message
    });
  }
});

/**
 * POST /api/enrollments/check-email
 * Vérifier si un email existe déjà dans users ou enrollments
 * Route publique pour validation en temps réel du formulaire
 */
router.post('/check-email', [
  body('email').isEmail().withMessage('Email valide requis'),
  body('first_name').notEmpty().withMessage('Prénom requis'),
  body('last_name').notEmpty().withMessage('Nom requis'),
  body('child_first_name').optional(),
  body('child_last_name').optional()
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

    const { email, first_name, last_name, child_first_name, child_last_name } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFirstName = first_name.toLowerCase().trim();
    const normalizedLastName = last_name.toLowerCase().trim();
    const normalizedChildFirstName = child_first_name ? child_first_name.toLowerCase().trim() : null;
    const normalizedChildLastName = child_last_name ? child_last_name.toLowerCase().trim() : null;

    console.log('📧 Check-email reçu:', { email, first_name, last_name });

    // 1. D'ABORD vérifier dans users (parents avec compte existant) - PRIORITAIRE
    const userCheck = await db.query(
      `SELECT id, first_name, last_name, email FROM users WHERE LOWER(email) = $1`,
      [normalizedEmail]
    );

    console.log('👤 Utilisateur trouvé dans users:', userCheck.rows.length > 0 ? userCheck.rows[0] : 'Aucun');

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      const dbFirstName = existingUser.first_name?.toLowerCase().trim() || '';
      const dbLastName = existingUser.last_name?.toLowerCase().trim() || '';
      const nameMatches = dbFirstName === normalizedFirstName && dbLastName === normalizedLastName;

      console.log('🔍 Comparaison noms users:', { dbFirstName, dbLastName, normalizedFirstName, normalizedLastName, nameMatches });

      if (nameMatches) {
        // Même personne - suggérer d'ajouter un enfant depuis l'espace parent
        return res.json({
          success: true,
          exists: true,
          type: 'registered_parent',
          message: 'Vous êtes déjà inscrit comme parent. Connectez-vous à votre espace parent pour ajouter un nouvel enfant.',
          suggestion: 'add_child_from_space',
          redirect: '/mon-espace/ajouter-enfant'
        });
      } else {
        // Email utilisé par quelqu'un d'autre dans users - BLOQUER
        return res.json({
          success: true,
          exists: true,
          type: 'email_taken',
          message: 'Cet email est déjà utilisé par un autre compte. Veuillez utiliser une autre adresse email.',
          suggestion: 'use_different_email'
        });
      }
    }

    // 2. Ensuite vérifier dans enrollments (demandes en cours)
    const enrollmentCheck = await db.query(
      `SELECT id, applicant_first_name, applicant_last_name, applicant_email, status 
       FROM enrollments 
       WHERE LOWER(applicant_email) = $1 AND status IN ('pending', 'in_progress')`,
      [normalizedEmail]
    );

    console.log('📋 Enrollments trouvés:', enrollmentCheck.rows.length);

    if (enrollmentCheck.rows.length > 0) {
      const existingEnrollment = enrollmentCheck.rows[0];
      const enrollmentFirstName = existingEnrollment.applicant_first_name?.toLowerCase().trim() || '';
      const enrollmentLastName = existingEnrollment.applicant_last_name?.toLowerCase().trim() || '';
      const parentNameMatches = enrollmentFirstName === normalizedFirstName && enrollmentLastName === normalizedLastName;

      console.log('🔍 Comparaison parent enrollment:', { enrollmentFirstName, enrollmentLastName, normalizedFirstName, normalizedLastName, parentNameMatches });

      if (parentNameMatches) {
        // Même parent avec dossier en cours - laisser continuer pour un autre enfant
        console.log('✅ Même parent - peut inscrire un autre enfant');
        return res.json({
          success: true,
          exists: false,
          type: 'same_parent',
          message: 'Vous pouvez continuer l\'inscription pour un autre enfant.',
          suggestion: 'continue'
        });
      } else {
        // Infos parent différentes = Email utilisé par quelqu'un d'autre
        return res.json({
          success: true,
          exists: true,
          type: 'email_taken',
          message: 'Cet email est déjà utilisé dans une autre demande d\'inscription. Veuillez utiliser une autre adresse email.',
          suggestion: 'use_different_email'
        });
      }
    }

    // Email disponible
    res.json({
      success: true,
      exists: false,
      message: 'Email disponible'
    });

  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification de l\'email'
    });
  }
});

/**
 * POST /api/enrollments/:id/documents
 * Upload des documents pour un dossier d'inscription
 * Aucune authentification requise (utilise l'ID du dossier)
 */
router.post('/:id/documents',
  upload.fields([
    { name: 'carnet_medical', maxCount: 1 },
    { name: 'acte_naissance', maxCount: 1 },
    { name: 'certificat_medical', maxCount: 1 }
  ]),
  enrollmentsController.uploadDocuments
);

/**
 * GET /api/enrollments/:id/status
 * Vérifier le statut d'un dossier (public avec token temporaire)
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis pour vérifier le statut'
      });
    }

    const result = await db.query(`
      SELECT id, status, created_at, updated_at, decision_notes
      FROM enrollments 
      WHERE id = $1 AND applicant_email = $2
    `, [id, email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dossier non trouvé ou email incorrect'
      });
    }

    const enrollment = result.rows[0];

    res.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        created_at: enrollment.created_at,
        updated_at: enrollment.updated_at,
        notes: enrollment.decision_notes
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du statut'
    });
  }
});

// =====================================================
// ROUTES PROTÉGÉES (STAFF/ADMIN)
// =====================================================

/**
 * GET /api/enrollments/appointments/today
 * Rendez-vous du jour depuis la table appointments (staff/admin)
 */
router.get('/appointments/today',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin', 'developer'),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Récupérer les RDV depuis la table appointments
      const result = await db.query(`
        SELECT 
          a.id,
          a.enrollment_id,
          a.proposed_date,
          a.confirmed_date,
          a.status as appointment_status,
          a.appointment_type,
          a.parent_first_name,
          a.parent_last_name,
          a.parent_phone,
          a.parent_email,
          a.child_first_name,
          a.child_last_name,
          a.rescheduled_count,
          a.appointment_outcome,
          TO_CHAR(COALESCE(a.confirmed_date, a.proposed_date), 'HH24:MI') as appointment_time,
          e.status as enrollment_status
        FROM appointments a
        LEFT JOIN enrollments e ON a.enrollment_id = e.id
        WHERE COALESCE(a.confirmed_date, a.proposed_date) >= $1
          AND COALESCE(a.confirmed_date, a.proposed_date) < $2
          AND a.status NOT IN ('cancelled', 'completed', 'failed')
        ORDER BY COALESCE(a.confirmed_date, a.proposed_date) ASC
      `, [today, tomorrow]);

      res.json({
        success: true,
        count: result.rows.length,
        date: today.toLocaleDateString('fr-FR'),
        appointments: result.rows.map(apt => ({
          id: apt.id,
          enrollment_id: apt.enrollment_id,
          child_name: `${apt.child_first_name || ''} ${apt.child_last_name || ''}`.trim() || 'Enfant',
          child_first_name: apt.child_first_name,
          child_last_name: apt.child_last_name,
          parent_name: `${apt.parent_first_name || ''} ${apt.parent_last_name || ''}`.trim() || 'Parent',
          parent_first_name: apt.parent_first_name,
          parent_last_name: apt.parent_last_name,
          parent_phone: apt.parent_phone,
          parent_email: apt.parent_email,
          appointment_date: apt.proposed_date,
          proposed_date: apt.proposed_date,
          confirmed_date: apt.confirmed_date,
          appointment_time: apt.appointment_time,
          status: apt.appointment_status,
          appointment_type: apt.appointment_type,
          enrollment_status: apt.enrollment_status,
          rescheduled_count: apt.rescheduled_count || 0,
          appointment_outcome: apt.appointment_outcome
        }))
      });

    } catch (error) {
      console.error('❌ Erreur récupération RDV du jour:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des rendez-vous'
      });
    }
  }
);

/**
 * GET /api/enrollments
 * Liste des dossiers d'inscription (staff/admin seulement)
 */
router.get('/',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin', 'developer'),
  enrollmentsController.getAllEnrollments
);

/**
 * GET /api/enrollments/:id
 * Détails d'un dossier avec documents (staff/admin)
 */
router.get('/:id',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin', 'developer'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Récupérer enrollment avec documents
      const enrollmentQuery = `
        SELECT e.*, 
               u.first_name as approved_by_name,
               u.last_name as approved_by_lastname
        FROM enrollments e
        LEFT JOIN users u ON e.approved_by = u.id
        WHERE e.id = $1
      `;

      const documentsQuery = `
        SELECT id, filename, original_filename, document_type,
               file_size, mime_type, cloudinary_url, cloudinary_public_id,
               uploaded_at, is_verified
        FROM enrollment_documents
        WHERE enrollment_id = $1
        ORDER BY uploaded_at DESC
      `;

      const [enrollmentResult, documentsResult] = await Promise.all([
        db.query(enrollmentQuery, [id]),
        db.query(documentsQuery, [id])
      ]);

      if (enrollmentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Dossier non trouvé'
        });
      }

      res.json({
        success: true,
        enrollment: enrollmentResult.rows[0],
        documents: documentsResult.rows
      });

    } catch (error) {
      console.error('❌ Erreur GET /api/enrollments/:id:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du dossier',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/enrollments/:id/approve
 * Approuver un dossier avec date RDV (admin uniquement)
 */
router.post('/:id/approve',
  auth.authenticateToken,
  auth.requireRole('admin', 'developer'),
  [
    body('appointment_date').notEmpty().withMessage('Date de rendez-vous requise')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: errors.array()
      });
    }
    next();
  },
  enrollmentsController.approveEnrollment
);

/**
 * PUT /api/enrollments/:id/reject
 * Rejeter un dossier avec 4 types (admin uniquement)
 */
router.put('/:id/reject',
  auth.authenticateToken,
  auth.requireRole('admin', 'developer'),
  [
    body('rejection_type').isIn(['age_depasse', 'maladie_contagieuse', 'dossier_manquant', 'autre']).withMessage('Type de rejet invalide'),
    body('custom_reason').optional().isString(),
    body('appointment_date').optional().isISO8601()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: errors.array()
      });
    }
    next();
  },
  enrollmentsController.rejectEnrollment
);

/**
 * POST /api/enrollments/:id/choose-appointment
 * Parent choisit un RDV pour apporter documents (public avec token)
 */
router.post('/:id/choose-appointment',
  [
    body('appointment_date').notEmpty().withMessage('Date de rendez-vous requise')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: errors.array()
      });
    }
    next();
  },
  enrollmentsController.chooseAppointment
);

/**
 * PUT /api/enrollments/:id/status
 * Changer le statut d'un dossier (staff/admin)
 */
router.put('/:id/status',
  auth.authenticateToken,
  auth.requireRole('admin', 'developer'),
  [
    body('status').isIn(['pending', 'in_progress', 'approved', 'rejected_incomplete', 'rejected_deleted', 'archived'])
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      await db.query(`
        UPDATE enrollments 
        SET status = $1, decision_notes = $2, updated_at = NOW()
        WHERE id = $3
      `, [status, notes, id]);

      res.json({
        success: true,
        message: 'Statut mis à jour'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du statut'
      });
    }
  }
);

/**
 * DELETE /api/enrollments/:id
 * Supprimer définitivement un dossier (admin seulement)
 */
router.delete('/:id',
  auth.authenticateToken,
  auth.requireRole('admin', 'developer'),
  async (req, res) => {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const { id } = req.params;

      // Archiver avant suppression
      await client.query(`
        INSERT INTO enrollments_archive 
        SELECT * FROM enrollments WHERE id = $1
      `, [id]);

      // Supprimer documents
      await client.query('DELETE FROM enrollment_documents WHERE enrollment_id = $1', [id]);

      // Supprimer enrollment
      await client.query('DELETE FROM enrollments WHERE id = $1', [id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Dossier supprimé et archivé'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression'
      });
    } finally {
      client.release();
    }
  }
);

// =====================================================
// ROUTES DOCUMENTS
// =====================================================

/**
 * GET /api/enrollments/:id/documents/:docId
 * Récupérer les informations d'un document spécifique (staff/admin)
 * Retourne l'URL Cloudinary pour visualisation/téléchargement direct
 */
router.get('/:id/documents/:docId',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin', 'developer'),
  async (req, res) => {
    try {
      const { id, docId } = req.params;

      // Récupérer le document
      const result = await db.query(`
        SELECT 
          id, 
          document_type, 
          original_filename, 
          file_path, 
          mime_type, 
          cloudinary_url,
          cloudinary_public_id,
          file_size,
          uploaded_at,
          is_verified
        FROM enrollment_documents
        WHERE id = $1 AND enrollment_id = $2
      `, [docId, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document non trouvé'
        });
      }

      const doc = result.rows[0];

      // Retourner les informations du document avec URL Cloudinary
      res.json({
        success: true,
        document: {
          id: doc.id,
          type: doc.document_type,
          filename: doc.original_filename,
          url: doc.cloudinary_url || null,
          publicId: doc.cloudinary_public_id || null,
          size: doc.file_size,
          mime_type: doc.mime_type,
          uploaded_at: doc.uploaded_at,
          is_verified: doc.is_verified,
          // URL pour visualisation directe (Cloudinary gère l'affichage)
          view_url: doc.cloudinary_url,
          // URL pour téléchargement forcé
          download_url: doc.cloudinary_url ? `${doc.cloudinary_url.split('/upload/')[0]}/upload/fl_attachment/${doc.cloudinary_url.split('/upload/')[1]}` : null
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération document:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du document'
      });
    }
  }
);

/**
 * GET /api/enrollments/:id/documents
 * Liste des documents d'un dossier (staff/admin)
 * Retourne les URLs Cloudinary pour chaque document
 */
router.get('/:id/documents',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin', 'developer'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(`
        SELECT 
          id, 
          document_type, 
          original_filename, 
          file_size, 
          mime_type,
          cloudinary_url,
          cloudinary_public_id,
          is_verified,
          uploaded_at
        FROM enrollment_documents
        WHERE enrollment_id = $1
        ORDER BY uploaded_at DESC
      `, [id]);

      res.json({
        success: true,
        count: result.rows.length,
        documents: result.rows.map(doc => ({
          id: doc.id,
          type: doc.document_type,
          filename: doc.original_filename,
          size: doc.file_size,
          mime_type: doc.mime_type,
          is_verified: doc.is_verified,
          uploaded_at: doc.uploaded_at,
          // URLs Cloudinary
          cloudinary_url: doc.cloudinary_url,
          cloudinary_public_id: doc.cloudinary_public_id,
          // URL pour visualisation directe (ouvre dans le navigateur)
          view_url: doc.cloudinary_url,
          // URL pour téléchargement forcé (force le download)
          download_url: doc.cloudinary_url ?
            `${doc.cloudinary_url.split('/upload/')[0]}/upload/fl_attachment/${doc.cloudinary_url.split('/upload/')[1]}` :
            null,
          // URL API pour récupérer les détails
          api_url: `/api/enrollments/${id}/documents/${doc.id}`
        }))
      });

    } catch (error) {
      console.error('❌ Erreur récupération documents:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des documents'
      });
    }
  }
);

/**
 * POST /api/enrollments/add-child
 * Demande d'inscription d'un nouvel enfant par un parent existant
 * WORKFLOW: Crée seulement l'inscription (pending). L'enfant sera créé à la validation du RDV.
 * Limite: Maximum 3 enfants par parent
 * Authentification requise (parent)
 */
router.post('/add-child',
  auth.authenticateToken,
  auth.requireRole('parent'),
  upload.fields([
    { name: 'carnet_medical', maxCount: 1 },
    { name: 'acte_naissance', maxCount: 1 },
    { name: 'certificat_medical', maxCount: 1 }
  ]),
  [
    body('child_first_name').notEmpty().withMessage('Prénom de l\'enfant requis'),
    body('child_last_name').notEmpty().withMessage('Nom de l\'enfant requis'),
    body('child_birth_date').isDate().withMessage('Date de naissance valide requise'),
    body('child_gender').isIn(['M', 'F', 'Autre']).withMessage('Genre invalide')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const parentId = req.user.userId || req.user.id;
      const { child_first_name, child_last_name, child_birth_date, child_gender, medical_info } = req.body;

      // Récupérer les infos du parent
      const parentResult = await db.query(
        'SELECT id, first_name, last_name, email, phone FROM users WHERE id = $1',
        [parentId]
      );

      if (parentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Parent non trouvé'
        });
      }

      const parent = parentResult.rows[0];

      // Vérifier le nombre d'enfants existants (max 3)
      const childrenCountResult = await db.query(
        'SELECT COUNT(*) as count FROM children WHERE parent_id = $1 AND is_active = true',
        [parentId]
      );
      const currentChildrenCount = parseInt(childrenCountResult.rows[0].count, 10);

      // Vérifier aussi les inscriptions en cours (pending/in_progress) pour ce parent
      const pendingEnrollmentsResult = await db.query(
        `SELECT COUNT(*) as count FROM enrollments 
         WHERE parent_id = $1 AND status IN ('pending', 'in_progress')`,
        [parentId]
      );
      const pendingCount = parseInt(pendingEnrollmentsResult.rows[0].count, 10);

      const totalChildren = currentChildrenCount + pendingCount;

      if (totalChildren >= 3) {
        return res.status(400).json({
          success: false,
          error: 'Vous avez atteint le nombre maximum d\'enfants autorisés (3)',
          currentChildren: currentChildrenCount,
          pendingEnrollments: pendingCount
        });
      }

      // NE PAS créer l'enfant maintenant - il sera créé à la validation du RDV
      // Créer seulement la demande d'inscription (comme pour le formulaire visiteur)
      const enrollmentResult = await db.query(`
        INSERT INTO enrollments (
          applicant_first_name, applicant_last_name, applicant_email, applicant_phone,
          child_first_name, child_last_name, child_birth_date, child_gender,
          child_medical_info, parent_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
        RETURNING id, status
      `, [
        parent.first_name, parent.last_name, parent.email, parent.phone,
        child_first_name, child_last_name, child_birth_date, child_gender,
        medical_info || null, parentId
      ]);

      const enrollment = enrollmentResult.rows[0];

      // Upload des documents si fournis (méthode unifiée)
      const files = req.files || {};
      const cloudinaryService = require('../services/cloudinaryService');

      for (const docType of ['carnet_medical', 'acte_naissance', 'certificat_medical']) {
        if (files[docType] && files[docType][0]) {
          const file = files[docType][0];
          try {
            // Upload vers Cloudinary avec la méthode unifiée
            const uploadResult = await cloudinaryService.uploadEnrollmentDocument(
              file.buffer,
              enrollment.id,
              docType
            );

            if (uploadResult.success) {
              // Sauvegarder en base
              await db.query(`
                INSERT INTO enrollment_documents (
                  enrollment_id, document_type, original_filename, file_path,
                  mime_type, file_size, cloudinary_url, cloudinary_public_id, uploaded_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
              `, [
                enrollment.id,
                docType,
                file.originalname,
                uploadResult.url,
                file.mimetype,
                file.size,
                uploadResult.url,
                uploadResult.publicId
              ]);
            }
          } catch (uploadError) {
            console.error(`Erreur upload ${docType}:`, uploadError);
          }
        }
      }

      // Créer une tâche pour l'admin dans la table TASKS
      // La tâche est créée le jour de l'inscription (même si jour non ouvrable)
      try {
        const adminResult = await db.query(`SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`);
        const adminId = adminResult.rows.length > 0 ? adminResult.rows[0].id : null;

        if (adminId) {
          const now = new Date();

          const taskResult = await taskService.createTask({
            title: `📋 Traiter dossier inscription #${enrollment.id}`,
            description: `Demande d'ajout d'enfant par ${parent.first_name} ${parent.last_name} (parent existant). Email: ${parent.email}. Lien: /dashboard/pending-enrollments`,
            assigned_to: adminId,
            due_date: now,
            priority: 'high'
          }, adminId);

          if (taskResult.success) {
            console.log(`✅ Tâche créée dans table TASKS - ID: ${taskResult.task.id}, dossier #${enrollment.id}`);
          }
        }
      } catch (taskError) {
        console.error('⚠️ Erreur création tâche:', taskError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Demande d\'inscription envoyée avec succès. Un rendez-vous vous sera proposé.',
        enrollment: {
          id: enrollment.id,
          status: enrollment.status
          // child_id sera créé après validation du RDV
        }
      });

    } catch (error) {
      console.error('Erreur ajout enfant:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la demande d\'inscription'
      });
    }
  }
);

module.exports = router;
