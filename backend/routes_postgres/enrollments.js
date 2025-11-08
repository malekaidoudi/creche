const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const enrollmentsController = require('../controllers/enrollmentsController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../config/db_postgres');
const path = require('path');
const fs = require('fs');

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
 * GET /api/enrollments/appointments/today
 * Rendez-vous du jour (staff/admin)
 */
router.get('/appointments/today',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await db.query(`
        SELECT 
          e.id,
          e.child_first_name,
          e.child_last_name,
          e.applicant_first_name,
          e.applicant_last_name,
          e.applicant_phone,
          e.applicant_email,
          e.appointment_date,
          e.new_status,
          TO_CHAR(e.appointment_date, 'HH24:MI') as appointment_time
        FROM enrollments e
        WHERE e.appointment_date >= $1
          AND e.appointment_date < $2
          AND e.new_status IN ('approved', 'rejected_incomplete')
        ORDER BY e.appointment_date ASC
      `, [today, tomorrow]);
      
      res.json({
        success: true,
        count: result.rows.length,
        date: today.toLocaleDateString('fr-FR'),
        appointments: result.rows.map(apt => ({
          id: apt.id,
          child_name: `${apt.child_first_name} ${apt.child_last_name || ''}`.trim(),
          parent_name: `${apt.applicant_first_name} ${apt.applicant_last_name || ''}`.trim(),
          parent_phone: apt.applicant_phone,
          parent_email: apt.applicant_email,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          status: apt.new_status
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

/**
 * GET /api/enrollments/:id/documents/:docId
 * Récupérer les informations d'un document spécifique (staff/admin)
 * Retourne l'URL Cloudinary pour visualisation/téléchargement direct
 */
router.get('/:id/documents/:docId',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
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
  auth.requireRole('staff', 'admin'),
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

module.exports = router;
