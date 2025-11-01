const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const enrollmentsController = require('../controllers/enrollmentsController_v2');
const auth = require('../middleware/auth');

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
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du dossier'
      });
    }
  }
);

/**
 * POST /api/enrollments/:id/approve
 * Approuver un dossier (admin seulement) - TRANSACTION ATOMIQUE
 */
router.post('/:id/approve',
  auth.authenticateToken,
  auth.requireRole('admin'),
  [
    body('decision_notes').optional().isString(),
    body('send_invitation').isBoolean().optional()
  ],
  enrollmentsController.approveEnrollment
);

/**
 * POST /api/enrollments/:id/reject
 * Rejeter un dossier (staff/admin)
 */
router.post('/:id/reject',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
  [
    body('reason').notEmpty().withMessage('Raison du rejet requise'),
    body('type').isIn(['incomplete', 'delete']).withMessage('Type de rejet invalide')
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
 * POST /api/enrollments/:id/documents
 * Upload de documents pour un dossier
 */
router.post('/:id/documents',
  enrollmentsController.uploadDocuments
);

/**
 * GET /api/enrollments/:id/documents/:docId/download
 * Télécharger un document (staff/admin ou propriétaire)
 */
router.get('/:id/documents/:docId/download',
  auth.authenticateToken,
  async (req, res) => {
    try {
      const { id, docId } = req.params;
      
      // Vérifier les permissions
      const canAccess = req.user.role === 'admin' || req.user.role === 'staff';
      
      if (!canAccess) {
        // Vérifier si c'est le propriétaire du dossier
        const ownerCheck = await db.query(`
          SELECT 1 FROM enrollments e
          JOIN users u ON e.parent_id = u.id
          WHERE e.id = $1 AND u.id = $2
        `, [id, req.user.id]);
        
        if (ownerCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Accès refusé'
          });
        }
      }
      
      // Récupérer le document
      const doc = await db.query(`
        SELECT file_path, original_filename, mime_type
        FROM enrollment_documents
        WHERE id = $1 AND enrollment_id = $2
      `, [docId, id]);
      
      if (doc.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Document non trouvé'
        });
      }
      
      const document = doc.rows[0];
      
      res.setHeader('Content-Type', document.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);
      res.sendFile(path.resolve(document.file_path));
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors du téléchargement'
      });
    }
  }
);

module.exports = router;
