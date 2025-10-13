const db = require('../config/database');

const attendanceController = {
  // Obtenir les présences d'aujourd'hui
  getTodayAttendance: async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [attendances] = await db.execute(`
        SELECT 
          a.id,
          a.child_id,
          a.date,
          CASE WHEN a.check_in_time IS NOT NULL THEN CONCAT(a.date, ' ', a.check_in_time) ELSE NULL END as check_in_time,
          CASE WHEN a.check_out_time IS NOT NULL THEN CONCAT(a.date, ' ', a.check_out_time) ELSE NULL END as check_out_time,
          a.notes,
          c.id as child_id,
          c.first_name,
          c.last_name,
          c.birth_date,
          c.gender
        FROM attendance a
        RIGHT JOIN children c ON a.child_id = c.id AND a.date = ?
        WHERE c.status = 'approved'
        ORDER BY c.first_name, c.last_name
      `, [today]);

      res.json({
        success: true,
        attendances: attendances.map(record => ({
          id: record.id,
          child_id: record.child_id,
          date: record.date,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
          notes: record.notes,
          child: {
            id: record.child_id,
            first_name: record.first_name,
            last_name: record.last_name,
            birth_date: record.birth_date,
            gender: record.gender
          }
        }))
      });
    } catch (error) {
      console.error('Erreur getTodayAttendance:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les présences par date
  getAttendanceByDate: async (req, res) => {
    try {
      const { date } = req.params;
      
      const [attendances] = await db.execute(`
        SELECT 
          a.id,
          a.child_id,
          a.date,
          CASE WHEN a.check_in_time IS NOT NULL THEN CONCAT(a.date, ' ', a.check_in_time) ELSE NULL END as check_in_time,
          CASE WHEN a.check_out_time IS NOT NULL THEN CONCAT(a.date, ' ', a.check_out_time) ELSE NULL END as check_out_time,
          a.notes,
          c.id as child_id,
          c.first_name,
          c.last_name,
          c.birth_date,
          c.gender
        FROM attendance a
        RIGHT JOIN children c ON a.child_id = c.id AND a.date = ?
        WHERE c.status = 'approved'
        ORDER BY c.first_name, c.last_name
      `, [date]);

      res.json({
        success: true,
        attendances: attendances.map(record => ({
          id: record.id,
          child_id: record.child_id,
          date: record.date,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
          notes: record.notes,
          child: {
            id: record.child_id,
            first_name: record.first_name,
            last_name: record.last_name,
            birth_date: record.birth_date,
            gender: record.gender
          }
        }))
      });
    } catch (error) {
      console.error('Erreur getAttendanceByDate:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les statistiques
  getAttendanceStats: async (req, res) => {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const [stats] = await db.execute(`
        SELECT 
          COUNT(c.id) as total,
          COUNT(a.check_in_time) as present,
          COUNT(c.id) - COUNT(a.check_in_time) as absent,
          COUNT(CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL THEN 1 END) as completed
        FROM children c
        LEFT JOIN attendance a ON c.id = a.child_id AND a.date = ?
        WHERE c.status = 'approved'
      `, [targetDate]);

      res.json({
        success: true,
        ...stats[0]
      });
    } catch (error) {
      console.error('Erreur getAttendanceStats:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les enfants actuellement présents
  getCurrentlyPresent: async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [children] = await db.execute(`
        SELECT 
          c.id,
          c.first_name,
          c.last_name,
          c.birth_date,
          c.gender,
          c.status,
          CONCAT(a.date, ' ', a.check_in_time) as check_in_time,
          a.check_out_time
        FROM children c
        INNER JOIN attendance a ON c.id = a.child_id
        WHERE a.date = ? 
          AND a.check_in_time IS NOT NULL 
          AND a.check_out_time IS NULL
          AND c.status = 'approved'
        ORDER BY c.first_name, c.last_name
      `, [today]);

      res.json({
        success: true,
        children
      });
    } catch (error) {
      console.error('Erreur getCurrentlyPresent:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Check-in (enregistrer l'arrivée)
  checkIn: async (req, res) => {
    try {
      const { child_id, notes } = req.body;
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Vérifier si l'enfant existe et est approuvé
      const [children] = await db.execute(
        'SELECT id FROM children WHERE id = ? AND status = "approved"',
        [child_id]
      );

      if (children.length === 0) {
        return res.status(404).json({ error: 'Enfant non trouvé ou non approuvé' });
      }

      // Vérifier s'il n'y a pas déjà un check-in aujourd'hui
      const [existing] = await db.execute(
        'SELECT id FROM attendance WHERE child_id = ? AND date = ?',
        [child_id, today]
      );

      if (existing.length > 0) {
        // Mettre à jour le check-in existant
        await db.execute(
          'UPDATE attendance SET check_in_time = ?, notes = ? WHERE child_id = ? AND date = ?',
          [now, notes, child_id, today]
        );
      } else {
        // Créer un nouvel enregistrement
        await db.execute(
          'INSERT INTO attendance (child_id, date, check_in_time, notes) VALUES (?, ?, ?, ?)',
          [child_id, today, now, notes]
        );
      }

      res.json({
        success: true,
        message: 'Arrivée enregistrée avec succès'
      });
    } catch (error) {
      console.error('Erreur checkIn:', error);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
    }
  },

  // Check-out (enregistrer le départ)
  checkOut: async (req, res) => {
    try {
      const { child_id, notes } = req.body;
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Vérifier s'il y a un check-in aujourd'hui
      const [existing] = await db.execute(
        'SELECT id, check_in_time FROM attendance WHERE child_id = ? AND date = ? AND check_in_time IS NOT NULL',
        [child_id, today]
      );

      if (existing.length === 0) {
        return res.status(400).json({ error: 'Aucune arrivée enregistrée aujourd\'hui' });
      }

      // Enregistrer le départ
      await db.execute(
        'UPDATE attendance SET check_out_time = ?, notes = CONCAT(COALESCE(notes, ""), ?) WHERE child_id = ? AND date = ?',
        [now, notes ? ` | Départ: ${notes}` : '', child_id, today]
      );

      res.json({
        success: true,
        message: 'Départ enregistré avec succès'
      });
    } catch (error) {
      console.error('Erreur checkOut:', error);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
    }
  },

  // Obtenir l'historique d'un enfant
  getChildAttendanceHistory: async (req, res) => {
    try {
      const { childId } = req.params;
      const { page = 1, limit = 30 } = req.query;
      const offset = (page - 1) * limit;

      const [attendances] = await db.execute(`
        SELECT 
          a.*,
          c.first_name,
          c.last_name
        FROM attendance a
        INNER JOIN children c ON a.child_id = c.id
        WHERE a.child_id = ?
        ORDER BY a.date DESC
        LIMIT ? OFFSET ?
      `, [childId, parseInt(limit), parseInt(offset)]);

      res.json({
        success: true,
        attendances
      });
    } catch (error) {
      console.error('Erreur getChildAttendanceHistory:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir la présence d'aujourd'hui pour un enfant
  getChildTodayAttendance: async (req, res) => {
    try {
      const { childId } = req.params;
      const today = new Date().toISOString().split('T')[0];

      const [attendance] = await db.execute(
        'SELECT * FROM attendance WHERE child_id = ? AND date = ?',
        [childId, today]
      );

      res.json({
        success: true,
        attendance: attendance[0] || null
      });
    } catch (error) {
      console.error('Erreur getChildTodayAttendance:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

module.exports = attendanceController;
