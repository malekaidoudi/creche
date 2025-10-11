const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  socketPath: process.env.DB_SOCKET_PATH || '/Applications/MAMP/tmp/mysql/mysql.sock',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mima_elghalia_db',
  multipleStatements: true
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connexion à la base de données...');
    connection = mysql.createConnection(dbConfig);
    
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'migration-v1-mvp.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Exécution de la migration...');
    
    // Exécuter la migration
    await new Promise((resolve, reject) => {
      connection.query(migrationSQL, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    console.log('✅ Migration exécutée avec succès !');
    console.log('📋 Tables créées/mises à jour :');
    console.log('   - uploads');
    console.log('   - enrollments');
    console.log('   - attendance');
    console.log('   - settings');
    console.log('   - children (colonnes ajoutées)');
    console.log('   - users (colonnes ajoutées)');
    console.log('👥 Comptes de test créés :');
    console.log('   - admin@creche.test / Password123!');
    console.log('   - staff@creche.test / Password123!');
    console.log('   - parent@creche.test / Password123!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

// Exécuter la migration
runMigration();
