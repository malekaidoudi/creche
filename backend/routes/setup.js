const express = require('express');
const bcrypt = require('bcryptjs');
const { execute } = require('../config/database');

const router = express.Router();

// Route temporaire pour créer les utilisateurs de test
router.post('/create-test-users', async (req, res) => {
  try {
    console.log('🔄 Création des utilisateurs de test...');
    
    // Vérifier si des utilisateurs existent déjà
    const [existingUsers] = await execute('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count > 0) {
      return res.json({ 
        message: 'Utilisateurs déjà existants',
        count: existingUsers[0].count 
      });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Créer les utilisateurs de test
    const users = [
      ['Admin', 'Test', 'admin@creche.test', hashedPassword, 'admin', '+33123456789'],
      ['Staff', 'Test', 'staff@creche.test', hashedPassword, 'staff', '+33123456790'],
      ['Parent', 'Test', 'parent@creche.test', hashedPassword, 'parent', '+33123456791']
    ];
    
    for (const user of users) {
      await execute(
        'INSERT INTO users (first_name, last_name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
        user
      );
    }
    
    console.log('✅ Utilisateurs de test créés');
    
    res.json({ 
      message: 'Utilisateurs de test créés avec succès',
      users: [
        { email: 'admin@creche.test', password: 'Password123!', role: 'admin' },
        { email: 'staff@creche.test', password: 'Password123!', role: 'staff' },
        { email: 'parent@creche.test', password: 'Password123!', role: 'parent' }
      ]
    });
    
  } catch (error) {
    console.error('Erreur création utilisateurs:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création des utilisateurs',
      details: error.message 
    });
  }
});

// Route pour lister les utilisateurs existants
router.get('/list-users', async (req, res) => {
  try {
    const [users] = await execute('SELECT id, email, role, first_name, last_name FROM users');
    res.json({ users });
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des utilisateurs',
      details: error.message 
    });
  }
});

// Route pour réinitialiser les mots de passe des utilisateurs de test
router.post('/reset-test-passwords', async (req, res) => {
  try {
    console.log('🔄 Réinitialisation des mots de passe...');
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Mettre à jour les mots de passe des utilisateurs de test
    const testEmails = ['admin@creche.test', 'staff@creche.test', 'parent@creche.test'];
    
    for (const email of testEmails) {
      await execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    }
    
    console.log('✅ Mots de passe réinitialisés');
    
    res.json({ 
      message: 'Mots de passe réinitialisés avec succès',
      password: 'Password123!',
      users: testEmails
    });
    
  } catch (error) {
    console.error('Erreur réinitialisation mots de passe:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la réinitialisation',
      details: error.message 
    });
  }
});

module.exports = router;
