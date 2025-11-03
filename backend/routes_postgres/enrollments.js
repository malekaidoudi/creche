const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const enrollmentsController = require('../controllers/enrollmentsController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../config/database');

// =====================================================
// ROUTES PUBLIQUES (VISITEURS)
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
      SELECT id, new_status, created_at, updated_at, decision_notes
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
        status: enrollment.new_status,
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
 * GET /api/enrollments
 * Liste des dossiers d'inscription (staff/admin seulement)
 */
router.get('/', 
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
  enrollmentsController.getAllEnrollments
);

/**
 * GET /api/enrollments/:id
 * Détails d'un dossier avec documents (staff/admin)
 */
router.get('/:id',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
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
               file_size, uploaded_at, is_verified
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
 * Approuver un dossier avec date RDV (admin/staff)
 */
router.post('/:id/approve',
  auth.authenticateToken,
  auth.requireRole('admin', 'staff'),
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
 * Rejeter un dossier avec 4 types (admin/staff)
 */
router.put('/:id/reject',
  auth.authenticateToken,
  auth.requireRole('admin', 'staff'),
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
  auth.requireRole('staff', 'admin'),
  [
    body('status').isIn(['pending', 'in_progress', 'approved', 'rejected_incomplete', 'rejected_deleted', 'archived'])
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      await db.query(`
        UPDATE enrollments 
        SET new_status = $1, decision_notes = $2, updated_at = NOW()
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
  auth.requireRole('admin'),
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

// Routes documents temporairement désactivées - à implémenter plus tard
// TODO: Implémenter uploadDocuments et downloadDocuments

module.exports = router;
