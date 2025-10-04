const { query } = require('../config/database')

// Configuration globale pour les tests
beforeAll(async () => {
  // Créer les tables de test si elles n'existent pas
  await setupTestDatabase()
})

afterAll(async () => {
  // Nettoyer après tous les tests
  await cleanupTestDatabase()
})

beforeEach(async () => {
  // Nettoyer les données avant chaque test
  await cleanupTestData()
})

async function setupTestDatabase() {
  try {
    // Créer la table users pour les tests
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'staff', 'parent') NOT NULL DEFAULT 'parent',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Créer la table children pour les tests
    await query(`
      CREATE TABLE IF NOT EXISTS children (
        id INT PRIMARY KEY AUTO_INCREMENT,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        birth_date DATE NOT NULL,
        gender ENUM('male', 'female') NOT NULL,
        parent_id INT NOT NULL,
        medical_info TEXT,
        emergency_contact VARCHAR(255),
        enrollment_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    console.log('✅ Tables de test créées')
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables de test:', error)
  }
}

async function cleanupTestData() {
  try {
    // Supprimer les données de test (garder la structure)
    await query('DELETE FROM children WHERE 1=1')
    await query('DELETE FROM users WHERE email LIKE "%test%"')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des données de test:', error)
  }
}

async function cleanupTestDatabase() {
  try {
    // Optionnel : supprimer les tables de test
    // await query('DROP TABLE IF EXISTS children')
    // await query('DROP TABLE IF EXISTS users')
    console.log('✅ Nettoyage des tests terminé')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la base de test:', error)
  }
}

module.exports = {
  setupTestDatabase,
  cleanupTestData,
  cleanupTestDatabase
}
