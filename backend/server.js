const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const childrenRoutes = require('./routes/children');
const enrollmentRoutes = require('./routes/enrollments');
const attendanceRoutes = require('./routes/attendance');
const uploadRoutes = require('./routes/uploads');
const documentsRoutes = require('./routes/documents');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const logsRoutes = require('./routes/logs');
// const publicRoutes = require('./routes/public'); // Fichier non existant
const articleRoutes = require('./routes/articles');
const newsRoutes = require('./routes/news');
const contactRoutes = require('./routes/contacts');
const healthRoutes = require('./routes/health');
const publicEnrollmentsRoutes = require('./routes/publicEnrollments');
const setupRoutes = require('./routes/setup');
const app = express();
const PORT = process.env.PORT || 3001;

// Configuration pour Railway proxy - DOIT être en premier
app.set('trust proxy', true);
console.log('🚂 Trust proxy activé globalement');

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting temporairement désactivé pour éviter les erreurs
// if (process.env.RAILWAY_ENVIRONMENT) {
//   console.log('🚂 Rate limiting temporairement désactivé pour éviter les erreurs');
// } else {
//   // Rate limiting local
//   app.use('/api/', rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
//   }));
// }

// CORS configuration - Support multiple origins for Railway deployment
const allowedOrigins = [
  'https://malekaidoudi.github.io',      // GitHub Pages racine
  'https://malekaidoudi.github.io/creche', // GitHub Pages avec path
  'http://localhost:5173',               // Vite dev server
  'http://localhost:5174',               // Vite dev server (port alternatif)
  'http://localhost:5175',               // Vite dev server (port alternatif)
  'http://127.0.0.1:5173',               // Alternative localhost
  'http://127.0.0.1:5174',               // Alternative localhost
  'http://127.0.0.1:5175'                // Alternative localhost
].filter(Boolean); // Retire les valeurs undefined

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // En développement, autoriser tous les localhost
    if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    // Vérifie si l'origin est dans la liste autorisée
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origin non autorisé: ${origin}`);
      callback(new Error('Non autorisé par la politique CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Servir les fichiers uploadés avec CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (uploads)
app.use('/media', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
}

// Middleware de logging personnalisé pour les API routes (temporairement désactivé)
// const { loggerMiddleware } = require('./middleware/logger');
// app.use('/api', loggerMiddleware);

// Route de base pour l'API
app.get('/api', (req, res) => {
  res.json({
    message: 'API Crèche - Backend fonctionnel',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/users',
      '/api/children',
      '/api/enrollments',
      '/api/attendance',
      '/api/public/enrollments',
      '/api/upload',
      '/api/articles',
      '/api/news',
      '/api/contacts'
    ]
  });
});


// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Crèche Backend API',
    status: 'running',
    api: '/api'
  });
});

// Route de debug temporaire
app.get('/api/debug', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { execute } = require('./config/database');
    
    // Test de création d'utilisateur direct
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
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
    
    // Insérer utilisateur test
    try {
      await execute(
        'INSERT IGNORE INTO users (first_name, last_name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin', 'Test', 'admin@creche.test', hashedPassword, 'admin', '+33123456789']
      );
    } catch (e) {
      // Ignorer si existe déjà
    }
    
    // Vérifier utilisateurs
    const [users] = await execute('SELECT email, role FROM users');
    
    res.json({
      status: 'OK',
      message: 'Debug Railway',
      environment: process.env.NODE_ENV,
      database: {
        host: process.env.MYSQLHOST || 'localhost',
        database: process.env.MYSQLDATABASE || 'railway'
      },
      users: users
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Debug error',
      message: error.message,
      stack: error.stack
    });
  }
});

// API Routes
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
app.use('/api/health', healthRoutes);
// app.use('/api/public', publicRoutes); // Fichier non existant
app.use('/api/public/enrollments', publicEnrollmentsRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/setup', setupRoutes); // Route temporaire pour Railway

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl 
  });
});
// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Erreur de validation', 
      details: err.message 
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Token invalide' 
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expiré' 
    });
  }
  
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message 
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API disponible sur: http://localhost:${PORT}/api`);
    
    // Informations spécifiques à Railway
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log(`🚂 Déployé sur Railway`);
      console.log(`🌍 URL publique: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'En cours de génération...'}`);
      console.log(`🔒 CORS autorisé pour: ${allowedOrigins.join(', ')}`);
    }
    
    // Vérification de la base de données
    console.log(`🗄️  Base de données: ${process.env.DB_HOST ? 'Configurée' : 'Locale'}`);
  });
}

module.exports = app;
