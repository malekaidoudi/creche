/**
 * ROUTES RENDEZ-VOUS
 * Admin ↔ Parent
 */

const express = require('express');
const router = express.Router();
const appointmentService = require('../services/appointmentService');
const auth = require('../middleware/auth');

/**
 * POST /api/appointments - Créer un RDV (admin) ou demander un RDV (parent)
 */
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    // Si parent, créer avec status 'pending' automatiquement
    if (req.user.role === 'parent') {
      req.body.status = 'pending';
      req.body.parent_id = req.user.userId;
    }

    const result = await appointmentService.createAppointment(req.body, req.user.userId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur POST /api/appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du rendez-vous'
    });
  }
});

/**
 * GET /api/appointments/my - Récupérer les RDV du parent connecté
 */
router.get('/my', auth.authenticateToken, async (req, res) => {
  try {
    const { pool } = require('../config/db_postgres');

    // Récupérer les RDV du parent par son user_id ou email
    const result = await pool.query(`
      SELECT 
        a.*,
        TO_CHAR(a.proposed_date, 'YYYY-MM-DD"T"HH24:MI') as proposed_date_formatted,
        TO_CHAR(a.confirmed_date, 'YYYY-MM-DD"T"HH24:MI') as confirmed_date_formatted,
        c.first_name as child_first_name,
        c.last_name as child_last_name
      FROM appointments a
      LEFT JOIN children c ON a.child_id = c.id
      WHERE a.parent_id = $1
         OR a.parent_email = (SELECT email FROM users WHERE id = $1)
      ORDER BY COALESCE(a.confirmed_date, a.proposed_date) DESC
    `, [req.user.userId]);

    res.json({
      success: true,
      appointments: result.rows
    });

  } catch (error) {
    console.error('❌ Erreur GET /api/appointments/my:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rendez-vous'
    });
  }
});

/**
 * GET /api/appointments - Récupérer les RDV
 */
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const result = await appointmentService.getAppointments(
      req.user.userId,
      req.user.role,
      { status }
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rendez-vous'
    });
  }
});

/**
 * GET /api/appointments/today - RDV d'aujourd'hui (admin)
 */
router.get('/today', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const result = await appointmentService.getTodayAppointments();

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/appointments/today:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rendez-vous'
    });
  }
});

/**
 * GET /api/appointments/:id - Récupérer un RDV spécifique
 */
router.get('/:id', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await appointmentService.getAppointmentById(id, req.user.userId, req.user.role);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur GET /api/appointments/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du rendez-vous'
    });
  }
});

/**
 * PATCH /api/appointments/:id/confirm - Confirmer un RDV (parent ou admin)
 */
router.patch('/:id/confirm', auth.authenticateToken, async (req, res) => {
  try {
    const { confirmed_date } = req.body;
    const result = await appointmentService.confirmAppointment(
      parseInt(req.params.id),
      confirmed_date,
      req.user.userId,
      req.user.role
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur PATCH /api/appointments/:id/confirm:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la confirmation'
    });
  }
});

/**
 * PATCH /api/appointments/:id/reschedule - Proposer nouvelle date (parent)
 */
router.patch('/:id/reschedule', auth.authenticateToken, auth.requireRole('parent'), async (req, res) => {
  try {
    const { new_date } = req.body;
    const result = await appointmentService.rescheduleAppointment(
      parseInt(req.params.id),
      new_date,
      req.user.userId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur PATCH /api/appointments/:id/reschedule:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la replanification'
    });
  }
});

/**
 * PATCH /api/appointments/:id/status - Changer le statut d'un RDV (admin/staff)
 * Compatible avec le widget TodayTasksWidget
 */
router.patch('/:id/status', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Si status = 'completed', utiliser la logique de validation pour les RDV d'inscription
    if (status === 'completed') {
      const appointmentsController = require('../controllers/appointmentsController');
      // Appeler completeAppointment qui gère aussi la finalisation de l'inscription
      return appointmentsController.completeAppointment(req, res);
    }

    // Pour les autres statuts, utiliser le service standard
    const result = await appointmentService.updateAppointmentStatus(
      parseInt(id),
      status,
      req.user.userId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur PATCH /api/appointments/:id/status:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut'
    });
  }
});

/**
 * PATCH /api/appointments/:id/complete - Marquer complété (admin)
 */
router.patch('/:id/complete', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const result = await appointmentService.completeAppointment(
      parseInt(req.params.id),
      notes
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur PATCH /api/appointments/:id/complete:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la complétion'
    });
  }
});

/**
 * PATCH /api/appointments/:id/cancel - Annuler un RDV
 */
router.patch('/:id/cancel', auth.authenticateToken, async (req, res) => {
  try {
    const result = await appointmentService.cancelAppointment(parseInt(req.params.id));

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur PATCH /api/appointments/:id/cancel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'annulation'
    });
  }
});

/**
 * POST /api/appointments/:id/failed - Marquer RDV échoué et décider de la suite (admin/staff)
 * 
 * WORKFLOW:
 * - outcome = 'reschedule' → Créer un nouveau RDV, enrollment reste 'in_progress'
 * - outcome = 'abandon' → enrollment.status = 'rejected_deleted', supprimer compte parent
 */
router.post('/:id/failed', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const appointmentsController = require('../controllers/appointmentsController');
    await appointmentsController.markAppointmentFailed(req, res);
  } catch (error) {
    console.error('❌ Erreur POST /api/appointments/:id/failed:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du RDV échoué'
    });
  }
});

/**
 * POST /api/appointments/:id/validate - Valider RDV d'inscription (admin/staff)
 * 
 * WORKFLOW: RDV validé → enrollment.status = 'approved' (inscription finalisée)
 */
router.post('/:id/validate', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const appointmentsController = require('../controllers/appointmentsController');
    await appointmentsController.completeAppointment(req, res);
  } catch (error) {
    console.error('❌ Erreur POST /api/appointments/:id/validate:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation du RDV'
    });
  }
});

/**
 * POST /api/appointments/:id/reject-with-proposal - Refuser et proposer nouvelle date (admin)
 */
router.post('/:id/reject-with-proposal', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const { proposed_date, reason } = req.body;
    const result = await appointmentService.rejectWithProposal(
      parseInt(req.params.id),
      proposed_date,
      reason,
      req.user.userId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur POST /api/appointments/:id/reject-with-proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du refus avec proposition'
    });
  }
});

// ============================================================
// ROUTES PUBLIQUES POUR PARENTS SANS COMPTE (via enrollment)
// ============================================================

/**
 * GET /api/appointments/by-enrollment/:enrollmentId
 * Récupérer le RDV d'une inscription (public avec email)
 */
router.get('/by-enrollment/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis pour accéder au rendez-vous'
      });
    }

    const { pool } = require('../config/db_postgres');

    const result = await pool.query(`
      SELECT 
        a.*,
        TO_CHAR(a.proposed_date, 'YYYY-MM-DD"T"HH24:MI') as proposed_date_formatted,
        TO_CHAR(a.confirmed_date, 'YYYY-MM-DD"T"HH24:MI') as confirmed_date_formatted
      FROM appointments a
      WHERE a.enrollment_id = $1
        AND LOWER(a.parent_email) = LOWER($2)
      ORDER BY a.created_at DESC
      LIMIT 1
    `, [enrollmentId, email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé ou email incorrect'
      });
    }

    res.json({
      success: true,
      appointment: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur GET /api/appointments/by-enrollment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du rendez-vous'
    });
  }
});

/**
 * POST /api/appointments/public/confirm
 * Parent confirme le RDV (sans compte, via email)
 */
router.post('/public/confirm', async (req, res) => {
  try {
    const { enrollment_id, email, parent_notes } = req.body;

    if (!enrollment_id || !email) {
      return res.status(400).json({
        success: false,
        error: 'ID inscription et email requis'
      });
    }

    const { pool } = require('../config/db_postgres');

    // Vérifier et mettre à jour le RDV
    const result = await pool.query(`
      UPDATE appointments
      SET 
        status = 'confirmed',
        confirmed_date = proposed_date,
        parent_notes = COALESCE($3, parent_notes),
        updated_at = NOW()
      WHERE enrollment_id = $1
        AND LOWER(parent_email) = LOWER($2)
        AND status IN ('proposed', 'rescheduled')
      RETURNING *
    `, [enrollment_id, email, parent_notes]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé, email incorrect, ou déjà confirmé'
      });
    }

    console.log(`✅ RDV confirmé par parent: ${email} pour inscription #${enrollment_id}`);

    res.json({
      success: true,
      message: 'Rendez-vous confirmé avec succès',
      appointment: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur POST /api/appointments/public/confirm:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la confirmation'
    });
  }
});

/**
 * POST /api/appointments/public/reschedule
 * Parent demande un changement de date (sans compte, via email)
 */
router.post('/public/reschedule', async (req, res) => {
  try {
    const { enrollment_id, email, new_date, parent_notes } = req.body;

    if (!enrollment_id || !email || !new_date) {
      return res.status(400).json({
        success: false,
        error: 'ID inscription, email et nouvelle date requis'
      });
    }

    // Vérifier que la date est dans le futur
    if (new Date(new_date) <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'La date doit être dans le futur'
      });
    }

    const { pool } = require('../config/db_postgres');

    // Vérifier le nombre de reports (max 3)
    const checkResult = await pool.query(`
      SELECT rescheduled_count FROM appointments
      WHERE enrollment_id = $1 AND LOWER(parent_email) = LOWER($2)
    `, [enrollment_id, email]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé ou email incorrect'
      });
    }

    if (checkResult.rows[0].rescheduled_count >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Nombre maximum de reports atteint (3). Veuillez contacter la crèche.'
      });
    }

    // Mettre à jour le RDV
    const result = await pool.query(`
      UPDATE appointments
      SET 
        proposed_date = $3,
        status = 'rescheduled',
        rescheduled_count = rescheduled_count + 1,
        last_rescheduled_at = NOW(),
        parent_notes = COALESCE($4, parent_notes),
        updated_at = NOW()
      WHERE enrollment_id = $1
        AND LOWER(parent_email) = LOWER($2)
        AND status NOT IN ('completed', 'cancelled', 'no_show')
      RETURNING *
    `, [enrollment_id, email, new_date, parent_notes]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé ou déjà finalisé'
      });
    }

    const appointment = result.rows[0];

    // Formater la nouvelle date pour log
    const formattedDate = new Date(new_date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log(`📅 RDV reporté par parent ${email}: nouvelle date ${formattedDate}`);

    res.json({
      success: true,
      message: 'Nouvelle date proposée avec succès',
      appointment,
      remaining_reschedules: 3 - appointment.rescheduled_count
    });

  } catch (error) {
    console.error('❌ Erreur POST /api/appointments/public/reschedule:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de date'
    });
  }
});

module.exports = router;
