const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

// Charger le .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function quickSetup() {
  try {
    console.log('🔄 Configuration rapide de la base de données...');
    
    // Connexion sans spécifier de base de données
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      socketPath: process.env.DB_SOCKET,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'root'
    });
    
    console.log('✅ Connexion MySQL réussie');
    
    // Créer la base de données si elle n'existe pas
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'mima_elghalia_db'}`);
    console.log('✅ Base de données créée/vérifiée');
    
    // Se reconnecter avec la base de données spécifiée
    await connection.end();
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      socketPath: process.env.DB_SOCKET,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'root',
      database: process.env.DB_NAME || 'mima_elghalia_db'
    });
    
    // Créer la table users si elle n'existe pas
    await dbConnection.execute(`
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
    console.log('✅ Table users créée/vérifiée');
    
    // Vérifier si des utilisateurs existent
    const [users] = await dbConnection.execute('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      console.log('🔄 Création des utilisateurs de test...');
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      // Insérer les utilisateurs de test
      await dbConnection.execute(`
        INSERT INTO users (first_name, last_name, email, password, role, phone) VALUES
        ('Admin', 'Test', 'admin@creche.test', ?, 'admin', '+33123456789'),
        ('Staff', 'Test', 'staff@creche.test', ?, 'staff', '+33123456790'),
        ('Parent', 'Test', 'parent@creche.test', ?, 'parent', '+33123456791')
      `, [hashedPassword, hashedPassword, hashedPassword]);
      
      console.log('✅ Utilisateurs de test créés');
    } else {
      console.log('✅ Utilisateurs déjà existants');
    }
    
    // Vérifier les utilisateurs créés
    const [testUsers] = await dbConnection.execute('SELECT email, role FROM users');
    console.log('👥 Utilisateurs disponibles:');
    testUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
    await dbConnection.end();
    console.log('🎉 Configuration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

quickSetup();
