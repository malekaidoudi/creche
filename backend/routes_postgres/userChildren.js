const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

// GET /api/user/has-children - Vérifier si l'utilisateur a des enfants associés
router.get('/has-children', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await db.query(
      'SELECT COUNT(*) as count FROM children WHERE parent_id = $1',
      [userId]
    );
    
    const hasChildren = parseInt(result.rows[0].count) > 0;
    
    res.json({
      success: true,
      hasChildren,
      count: parseInt(result.rows[0].count)
    });
    
  } catch (error) {
    console.error('Erreur vérification enfants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification des enfants' 
    });
  }
});

// GET /api/user/children - Récupérer les enfants de l'utilisateur
router.get('/children', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await db.query(
      `SELECT c.*, 
        e.status as enrollment_status,
        e.start_date as enrollment_start_date
       FROM children c
       LEFT JOIN enrollments e ON c.id = e.child_id
       WHERE c.parent_id = $1
       ORDER BY c.first_name, c.last_name`,
      [userId]
    );
    
    res.json({
      success: true,
      children: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Erreur récupération enfants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des enfants' 
    });
  }
});

// GET /api/user/children-summary - Résumé des enfants de l'utilisateur
router.get('/children-summary', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await db.query(
      `SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.birth_date,
        c.photo_url,
        e.status as enrollment_status,
        e.start_date as enrollment_start_date,
        COUNT(DISTINCT a.id) as total_absences
       FROM children c
       LEFT JOIN enrollments e ON c.id = e.child_id
       LEFT JOIN absence_requests a ON c.id = a.child_id
       WHERE c.parent_id = $1
       GROUP BY c.id, c.first_name, c.last_name, c.birth_date, c.photo_url, e.status, e.start_date
       ORDER BY c.first_name, c.last_name`,
      [userId]
    );
    
    res.json({
      success: true,
      children: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Erreur récupération résumé enfants:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du résumé des enfants' 
    });
  }
});

module.exports = router;
