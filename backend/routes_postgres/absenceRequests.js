const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

// GET /api/absence-requests/parent/:parentId - Demandes d'absence d'un parent
router.get('/parent/:parentId', auth.authenticateToken, async (req, res) => {
  try {
    const { parentId } = req.params;
    const userId = req.user.userId;
    
    // Vérifier que l'utilisateur accède à ses propres données (sauf admin/staff)
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && userId !== parseInt(parentId)) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }
    
    // Récupérer les demandes d'absence avec les infos des enfants
    const result = await db.query(
      `SELECT 
        ar.id,
        ar.child_id,
        ar.absence_date,
        ar.reason,
        ar.notes,
        ar.status,
        ar.created_at,
        c.first_name,
        c.last_name
       FROM absence_requests ar
       LEFT JOIN children c ON ar.child_id = c.id
       WHERE c.parent_id = $1
       ORDER BY ar.absence_date DESC, ar.created_at DESC`,
      [parentId]
    );
    
    res.json({
      success: true,
      requests: result.rows
    });
    
  } catch (error) {
    console.error('Erreur récupération demandes absence:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des demandes d\'absence'
    });
  }
});

// POST /api/absence-requests - Créer une demande d'absence
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    const { child_id, absence_date, reason, notes } = req.body;
    const userId = req.user.userId;
    
    // Validation des données
    if (!child_id || !absence_date || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes (child_id, absence_date, reason requis)'
      });
    }
    
    // Vérifier que l'enfant appartient au parent (sauf admin/staff)
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      const childCheck = await db.query(
        'SELECT id FROM children WHERE id = $1 AND parent_id = $2',
        [child_id, userId]
      );
      
      if (childCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'êtes pas autorisé à créer une demande pour cet enfant'
        });
      }
    }
    
    // Créer la demande d'absence
    const result = await db.query(
      `INSERT INTO absence_requests (child_id, absence_date, reason, notes, status, created_by)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id, child_id, absence_date, reason, notes, status, created_at`,
      [child_id, absence_date, reason, notes || null, userId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Demande d\'absence créée avec succès',
      request: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur création demande absence:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la demande d\'absence'
    });
  }
});

// PUT /api/absence-requests/:id/acknowledge - Accuser réception d'une demande
router.put('/:id/acknowledge', auth.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledged_by } = req.body;
    
    // Vérifier que l'utilisateur est admin ou staff
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        error: 'Seuls les administrateurs et le personnel peuvent accuser réception'
      });
    }
    
    // Mettre à jour le statut
    const result = await db.query(
      `UPDATE absence_requests 
       SET status = 'acknowledged',
           acknowledged_by = $1,
           acknowledged_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status, acknowledged_at`,
      [acknowledged_by || req.user.userId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Demande d\'absence non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Demande d\'absence accusée réception',
      request: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur accusé réception:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'accusé de réception'
    });
  }
});

module.exports = router;
