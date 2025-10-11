const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Routes pour les logs (Admin seulement)

// Obtenir tous les logs avec pagination et filtres
router.get('/', authenticateToken, requireAdmin, logsController.getAllLogs);

// Obtenir les statistiques des logs
router.get('/stats', authenticateToken, requireAdmin, logsController.getLogsStats);

// Obtenir les actions disponibles
router.get('/actions', authenticateToken, requireAdmin, logsController.getAvailableActions);

// Obtenir un log spécifique
router.get('/:id', authenticateToken, requireAdmin, logsController.getLogById);

// Nettoyer les anciens logs
router.delete('/cleanup', authenticateToken, requireAdmin, logsController.cleanOldLogs);

module.exports = router;
