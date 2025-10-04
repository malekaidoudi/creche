const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

async function initProductionDatabase() {
  try {
    console.log('🚀 Initialisation de la base de données de production...');

    // Vérifier si les tables existent déjà
    const tables = await query("SHOW TABLES");
    const tableNames = tables.map(table => Object.values(table)[0]);

    if (tableNames.length === 0) {
      console.log('📋 Création des tables...');
      
      // Créer les tables (vous pouvez importer votre script SQL ici)
      // Pour l'instant, on assume que les tables existent
      console.log('⚠️  Veuillez exécuter le script SQL de création des tables manuellement');
      console.log('   ou importer votre fichier database.sql');
    }

    // Vérifier si l'admin existe déjà
    const existingAdmin = await query(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@mimaelghalia.tn', 'admin']
    );

    if (existingAdmin.length === 0) {
      console.log('👤 Création du compte administrateur...');
      
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      await query(`
        INSERT INTO users (
          first_name, last_name, email, password, role, 
          phone, is_active, email_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Admin',
        'Système',
        'admin@mimaelghalia.tn',
        hashedPassword,
        'admin',
        '+216 71 000 000',
        true,
        true
      ]);
      
      console.log('✅ Compte administrateur créé');
      console.log('   Email: admin@mimaelghalia.tn');
      console.log('   Mot de passe: Admin123!');
    } else {
      console.log('✅ Compte administrateur existe déjà');
    }

    // Vérifier si le compte staff existe
    const existingStaff = await query(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['staff@mimaelghalia.tn', 'staff']
    );

    if (existingStaff.length === 0) {
      console.log('👥 Création du compte staff...');
      
      const hashedPassword = await bcrypt.hash('Staff123!', 12);
      
      await query(`
        INSERT INTO users (
          first_name, last_name, email, password, role, 
          phone, is_active, email_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Staff',
        'Équipe',
        'staff@mimaelghalia.tn',
        hashedPassword,
        'staff',
        '+216 71 000 001',
        true,
        true
      ]);
      
      console.log('✅ Compte staff créé');
      console.log('   Email: staff@mimaelghalia.tn');
      console.log('   Mot de passe: Staff123!');
    } else {
      console.log('✅ Compte staff existe déjà');
    }

    console.log('');
    console.log('🎉 Base de données de production initialisée avec succès !');
    console.log('');
    console.log('📋 Comptes créés :');
    console.log('   👑 Admin: admin@mimaelghalia.tn / Admin123!');
    console.log('   👥 Staff: staff@mimaelghalia.tn / Staff123!');
    console.log('');
    console.log('⚠️  IMPORTANT: Changez ces mots de passe après la première connexion !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  initProductionDatabase()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur:', error);
      process.exit(1);
    });
}

module.exports = { initProductionDatabase };
