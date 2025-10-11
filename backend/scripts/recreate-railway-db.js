const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function recreateRailwayDB() {
  try {
    console.log('🚂 Recréation de la base de données Railway...');
    
    // Configuration Railway
    const config = {
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASS,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway'
    };
    
    console.log('📋 Configuration Railway:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Database: ${config.database}`);
    
    if (!config.host || !config.user || !config.password) {
      throw new Error('Variables d\'environnement Railway manquantes');
    }
    
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion Railway réussie');
    
    // ⚠️ SUPPRESSION ET RECRÉATION DES TABLES
    console.log('⚠️  ATTENTION: Suppression de toutes les données existantes...');
    
    // Supprimer les tables dans l'ordre (à cause des clés étrangères)
    const tablesToDrop = ['enrollments', 'attendance', 'children', 'users'];
    
    for (const table of tablesToDrop) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`   ✅ Table ${table} supprimée`);
      } catch (error) {
        console.log(`   ⚠️  Table ${table} n'existait pas`);
      }
    }
    
    // Créer la table users
    await connection.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'staff', 'parent') DEFAULT 'parent',
        profile_image VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table users créée');
    
    // Créer la table children
    await connection.execute(`
      CREATE TABLE children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        birth_date DATE NOT NULL,
        gender ENUM('M', 'F') NOT NULL,
        parent_id INT,
        medical_info TEXT,
        emergency_contact_name VARCHAR(200),
        emergency_contact_phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Table children créée');
    
    // Créer la table enrollments
    await connection.execute(`
      CREATE TABLE enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT,
        child_id INT,
        child_first_name VARCHAR(100) NOT NULL,
        child_last_name VARCHAR(100) NOT NULL,
        parent_first_name VARCHAR(100) NOT NULL,
        parent_last_name VARCHAR(100) NOT NULL,
        parent_email VARCHAR(255) NOT NULL,
        parent_phone VARCHAR(20),
        birth_date DATE NOT NULL,
        gender ENUM('M', 'F') NOT NULL,
        medical_info TEXT,
        emergency_contact_name VARCHAR(200),
        emergency_contact_phone VARCHAR(20),
        enrollment_date DATE NOT NULL,
        lunch_assistance BOOLEAN DEFAULT FALSE,
        regulation_accepted BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        notes TEXT,
        carnet_medical VARCHAR(255),
        acte_naissance VARCHAR(255),
        certificat_medical VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Table enrollments créée');
    
    // Créer la table attendance
    await connection.execute(`
      CREATE TABLE attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        child_id INT NOT NULL,
        date DATE NOT NULL,
        check_in_time TIME,
        check_out_time TIME,
        status ENUM('present', 'absent', 'late', 'sick') DEFAULT 'present',
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_child_date (child_id, date)
      )
    `);
    console.log('✅ Table attendance créée');
    
    // Hasher le mot de passe (même que local)
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    // Insérer les utilisateurs de test (EXACTEMENT comme en local)
    await connection.execute(`
      INSERT INTO users (first_name, last_name, email, password, role, phone) VALUES
      ('Admin', 'Test', 'admin@creche.test', ?, 'admin', '+33123456789'),
      ('Staff', 'Test', 'staff@creche.test', ?, 'staff', '+33123456790'),
      ('Parent', 'Test', 'parent@creche.test', ?, 'parent', '+33123456791'),
      ('Sarah', 'Martin', 'sarah.martin@email.com', ?, 'parent', '+33123456792'),
      ('Pierre', 'Dubois', 'pierre.dubois@email.com', ?, 'parent', '+33123456793'),
      ('Marie', 'Leroy', 'marie.leroy@email.com', ?, 'staff', '+33123456794')
    `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]);
    
    console.log('✅ Utilisateurs de test créés');
    
    // Insérer quelques enfants de test
    await connection.execute(`
      INSERT INTO children (first_name, last_name, birth_date, gender, parent_id, medical_info) VALUES
      ('Emma', 'Martin', '2021-03-15', 'F', 4, 'Aucune allergie connue'),
      ('Lucas', 'Dubois', '2020-08-22', 'M', 5, 'Allergie aux arachides'),
      ('Léa', 'Test', '2021-06-10', 'F', 3, 'RAS'),
      ('Noah', 'Martin', '2022-01-05', 'M', 4, 'Asthme léger'),
      ('Chloé', 'Orpheline', '2021-11-30', 'F', NULL, 'En attente d\'adoption')
    `);
    
    console.log('✅ Enfants de test créés');
    
    // Insérer quelques demandes d'inscription
    await connection.execute(`
      INSERT INTO enrollments (
        child_first_name, child_last_name, parent_first_name, parent_last_name, 
        parent_email, parent_phone, birth_date, gender, enrollment_date, 
        status, lunch_assistance, regulation_accepted
      ) VALUES
      ('Jade', 'Nouveau', 'Alice', 'Nouveau', 'alice.nouveau@email.com', '+33123456800', '2021-05-20', 'F', '2024-01-15', 'pending', true, true),
      ('Tom', 'Candidat', 'Bob', 'Candidat', 'bob.candidat@email.com', '+33123456801', '2020-12-03', 'M', '2024-01-20', 'approved', false, true),
      ('Lily', 'Demande', 'Carol', 'Demande', 'carol.demande@email.com', '+33123456802', '2021-09-18', 'F', '2024-01-25', 'rejected', true, false)
    `);
    
    console.log('✅ Demandes d\'inscription créées');
    
    // Vérifier les données créées
    const [users] = await connection.execute('SELECT email, role FROM users');
    console.log('\n👥 Utilisateurs créés:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
    const [children] = await connection.execute('SELECT COUNT(*) as count FROM children');
    console.log(`\n👶 Enfants créés: ${children[0].count}`);
    
    const [enrollments] = await connection.execute('SELECT COUNT(*) as count FROM enrollments');
    console.log(`📝 Demandes d'inscription: ${enrollments[0].count}`);
    
    await connection.end();
    
    console.log('\n🎉 Base de données Railway recréée avec succès !');
    console.log('\n🎯 Comptes de test disponibles:');
    console.log('   - admin@creche.test / Password123!');
    console.log('   - staff@creche.test / Password123!');
    console.log('   - parent@creche.test / Password123!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur recréation Railway:', error.message);
    return false;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  recreateRailwayDB().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = recreateRailwayDB;
