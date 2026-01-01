/**
 * ROUTES TÂCHES V2 - Système simplifié
 * Admin → Staff uniquement
 */

const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');
const auth = require('../middleware/auth');

// ============================================================================
// ROUTES TÂCHES
// ============================================================================

/**
 * POST /api/tasks - Créer une tâche (admin uniquement)
 */
router.post('/', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const result = await taskService.createTask(req.body, req.user.userId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur POST /api/tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la tâche'
    });
  }
});

/**
 * GET /api/tasks/my - Récupérer mes tâches
 */
router.get('/my', auth.authenticateToken, async (req, res) => {
  try {
    const { status, date } = req.query;
    const result = await taskService.getUserTasks(req.user.userId, { status, date });

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/tasks/my:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des tâches'
    });
  }
});

/**
 * GET /api/tasks/today - Tâches d'aujourd'hui
 */
router.get('/today', auth.authenticateToken, async (req, res) => {
  try {
    const result = await taskService.getTodayTasks(req.user.userId);

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/tasks/today:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des tâches'
    });
  }
});

/**
 * GET /api/tasks/overdue - Tâches en retard (admin et staff)
 */
router.get('/overdue', auth.authenticateToken, async (req, res) => {
  try {
    const result = await taskService.getOverdueTasks();

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/tasks/overdue:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des tâches en retard'
    });
  }
});

/**
 * PATCH /api/tasks/:id/status - Mettre à jour le statut
 */
router.patch('/:id/status', auth.authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await taskService.updateTaskStatus(
      parseInt(req.params.id),
      status,
      req.user.userId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur PATCH /api/tasks/:id/status:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut'
    });
  }
});

/**
 * POST /api/tasks/:id/remind - Envoyer un rappel (admin uniquement)
 */
router.post('/:id/remind', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const result = await taskService.sendTaskReminder(
      parseInt(req.params.id),
      req.user.userId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur POST /api/tasks/:id/remind:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du rappel'
    });
  }
});

/**
 * DELETE /api/tasks/:id - Supprimer une tâche (admin uniquement)
 */
router.delete('/:id', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const result = await taskService.deleteTask(parseInt(req.params.id));

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('❌ Erreur DELETE /api/tasks/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la tâche'
    });
  }
});

module.exports = router;
