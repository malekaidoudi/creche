#!/usr/bin/env node

// Charger les variables d'environnement
require('dotenv').config();

console.log('🚀 SERVEUR POSTGRESQL CRÈCHE MIMA ELGHALIA');
console.log('==========================================');

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3006;

// Configuration PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false
});

// Middlewares
app.use(express.json());
app.use(cors());

// Route de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'Serveur Crèche Mima Elghalia - PostgreSQL Edition',
    version: '2.1.0-postgresql',
    database: 'PostgreSQL Neon',
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        NOW() as time, 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM children) as children,
        (SELECT COUNT(*) FROM nursery_settings) as settings
    `);
    client.release();
    
    res.json({
      status: 'ok',
      message: 'PostgreSQL Neon connecté !',
      version: '2.1.0-postgresql',
      database: {
        connected: true,
        time: result.rows[0].time,
        users: result.rows[0].users,
        children: result.rows[0].children,
        settings: result.rows[0].settings
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur health:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
      database: 'PostgreSQL Neon (erreur)'
    });
  }
});

// Route nursery-settings
app.get('/api/nursery-settings', async (req, res) => {
  try {
    const { lang = 'fr', category } = req.query;
    
    let sql = 'SELECT setting_key, value_fr, value_ar, category FROM nursery_settings WHERE is_active = TRUE';
    const params = [];
    
    if (category) {
      sql += ' AND category = $1';
      params.push(category);
    }
    
    sql += ' ORDER BY setting_key';
    
    const client = await pool.connect();
    const result = await client.query(sql, params);
    client.release();
    
    // Transformer en objet avec les valeurs selon la langue
    const settings = {};
    result.rows.forEach(row => {
      const value = lang === 'ar' && row.value_ar ? row.value_ar : row.value_fr;
      settings[row.setting_key] = value;
    });
    
    res.json({
      success: true,
      settings,
      language: lang,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Erreur settings:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email et mot de passe requis' 
      });
    }
    
    const client = await pool.connect();
    const result = await client.query(
      'SELECT id, email, first_name, last_name, role, phone, is_active FROM users WHERE email = $1',
      [email]
    );
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Compte désactivé' });
    }
    
    // Pour la démo, on accepte tous les mots de passe
    res.json({
      message: 'Connexion réussie',
      token: 'demo-token-' + Date.now(),
      user: user
    });
    
  } catch (error) {
    console.error('❌ Erreur login:', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route users
app.get('/api/users', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT id, email, first_name, last_name, role, phone, is_active, created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    client.release();
    
    res.json({
      success: true,
      users: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Erreur users:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route children
app.get('/api/children', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT id, first_name, last_name, birth_date, gender, medical_info, 
             emergency_contact_name, emergency_contact_phone, photo_url, 
             is_active, created_at, updated_at
      FROM children
      ORDER BY first_name, last_name
    `);
    client.release();
    
    res.json({
      success: true,
      children: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Erreur children:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route holidays
app.get('/api/holidays', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT id, name, date, is_closed, description, created_at
      FROM holidays 
      ORDER BY date ASC
    `);
    client.release();
    
    res.json({
      success: true,
      holidays: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Erreur holidays:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Routes PostgreSQL complètes
const authRoutes = require('./routes_postgres/auth');
const usersRoutes = require('./routes_postgres/users');
const childrenRoutes = require('./routes_postgres/children');
const enrollmentsRoutes = require('./routes_postgres/enrollments');
const attendanceRoutes = require('./routes_postgres/attendance');
const notificationsRoutes = require('./routes_postgres/notifications');
const nurserySettingsRoutes = require('./routes_postgres/nurserySettings');
const holidaysRoutes = require('./routes_postgres/holidays');

// Utiliser les routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/nursery-settings', nurserySettingsRoutes);
app.use('/api/holidays', holidaysRoutes);

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error.message);
  res.status(500).json({
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

console.log('🔧 Démarrage du serveur PostgreSQL...');

const server = app.listen(PORT, () => {
  console.log('✅ ========================================');
  console.log('✅ SERVEUR POSTGRESQL CRÈCHE DÉMARRÉ !');
  console.log('✅ ========================================');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️  Santé: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Paramètres: http://localhost:${PORT}/api/nursery-settings`);
  console.log(`👥 Utilisateurs: http://localhost:${PORT}/api/users`);
  console.log(`👶 Enfants: http://localhost:${PORT}/api/children`);
  console.log(`📅 Jours fériés: http://localhost:${PORT}/api/holidays`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log('✅ ========================================');
});

server.on('error', (error) => {
  console.error('❌ Erreur serveur:', error.message);
  process.exit(1);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🔄 Arrêt du serveur...');
  server.close(async () => {
    console.log('🔒 Serveur arrêté');
    await pool.end();
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non gérée:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promesse rejetée:', error.message);
  process.exit(1);
});
