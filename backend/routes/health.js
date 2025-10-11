const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/database');
const packageJson = require('../package.json');

// Route de vérification de santé
router.get('/', async (req, res) => {
  // Si paramètre setup=true, créer les utilisateurs
  if (req.query.setup === 'true') {
    try {
      const bcrypt = require('bcryptjs');
      const { execute } = require('../config/database');
      
      // Créer table users si elle n'existe pas
      await execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          role ENUM('admin', 'staff', 'parent') DEFAULT 'parent',
          profile_image VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Hash password
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      // Insérer utilisateurs de test
      const users = [
        ['Admin', 'Test', 'admin@creche.test', hashedPassword, 'admin', '+33123456789'],
        ['Staff', 'Test', 'staff@creche.test', hashedPassword, 'staff', '+33123456790'],
        ['Parent', 'Test', 'parent@creche.test', hashedPassword, 'parent', '+33123456791']
      ];
      
      for (const user of users) {
        try {
          await execute(
            'INSERT IGNORE INTO users (first_name, last_name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
            user
          );
        } catch (e) {
          // Ignorer si existe déjà
        }
      }
      
      // Vérifier utilisateurs créés
      const [userList] = await execute('SELECT email, role FROM users');
      
      return res.json({
        status: 'SETUP_COMPLETE',
        message: 'Utilisateurs Railway créés',
        users: userList,
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
      version: packageJson.version,
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

    // Tester la connexion à la base de données
    try {
      const dbStatus = await testConnection();
      healthCheck.services.database = dbStatus ? 'OK' : 'ERROR';
    } catch (error) {
      healthCheck.services.database = 'ERROR';
      healthCheck.status = 'DEGRADED';
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
      version: packageJson.version,
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
        port: process.env.PORT || 3003,
        db_host: process.env.DB_HOST || 'localhost',
        db_port: process.env.DB_PORT || 3306,
        jwt_configured: !!process.env.JWT_SECRET
      }
    };

    // Tester la connexion à la base de données
    try {
      const dbStatus = await testConnection();
      detailedCheck.services.database = dbStatus ? 'OK' : 'ERROR';
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
