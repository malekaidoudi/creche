const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  res.json({ message: 'Service de configuration initial' });
});

// POST /api/setup/create-admin - Créer le compte admin initial (Désactivé en production - SEC-04)
router.post('/create-admin', async (req, res) => {
  try {
    // Sécurité SEC-04 : interdire formellement cet endpoint en production ou sans flag explicite
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_INITIAL_SETUP !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Cet endpoint d\'initialisation est désactivé pour des raisons de sécurité.'
      });
    }

    console.log('🔧 Création du compte admin initial...');

    // Vérifier si la table users existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          role VARCHAR(50) DEFAULT 'parent',
          phone VARCHAR(50),
          profile_image TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table users créée');
    }

    // Vérifier si l'admin existe déjà
    const existingAdmin = await db.query(
      'SELECT id FROM users WHERE email = $1',
      ['crechemimaelghalia@gmail.com']
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Le compte administrateur existe déjà.'
      });
    }

    // Créer le compte admin avec mot de passe fourni ou généré
    const initialPassword = req.body.password || 'password';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    await db.query(
      `INSERT INTO users (email, password, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['crechemimaelghalia@gmail.com', hashedPassword, 'Admin', 'Crèche', 'admin', true]
    );

    console.log('✅ Compte admin créé avec succès');
    res.json({
      success: true,
      message: 'Compte admin créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la configuration' });
  }
});

// GET /api/setup/check-users - Vérifier les utilisateurs (Protégé admin/developer)
router.get('/check-users', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, role, is_active FROM users LIMIT 10');
    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
