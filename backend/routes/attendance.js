const express = require('express');
const { body, validationResult } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireStaff, requireChildAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance/today - Obtenir les présences d'aujourd'hui (Admin/Staff)
router.get('/today', authenticateToken, requireStaff, attendanceController.getTodayAttendance);

// GET /api/attendance/date/:date - Obtenir les présences pour une date donnée (Admin/Staff)
router.get('/date/:date', authenticateToken, requireStaff, attendanceController.getAttendanceByDate);

// GET /api/attendance/stats - Obtenir les statistiques de présence (Admin/Staff)
router.get('/stats', authenticateToken, requireStaff, attendanceController.getAttendanceStats);

// GET /api/attendance/currently-present - Obtenir les enfants actuellement présents (Admin/Staff)
router.get('/currently-present', authenticateToken, requireStaff, attendanceController.getCurrentlyPresent);

// POST /api/attendance/check-in - Enregistrer l'arrivée d'un enfant (Admin/Staff)
router.post('/check-in', [
  authenticateToken,
  requireStaff,
  body('child_id').isInt({ min: 1 }).withMessage('ID enfant invalide'),
  body('notes').optional().isString().withMessage('Notes invalides')
], attendanceController.checkIn);

// POST /api/attendance/check-out - Enregistrer le départ d'un enfant (Admin/Staff)
router.post('/check-out', [
  authenticateToken,
  requireStaff,
  body('child_id').isInt({ min: 1 }).withMessage('ID enfant invalide'),
  body('notes').optional().isString().withMessage('Notes invalides')
], attendanceController.checkOut);

// Routes pour enfants individuels - À implémenter si nécessaire
// router.get('/child/:childId', authenticateToken, requireChildAccess, attendanceController.getChildAttendanceHistory);
// router.get('/child/:childId/today', authenticateToken, requireChildAccess, attendanceController.getChildTodayAttendance);

module.exports = router;
