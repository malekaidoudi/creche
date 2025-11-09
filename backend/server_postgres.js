const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Version: 2.1.0 - Ajout système tâches quotidiennes (09/01/2025)
// Configuration PostgreSQL Neon
const db = require('./config/db_postgres');

// Import des routes
const authRoutes = require('./routes_postgres/auth');
const userRoutes = require('./routes_postgres/users');
const childrenRoutes = require('./routes_postgres/children');
const enrollmentRoutes = require('./routes_postgres/enrollments');
const attendanceRoutes = require('./routes_postgres/attendance');
const uploadRoutes = require('./routes_postgres/uploads');
const documentsRoutes = require('./routes_postgres/documents');
const reportsRoutes = require('./routes_postgres/reports');
const settingsRoutes = require('./routes_postgres/settings');
const logsRoutes = require('./routes_postgres/logs');
const articleRoutes = require('./routes_postgres/articles');
const newsRoutes = require('./routes_postgres/news');
const contactRoutes = require('./routes_postgres/contacts');
const healthRoutes = require('./routes_postgres/health');
const publicEnrollmentsRoutes = require('./routes_postgres/publicEnrollments');
const setupRoutes = require('./routes_postgres/setup');
const profileRoutes = require('./routes_postgres/profile');
const absenceRequestsRoutes = require('./routes_postgres/absenceRequests');
const nurserySettingsRoutes = require('./routes_postgres/nurserySettings');
const notificationsRoutes = require('./routes_postgres/notifications');
const fixUserRoleRoutes = require('./routes_postgres/fixUserRole');
const userChildrenRoutes = require('./routes_postgres/userChildren');
const absencesRoutes = require('./routes_postgres/absences');
const holidaysRoutes = require('./routes_postgres/holidays');
const scheduleSettingsRoutes = require('./routes_postgres/schedule-settings');

const app = express();
const PORT = process.env.PORT || 3005;

// Configuration proxy pour production
app.set('trust proxy', true);
console.log('🔧 Trust proxy activé');

// Security middleware avec configuration pour les images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  validate: { trustProxy: false }
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://malekaidoudi.github.io',
      'https://creche-mima-elghalia.netlify.app',
      'https://mimaelghalia.tn',
      'https://www.mimaelghalia.tn',
      'https://www.mima-elghalia.com',
      'https://mima-elghalia.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/public-enrollments', publicEnrollmentsRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/absence-requests', absenceRequestsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/nursery-settings', nurserySettingsRoutes);
app.use('/api/holidays', holidaysRoutes);
app.use('/api/schedule-settings', scheduleSettingsRoutes);
app.use('/api/fix-user-role', fixUserRoleRoutes);
app.use('/api/user', userChildrenRoutes);
app.use('/api/absences', absencesRoutes);

// Routes des tâches
try {
  const tasksRoutes = require('./routes_postgres/tasks');
  app.use('/api/tasks', tasksRoutes);
  console.log('✅ Routes tasks chargées avec succès');
} catch (error) {
  console.error('❌ Erreur chargement routes tasks:', error.message);
}

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: 'API Crèche Mima Elghalia - PostgreSQL',
    version: '2.0.0',
    database: 'PostgreSQL Neon',
    status: 'active',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      children: '/api/children',
      enrollments: '/api/enrollments',
      attendance: '/api/attendance'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    url: req.originalUrl,
    message: 'Cette route n\'existe pas sur l\'API'
  });
});

// Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  
  // Erreur de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: error.message
    });
  }
  
  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide',
      message: 'Veuillez vous reconnecter'
    });
  }
  
  // Erreur PostgreSQL
  if (error.code && error.code.startsWith('23')) {
    return res.status(409).json({
      error: 'Conflit de données',
      message: 'Cette donnée existe déjà ou viole une contrainte'
    });
  }
  
  // Erreur générique
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  });
});

// Fonction d'initialisation simplifiée
async function initializeDatabase() {
  try {
    console.log('🔄 Test de connexion PostgreSQL Neon...');
    
    // Test simple de connexion
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL connecté à:', result.rows[0].current_time);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error.message);
    return false;
  }
}

// Démarrage du serveur simplifié
async function startServer() {
  console.log('🚀 DÉMARRAGE SERVEUR POSTGRESQL');
  
  // Test de connexion (non bloquant)
  const dbConnected = await initializeDatabase();
  
  // Démarrer le serveur même si la DB a des problèmes
  const server = app.listen(PORT, () => {
    console.log('✅ ================================');
    console.log('✅ SERVEUR POSTGRESQL DÉMARRÉ !');
    console.log('✅ ================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🏥 Santé: http://localhost:${PORT}/api/health`);
    console.log(`📊 Base: PostgreSQL Neon ${dbConnected ? '✅' : '❌'}`);
    console.log('✅ ================================');
  });
  
  server.on('error', (error) => {
    console.error('❌ Erreur serveur:', error.message);
  });
}

// Lancement
if (require.main === module) {
  startServer();
}

module.exports = app;
