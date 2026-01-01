const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

// GET /api/absence-requests/all - Toutes les demandes (admin/staff)
router.get('/all', auth.authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin ou staff
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
    }

    // Récupérer toutes les demandes avec infos enfant et parent
    const result = await db.query(
      `SELECT 
        ar.id,
        ar.child_id,
        ar.parent_id,
        ar.start_date,
        ar.end_date,
        ar.reason,
        ar.admin_notes,
        ar.status,
        ar.created_at,
        ar.acknowledged_at,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name
       FROM absence_requests ar
       LEFT JOIN children c ON ar.child_id = c.id
       LEFT JOIN users u ON ar.parent_id = u.id
       ORDER BY ar.created_at DESC`
    );

    res.json({
      success: true,
      requests: result.rows
    });

  } catch (error) {
    console.error('Erreur récupération toutes demandes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des demandes'
    });
  }
});

// GET /api/absence-requests/today - Absences du jour (admin/staff)
router.get('/today', auth.authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Récupérer les absences déclarées pour aujourd'hui (dans la plage start_date - end_date)
    // Inclut les statuts: pending, acknowledged (pas cancelled)
    const result = await db.query(
      `SELECT 
        ar.id,
        ar.child_id,
        ar.start_date,
        ar.end_date,
        ar.reason,
        ar.status,
        ar.admin_notes as notes,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name
       FROM absence_requests ar
       LEFT JOIN children c ON ar.child_id = c.id
       LEFT JOIN users u ON ar.parent_id = u.id
       WHERE $1 BETWEEN ar.start_date AND COALESCE(ar.end_date, ar.start_date)
       AND ar.status IN ('pending', 'acknowledged')
       ORDER BY c.first_name, c.last_name`,
      [targetDate]
    );

    res.json({
      success: true,
      absences: result.rows,
      date: targetDate
    });

  } catch (error) {
    console.error('Erreur récupération absences du jour:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des absences du jour'
    });
  }
});

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
        ar.start_date,
        ar.end_date,
        ar.reason,
        ar.admin_notes as notes,
        ar.status,
        ar.created_at,
        ar.acknowledged_at,
        c.first_name as child_first_name,
        c.last_name as child_last_name
       FROM absence_requests ar
       LEFT JOIN children c ON ar.child_id = c.id
       WHERE ar.parent_id = $1
       ORDER BY ar.start_date DESC, ar.created_at DESC`,
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
    const { child_id, start_date, end_date, reason, notes } = req.body;
    const userId = req.user.userId;

    // Validation des données
    if (!child_id || !start_date || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes (child_id, start_date, reason requis)'
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

    // Note: admin_notes sera NULL par défaut, peut être ajouté plus tard par admin

    // Créer la demande d'absence
    const result = await db.query(
      `INSERT INTO absence_requests (child_id, parent_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, child_id, start_date, end_date, reason, status, created_at`,
      [child_id, userId, start_date, end_date || null, reason]
    );

    const absenceRequest = result.rows[0];

    // Récupérer les infos de l'enfant et du parent
    const childInfo = await db.query(
      `SELECT c.first_name, c.last_name, u.first_name as parent_first_name, u.last_name as parent_last_name
       FROM children c
       LEFT JOIN users u ON c.parent_id = u.id
       WHERE c.id = $1`,
      [child_id]
    );

    if (childInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enfant non trouvé'
      });
    }

    const child = childInfo.rows[0];
    const childName = `${child.first_name} ${child.last_name}`;
    const parentName = `${child.parent_first_name || ''} ${child.parent_last_name || ''}`;

    // Créer des notifications pour tous les admins et staff
    const staffUsers = await db.query(
      `SELECT id FROM users WHERE role IN ('admin', 'staff') AND is_active = true`
    );

    const notificationTitle = `Nouvelle demande d'absence - ${childName}`;
    const notificationMessage = `${parentName} a créé une demande d'absence pour ${childName} du ${new Date(start_date).toLocaleDateString('fr-FR')} ${end_date && end_date !== start_date ? `au ${new Date(end_date).toLocaleDateString('fr-FR')}` : ''}. Raison: ${reason}`;

    // Insérer les notifications
    for (const staff of staffUsers.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
         VALUES ($1, $2, $3, 'absence_request', $4, false)`,
        [staff.id, notificationTitle, notificationMessage, absenceRequest.id]
      );
    }

    console.log(`✅ Notifications créées pour ${staffUsers.rows.length} membres du staff`);

    res.status(201).json({
      success: true,
      message: 'Demande d\'absence créée avec succès',
      request: absenceRequest
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

    // Mettre à jour le statut (admin_notes peut être ajouté si fourni)
    const { admin_notes } = req.body;

    const result = await db.query(
      `UPDATE absence_requests 
       SET status = 'acknowledged',
           admin_notes = COALESCE($1, admin_notes),
           acknowledged_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status, admin_notes, acknowledged_at, updated_at`,
      [admin_notes || null, id]
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
