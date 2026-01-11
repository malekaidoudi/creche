/**
 * ROUTES RENDEZ-VOUS v2
 * Workflow simplifié de négociation RDV admin ↔ parent
 */

const express = require('express');
const router = express.Router();
const appointmentService = require('../services/appointmentService');
const auth = require('../middleware/auth');

// ============================================================================
// ROUTES PRINCIPALES
// ============================================================================

/**
 * POST /api/appointments - Créer un RDV (admin ou parent)
 */
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    // Si parent, définir automatiquement parent_id
    if (req.user.role === 'parent') {
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
 * GET /api/appointments/my - RDV du parent connecté
 */
router.get('/my', auth.authenticateToken, async (req, res) => {
  try {
    const { pool } = require('../config/db_postgres');

    const result = await pool.query(`
      SELECT 
        a.*,
        TO_CHAR(a.proposed_date, 'YYYY-MM-DD"T"HH24:MI') as proposed_date_formatted,
        TO_CHAR(a.confirmed_date, 'YYYY-MM-DD"T"HH24:MI') as confirmed_date_formatted,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        lp.first_name || ' ' || lp.last_name as last_proposed_by_name,
        lp.role as last_proposed_by_role
      FROM appointments a
      LEFT JOIN children c ON a.child_id = c.id
      LEFT JOIN users lp ON a.last_proposed_by = lp.id
      WHERE a.parent_id = $1
         OR a.parent_email = (SELECT email FROM users WHERE id = $1)
      ORDER BY 
        CASE WHEN a.status IN ('proposed', 'counter_proposed') THEN 0 ELSE 1 END,
        COALESCE(a.confirmed_date, a.proposed_date) DESC
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
 * GET /api/appointments/today - RDV d'aujourd'hui (admin)
 */
router.get('/today', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
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
 * GET /api/appointments/pending - RDV en attente (admin, pour rappels)
 */
router.get('/pending', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const result = await appointmentService.getPendingAppointments();
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/appointments/pending:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rendez-vous en attente'
    });
  }
});

/**
 * GET /api/appointments/:id - Récupérer un RDV spécifique
 */
router.get('/:id', auth.authenticateToken, async (req, res) => {
  try {
    const result = await appointmentService.getAppointmentById(
      parseInt(req.params.id),
      req.user.userId,
      req.user.role
    );

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

// ============================================================================
// ACTIONS SUR LES RDV
// ============================================================================

/**
 * PATCH /api/appointments/:id/confirm - Confirmer un RDV (accepter la proposition)
 */
router.patch('/:id/confirm', auth.authenticateToken, async (req, res) => {
  try {
    const result = await appointmentService.confirmAppointment(
      parseInt(req.params.id),
      req.user.userId,
      req.user.role
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
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
 * PATCH /api/appointments/:id/counter-propose - Proposer une autre date
 */
router.patch('/:id/counter-propose', auth.authenticateToken, async (req, res) => {
  try {
    const { proposed_date } = req.body;

    if (!proposed_date) {
      return res.status(400).json({
        success: false,
        error: 'La nouvelle date est requise'
      });
    }

    const result = await appointmentService.counterProposeDate(
      parseInt(req.params.id),
      proposed_date,
      req.user.userId,
      req.user.role
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur PATCH /api/appointments/:id/counter-propose:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la contre-proposition'
    });
  }
});

/**
 * PATCH /api/appointments/:id/cancel - Annuler un RDV
 */
router.patch('/:id/cancel', auth.authenticateToken, async (req, res) => {
  try {
    const result = await appointmentService.cancelAppointment(
      parseInt(req.params.id),
      req.user.userId
    );

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
 * PATCH /api/appointments/:id/complete - Marquer complété (admin)
 * Pour les RDV d'inscription: crée l'enfant et migre les documents
 */
router.patch('/:id/complete', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  const appointmentsController = require('../controllers/appointmentsController');
  // Mapper notes vers staff_notes pour le controller
  req.body.staff_notes = req.body.notes;
  return appointmentsController.completeAppointment(req, res);
});

/**
 * PATCH /api/appointments/:id/status - Changer le statut (admin)
 */
router.patch('/:id/status', auth.authenticateToken, auth.requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await appointmentService.updateAppointmentStatus(
      parseInt(req.params.id),
      status,
      req.user.userId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur PATCH /api/appointments/:id/status:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut'
    });
  }
});

// ============================================================================
// ROUTES PUBLIQUES (parents sans compte, via enrollment)
// ============================================================================

/**
 * GET /api/appointments/by-enrollment/:enrollmentId
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
 * POST /api/appointments/public/confirm - Parent confirme (sans compte)
 */
router.post('/public/confirm', async (req, res) => {
  try {
    const { enrollment_id, email } = req.body;

    if (!enrollment_id || !email) {
      return res.status(400).json({
        success: false,
        error: 'ID inscription et email requis'
      });
    }

    const { pool } = require('../config/db_postgres');

    const result = await pool.query(`
      UPDATE appointments
      SET 
        status = 'confirmed',
        confirmed_date = proposed_date,
        pending_response_from = NULL,
        updated_at = NOW()
      WHERE enrollment_id = $1
        AND LOWER(parent_email) = LOWER($2)
        AND status IN ('proposed', 'counter_proposed')
      RETURNING *
    `, [enrollment_id, email]);

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
 * POST /api/appointments/public/counter-propose - Parent propose autre date (sans compte)
 */
router.post('/public/counter-propose', async (req, res) => {
  try {
    const { enrollment_id, email, proposed_date } = req.body;

    if (!enrollment_id || !email || !proposed_date) {
      return res.status(400).json({
        success: false,
        error: 'ID inscription, email et nouvelle date requis'
      });
    }

    if (new Date(proposed_date) <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'La date doit être dans le futur'
      });
    }

    const { pool } = require('../config/db_postgres');

    const result = await pool.query(`
      UPDATE appointments
      SET 
        proposed_date = $3,
        status = 'counter_proposed',
        pending_response_from = 'admin',
        updated_at = NOW()
      WHERE enrollment_id = $1
        AND LOWER(parent_email) = LOWER($2)
        AND status IN ('proposed', 'counter_proposed')
      RETURNING *
    `, [enrollment_id, email, proposed_date]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rendez-vous non trouvé ou déjà finalisé'
      });
    }

    console.log(`📅 RDV contre-proposé par parent ${email}`);

    res.json({
      success: true,
      message: 'Nouvelle date proposée avec succès',
      appointment: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur POST /api/appointments/public/counter-propose:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la contre-proposition'
    });
  }
});

module.exports = router;
