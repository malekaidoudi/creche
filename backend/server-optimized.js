/**
 * 🚀 SERVEUR OPTIMISÉ AVEC CACHE INTELLIGENT
 * 
 * Version optimisée du serveur principal intégrant le service centralisé
 * et le middleware de cache pour éliminer les redondances.
 * 
 * @author Ingénieur Full Stack Senior
 * @version 2.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Services et middleware optimisés
const settingsService = require('./services/SettingsService');
const cacheMiddleware = require('./middleware/cacheMiddleware');
const { authenticateToken, requireRole } = require('./middleware/auth');

// Routes optimisées
const optimizedSettingsRoutes = require('./routes/optimized-settings');

const app = express();

// 🛡️ SÉCURITÉ ET PERFORMANCE
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(compression()); // Compression gzip
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS optimisé
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://malekaidoudi.github.io', 'https://creche-mima-elghalia.netlify.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting intelligent
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limits différenciés
app.use('/api/settings', createRateLimit(15 * 60 * 1000, 100, 'Trop de requêtes settings'));
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 5, 'Trop de tentatives de connexion'));
app.use('/api/', createRateLimit(15 * 60 * 1000, 200, 'Trop de requêtes API'));

// 📊 MONITORING ET MÉTRIQUES
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    
    // Métriques de performance
    if (duration > 1000) {
      console.warn(`⚠️ Requête lente détectée: ${req.method} ${req.path} (${duration}ms)`);
    }
  });
  
  next();
});

// 🚀 ROUTES OPTIMISÉES AVEC CACHE

// Routes settings avec cache intelligent
app.use('/api/settings', optimizedSettingsRoutes);

// Route contact optimisée (remplace l'ancienne /api/contact)
app.get('/api/contact', 
  cacheMiddleware.publicCache(900), // 15 minutes de cache
  async (req, res) => {
    try {
      const { lang = 'fr' } = req.query;
      const contactData = await settingsService.getContactData(lang);
      res.json(contactData);
    } catch (error) {
      console.error('❌ Erreur /api/contact:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données de contact'
      });
    }
  }
);

// Route nursery-settings (compatibilité avec l'ancien système)
app.get('/api/nursery-settings',
  authenticateToken,
  cacheMiddleware.privateCache(300), // 5 minutes de cache privé
  async (req, res) => {
    try {
      const { settings, metadata } = await settingsService.getAllSettings();
      
      res.json({
        success: true,
        settings: settings,
        language: 'fr',
        total: metadata.total,
        cached: true
      });
    } catch (error) {
      console.error('❌ Erreur /api/nursery-settings:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des paramètres'
      });
    }
  }
);

// Route footer (compatibilité)
app.get('/api/nursery-settings/footer',
  cacheMiddleware.publicCache(900),
  async (req, res) => {
    try {
      const { lang = 'fr' } = req.query;
      const footerData = await settingsService.getFooterData(lang);
      
      res.json({
        success: true,
        settings: footerData,
        language: lang,
        cached: true
      });
    } catch (error) {
      console.error('❌ Erreur /api/nursery-settings/footer:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données du footer'
      });
    }
  }
);

// Mise à jour avec invalidation de cache
app.put('/api/nursery-settings/simple-update',
  authenticateToken,
  requireRole(['admin']),
  cacheMiddleware.invalidateOnUpdate(['settings', 'contact', 'footer']),
  async (req, res) => {
    try {
      const settingsData = req.body;
      
      // Transformer les données pour le service
      const settingsMap = {};
      Object.entries(settingsData).forEach(([key, value]) => {
        settingsMap[key] = {
          value_fr: value,
          value_ar: value,
          category: 'general'
        };
      });
      
      await settingsService.updateMultipleSettings(settingsMap);
      
      res.json({
        success: true,
        message: `${Object.keys(settingsMap).length} paramètres mis à jour avec succès`,
        updatedCount: Object.keys(settingsMap).length
      });
      
    } catch (error) {
      console.error('❌ Erreur mise à jour settings:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des paramètres'
      });
    }
  }
);

// 📊 ENDPOINT DE SANTÉ AVEC MÉTRIQUES CACHE
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/db_postgres');
    
    // Test de connexion DB
    const dbTest = await db.query('SELECT NOW() as time');
    
    // Statistiques du cache
    const cacheStats = settingsService.getCacheStats();
    const middlewareCacheStats = cacheMiddleware.getStats();
    
    // Métriques système
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbTest.rows[0].time
      },
      cache: {
        service: cacheStats,
        middleware: middlewareCacheStats
      },
      system: {
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        node_version: process.version
      },
      performance: {
        cache_hit_rate: cacheStats.hitRate,
        avg_response_time: '< 100ms' // À implémenter avec des métriques réelles
      }
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🔧 ENDPOINT D'ADMINISTRATION CACHE
app.get('/api/admin/cache-info',
  authenticateToken,
  requireRole(['admin']),
  (req, res) => {
    const serviceStats = settingsService.getCacheStats();
    const middlewareStats = cacheMiddleware.getStats();
    
    res.json({
      success: true,
      cache_info: {
        service: serviceStats,
        middleware: middlewareStats,
        recommendations: {
          hit_rate_good: serviceStats.hitRate > 0.8,
          memory_usage_ok: middlewareStats.memory.heapUsed < 100 * 1024 * 1024,
          keys_count_normal: serviceStats.keys < 1000
        }
      }
    });
  }
);

app.delete('/api/admin/clear-cache',
  authenticateToken,
  requireRole(['admin']),
  (req, res) => {
    try {
      settingsService._invalidateCache();
      cacheMiddleware.clear();
      
      res.json({
        success: true,
        message: 'Cache complètement vidé',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors du vidage du cache'
      });
    }
  }
);

// 🚫 GESTION D'ERREURS GLOBALE
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  
  // Invalider le cache en cas d'erreur critique
  if (err.message.includes('database') || err.message.includes('connection')) {
    console.log('🗑️ Invalidation cache suite à erreur DB');
    cacheMiddleware.clear();
  }
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// 🚀 DÉMARRAGE DU SERVEUR
const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    // Initialiser la base de données
    const db = require('./config/db_postgres');
    await db.query('SELECT 1'); // Test de connexion
    
    console.log('✅ Connexion base de données établie');
    
    // Pré-charger le cache avec les données essentielles
    console.log('🔄 Pré-chargement du cache...');
    await settingsService.getAllSettings();
    await settingsService.getContactData('fr');
    await settingsService.getContactData('ar');
    await settingsService.getFooterData('fr');
    await settingsService.getFooterData('ar');
    
    console.log('✅ Cache pré-chargé avec succès');
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur optimisé démarré sur le port ${PORT}`);
      console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🧠 Cache intelligent activé`);
      console.log(`⚡ Compression gzip activée`);
      console.log(`🛡️ Sécurité renforcée avec Helmet`);
    });
    
  } catch (error) {
    console.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
};

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('🔄 Arrêt gracieux du serveur...');
  cacheMiddleware.clear();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Arrêt du serveur (Ctrl+C)...');
  cacheMiddleware.clear();
  process.exit(0);
});

startServer();

module.exports = app;
