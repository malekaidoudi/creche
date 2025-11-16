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

module.exports = router;
