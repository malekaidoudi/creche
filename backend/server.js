#!/usr/bin/env node

// Charger les variables d'environnement
require('dotenv').config();

console.log('🚀 SERVEUR POSTGRESQL CRÈCHE MIMA ELGHALIA - PRODUCTION READY');
console.log('============================================================');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { Pool } = require('pg');
const { initializeDatabase } = require('./init_database');

const app = express();
const PORT = process.env.PORT || 3003; // Port dynamique pour Render

// Configuration PostgreSQL Neon
console.log('🔧 Configuration PostgreSQL Neon:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false
});

// Test de connexion
pool.connect()
  .then(client => {
    console.log('✅ Connexion PostgreSQL Neon réussie !');
    client.release();
  })
  .catch(err => {
    console.error('❌ Erreur connexion PostgreSQL:', err.message);
  });

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Désactivé pour permettre les uploads d'images
}));
app.use(compression());

// CORS configuration pour production (AVANT tout le reste)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://192.168.1.60:5173',
  'https://malekaidoudi.github.io',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images uploadées) APRÈS CORS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Dossier uploads configuré:', path.join(__dirname, 'uploads'));

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Serveur PostgreSQL Crèche Mima Elghalia',
    version: '2.1.0-postgresql-fixed',
    database: 'PostgreSQL Neon',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Import et utilisation des routes existantes seulement
try {
  // Test de chargement des routes une par une
  console.log('🔄 Chargement des routes...');
  
  const healthRoutes = require('./routes_postgres/health');
  app.use('/api/health', healthRoutes);
  console.log('✅ Route health chargée');
  
  const authRoutes = require('./routes_postgres/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Route auth chargée');
  
  const usersRoutes = require('./routes_postgres/users');
  app.use('/api/users', usersRoutes);
  app.use('/api/user', usersRoutes); // Réactivé - base de données maintenant initialisée
  console.log('✅ Route users chargée');
  
  // Routes children - UTILISATION DU FICHIER ROUTES SEULEMENT
  const childrenRoutes = require('./routes_postgres/children');
  app.use('/api/children', childrenRoutes);
  console.log('✅ Route children chargée');
  
  const nurserySettingsRoutes = require('./routes_postgres/nurserySettings');
  app.use('/api/nursery-settings', nurserySettingsRoutes);
  console.log('✅ Route nursery-settings chargée');
  
  const notificationsRoutes = require('./routes_postgres/notifications');
  app.use('/api/notifications', notificationsRoutes);
  console.log('✅ Route notifications chargée');
  
  // Ajout des routes manquantes
  const enrollmentsRoutes = require('./routes_postgres/enrollments');
  app.use('/api/enrollments', enrollmentsRoutes);
  console.log('✅ Route enrollments chargée');
  
  try {
    const attendanceRoutes = require('./routes_postgres/attendance');
    app.use('/api/attendance', attendanceRoutes);
    console.log('✅ Route attendance chargée');
  } catch (error) {
    console.log('⚠️ Route attendance non disponible:', error.message);
  }
  
  // Ajout des routes manquantes
  try {
    const holidaysRoutes = require('./routes_postgres/holidays');
    app.use('/api/holidays', holidaysRoutes);
    console.log('✅ Route holidays chargée');
  } catch (error) {
    console.log('⚠️ Route holidays non disponible:', error.message);
  }
  
  try {
    const profileRoutes = require('./routes_postgres/profile');
    app.use('/api/profile', profileRoutes);
    console.log('✅ Route profile chargée');
  } catch (error) {
    console.log('⚠️ Route profile non disponible:', error.message);
  }
  
  try {
    const uploadsRoutes = require('./routes_postgres/uploads');
    app.use('/uploads', uploadsRoutes);
    console.log('✅ Route uploads chargée');
  } catch (error) {
    console.log('⚠️ Route uploads non disponible:', error.message);
  }
  
  try {
    const testEmailRoutes = require('./routes_postgres/test-email');
    app.use('/api/test-email', testEmailRoutes);
    console.log('✅ Route test-email chargée');
  } catch (error) {
    console.log('⚠️ Route test-email non disponible:', error.message);
  }

  // Route pour servir les fichiers statiques uploads
  const uploadsPath = path.join(__dirname, 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log('✅ Route fichiers statiques uploads configurée:', uploadsPath);

  console.log('✅ Routes PostgreSQL principales chargées avec succès');

} catch (error) {
  console.error('❌ Erreur lors du chargement des routes:', error.message);
  console.error('Stack:', error.stack);
}

// Routes de développement simples pour les autres
const devRoutes = [
  'absenceRequests', 'absences', 'articles', 'documents', 
  'logs', 'stats'
];

devRoutes.forEach(route => {
  app.get(`/api/${route}`, (req, res) => {
    res.json({
      success: true,
      message: `Route ${route} en développement`,
      data: [],
      total: 0
    });
  });
});

// Route contact dynamique - récupère les données de nursery_settings
app.get('/api/contact', async (req, res) => {
  try {
    const db = require('./config/db_postgres');
    
    // Récupérer les paramètres de contact depuis la base de données
    const result = await db.query(`
      SELECT setting_key, value_fr, value_ar 
      FROM nursery_settings 
      WHERE setting_key IN (
        'address', 'phone', 'email', 'nursery_name',
        'working_hours_weekdays', 'working_hours_saturday', 'saturday_open',
        'working_days'
      )
    `);
    
    // Organiser les données
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = {
        fr: row.value_fr,
        ar: row.value_ar
      };
    });
    
    // Construire les heures d'ouverture à partir des vraies données
    const weekdaysHours = settings.working_hours_weekdays?.fr || '07:00-18:00';
    const saturdayHours = settings.working_hours_saturday?.fr || '08:00-12:00';
    const saturdayOpen = settings.saturday_open?.fr === 'true';
    
    console.log('📅 Contact - Données récupérées:', {
      weekdaysHours,
      saturdayHours,
      saturdayOpen,
      saturday_open_raw: settings.saturday_open?.fr
    });
    
    // Construire les heures en français
    let hoursFr = [`Lun-Ven: ${weekdaysHours}`];
    if (saturdayOpen && saturdayHours) {
      hoursFr.push(`Sam: ${saturdayHours}`);
    }
    
    // Construire les heures en arabe
    let hoursAr = [`الإثنين-الجمعة: ${weekdaysHours}`];
    if (saturdayOpen && saturdayHours) {
      hoursAr.push(`السبت: ${saturdayHours}`);
    }
    
    res.json({
      success: true,
      contact: {
        address: settings.address?.fr || "8 Rue Bizerte, Medenine 4100, Tunisie",
        address_ar: settings.address?.ar || "8 شارع بنزرت، مدنين 4100، تونس",
        phone: settings.phone?.fr || "+216 25 95 35 32",
        email: settings.email?.fr || "contact@mimaelghalia.tn",
        hours: hoursFr.join(', ') || "Lun-Ven: 7h30-17h30",
        hours_ar: hoursAr.join('، ') || "الإثنين-الجمعة: 07:30-17:30"
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération contact:', error);
    // Fallback avec données statiques
    res.json({
      success: true,
      contact: {
        address: "8 Rue Bizerte, Medenine 4100, Tunisie",
        address_ar: "8 شارع بنزرت، مدنين 4100، تونس",
        phone: "+216 25 95 35 32",
        email: "contact@mimaelghalia.tn",
        hours: "Lun-Ven: 7h30-17h30",
        hours_ar: "الإثنين-الجمعة: 07:30-17:30"
      }
    });
  }
});

// Route reports spécifique
app.get('/api/attendance/report', (req, res) => {
  res.json({
    success: true,
    message: "Rapport de présence en développement",
    data: [],
    total: 0
  });
});

// Route simple-update pour nursery-settings - VRAIE MISE À JOUR
app.post('/api/nursery-settings/simple-update', async (req, res) => {
  try {
    const db = require('./config/db_postgres');
    console.log('📝 Mise à jour paramètres reçue:', req.body);
    
    const updates = req.body;
    let updatedCount = 0;
    
    // Mettre à jour chaque paramètre
    for (const [key, value] of Object.entries(updates)) {
      try {
        // Traitement spécial pour certaines clés
        let finalValue = value;
        if (key === 'saturday_open') {
          // Convertir explicitement en string 'true' ou 'false'
          finalValue = (value === true || value === 'true') ? 'true' : 'false';
          console.log(`🔄 Conversion saturday_open: ${value} → ${finalValue}`);
        } else if (key === 'working_hours_weekdays') {
          console.log(`🕐 Traitement working_hours_weekdays: ${value}`);
        }
        
        console.log(`📝 Mise à jour: ${key} = ${finalValue}`);
        
        // Vérifier si le paramètre existe
        const existingResult = await db.query(
          'SELECT id FROM nursery_settings WHERE setting_key = $1',
          [key]
        );
        
        if (existingResult.rows.length > 0) {
          // Mettre à jour
          await db.query(
            'UPDATE nursery_settings SET value_fr = $1, value_ar = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2',
            [finalValue, key]
          );
          console.log(`✅ Paramètre mis à jour: ${key} = ${finalValue}`);
        } else {
          // Créer nouveau paramètre
          await db.query(
            'INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category) VALUES ($1, $2, $2, $3)',
            [key, finalValue, 'general']
          );
          console.log(`✅ Nouveau paramètre créé: ${key} = ${finalValue}`);
        }
        updatedCount++;
      } catch (error) {
        console.error(`❌ Erreur mise à jour ${key}:`, error);
      }
    }
    
    console.log(`🎯 ${updatedCount} paramètres mis à jour avec succès`);
    
    res.json({
      success: true,
      message: `${updatedCount} paramètres mis à jour avec succès`,
      updatedCount
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour paramètres:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour des paramètres'
    });
  }
});

// Route principale pour récupérer tous les paramètres nursery
app.get('/api/nursery-settings', async (req, res) => {
  try {
    const db = require('./config/db_postgres');
    console.log('📡 GET /api/nursery-settings - Récupération des paramètres...');
    
    // Récupérer tous les paramètres
    const result = await db.query('SELECT setting_key, value_fr, value_ar FROM nursery_settings');
    console.log(`📊 Paramètres trouvés en base: ${result.rows.length}`);
    
    // Organiser les données
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = {
        fr: row.value_fr,
        ar: row.value_ar,
        value: row.value_fr // Compatibilité
      };
      console.log(`📝 ${row.setting_key}: ${row.value_fr}`);
    });
    
    res.json({
      success: true,
      settings: settings,
      language: 'fr',
      total: Object.keys(settings).length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération paramètres:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des paramètres' 
    });
  }
});

// Route spécifique pour le Footer avec format compatible
app.get('/api/nursery-settings/footer', async (req, res) => {
  try {
    const db = require('./config/db_postgres');
    
    // Récupérer tous les paramètres
    const result = await db.query('SELECT setting_key, value_fr, value_ar FROM nursery_settings');
    
    // Organiser les données
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.value_fr, // Utiliser le français par défaut pour le Footer
        value_fr: row.value_fr,
        value_ar: row.value_ar
      };
    });
    
    // Construire les horaires au format attendu par le Footer
    const weekdaysHours = settings.opening_hours_monday?.value || '07:00-18:00';
    const saturdayHours = settings.opening_hours_saturday?.value || '08:00-14:00';
    
    // Vérifier si samedi est ouvert - utiliser la valeur de saturday_open
    let saturdayOpen = false; // Par défaut fermé
    if (settings.saturday_open?.value) {
      saturdayOpen = settings.saturday_open.value === 'true';
      console.log(`🔍 Footer - saturday_open trouvé en base: ${settings.saturday_open.value} → ${saturdayOpen}`);
    } else {
      console.log('⚠️ Footer - saturday_open non trouvé en base, utilisation par défaut: false');
    }
    
    console.log(`📅 Samedi ouvert: ${saturdayOpen}, Horaires samedi: ${saturdayHours}`);
    
    // Ajouter les formats compatibles
    settings.working_hours_weekdays = {
      value: weekdaysHours.includes('-') ? 
        `{"start": "${weekdaysHours.split('-')[0]}", "end": "${weekdaysHours.split('-')[1]}"}` :
        '{"start": "07:00", "end": "18:00"}'
    };
    
    settings.working_hours_saturday = {
      value: (saturdayOpen && saturdayHours.includes('-')) ? 
        `{"start": "${saturdayHours.split('-')[0]}", "end": "${saturdayHours.split('-')[1]}"}` :
        '{"start": "08:00", "end": "14:00"}'
    };
    
    settings.saturday_open = {
      value: saturdayOpen ? 'true' : 'false'
    };
    
    res.json({
      success: true,
      settings: settings,
      language: 'fr',
      total: Object.keys(settings).length
    });
    
  } catch (error) {
    console.error('Erreur récupération paramètres footer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des paramètres' 
    });
  }
});

// Routes de correction supprimées - maintenant gérées par les vraies routes


// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error.message);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Démarrage du serveur avec initialisation de la base de données
app.listen(PORT, async () => {
  console.log(`🚀 Serveur PostgreSQL démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  
  // Initialiser la base de données
  try {
    await initializeDatabase();
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
  }
  
  console.log(`📊 Routes principales disponibles:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/users`);
  console.log(`   - GET  /api/children`);
  console.log(`   - GET  /api/enrollments`);
  console.log(`   - GET  /api/attendance`);
  console.log(`   - GET  /api/notifications`);
  console.log(`   - GET  /api/nursery-settings`);
  console.log(`   - GET  /api/holidays`);
  console.log('');
  console.log('🎯 Serveur prêt à recevoir des requêtes !');
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('🔄 Arrêt du serveur...');
  pool.end(() => {
    console.log('✅ Connexions PostgreSQL fermées');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Arrêt du serveur...');
  pool.end(() => {
    console.log('✅ Connexions PostgreSQL fermées');
    process.exit(0);
  });
});
