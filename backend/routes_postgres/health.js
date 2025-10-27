const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
// const packageJson = require('../package.json');

// Route de vérification de santé
router.get('/', async (req, res) => {
  // Si paramètre setup=true, créer les utilisateurs de test
  if (req.query.setup === 'true') {
    try {
      const bcrypt = require('bcryptjs');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      // Insérer utilisateurs de test PostgreSQL
      const users = [
        ['Admin', 'Test', 'admin@creche.test', hashedPassword, 'admin', '+33123456789'],
        ['Staff', 'Test', 'staff@creche.test', hashedPassword, 'staff', '+33123456790'],
        ['Parent', 'Test', 'parent@creche.test', hashedPassword, 'parent', '+33123456791']
      ];
      
      for (const user of users) {
        try {
          await db.query(
            `INSERT INTO users (first_name, last_name, email, password, role, phone) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             ON CONFLICT (email) DO NOTHING`,
            user
          );
        } catch (e) {
          // Ignorer si existe déjà
        }
      }
      
      // Vérifier utilisateurs créés
      const userList = await db.query('SELECT email, role FROM users ORDER BY role');
      
      return res.json({
        status: 'SETUP_COMPLETE',
        message: 'Utilisateurs PostgreSQL créés',
        database: 'PostgreSQL Neon',
        users: userList.rows,
        credentials: [
          { email: 'admin@creche.test', password: 'Password123!', role: 'admin' },
          { email: 'staff@creche.test', password: 'Password123!', role: 'staff' },
          { email: 'parent@creche.test', password: 'Password123!', role: 'parent' }
        ],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return res.status(500).json({
        status: 'SETUP_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.1.0-postgresql',
      database: 'PostgreSQL Neon',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'checking...',
        server: 'OK'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
      }
    };

    // Tester la connexion à PostgreSQL
    try {
      const dbStatus = await db.testConnection();
      healthCheck.services.database = dbStatus ? 'OK' : 'ERROR';
      
      // Ajouter des infos sur les données
      const users = await db.query('SELECT COUNT(*) as count FROM users');
      const children = await db.query('SELECT COUNT(*) as count FROM children');
      const settings = await db.query('SELECT COUNT(*) as count FROM nursery_settings');
      
      healthCheck.data = {
        users: parseInt(users.rows[0].count),
        children: parseInt(children.rows[0].count),
        settings: parseInt(settings.rows[0].count)
      };
      
    } catch (error) {
      healthCheck.services.database = 'ERROR';
      healthCheck.status = 'DEGRADED';
      healthCheck.database_error = error.message;
    }

    // Déterminer le statut global
    const allServicesOk = Object.values(healthCheck.services).every(status => status === 'OK');
    if (!allServicesOk) {
      healthCheck.status = 'DEGRADED';
    }

    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Route de vérification détaillée (pour les admins)
router.get('/detailed', async (req, res) => {
  try {
    const detailedCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.1.0-postgresql',
      database: 'PostgreSQL Neon',
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      services: {
        database: 'checking...',
        server: 'OK'
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
        arrayBuffers: Math.round(process.memoryUsage().arrayBuffers / 1024 / 1024 * 100) / 100
      },
      cpu: {
        usage: process.cpuUsage()
      },
      env: {
        port: process.env.PORT || 3000,
        db_host: process.env.DB_HOST,
        db_port: process.env.DB_PORT || 5432,
        jwt_configured: !!process.env.JWT_SECRET
      }
    };

    // Tester la connexion à PostgreSQL
    try {
      const dbStatus = await db.testConnection();
      detailedCheck.services.database = dbStatus ? 'OK' : 'ERROR';
      
      // Informations détaillées sur la base
      const tables = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      detailedCheck.database_info = {
        tables: tables.rows.map(t => t.table_name),
        table_count: tables.rows.length
      };
      
      // Compter les données dans chaque table principale
      const dataCounts = {};
      const mainTables = ['users', 'children', 'enrollments', 'attendance', 'nursery_settings', 'holidays'];
      
      for (const table of mainTables) {
        try {
          const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
          dataCounts[table] = parseInt(result.rows[0].count);
        } catch (e) {
          dataCounts[table] = 'N/A';
        }
      }
      
      detailedCheck.data_counts = dataCounts;
      
    } catch (error) {
      detailedCheck.services.database = 'ERROR';
      detailedCheck.database_error = error.message;
    }

    // Déterminer le statut global
    const allServicesOk = Object.values(detailedCheck.services).every(status => status === 'OK');
    if (!allServicesOk) {
      detailedCheck.status = 'DEGRADED';
    }

    const statusCode = detailedCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(detailedCheck);

  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
