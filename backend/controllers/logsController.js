const db = require('../config/database');

const logsController = {
  // Obtenir tous les logs avec pagination et filtres
  getAllLogs: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        level = 'all', 
        action = 'all',
        startDate,
        endDate,
        userId
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let whereClause = '1=1';
      let params = [];
      
      // Filtrage par niveau
      if (level !== 'all') {
        whereClause += ' AND l.level = ?';
        params.push(level);
      }
      
      // Filtrage par action
      if (action !== 'all') {
        whereClause += ' AND l.action = ?';
        params.push(action);
      }
      
      // Filtrage par utilisateur
      if (userId) {
        whereClause += ' AND l.user_id = ?';
        params.push(userId);
      }
      
      // Filtrage par date
      if (startDate) {
        whereClause += ' AND l.created_at >= ?';
        params.push(startDate + ' 00:00:00');
      }
      
      if (endDate) {
        whereClause += ' AND l.created_at <= ?';
        params.push(endDate + ' 23:59:59');
      }
      
      // Requête principale
      const [logs] = await db.execute(`
        SELECT 
          l.*,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          u.email as user_email
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);
      
      // Compter le total
      const [countResult] = await db.execute(`
        SELECT COUNT(*) as total 
        FROM logs l 
        WHERE ${whereClause}
      `, params);
      
      const total = countResult[0].total;
      
      res.json({
        success: true,
        data: {
          logs: logs.map(log => ({
            ...log,
            additional_data: log.additional_data ? JSON.parse(log.additional_data) : null,
            user: log.user_first_name ? {
              first_name: log.user_first_name,
              last_name: log.user_last_name,
              email: log.user_email
            } : null
          })),
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Erreur récupération logs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les statistiques des logs
  getLogsStats: async (req, res) => {
    try {
      const { days = 7 } = req.query;
      
      // Statistiques par niveau
      const [levelStats] = await db.execute(`
        SELECT level, COUNT(*) as count
        FROM logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY level
      `, [days]);
      
      // Statistiques par action (top 10)
      const [actionStats] = await db.execute(`
        SELECT action, COUNT(*) as count
        FROM logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND action IS NOT NULL
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      `, [days]);
      
      // Activité par heure (dernières 24h)
      const [hourlyStats] = await db.execute(`
        SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as count
        FROM logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(created_at)
        ORDER BY hour
      `);
      
      // Utilisateurs les plus actifs
      const [userStats] = await db.execute(`
        SELECT 
          u.first_name,
          u.last_name,
          u.email,
          COUNT(*) as count
        FROM logs l
        JOIN users u ON l.user_id = u.id
        WHERE l.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY l.user_id
        ORDER BY count DESC
        LIMIT 10
      `, [days]);
      
      // Erreurs récentes
      const [recentErrors] = await db.execute(`
        SELECT message, created_at, response_status
        FROM logs
        WHERE level = 'error'
          AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ORDER BY created_at DESC
        LIMIT 5
      `, [days]);
      
      res.json({
        success: true,
        stats: {
          levelStats,
          actionStats,
          hourlyStats,
          userStats,
          recentErrors
        }
      });
    } catch (error) {
      console.error('Erreur statistiques logs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les actions disponibles
  getAvailableActions: async (req, res) => {
    try {
      const [actions] = await db.execute(`
        SELECT DISTINCT action
        FROM logs
        WHERE action IS NOT NULL
        ORDER BY action
      `);
      
      res.json({
        success: true,
        actions: actions.map(row => row.action)
      });
    } catch (error) {
      console.error('Erreur récupération actions:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Nettoyer les anciens logs
  cleanOldLogs: async (req, res) => {
    try {
      const { days = 90 } = req.body;
      
      const [result] = await db.execute(`
        DELETE FROM logs
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [days]);
      
      res.json({
        success: true,
        message: `${result.affectedRows} logs supprimés`,
        deletedCount: result.affectedRows
      });
    } catch (error) {
      console.error('Erreur nettoyage logs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir un log spécifique
  getLogById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [logs] = await db.execute(`
        SELECT 
          l.*,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          u.email as user_email
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.id = ?
      `, [id]);
      
      if (logs.length === 0) {
        return res.status(404).json({ error: 'Log non trouvé' });
      }
      
      const log = logs[0];
      
      res.json({
        success: true,
        log: {
          ...log,
          additional_data: log.additional_data ? JSON.parse(log.additional_data) : null,
          user: log.user_first_name ? {
            first_name: log.user_first_name,
            last_name: log.user_last_name,
            email: log.user_email
          } : null
        }
      });
    } catch (error) {
      console.error('Erreur récupération log:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

module.exports = logsController;
