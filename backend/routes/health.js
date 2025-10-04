const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/database');
const packageJson = require('../package.json');

// Route de vérification de santé
router.get('/', async (req, res) => {
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
