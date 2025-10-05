const mysql = require('mysql2/promise');
const path = require('path');

// Charger le .env depuis la racine du projet
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Debug des variables d'environnement (commenté après résolution)
// console.log('🔍 Variables d\'environnement DB:');
// console.log('DB_SOCKET:', process.env.DB_SOCKET);
// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_PORT:', process.env.DB_PORT);
// console.log('DB_USER:', process.env.DB_USER);

// Configuration de la base de données avec support Railway
let dbConfig = {
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASS || process.env.MYSQLPASSWORD || 'root',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'creche_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Configuration spécifique Railway (variables automatiques)
if (process.env.RAILWAY_ENVIRONMENT) {
  console.log('🚂 Configuration Railway détectée');
  dbConfig.host = process.env.MYSQLHOST || process.env.DB_HOST;
  dbConfig.port = process.env.MYSQLPORT || process.env.DB_PORT || 3306;
  
  // Railway utilise souvent SSL en production
  if (process.env.NODE_ENV === 'production') {
    dbConfig.ssl = {
      rejectUnauthorized: false
    };
  }
} 
// Configuration locale (MAMP/XAMPP)
else if (process.env.DB_SOCKET) {
  console.log('📡 Utilisation du socket MAMP:', process.env.DB_SOCKET);
  dbConfig.socketPath = process.env.DB_SOCKET;
} 
// Configuration standard host/port
else {
  console.log('🌐 Utilisation host/port:', process.env.DB_HOST, process.env.DB_PORT);
  dbConfig.host = process.env.DB_HOST || 'localhost';
  dbConfig.port = process.env.DB_PORT || 3306;
}

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de connexion
const testConnection = async () => {
  try {
    console.log('🔄 Test de connexion MySQL avec config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      socketPath: dbConfig.socketPath,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    const connection = await pool.getConnection();
    console.log('✅ Connexion à MySQL réussie');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Errno:', error.errno);
    return false;
  }
};

// Fonction pour exécuter des requêtes
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erreur SQL:', error.message);
    throw error;
  }
};

// Fonction pour les transactions
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Test de connexion au démarrage
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
