const { pool } = require('../config/database');

// Script d'initialisation de la base de données Railway
async function initDatabase() {
  console.log('🚀 Initialisation de la base de données Railway...');
  
  try {
    // Table des paramètres
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS creche_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type ENUM('text', 'number', 'boolean', 'image', 'color', 'json') DEFAULT 'text',
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table creche_settings créée');

    // Table des utilisateurs (pour l'authentification)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff', 'parent') DEFAULT 'parent',
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table users créée');

    // Table des enfants
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        birth_date DATE NOT NULL,
        gender ENUM('M', 'F') NOT NULL,
        profile_picture VARCHAR(255),
        medical_info TEXT,
        allergies TEXT,
        emergency_contact TEXT,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (first_name, last_name),
        INDEX idx_birth_date (birth_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table children créée');

    // Table des inscriptions
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        child_id INT NOT NULL,
        parent_id INT NOT NULL,
        enrollment_date DATE NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'active', 'inactive') DEFAULT 'pending',
        lunch_assistance BOOLEAN DEFAULT FALSE,
        pickup_authorization TEXT,
        documents_uploaded BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_child (child_id),
        INDEX idx_parent (parent_id),
        INDEX idx_status (status),
        INDEX idx_enrollment_date (enrollment_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table enrollments créée');

    // Insérer des paramètres par défaut
    const defaultSettings = [
      ['nursery_name', 'Crèche Mima El Ghalia', 'text', 'general', 'Nom de la crèche'],
      ['nursery_logo', '/images/logo.png', 'image', 'branding', 'Logo de la crèche'],
      ['nursery_favicon', '/images/favicon.ico', 'image', 'branding', 'Favicon du site'],
      ['primary_color', '#3B82F6', 'color', 'branding', 'Couleur principale'],
      ['secondary_color', '#10B981', 'color', 'branding', 'Couleur secondaire'],
      ['contact_phone', '+33 1 23 45 67 89', 'text', 'contact', 'Téléphone de contact'],
      ['contact_email', 'contact@creche-mima.fr', 'text', 'contact', 'Email de contact'],
      ['address', '123 Rue de la Crèche, 75001 Paris', 'text', 'contact', 'Adresse de la crèche'],
      ['opening_hours', '7h30 - 18h30', 'text', 'general', 'Horaires d\'ouverture'],
      ['capacity', '60', 'number', 'general', 'Capacité d\'accueil'],
      ['age_range', '3 mois - 3 ans', 'text', 'general', 'Tranche d\'âge accueillie']
    ];

    for (const [key, value, type, category, description] of defaultSettings) {
      await pool.execute(`
        INSERT IGNORE INTO creche_settings (setting_key, setting_value, setting_type, category, description)
        VALUES (?, ?, ?, ?, ?)
      `, [key, value, type, category, description]);
    }
    console.log('✅ Paramètres par défaut insérés');

    console.log('🎉 Base de données initialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('✅ Initialisation terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Échec de l\'initialisation:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
