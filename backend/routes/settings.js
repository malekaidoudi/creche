const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Routes pour les paramètres

// Obtenir tous les paramètres (publics pour tous, tous pour admin)
router.get('/', authenticateToken, settingsController.getAllSettings);

// Obtenir un paramètre spécifique
router.get('/:key', authenticateToken, settingsController.getSetting);

// Mettre à jour ou créer un paramètre (Admin seulement)
router.put('/:key', authenticateToken, requireAdmin, settingsController.updateSetting);

// Supprimer un paramètre (Admin seulement)
router.delete('/:key', authenticateToken, requireAdmin, settingsController.deleteSetting);

// Mettre à jour plusieurs paramètres (Admin seulement)
router.put('/', authenticateToken, requireAdmin, settingsController.updateMultipleSettings);

module.exports = router;
