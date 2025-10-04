const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function initUsers() {
  try {
    console.log('🔍 Initialisation des utilisateurs de test...');
    
    // Vérifier si la table users existe
    const tables = await query('SHOW TABLES LIKE "users"');
    if (tables.length === 0) {
      console.log('❌ Table users n\'existe pas. Veuillez d\'abord créer la base de données.');
      process.exit(1);
    }

    // Utilisateurs de test à créer
    const testUsers = [
      {
        email: 'admin@mimaelghalia.tn',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'Système',
        role: 'admin',
        phone: '+216 12 345 678'
      },
      {
        email: 'staff@mimaelghalia.tn',
        password: 'staff123',
        first_name: 'Éducatrice',
        last_name: 'Test',
        role: 'staff',
        phone: '+216 12 345 679'
      },
      {
        email: 'parent@mimaelghalia.tn',
        password: 'parent123',
        first_name: 'Parent',
        last_name: 'Test',
        role: 'parent',
        phone: '+216 12 345 680'
      }
    ];

    for (const user of testUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await query('SELECT id FROM users WHERE email = ?', [user.email]);
      
      if (existingUser.length > 0) {
        console.log(`⚠️  Utilisateur ${user.email} existe déjà`);
        
        // Mettre à jour le mot de passe au cas où
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await query(
          'UPDATE users SET password = ? WHERE email = ?',
          [hashedPassword, user.email]
        );
        console.log(`🔄 Mot de passe mis à jour pour ${user.email}`);
      } else {
        // Créer l'utilisateur
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await query(
          `INSERT INTO users (email, password, first_name, last_name, role, phone, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [user.email, hashedPassword, user.first_name, user.last_name, user.role, user.phone]
        );
        
        console.log(`✅ Utilisateur ${user.email} créé avec succès`);
      }
    }

    // Afficher tous les utilisateurs
    console.log('\n📋 Utilisateurs dans la base de données:');
    const allUsers = await query('SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY role, email');
    
    allUsers.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.email} (${user.first_name} ${user.last_name})`);
    });

    console.log('\n🎉 Initialisation terminée!');
    console.log('\n👤 Comptes de test disponibles:');
    console.log('Admin: admin@mimaelghalia.tn / admin123');
    console.log('Staff: staff@mimaelghalia.tn / staff123');
    console.log('Parent: parent@mimaelghalia.tn / parent123');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    console.error(error);
  }
  
  process.exit(0);
}

initUsers();
