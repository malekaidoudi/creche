const express = require('express');
const router = express.Router();
const enrollmentsController = require('../controllers/enrollmentsController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes pour la gestion des inscriptions

// Obtenir toutes les inscriptions (Admin/Staff seulement)
router.get('/', authenticateToken, enrollmentsController.getAllEnrollments);

// Obtenir les statistiques des inscriptions
router.get('/stats', authenticateToken, enrollmentsController.getEnrollmentStats);

// Obtenir une inscription par ID
router.get('/:id', authenticateToken, enrollmentsController.getEnrollmentById);

// Créer une nouvelle inscription (public, avec upload de fichiers)
router.post('/', upload.array('documents', 5), enrollmentsController.createEnrollment);

// Approuver une inscription
router.put('/:id/approve', authenticateToken, enrollmentsController.approveEnrollment);

// Rejeter une inscription
router.put('/:id/reject', authenticateToken, enrollmentsController.rejectEnrollment);

module.exports = router;
