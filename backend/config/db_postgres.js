const { Pool } = require('pg');
const path = require('path');

// Charger le .env depuis la racine du projet
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuration PostgreSQL pour Neon
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false },
  max: 10, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('🔧 Configuration PostgreSQL Neon:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  ssl: 'enabled'
});

// Création du pool de connexions PostgreSQL
const pool = new Pool(dbConfig);

// Test de connexion
const testConnection = async () => {
  try {
    console.log('🔄 Test de connexion PostgreSQL Neon...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connexion à PostgreSQL Neon réussie');
    console.log('📅 Heure serveur:', result.rows[0].current_time);
    console.log('🐘 Version PostgreSQL:', result.rows[0].pg_version.split(' ')[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL Neon:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Détails:', error.detail);
    return false;
  }
};

// Fonction helper pour exécuter des requêtes
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Requête exécutée:', { text: text.substring(0, 50) + '...', duration: duration + 'ms', rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erreur requête PostgreSQL:', error.message);
    throw error;
  }
};

// Fonction pour obtenir une connexion du pool
const getClient = async () => {
  return await pool.connect();
};

// Fonction pour fermer le pool
const closePool = async () => {
  await pool.end();
  console.log('🔒 Pool PostgreSQL fermé');
};

// Test de connexion au démarrage
testConnection().catch(console.error);

// Export des fonctions
module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool,
  // Compatibilité avec l'ancien code MySQL
  execute: query,
  getConnection: getClient
};
