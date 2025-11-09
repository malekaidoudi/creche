const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/tasks/today
 * @desc    Récupérer les tâches du jour (personnalisées + rendez-vous)
 * @access  Staff/Admin
 */
router.get('/today',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
  tasksController.getTodayTasks
);

/**
 * @route   POST /api/tasks
 * @desc    Créer une nouvelle tâche personnalisée
 * @access  Staff/Admin
 */
router.post('/',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
  tasksController.createTask
);

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Mettre à jour le statut d'une tâche
 * @access  Staff/Admin
 */
router.patch('/:id/status',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
  tasksController.updateTaskStatus
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Supprimer une tâche personnalisée
 * @access  Staff/Admin
 */
router.delete('/:id',
  auth.authenticateToken,
  auth.requireRole('staff', 'admin'),
  tasksController.deleteTask
);

module.exports = router;
