const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la base de données (sans spécifier la DB pour pouvoir la créer)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  socketPath: process.env.DB_SOCKET_PATH || '/Applications/MAMP/tmp/mysql/mysql.sock',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  multipleStatements: true
};

async function recreateDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connexion au serveur MySQL...');
    connection = mysql.createConnection(dbConfig);
    
    // Lire le fichier de recréation
    const recreatePath = path.join(__dirname, 'recreate-database.sql');
    const recreateSQL = fs.readFileSync(recreatePath, 'utf8');
    
    console.log('⚠️  ATTENTION: Suppression et recréation de la base de données...');
    console.log('📄 Exécution du script de recréation...');
    
    // Exécuter le script de recréation
    await new Promise((resolve, reject) => {
      connection.query(recreateSQL, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    console.log('✅ Base de données recréée avec succès !');
    console.log('');
    console.log('📊 Données créées :');
    console.log('   👥 Utilisateurs de test :');
    console.log('      - admin@creche.test / Password123! (Admin)');
    console.log('      - staff@creche.test / Password123! (Staff)');
    console.log('      - parent@creche.test / Password123! (Parent)');
    console.log('      - + 3 autres parents avec enfants');
    console.log('');
    console.log('   👶 Enfants de test : 5 enfants avec données complètes');
    console.log('   📝 Demandes d\'inscription : 3 demandes (2 en attente, 1 approuvée)');
    console.log('   ⏰ Présences : Données d\'aujourd\'hui et d\'hier');
    console.log('   ⚙️  Paramètres système : Configuration de base');
    console.log('');
    console.log('🚀 La base est prête pour les tests !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la recréation :', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

// Demander confirmation avant de supprimer la base
console.log('⚠️  ATTENTION: Ce script va SUPPRIMER toutes les données existantes !');
console.log('Êtes-vous sûr de vouloir continuer ? (Ctrl+C pour annuler)');

// Attendre 3 secondes puis exécuter
setTimeout(() => {
  recreateDatabase();
}, 3000);
