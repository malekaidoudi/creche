const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// POST /api/absences/report - Signaler une absence
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { child_id, absence_date, reason, comment } = req.body;
    
    // Validation des données
    if (!child_id || !absence_date) {
      return res.status(400).json({
        success: false,
        error: 'L\'ID de l\'enfant et la date d\'absence sont requis'
      });
    }
    
    // Vérifier que l'utilisateur a accès à cet enfant
    const [children] = await db.execute(`
      SELECT c.* FROM children c 
      WHERE c.id = ? AND (c.parent_id = ? OR c.assigned_staff_id = ?)
    `, [child_id, userId, userId]);
    
    if (children.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé à cet enfant'
      });
    }
    
    // Vérifier si une absence n'est pas déjà signalée pour cette date
    const [existingAbsence] = await db.execute(`
      SELECT id FROM absence_reports 
      WHERE child_id = ? AND absence_date = ?
    `, [child_id, absence_date]);
    
    if (existingAbsence.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Une absence est déjà signalée pour cette date'
      });
    }
    
    // Insérer la demande d'absence
    const [result] = await db.execute(`
      INSERT INTO absence_reports (child_id, reported_by, absence_date, reason, comment, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    `, [child_id, userId, absence_date, reason || 'Autre', comment || '']);
    
    // Récupérer la demande créée avec les informations de l'enfant
    const [newAbsence] = await db.execute(`
      SELECT ar.*, c.first_name, c.last_name, u.first_name as reporter_first_name, u.last_name as reporter_last_name
      FROM absence_reports ar
      JOIN children c ON ar.child_id = c.id
      JOIN users u ON ar.reported_by = u.id
      WHERE ar.id = ?
    `, [result.insertId]);
    
    res.json({
      success: true,
      message: 'Absence signalée avec succès',
      absence: newAbsence[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur signalement absence:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET /api/absences/my-reports - Mes demandes d'absence
router.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [absences] = await db.execute(`
      SELECT ar.*, c.first_name, c.last_name
      FROM absence_reports ar
      JOIN children c ON ar.child_id = c.id
      WHERE ar.reported_by = ?
      ORDER BY ar.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      absences
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération absences:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET /api/absences/all - Toutes les demandes (admin/staff)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    if (!['admin', 'staff'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
    }
    
    const [absences] = await db.execute(`
      SELECT ar.*, c.first_name, c.last_name, 
             u.first_name as reporter_first_name, u.last_name as reporter_last_name
      FROM absence_reports ar
      JOIN children c ON ar.child_id = c.id
      JOIN users u ON ar.reported_by = u.id
      ORDER BY ar.created_at DESC
    `);
    
    res.json({
      success: true,
      absences
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération toutes absences:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
