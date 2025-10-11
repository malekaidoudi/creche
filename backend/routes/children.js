const express = require('express');
const router = express.Router();
const childrenController = require('../controllers/childrenController');
const { authenticateToken } = require('../middleware/auth');

// Routes pour la gestion des enfants

// Obtenir tous les enfants
router.get('/', authenticateToken, childrenController.getAllChildren);

// Obtenir les statistiques des enfants
router.get('/stats', authenticateToken, childrenController.getChildrenStats);

// Obtenir les enfants disponibles (sans parent)
router.get('/available', childrenController.getAvailableChildren);

// Obtenir les enfants d'un parent
router.get('/parent/:parentId', authenticateToken, childrenController.getChildrenByParent);

// Obtenir un enfant par ID
router.get('/:id', authenticateToken, childrenController.getChildById);

// Créer un nouvel enfant
router.post('/', authenticateToken, childrenController.createChild);

// Mettre à jour un enfant
router.put('/:id', authenticateToken, childrenController.updateChild);

// Supprimer un enfant (soft delete)
router.delete('/:id', authenticateToken, childrenController.deleteChild);

module.exports = router;
