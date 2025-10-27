#!/usr/bin/env node

const express = require('express');
const db = require('./config/db_postgres');

const app = express();
const PORT = 3000;

app.use(express.json());

// Route de test simple
app.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test de la route /test');
    
    // Test connexion DB
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Base de données connectée');
    
    // Test données
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    const children = await db.query('SELECT COUNT(*) as count FROM children');
    const settings = await db.query('SELECT COUNT(*) as count FROM nursery_settings');
    
    res.json({
      status: 'success',
      message: 'Serveur et PostgreSQL fonctionnent !',
      database: {
        connected: true,
        time: result.rows[0].current_time,
        data: {
          users: users.rows[0].count,
          children: children.rows[0].count,
          settings: settings.rows[0].count
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur de test actif' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
  console.log(`❤️  Santé: http://localhost:${PORT}/health`);
});

// Test de connexion au démarrage
(async () => {
  try {
    console.log('🔄 Test de connexion PostgreSQL...');
    await db.testConnection();
    console.log('✅ PostgreSQL prêt !');
  } catch (error) {
    console.error('❌ PostgreSQL non accessible:', error.message);
  }
})();
