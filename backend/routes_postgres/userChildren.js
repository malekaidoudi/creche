const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

// GET /api/user/has-children - Vérifier si l'utilisateur a des enfants associés
router.get('/has-children', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Vérifie dans children.parent_id OU enrollments.parent_id
    const result = await db.query(
      `SELECT COUNT(DISTINCT c.id) as count 
       FROM children c
       LEFT JOIN enrollments e ON c.id = e.child_id
       WHERE c.parent_id = $1 OR e.parent_id = $1`,
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
    const userId = req.user.userId || req.user.id;

    // Utilise children.parent_id OU enrollments.parent_id
    const result = await db.query(
      `SELECT DISTINCT ON (c.id)
        c.*, 
        COALESCE(c.enrollment_status::text, e.status::text, 'pending') as enrollment_status,
        e.enrollment_date as enrollment_start_date,
        COALESCE(c.parent_id, e.parent_id) as parent_id
       FROM children c
       LEFT JOIN enrollments e ON c.id = e.child_id
       WHERE c.parent_id = $1 OR e.parent_id = $1
       ORDER BY c.id, c.first_name, c.last_name`,
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
    const userId = req.user.userId || req.user.id;
    console.log('👶 children-summary - userId:', userId, 'user:', req.user);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID utilisateur non trouvé dans le token'
      });
    }

    // Requête avec calcul de l'âge - utilise children.parent_id OU enrollments.parent_id
    const result = await db.query(
      `SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.birth_date,
        c.photo_url,
        c.gender,
        COALESCE(c.enrollment_status::text, e.status::text, 'pending') as enrollment_status,
        e.id as enrollment_id,
        CASE 
          WHEN c.birth_date IS NOT NULL THEN
            CASE 
              WHEN EXTRACT(YEAR FROM AGE(c.birth_date)) >= 1 THEN
                EXTRACT(YEAR FROM AGE(c.birth_date))::text || ' an' || 
                CASE WHEN EXTRACT(YEAR FROM AGE(c.birth_date)) > 1 THEN 's' ELSE '' END
              ELSE
                EXTRACT(MONTH FROM AGE(c.birth_date))::text || ' mois'
            END
          ELSE NULL
        END as age_display
       FROM children c
       LEFT JOIN enrollments e ON c.id = e.child_id
       WHERE c.parent_id = $1 OR e.parent_id = $1
       GROUP BY c.id, c.first_name, c.last_name, c.birth_date, c.photo_url, c.gender, 
                c.enrollment_status, e.status, e.id
       ORDER BY c.first_name, c.last_name`,
      [userId]
    );

    console.log('👶 Enfants trouvés pour parent', userId, ':', result.rows.length, result.rows.map(r => ({ name: r.first_name, status: r.enrollment_status })));

    res.json({
      success: true,
      children: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Erreur récupération résumé enfants:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du résumé des enfants',
      details: error.message
    });
  }
});

module.exports = router;
