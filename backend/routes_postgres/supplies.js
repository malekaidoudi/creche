/**
 * Routes pour la gestion des fournitures (supplies)
 * Stock de couches, fournitures apportées par les parents, etc.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requirePermission } = require('../middleware/auth');
const suppliesController = require('../controllers/suppliesController');

// GET - Stock de fournitures d'un enfant
router.get('/child/:childId',
    authenticateToken,
    suppliesController.getChildSupplies
);

// POST - Ajouter des fournitures au stock (parent apporte)
router.post('/child/:childId/refill',
    authenticateToken,
    requirePermission('daily_reports.manage'),
    suppliesController.refillSupply
);

// POST - Utiliser une fourniture (décrémenter le stock)
router.post('/child/:childId/use',
    authenticateToken,
    requirePermission('daily_reports.manage'),
    suppliesController.useSupply
);

// GET - Historique des fournitures apportées
router.get('/child/:childId/history',
    authenticateToken,
    suppliesController.getSuppliesHistory
);

// POST - Enregistrer les fournitures apportées aujourd'hui
router.post('/daily-brought',
    authenticateToken,
    requirePermission('daily_reports.manage'),
    suppliesController.recordDailySupplies
);

// GET - Fournitures apportées aujourd'hui pour un enfant
router.get('/today/:childId',
    authenticateToken,
    suppliesController.getTodaySupplies
);

// GET - Options de nourriture apportées pour un enfant (pour les repas)
router.get('/child/:childId/food-options',
    authenticateToken,
    suppliesController.getFoodOptions
);

module.exports = router;
