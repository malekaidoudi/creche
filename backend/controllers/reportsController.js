const db = require('../config/database');

const reportsController = {
  // Rapport général avec statistiques
  getGeneralReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Statistiques générales
      const [totalChildren] = await db.execute(
        'SELECT COUNT(*) as total FROM children WHERE is_active = TRUE'
      );
      
      const [totalParents] = await db.execute(
        'SELECT COUNT(*) as total FROM users WHERE role = "parent" AND is_active = TRUE'
      );
      
      const [totalEnrollments] = await db.execute(
        'SELECT COUNT(*) as total FROM enrollments'
      );
      
      const [pendingEnrollments] = await db.execute(
        'SELECT COUNT(*) as total FROM enrollments WHERE status = "pending"'
      );

      // Statistiques par âge
      const [ageStats] = await db.execute(`
        SELECT 
          CASE 
            WHEN TIMESTAMPDIFF(MONTH, birth_date, CURDATE()) < 12 THEN '0-1 an'
            WHEN TIMESTAMPDIFF(MONTH, birth_date, CURDATE()) < 24 THEN '1-2 ans'
            WHEN TIMESTAMPDIFF(MONTH, birth_date, CURDATE()) < 36 THEN '2-3 ans'
            ELSE '3+ ans'
          END as age_group,
          COUNT(*) as count
        FROM children 
        WHERE is_active = TRUE
        GROUP BY age_group
      `);

      // Statistiques de présence (derniers 30 jours)
      const [attendanceStats] = await db.execute(`
        SELECT 
          DATE(date) as attendance_date,
          COUNT(DISTINCT child_id) as present_children
        FROM attendance 
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(date)
        ORDER BY attendance_date DESC
        LIMIT 30
      `);

      // Inscriptions par mois (derniers 6 mois)
      const [enrollmentsByMonth] = await db.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as count
        FROM enrollments 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month DESC
      `);

      res.json({
        success: true,
        report: {
          general: {
            totalChildren: totalChildren[0].total,
            totalParents: totalParents[0].total,
            totalEnrollments: totalEnrollments[0].total,
            pendingEnrollments: pendingEnrollments[0].total
          },
          ageDistribution: ageStats,
          attendanceStats: attendanceStats.reverse(), // Plus récent en premier
          enrollmentsByMonth: enrollmentsByMonth.reverse()
        }
      });
    } catch (error) {
      console.error('Erreur rapport général:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Rapport de présences
  getAttendanceReport: async (req, res) => {
    try {
      const { startDate, endDate, childId } = req.query;
      
      let whereClause = '1=1';
      let params = [];

      if (startDate) {
        whereClause += ' AND a.date >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND a.date <= ?';
        params.push(endDate);
      }

      if (childId) {
        whereClause += ' AND a.child_id = ?';
        params.push(childId);
      }

      const [attendanceData] = await db.execute(`
        SELECT 
          a.*,
          c.first_name as child_first_name,
          c.last_name as child_last_name,
          p.first_name as parent_first_name,
          p.last_name as parent_last_name
        FROM attendance a
        JOIN children c ON a.child_id = c.id
        LEFT JOIN users p ON c.parent_id = p.id
        WHERE ${whereClause}
        ORDER BY a.date DESC, a.check_in_time DESC
      `, params);

      // Statistiques de présence
      const [stats] = await db.execute(`
        SELECT 
          COUNT(DISTINCT child_id) as total_children,
          COUNT(*) as total_days,
          AVG(TIME_TO_SEC(TIMEDIFF(check_out_time, check_in_time))/3600) as avg_hours_per_day
        FROM attendance a
        WHERE ${whereClause} AND check_in_time IS NOT NULL AND check_out_time IS NOT NULL
      `, params);

      res.json({
        success: true,
        report: {
          attendance: attendanceData,
          statistics: stats[0]
        }
      });
    } catch (error) {
      console.error('Erreur rapport présences:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Rapport des inscriptions
  getEnrollmentsReport: async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      
      let whereClause = '1=1';
      let params = [];

      if (status && status !== 'all') {
        whereClause += ' AND e.status = ?';
        params.push(status);
      }

      if (startDate) {
        whereClause += ' AND e.created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND e.created_at <= ?';
        params.push(endDate + ' 23:59:59');
      }

      const [enrollments] = await db.execute(`
        SELECT 
          e.*,
          CASE 
            WHEN e.status = 'pending' THEN 'En attente'
            WHEN e.status = 'approved' THEN 'Approuvée'
            WHEN e.status = 'rejected' THEN 'Rejetée'
            ELSE e.status
          END as status_label
        FROM enrollments e
        WHERE ${whereClause}
        ORDER BY e.created_at DESC
      `, params);

      // Statistiques par statut
      const [statusStats] = await db.execute(`
        SELECT 
          status,
          COUNT(*) as count
        FROM enrollments e
        WHERE ${whereClause}
        GROUP BY status
      `, params);

      res.json({
        success: true,
        report: {
          enrollments,
          statusStats
        }
      });
    } catch (error) {
      console.error('Erreur rapport inscriptions:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Export CSV des données
  exportToCSV: async (req, res) => {
    try {
      const { type, startDate, endDate } = req.query;
      
      let data = [];
      let filename = '';
      let headers = [];

      switch (type) {
        case 'children':
          const [children] = await db.execute(`
            SELECT 
              c.first_name, c.last_name, c.birth_date, c.gender,
              p.first_name as parent_first_name, p.last_name as parent_last_name,
              p.email as parent_email, p.phone as parent_phone,
              c.created_at
            FROM children c
            LEFT JOIN users p ON c.parent_id = p.id
            WHERE c.is_active = TRUE
            ORDER BY c.first_name, c.last_name
          `);
          data = children;
          filename = 'enfants.csv';
          headers = ['Prénom', 'Nom', 'Date naissance', 'Genre', 'Parent prénom', 'Parent nom', 'Email parent', 'Téléphone parent', 'Date inscription'];
          break;

        case 'attendance':
          let whereClause = '1=1';
          let params = [];
          
          if (startDate) {
            whereClause += ' AND a.date >= ?';
            params.push(startDate);
          }
          
          if (endDate) {
            whereClause += ' AND a.date <= ?';
            params.push(endDate);
          }

          const [attendance] = await db.execute(`
            SELECT 
              c.first_name, c.last_name,
              a.date, a.check_in_time, a.check_out_time,
              a.notes
            FROM attendance a
            JOIN children c ON a.child_id = c.id
            WHERE ${whereClause}
            ORDER BY a.date DESC, c.first_name
          `, params);
          data = attendance;
          filename = 'presences.csv';
          headers = ['Prénom enfant', 'Nom enfant', 'Date', 'Heure arrivée', 'Heure départ', 'Notes'];
          break;

        case 'enrollments':
          const [enrollments] = await db.execute(`
            SELECT 
              child_first_name, child_last_name, child_birth_date, child_gender,
              parent_first_name, parent_last_name, parent_email, parent_phone,
              status, created_at, appointment_date
            FROM enrollments
            ORDER BY created_at DESC
          `);
          data = enrollments;
          filename = 'inscriptions.csv';
          headers = ['Prénom enfant', 'Nom enfant', 'Date naissance', 'Genre', 'Parent prénom', 'Parent nom', 'Email', 'Téléphone', 'Statut', 'Date demande', 'RDV'];
          break;

        default:
          return res.status(400).json({ error: 'Type d\'export non supporté' });
      }

      // Générer le CSV
      let csv = headers.join(',') + '\n';
      
      data.forEach(row => {
        const values = Object.values(row).map(value => {
          if (value === null || value === undefined) return '';
          // Échapper les guillemets et entourer de guillemets si nécessaire
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
          }
          return str;
        });
        csv += values.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\ufeff' + csv); // BOM pour UTF-8
    } catch (error) {
      console.error('Erreur export CSV:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

module.exports = reportsController;
