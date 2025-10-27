#!/usr/bin/env node

/**
 * Serveur minimal pour tester PostgreSQL Neon
 */

const express = require('express');
const cors = require('cors');
const db = require('./config/db_postgres');

const app = express();
const PORT = 3000;

// Middlewares de base
app.use(express.json());
app.use(cors());

// Route de test
app.get('/api/test', async (req, res) => {
  try {
    console.log('🧪 Test route appelée');
    
    // Test PostgreSQL
    const result = await db.query('SELECT NOW() as current_time, COUNT(*) as user_count FROM users');
    
    res.json({
      status: 'success',
      message: 'Serveur et PostgreSQL fonctionnent !',
      data: {
        time: result.rows[0].current_time,
        users: result.rows[0].user_count
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Route de santé simple
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Serveur minimal actif',
    database: 'PostgreSQL Neon'
  });
});

// Route pour tester les données migrées
app.get('/api/data', async (req, res) => {
  try {
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    const children = await db.query('SELECT COUNT(*) as count FROM children');
    const settings = await db.query('SELECT COUNT(*) as count FROM nursery_settings');
    const enrollments = await db.query('SELECT COUNT(*) as count FROM enrollments');
    const attendance = await db.query('SELECT COUNT(*) as count FROM attendance');
    
    res.json({
      status: 'success',
      data: {
        users: users.rows[0].count,
        children: children.rows[0].count,
        settings: settings.rows[0].count,
        enrollments: enrollments.rows[0].count,
        attendance: attendance.rows[0].count
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur données:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`🚀 Serveur minimal démarré sur http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`❤️  Santé: http://localhost:${PORT}/api/health`);
  console.log(`📊 Données: http://localhost:${PORT}/api/data`);
  
  // Test de connexion PostgreSQL
  try {
    console.log('🔄 Test de connexion PostgreSQL...');
    await db.testConnection();
    console.log('✅ PostgreSQL Neon connecté !');
  } catch (error) {
    console.error('❌ PostgreSQL non accessible:', error.message);
  }
});
