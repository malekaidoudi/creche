const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const { authenticateToken, requireStaff, requireChildAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance/today - Obtenir les présences d'aujourd'hui (Admin/Staff)
router.get('/today', authenticateToken, requireStaff, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { page = 1, limit = 50 } = req.query;
    
    const result = await Attendance.findByDate(today, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/attendance/date/:date - Obtenir les présences pour une date donnée (Admin/Staff)
router.get('/date/:date', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { date } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Valider le format de la date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Format de date invalide (YYYY-MM-DD)' });
    }
    
    const result = await Attendance.findByDate(date, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/attendance/stats - Obtenir les statistiques de présence (Admin/Staff)
router.get('/stats', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { date } = req.query;
    const stats = await Attendance.getStats(date);
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/attendance/currently-present - Obtenir les enfants actuellement présents (Admin/Staff)
router.get('/currently-present', authenticateToken, requireStaff, async (req, res) => {
  try {
    const currentlyPresent = await Attendance.getCurrentlyPresent();
    
    res.json(currentlyPresent);
  } catch (error) {
    console.error('Erreur lors de la récupération des présents:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/attendance/check-in - Enregistrer l'arrivée d'un enfant (Admin/Staff)
router.post('/check-in', [
  authenticateToken,
  requireStaff,
  body('child_id').isInt({ min: 1 }).withMessage('ID enfant invalide'),
  body('notes').optional().isString().withMessage('Notes invalides')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const { child_id, notes } = req.body;
    
    const attendance = await Attendance.checkIn(child_id, req.user.id, notes);
    
    res.status(201).json({
      message: 'Arrivée enregistrée avec succès',
      attendance
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'arrivée:', error);
    
    if (error.message.includes('déjà arrivé')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/attendance/check-out - Enregistrer le départ d'un enfant (Admin/Staff)
router.post('/check-out', [
  authenticateToken,
  requireStaff,
  body('child_id').isInt({ min: 1 }).withMessage('ID enfant invalide'),
  body('notes').optional().isString().withMessage('Notes invalides')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const { child_id, notes } = req.body;
    
    const attendance = await Attendance.checkOut(child_id, req.user.id, notes);
    
    res.json({
      message: 'Départ enregistré avec succès',
      attendance
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du départ:', error);
    
    if (error.message.includes('pas encore arrivé') || error.message.includes('déjà parti')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/attendance/child/:childId - Obtenir l'historique des présences d'un enfant
router.get('/child/:childId', authenticateToken, requireChildAccess, async (req, res) => {
  try {
    const { childId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    
    const result = await Attendance.findByChildId(childId, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/attendance/child/:childId/today - Obtenir la présence d'aujourd'hui pour un enfant
router.get('/child/:childId/today', authenticateToken, requireChildAccess, async (req, res) => {
  try {
    const { childId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const attendance = await Attendance.findByChildAndDate(childId, today);
    
    if (!attendance) {
      return res.json({ message: 'Aucune présence enregistrée aujourd\'hui', attendance: null });
    }
    
    res.json({ attendance });
  } catch (error) {
    console.error('Erreur lors de la récupération de la présence:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
