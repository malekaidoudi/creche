const db = require('../config/database');

const attendanceController = {
  // Obtenir les présences d'aujourd'hui
  getTodayAttendance: async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [attendances] = await db.execute(`
        SELECT 
          c.id as child_id,
          c.first_name,
          c.last_name,
          c.birth_date,
          c.gender,
          a.id as attendance_id,
          a.date,
          a.check_in_time,
          a.check_out_time,
          a.notes,
          CASE 
            WHEN a.check_in_time IS NULL THEN 'absent'
            WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NULL THEN 'present'
            WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL THEN 'completed'
            ELSE 'absent'
          END as status
        FROM children c
        LEFT JOIN attendance a ON c.id = a.child_id AND a.date = ?
        WHERE c.status = 'approved'
        ORDER BY c.first_name, c.last_name
      `, [today]);

      // Formater les données pour le frontend
      const formattedAttendances = attendances.map(record => ({
        child_id: record.child_id,
        child: {
          id: record.child_id,
          first_name: record.first_name,
          last_name: record.last_name,
          birth_date: record.birth_date,
          gender: record.gender
        },
        attendance_id: record.attendance_id,
        date: record.date,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        notes: record.notes,
        status: record.status
      }));

      res.json({
        success: true,
        attendances: formattedAttendances
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
          c.id as child_id,
          c.first_name,
          c.last_name,
          c.birth_date,
          c.gender,
          a.id as attendance_id,
          a.date,
          a.check_in_time,
          a.check_out_time,
          a.notes,
          CASE 
            WHEN a.check_in_time IS NULL THEN 'absent'
            WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NULL THEN 'present'
            WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL THEN 'completed'
            ELSE 'absent'
          END as status
        FROM children c
        LEFT JOIN attendance a ON c.id = a.child_id AND a.date = ?
        WHERE c.status = 'approved'
        ORDER BY c.first_name, c.last_name
      `, [date]);

      // Formater les données pour le frontend
      const formattedAttendances = attendances.map(record => ({
        child_id: record.child_id,
        child: {
          id: record.child_id,
          first_name: record.first_name,
          last_name: record.last_name,
          birth_date: record.birth_date,
          gender: record.gender
        },
        attendance_id: record.attendance_id,
        date: record.date,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        notes: record.notes,
        status: record.status
      }));

      res.json({
        success: true,
        attendances: formattedAttendances
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
          c.*,
          CONCAT(a.date, ' ', a.check_in_time) as formatted_check_in_time,
          a.check_out_time
        FROM children c
        INNER JOIN attendance a ON c.id = a.child_id
        WHERE a.date = ? 
          AND a.check_in_time IS NOT NULL 
          AND a.check_out_time IS NULL
          AND c.status = 'approved'
        ORDER BY c.first_name, c.last_name
      `, [today]);

      // Formater les données pour utiliser le bon champ
      const formattedChildren = children.map(child => ({
        ...child,
        check_in_time: child.formatted_check_in_time
      }));

      res.json({
        success: true,
        children: formattedChildren
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
      const timeNow = now.toTimeString().split(' ')[0]; // Format HH:mm:ss

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
        'SELECT id, check_in_time FROM attendance WHERE child_id = ? AND date = ?',
        [child_id, today]
      );

      if (existing.length > 0 && existing[0].check_in_time) {
        return res.status(400).json({ error: 'Enfant déjà enregistré aujourd\'hui' });
      }

      if (existing.length > 0) {
        // Mettre à jour l'enregistrement existant
        await db.execute(
          'UPDATE attendance SET check_in_time = ?, notes = ? WHERE child_id = ? AND date = ?',
          [timeNow, notes, child_id, today]
        );
      } else {
        // Créer un nouvel enregistrement
        await db.execute(
          'INSERT INTO attendance (child_id, date, check_in_time, notes) VALUES (?, ?, ?, ?)',
          [child_id, today, timeNow, notes]
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
      const timeNow = now.toTimeString().split(' ')[0]; // Format HH:mm:ss

      // Vérifier s'il y a un check-in aujourd'hui
      const [existing] = await db.execute(
        'SELECT id, check_in_time, check_out_time FROM attendance WHERE child_id = ? AND date = ?',
        [child_id, today]
      );

      if (existing.length === 0 || !existing[0].check_in_time) {
        return res.status(400).json({ error: 'Aucune arrivée enregistrée aujourd\'hui' });
      }

      if (existing[0].check_out_time) {
        return res.status(400).json({ error: 'Départ déjà enregistré aujourd\'hui' });
      }

      // Enregistrer le départ
      await db.execute(
        'UPDATE attendance SET check_out_time = ?, notes = CONCAT(COALESCE(notes, ""), ?) WHERE child_id = ? AND date = ?',
        [timeNow, notes ? ` | Départ: ${notes}` : '', child_id, today]
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

  // Obtenir les présences d'un enfant pour un mois donné
  getChildMonthlyAttendance: async (req, res) => {
    try {
      const { childId } = req.params;
      const { year, month } = req.query;
      
      console.log(`📅 Récupération présences enfant ${childId} pour ${year}-${month}`);
      
      // Vérifier les permissions (parent peut voir ses enfants, admin/staff peuvent tout voir)
      if (req.user.role === 'parent') {
        // Vérifier que l'enfant appartient au parent
        const [childCheck] = await db.execute(
          'SELECT COUNT(*) as count FROM enrollments WHERE parent_id = ? AND child_id = ? AND status = "approved"',
          [req.user.id, childId]
        );
        
        if (childCheck[0].count === 0) {
          return res.status(403).json({ error: 'Accès non autorisé à cet enfant' });
        }
      }

      // Construire la requête pour le mois demandé
      let dateCondition = '';
      let params = [childId];
      
      if (year && month) {
        dateCondition = 'AND YEAR(a.date) = ? AND MONTH(a.date) = ?';
        params.push(year, month);
      } else {
        // Par défaut, mois actuel
        const now = new Date();
        dateCondition = 'AND YEAR(a.date) = ? AND MONTH(a.date) = ?';
        params.push(now.getFullYear(), now.getMonth() + 1);
      }

      const [attendances] = await db.execute(`
        SELECT 
          a.id,
          a.date,
          a.check_in_time,
          a.check_out_time,
          a.notes,
          a.created_at
        FROM attendance a
        WHERE a.child_id = ? ${dateCondition}
        ORDER BY a.date DESC
      `, params);

      console.log(`✅ ${attendances.length} présences trouvées`);

      res.json({
        success: true,
        attendance: attendances
      });

    } catch (error) {
      console.error('Erreur récupération présences mensuelles:', error);
      res.status(500).json({ 
        error: 'Erreur interne du serveur',
        details: error.message 
      });
    }
  },

  // Obtenir un rapport d'attendance avec filtres
  getAttendanceReport: async (req, res) => {
    try {
      // Version simplifiée pour tester
      const [attendances] = await db.execute(`
        SELECT 
          a.id,
          a.date,
          a.check_in_time,
          a.check_out_time,
          c.first_name,
          c.last_name,
          CASE 
            WHEN a.check_in_time IS NULL THEN 'absent'
            ELSE 'present'
          END as status
        FROM attendance a
        JOIN children c ON a.child_id = c.id
        ORDER BY a.date DESC
        LIMIT 50
      `);
      
      res.json({
        success: true,
        attendances: attendances.map(record => ({
          id: record.id,
          child_name: `${record.first_name} ${record.last_name}`,
          date: record.date,
          check_in: record.check_in_time,
          check_out: record.check_out_time,
          status: record.status
        })),
        summary: {
          totalRecords: attendances.length,
          presentCount: attendances.filter(a => a.status === 'present').length,
          absentCount: attendances.filter(a => a.status === 'absent').length,
          lateCount: 0,
          averageHours: 8
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur rapport attendance:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
};

module.exports = attendanceController;
