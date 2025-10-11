const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// Routes pour les rapports (Admin/Staff seulement)

// Rapport général avec statistiques
router.get('/general', authenticateToken, requireStaff, reportsController.getGeneralReport);

// Rapport de présences
router.get('/attendance', authenticateToken, requireStaff, reportsController.getAttendanceReport);

// Rapport des inscriptions
router.get('/enrollments', authenticateToken, requireStaff, reportsController.getEnrollmentsReport);

// Export CSV
router.get('/export/csv', authenticateToken, requireStaff, reportsController.exportToCSV);

module.exports = router;
