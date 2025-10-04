const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Charger le .env depuis la racine du projet
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuration de la base de données (même que database.js)
let dbConfig = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'mima_elghalia_db',
  multipleStatements: true
};

// Choisir entre socket ou host/port
if (process.env.DB_SOCKET) {
  dbConfig.socketPath = process.env.DB_SOCKET;
} else {
  dbConfig.host = process.env.DB_HOST || 'localhost';
  dbConfig.port = process.env.DB_PORT || 3306;
}

async function initializeSettings() {
  let connection;
  
  try {
    console.log('🔄 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📄 Lecture du fichier de migration...');
    const migrationPath = path.join(__dirname, '../migrations/create_settings_table.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('🚀 Exécution de la migration...');
    await connection.execute(migrationSQL);
    
    console.log('✅ Table des paramètres créée avec succès !');
    console.log('📊 Paramètres par défaut insérés !');
    
    // Vérifier les données insérées
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM creche_settings');
    console.log(`📈 ${rows[0].count} paramètres configurés`);
    
    // Afficher quelques paramètres importants
    const [settings] = await connection.execute(`
      SELECT setting_key, setting_value 
      FROM creche_settings 
      WHERE setting_key IN ('nursery_name', 'nursery_email', 'total_capacity', 'site_theme')
    `);
    
    console.log('\n🔧 Paramètres principaux :');
    settings.forEach(setting => {
      console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error.message);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  La table existe déjà. Vérification des données...');
      
      try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM creche_settings');
        console.log(`📊 ${rows[0].count} paramètres trouvés dans la table existante`);
      } catch (checkError) {
        console.error('❌ Erreur lors de la vérification :', checkError.message);
      }
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Fonction pour mettre à jour un paramètre spécifique
async function updateSetting(key, value, type = 'string') {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE creche_settings SET setting_value = ?, setting_type = ? WHERE setting_key = ?',
      [value, type, key]
    );
    
    console.log(`✅ Paramètre ${key} mis à jour : ${value}`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${key} :`, error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Fonction pour lister tous les paramètres
async function listSettings() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [settings] = await connection.execute(`
      SELECT setting_key, setting_value, setting_type, category, is_public 
      FROM creche_settings 
      ORDER BY category, setting_key
    `);
    
    console.log('\n📋 Liste de tous les paramètres :');
    console.log('=====================================');
    
    let currentCategory = '';
    settings.forEach(setting => {
      if (setting.category !== currentCategory) {
        currentCategory = setting.category;
        console.log(`\n📁 ${currentCategory.toUpperCase()}`);
        console.log('-------------------');
      }
      
      const visibility = setting.is_public ? '🌐' : '🔒';
      const type = `[${setting.setting_type}]`;
      console.log(`${visibility} ${setting.setting_key} ${type}: ${setting.setting_value}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des paramètres :', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Interface en ligne de commande
const command = process.argv[2];
const key = process.argv[3];
const value = process.argv[4];
const type = process.argv[5] || 'string';

switch (command) {
  case 'init':
    initializeSettings();
    break;
    
  case 'update':
    if (!key || !value) {
      console.error('❌ Usage: npm run init-settings update <key> <value> [type]');
      process.exit(1);
    }
    updateSetting(key, value, type);
    break;
    
  case 'list':
    listSettings();
    break;
    
  default:
    console.log(`
🏥 Script de gestion des paramètres de la crèche

Usage:
  npm run init-settings init              - Initialiser la table et les données
  npm run init-settings update <key> <value> [type] - Mettre à jour un paramètre
  npm run init-settings list             - Lister tous les paramètres

Exemples:
  npm run init-settings init
  npm run init-settings update nursery_name "Ma Nouvelle Crèche"
  npm run init-settings update total_capacity 50 number
  npm run init-settings list
    `);
    break;
}
