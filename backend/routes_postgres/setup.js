const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db_postgres');

router.get('/', (req, res) => {
  res.json({ message: 'Route setup PostgreSQL - En développement', database: 'PostgreSQL Neon' });
});

// POST /api/setup/create-admin - Créer le compte admin
router.post('/create-admin', async (req, res) => {
  try {
    console.log('🔧 Création du compte admin...');

    // Vérifier si la table users existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      // Créer la table users si elle n'existe pas
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
      // Mettre à jour le mot de passe
      const hashedPassword = await bcrypt.hash('password', 10);
      await db.query(
        'UPDATE users SET password = $1, is_active = true WHERE email = $2',
        [hashedPassword, 'crechemimaelghalia@gmail.com']
      );
      console.log('✅ Mot de passe admin mis à jour');
      return res.json({ success: true, message: 'Mot de passe admin mis à jour' });
    }

    // Créer le compte admin
    const hashedPassword = await bcrypt.hash('password', 10);
    await db.query(
      `INSERT INTO users (email, password, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['crechemimaelghalia@gmail.com', hashedPassword, 'Admin', 'Crèche', 'admin', true]
    );

    console.log('✅ Compte admin créé avec succès');
    res.json({
      success: true,
      message: 'Compte admin créé',
      credentials: {
        email: 'crechemimaelghalia@gmail.com',
        password: 'password'
      }
    });

  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/setup/check-users - Vérifier les utilisateurs
router.get('/check-users', async (req, res) => {
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
