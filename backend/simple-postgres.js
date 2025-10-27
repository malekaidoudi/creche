#!/usr/bin/env node

// Charger les variables d'environnement
require('dotenv').config();

console.log('🚀 SERVEUR SIMPLE POSTGRESQL');
console.log('🔧 Variables DB:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

const express = require('express');
const app = express();
const PORT = 3005;

app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  console.log('✅ Route / appelée');
  res.json({ 
    message: 'Serveur PostgreSQL simple fonctionne !',
    database: 'PostgreSQL Neon',
    timestamp: new Date().toISOString()
  });
});

// Route de santé avec PostgreSQL
app.get('/api/health', async (req, res) => {
  console.log('❤️ Health check appelé');
  
  try {
    // Test PostgreSQL
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, COUNT(*) as users FROM users');
    client.release();
    await pool.end();
    
    console.log('✅ PostgreSQL testé avec succès');
    
    res.json({
      status: 'ok',
      message: 'PostgreSQL Neon fonctionne !',
      database: {
        connected: true,
        time: result.rows[0].time,
        users: result.rows[0].users
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur PostgreSQL:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Route nursery-settings
app.get('/api/nursery-settings', async (req, res) => {
  console.log('⚙️ Nursery settings appelé');
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT setting_key, value_fr FROM nursery_settings LIMIT 5');
    client.release();
    await pool.end();
    
    res.json({
      success: true,
      settings: result.rows,
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

console.log('🔧 Démarrage du serveur simple...');

app.listen(PORT, () => {
  console.log('✅ ================================');
  console.log('✅ SERVEUR SIMPLE DÉMARRÉ !');
  console.log('✅ ================================');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️  Santé: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Paramètres: http://localhost:${PORT}/api/nursery-settings`);
  console.log('✅ ================================');
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non gérée:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promesse rejetée:', error.message);
});
