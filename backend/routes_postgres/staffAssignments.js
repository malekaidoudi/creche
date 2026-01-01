const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getStaffAssignments,
    updateStaffAssignment,
    getMyAssignment
} = require('../controllers/staffAssignmentsController');

// Routes pour la gestion des affectations staff (admin seulement)
router.get('/', authenticateToken, requireRole('admin'), getStaffAssignments);
router.put('/:staffId', authenticateToken, requireRole('admin'), updateStaffAssignment);

// Route pour récupérer son propre affectation (staff/admin)
router.get('/my-assignment', authenticateToken, requireRole('admin', 'staff'), getMyAssignment);

module.exports = router;
