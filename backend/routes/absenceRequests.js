const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// POST /api/absence-requests - Créer une demande d'absence
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { child_id, absence_date, reason, notes } = req.body;
    const parent_id = req.user.id;

    console.log('📝 Nouvelle demande d\'absence:', { parent_id, child_id, absence_date, reason });

    // Vérifier que l'enfant appartient au parent
    const [childCheck] = await db.execute(
      'SELECT COUNT(*) as count FROM enrollments WHERE parent_id = ? AND child_id = ? AND status = "approved"',
      [parent_id, child_id]
    );

    if (childCheck[0].count === 0) {
      return res.status(403).json({ error: 'Accès non autorisé à cet enfant' });
    }

    // Créer la demande d'absence
    const [result] = await db.execute(
      'INSERT INTO absence_requests (parent_id, child_id, absence_date, reason, notes) VALUES (?, ?, ?, ?, ?)',
      [parent_id, child_id, absence_date, reason, notes]
    );

    // Récupérer les informations de l'enfant et du parent
    const [childInfo] = await db.execute(
      'SELECT c.first_name as child_name, c.last_name as child_lastname, u.first_name as parent_name, u.last_name as parent_lastname FROM children c JOIN users u ON u.id = ? WHERE c.id = ?',
      [parent_id, child_id]
    );

    const child = childInfo[0];

    // Créer des notifications pour tous les admin et staff
    const [adminStaff] = await db.execute(
      'SELECT id FROM users WHERE role IN ("admin", "staff") AND is_active = 1'
    );

    const notificationPromises = adminStaff.map(user => {
      return db.execute(
        'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
        [
          user.id,
          'absence_request',
          'Nouvelle demande d\'absence',
          `${child.parent_name} ${child.parent_lastname} demande une absence pour ${child.child_name} ${child.child_lastname} le ${new Date(absence_date).toLocaleDateString('fr-FR')}`,
          JSON.stringify({
            absence_request_id: result.insertId,
            parent_id,
            child_id,
            absence_date,
            reason
          })
        ]
      );
    });

    await Promise.all(notificationPromises);

    console.log('✅ Demande d\'absence créée avec ID:', result.insertId);
    console.log('📬 Notifications envoyées à', adminStaff.length, 'utilisateurs');

    res.json({
      success: true,
      message: 'Demande d\'absence créée avec succès',
      request_id: result.insertId
    });

  } catch (error) {
    console.error('❌ Erreur création demande d\'absence:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// GET /api/absence-requests/parent/:parentId - Obtenir les demandes d'un parent
router.get('/parent/:parentId', authenticateToken, async (req, res) => {
  try {
    const { parentId } = req.params;

    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.id != parentId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const [requests] = await db.execute(`
      SELECT 
        ar.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name
      FROM absence_requests ar
      LEFT JOIN children c ON ar.child_id = c.id
      WHERE ar.parent_id = ?
      ORDER BY ar.created_at DESC
    `, [parentId]);

    res.json({
      success: true,
      requests: requests
    });

  } catch (error) {
    console.error('❌ Erreur récupération demandes:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// GET /api/absence-requests - Obtenir toutes les demandes (admin/staff)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Seuls admin et staff peuvent voir toutes les demandes
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const [requests] = await db.execute(`
      SELECT 
        ar.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name,
        u.email as parent_email,
        u.phone as parent_phone
      FROM absence_requests ar
      LEFT JOIN children c ON ar.child_id = c.id
      LEFT JOIN users u ON ar.parent_id = u.id
      ORDER BY ar.created_at DESC
    `);

    res.json({
      success: true,
      requests: requests
    });

  } catch (error) {
    console.error('❌ Erreur récupération toutes demandes:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// PUT /api/absence-requests/:id/acknowledge - Accusé de réception d'une demande (admin/staff)
router.put('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    // Seuls admin et staff peuvent accuser réception
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Mettre à jour la demande avec accusé de réception
    const [result] = await db.execute(
      'UPDATE absence_requests SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
      ['acknowledged', admin_notes || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Récupérer les informations pour notification
    const [requestInfo] = await db.execute(`
      SELECT 
        ar.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name
      FROM absence_requests ar
      LEFT JOIN children c ON ar.child_id = c.id
      LEFT JOIN users u ON ar.parent_id = u.id
      WHERE ar.id = ?
    `, [id]);

    const request = requestInfo[0];

    // Notifier le parent de l'accusé de réception
    await db.execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [
        request.parent_id,
        'absence_request',
        'Demande d\'absence reçue',
        `Votre demande d'absence pour ${request.child_first_name} ${request.child_last_name} le ${new Date(request.absence_date).toLocaleDateString('fr-FR')} a été prise en compte par l'administration.`,
        JSON.stringify({
          absence_request_id: id,
          status: 'acknowledged',
          admin_notes,
          acknowledged_by: req.user.id,
          acknowledged_at: new Date().toISOString()
        })
      ]
    );

    console.log('✅ Accusé de réception demande d\'absence:', id, 'par utilisateur:', req.user.id);

    res.json({
      success: true,
      message: 'Accusé de réception envoyé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur accusé de réception:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

module.exports = router;
