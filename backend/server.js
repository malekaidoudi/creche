#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVEUR API - CRÈCHE MIMA ELGHALIA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Version: 2.1.0
 * Date: 09/01/2025
 * Description: Serveur Express avec PostgreSQL Neon
 * 
 * Fonctionnalités:
 * - Authentification JWT
 * - Gestion inscriptions, enfants, présences
 * - Système de tâches quotidiennes
 * - Notifications en temps réel
 * - Upload de documents
 * - Rate limiting et sécurité
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

console.log('🚀 DÉMARRAGE SERVEUR CRÈCHE MIMA ELGHALIA');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`📦 Version: 2.1.0`);
console.log('═══════════════════════════════════════════════════════════════\n');

// Configuration PostgreSQL Neon
const db = require('./config/db_postgres');

// Import des routes
console.log('📂 Chargement des routes...');
const authRoutes = require('./routes_postgres/auth');
const userRoutes = require('./routes_postgres/users');
const childrenRoutes = require('./routes_postgres/children');
const enrollmentRoutes = require('./routes_postgres/enrollments');
const attendanceRoutes = require('./routes_postgres/attendance');
const logsRoutes = require('./routes_postgres/logs');
const contactRoutes = require('./routes_postgres/contacts');
const healthRoutes = require('./routes_postgres/health');
const setupRoutes = require('./routes_postgres/setup');
const profileRoutes = require('./routes_postgres/profile');
const absenceRequestsRoutes = require('./routes_postgres/absenceRequests');
const nurserySettingsRoutes = require('./routes_postgres/nurserySettings');
const notificationsRoutes = require('./routes_postgres/notifications');
const userChildrenRoutes = require('./routes_postgres/userChildren');
const holidaysRoutes = require('./routes_postgres/holidays');
const scheduleSettingsRoutes = require('./routes_postgres/schedule-settings');
const eventsRoutes = require('./routes_postgres/events');
const tasksRoutes = require('./routes_postgres/tasks');
const announcementsRoutes = require('./routes_postgres/announcements');
const appointmentsRoutes = require('./routes_postgres/appointments');
const staffMessagesRoutes = require('./routes_postgres/staff-messages');
const personalMemosRoutes = require('./routes_postgres/personal-memos');
const activitiesRoutes = require('./routes_postgres/activities');
const activityLogsRoutes = require('./routes_postgres/activityLogs');
const userWorkflowRoutes = require('./routes_postgres/userWorkflow');
const debugEnrollmentsRoutes = require('./routes_postgres/debugEnrollments');
const backupRoutes = require('./routes_postgres/backup');
const recoveryRoutes = require('./routes_postgres/recovery');
const dailyReportsRoutes = require('./routes_postgres/dailyReports');
const suppliesRoutes = require('./routes_postgres/supplies');
const staffAssignmentsRoutes = require('./routes_postgres/staffAssignments');
const dashboardStatsRoutes = require('./routes_postgres/dashboardStats');
const contactMessagesRoutes = require('./routes_postgres/contactMessages');
const virtualTourRoutes = require('./routes_postgres/virtualTour');
const paymentAlertsRoutes = require('./routes_postgres/paymentAlerts');
const documentsRoutes = require('./routes_postgres/documents');
const cloudinaryRoutes = require('./routes_postgres/cloudinary');
const cloudinaryExplorerRoutes = require('./routes_postgres/cloudinaryExplorer');
console.log('✅ Routes chargées\n');

const app = express();
const PORT = process.env.PORT || 3003;

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION MIDDLEWARES
// ═══════════════════════════════════════════════════════════════════════════

// Trust proxy pour Render/Heroku
app.set('trust proxy', true);
console.log('🔧 Trust proxy: activé');

// Security - Helmet avec CSP configuré
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
console.log('🔒 Helmet: activé');

// Rate Limiting - Protection contre les abus
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requêtes max
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  validate: { trustProxy: false }, // Évite le warning
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use(limiter);
console.log('⏱️  Rate limiting: 1000 req/15min');

// Compression
app.use(compression());
console.log('📦 Compression: activée');

// Logging avec Morgan
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  console.log('📝 Logging: combined (production)');
} else {
  app.use(morgan('dev'));
  console.log('📝 Logging: dev (development)');
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION CORS - FLEXIBLE ET SÉCURISÉ
// ═══════════════════════════════════════════════════════════════════════════

const corsOptions = {
  origin: function (origin, callback) {
    // Liste des origines autorisées explicitement
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://192.168.1.60:5173',
      'https://creche-mima-elghalia.netlify.app',
      'https://mimaelghalia.tn',
      'https://www.mimaelghalia.tn',
      'https://www.mima-elghalia.com',
      'https://mima-elghalia.com'
    ];

    // Autoriser les requêtes sans origin (Postman, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    // En développement uniquement: autoriser les IP locales
    if (process.env.NODE_ENV !== 'production') {
      if (origin.match(/^http:\/\/(192\.168\.\d+\.\d+|127\.0\.0\.1|localhost)(:\d+)?$/)) {
        return callback(null, true);
      }
    }

    // Autoriser uniquement les sous-domaines spécifiques de Render (notre backend)
    if (origin === 'https://creche-backend.onrender.com') {
      return callback(null, true);
    }

    // Autoriser le domaine principal de production uniquement
    if (origin === 'https://mima-elghalia.com' || origin === 'https://www.mima-elghalia.com' ||
      origin === 'https://mimaelghalia.tn' || origin === 'https://www.mimaelghalia.tn') {
      return callback(null, true);
    }

    // Vérifier la liste explicite
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Bloquer les autres origines
    console.log('❌ CORS bloqué pour:', origin);
    callback(new Error('Non autorisé par CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
console.log('🌐 CORS: configuré (flexible + sécurisé)\n');

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Activity Logger - Journal d'activité automatique
const { activityLogger } = require('./middleware/activityLogger');
app.use(activityLogger({ logErrors: true }));
console.log('📊 Activity Logger: activé');

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));
console.log('📁 Fichiers statiques: /uploads, /public');

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES API
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n🔗 Montage des routes API...');

app.use('/api/auth', authRoutes);
console.log('  ✓ /api/auth');

app.use('/api/users', userRoutes);
console.log('  ✓ /api/users');

app.use('/api/children', childrenRoutes);
console.log('  ✓ /api/children');

app.use('/api/enrollments', enrollmentRoutes);
console.log('  ✓ /api/enrollments');

app.use('/api/attendance', attendanceRoutes);
console.log('  ✓ /api/attendance');

app.use('/api/logs', logsRoutes);
console.log('  ✓ /api/logs');

app.use('/api/contacts', contactRoutes);
app.use('/api/contact', contactRoutes); // Alias pour compatibilité
console.log('  ✓ /api/contacts + /api/contact');

app.use('/api/health', healthRoutes);
console.log('  ✓ /api/health');

app.use('/api/setup', setupRoutes);
console.log('  ✓ /api/setup');

app.use('/api/profile', profileRoutes);
console.log('  ✓ /api/profile');

app.use('/api/absence-requests', absenceRequestsRoutes);
console.log('  ✓ /api/absence-requests');

app.use('/api/notifications', notificationsRoutes);
console.log('  ✓ /api/notifications');

app.use('/api/nursery-settings', nurserySettingsRoutes);
console.log('  ✓ /api/nursery-settings');

app.use('/api/holidays', holidaysRoutes);
console.log('  ✓ /api/holidays');


app.use('/api/schedule-settings', scheduleSettingsRoutes);
console.log('  ✓ /api/schedule-settings');

app.use('/api/user', userChildrenRoutes);
console.log('  ✓ /api/user');

// Routes des événements (v2.2.0)
app.use('/api/events', eventsRoutes);
console.log('  ✓ /api/events (système événements) 🆕');

// Routes système simplifié (v3.0.0)
app.use('/api/tasks', tasksRoutes);
console.log('  ✓ /api/tasks (tâches simplifiées) 🆕');

app.use('/api/announcements', announcementsRoutes);
console.log('  ✓ /api/announcements (actualités parents) 🆕');

app.use('/api/appointments', appointmentsRoutes);
console.log('  ✓ /api/appointments (rendez-vous) 🆕');

app.use('/api/staff-messages', staffMessagesRoutes);
console.log('  ✓ /api/staff-messages (messages staff) 🆕');

app.use('/api/personal-memos', personalMemosRoutes);
console.log('  ✓ /api/personal-memos (mémos personnels) 🆕');

app.use('/api/activities', activitiesRoutes);
console.log('  ✓ /api/activities (fil d\'activités) 🆕');

app.use('/api/activity-logs', activityLogsRoutes);
console.log('  ✓ /api/activity-logs (journal d\'activité direction) 🆕');

app.use('/api/user-workflow', userWorkflowRoutes);
console.log('  ✓ /api/user-workflow (workflow parent/staff) 🆕');

app.use('/api/debug', debugEnrollmentsRoutes);
console.log('  ✓ /api/debug (diagnostic enrollments) 🔧');

app.use('/api/backup', backupRoutes);
console.log('  ✓ /api/backup (système de sauvegarde) 💾');

app.use('/api/recovery', recoveryRoutes);
console.log('  ✓ /api/recovery (récupération d\'urgence) 🆘');

app.use('/api/daily-reports', dailyReportsRoutes);
console.log('  ✓ /api/daily-reports (rapports journaliers enfants) 📋');

app.use('/api/supplies', suppliesRoutes);
console.log('  ✓ /api/supplies (fournitures enfants) 🎒');

app.use('/api/staff-assignments', staffAssignmentsRoutes);
console.log('  ✓ /api/staff-assignments (affectations staff) 👥');

app.use('/api/dashboard', dashboardStatsRoutes);
console.log('  ✓ /api/dashboard (statistiques dashboard) 📊');

app.use('/api/admin/contact-messages', contactMessagesRoutes);
console.log('  ✓ /api/admin/contact-messages (courrier admin) 📧');

app.use('/api/virtual-tour', virtualTourRoutes);
console.log('  ✓ /api/virtual-tour (images visite virtuelle) 🖼️');

app.use('/api/payment-alerts', paymentAlertsRoutes);
console.log('  ✓ /api/payment-alerts (alertes de paiement) 💰');

app.use('/api/documents', documentsRoutes);
console.log('  ✓ /api/documents (gestion documents) 📄');

app.use('/api/cloudinary', cloudinaryRoutes);
console.log('  ✓ /api/cloudinary (upload direct) ☁️');

app.use('/api/cloudinary-explorer', cloudinaryExplorerRoutes);
console.log('  ✓ /api/cloudinary-explorer (explorateur stockage) 🗂️');

console.log('\n✅ Toutes les routes montées avec succès\n');

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.json({
    message: 'API Crèche Mima Elghalia',
    version: '2.1.0',
    status: 'active',
    database: 'PostgreSQL Neon',
    features: [
      'Authentification JWT',
      'Gestion inscriptions',
      'Gestion enfants',
      'Gestion présences',
      'Tâches quotidiennes',
      'Notifications',
      'Upload documents',
      'Rapports'
    ],
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      children: '/api/children',
      enrollments: '/api/enrollments',
      attendance: '/api/attendance',
      tasks: '/api/tasks',
      notifications: '/api/notifications'
    },
    documentation: 'https://github.com/malekaidoudi/creche'
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GESTION DES ERREURS
// ═══════════════════════════════════════════════════════════════════════════

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    path: req.originalUrl,
    message: 'Vérifiez l\'URL et la méthode HTTP'
  });
});

// Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);

  // Erreur de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Erreur de validation',
      details: error.message
    });
  }

  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }

  // Erreur CORS
  if (error.message === 'Non autorisé par CORS') {
    return res.status(403).json({
      success: false,
      error: 'Origine non autorisée',
      message: 'Votre domaine n\'est pas autorisé à accéder à cette API'
    });
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'production'
      ? 'Une erreur est survenue'
      : error.message
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DÉMARRAGE DU SERVEUR
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ SERVEUR DÉMARRÉ AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🌐 URL locale:     http://localhost:${PORT}`);
  console.log(`🏥 Health check:   http://localhost:${PORT}/api/health`);
  console.log(`📊 Base de données: PostgreSQL Neon ✅`);
  console.log(`🔒 Sécurité:        Helmet + Rate Limiting ✅`);
  console.log(`🌍 CORS:            Flexible + Sécurisé ✅`);
  console.log(`📝 Logging:         Morgan ✅`);
  console.log(`✨ Tâches:          Système v2.1.0 ✅`);
  console.log(`📅 Événements:      Système v2.2.0 ✅`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎯 Serveur prêt à recevoir des requêtes !');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Démarrer les jobs cron pour les événements
  try {
    const { startAllJobs } = require('./jobs/eventJobs');
    startAllJobs();
  } catch (error) {
    console.error('❌ Erreur démarrage jobs événements:', error.message);
  }

  // Démarrer le job de backup automatique
  try {
    const { startBackupJob } = require('./jobs/backupJob');
    startBackupJob();
    console.log('💾 Backup:          Automatique quotidien à 02:00 ✅');
  } catch (error) {
    console.error('❌ Erreur démarrage job backup:', error.message);
  }
});

// Timeout serveur pour les uploads volumineux (5 minutes)
server.timeout = 300000;
server.keepAliveTimeout = 300000;
server.headersTimeout = 310000;

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

module.exports = app;
