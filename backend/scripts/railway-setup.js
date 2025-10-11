const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function railwaySetup() {
  try {
    console.log('🚂 Configuration Railway en cours...');
    
    // Utiliser les variables d'environnement Railway
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASS,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway'
    });
    
    console.log('✅ Connexion MySQL Railway réussie');
    
    // Créer la table users si elle n'existe pas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
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
    
    // Créer la table children
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS children (
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
        FOREIGN KEY (parent_id) REFERENCES users(id)
      )
    `);
    
    // Créer la table enrollments
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS enrollments (
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
        FOREIGN KEY (parent_id) REFERENCES users(id),
        FOREIGN KEY (child_id) REFERENCES children(id)
      )
    `);
    
    console.log('✅ Tables créées');
    
    // Vérifier si des utilisateurs existent
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      console.log('🔄 Création des utilisateurs de test...');
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      // Insérer les utilisateurs de test
      await connection.execute(`
        INSERT INTO users (first_name, last_name, email, password, role, phone) VALUES
        ('Admin', 'Railway', 'admin@creche.test', ?, 'admin', '+216123456789'),
        ('Staff', 'Railway', 'staff@creche.test', ?, 'staff', '+216123456790'),
        ('Parent', 'Railway', 'parent@creche.test', ?, 'parent', '+216123456791')
      `, [hashedPassword, hashedPassword, hashedPassword]);
      
      console.log('✅ Utilisateurs de test créés');
    }
    
    await connection.end();
    console.log('🎉 Configuration Railway terminée !');
    
  } catch (error) {
    console.error('❌ Erreur Railway:', error.message);
    process.exit(1);
  }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
  railwaySetup();
}

module.exports = railwaySetup;
