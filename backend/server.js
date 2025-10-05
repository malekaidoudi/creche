const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const uploadProfileRoutes = require('./routes/upload');
const articleRoutes = require('./routes/articles');
const newsRoutes = require('./routes/news');
const contactRoutes = require('./routes/contacts');
const healthRoutes = require('./routes/health');
const publicEnrollmentsRoutes = require('./routes/publicEnrollments');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration pour Railway proxy
if (process.env.RAILWAY_ENVIRONMENT) {
  app.set('trust proxy', true);
  console.log('🚂 Trust proxy activé pour Railway');
}

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting - Configuration pour Railway
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  // Configuration pour Railway proxy
  trustProxy: true,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting en cas d'erreur de proxy
  skipFailedRequests: true,
  skipSuccessfulRequests: false
});

// Appliquer rate limiting seulement si pas en mode Railway ou si pas d'erreur
if (process.env.RAILWAY_ENVIRONMENT) {
  console.log('🚂 Rate limiting adapté pour Railway');
  // Rate limiting plus permissif sur Railway
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // Plus permissif sur Railway
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
    trustProxy: true,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true
  }));
} else {
  app.use('/api/', limiter);
}

// CORS configuration - Support multiple origins for Railway deployment
const allowedOrigins = [
  'http://localhost:5173',           // Développement local
  'https://malekaidoudi.github.io',  // GitHub Pages production
  process.env.FRONTEND_URL           // URL personnalisée (si définie)
].filter(Boolean); // Retire les valeurs undefined

app.use(cors({
  origin: function (origin, callback) {
    // Permet les requêtes sans origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/media', express.static(path.join(__dirname, process.env.UPLOADS_DIR || 'uploads')));

// Route de base pour l'API
app.get('/api', (req, res) => {
  res.json({
    message: 'API Crèche - Backend fonctionnel',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    endpoints: [
      '/api/health',
      '/api/settings',
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

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/public/enrollments', publicEnrollmentsRoutes);
app.use('/api/upload', uploadProfileRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/settings', settingsRoutes);

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
