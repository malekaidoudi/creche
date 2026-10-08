const { Pool } = require('pg');
const path = require('path');
const logger = require('../utils/logger');

// Charger le .env depuis la racine du projet
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuration PostgreSQL pour Neon avec timeouts optimisés
// Supporte DATABASE_URL (connexion string) ou variables séparées
const dbConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: true },
  }
  : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    // SSL activé pour Neon - les certificats Neon sont valides, pas besoin de désactiver la vérification
    ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: true },
  };

// Configuration du pool optimisée pour Neon (Free tier & sessions actives)
Object.assign(dbConfig, {
  max: 10,
  min: 0,                          // Permet la mise en veille automatique de Neon lors d'inactivité
  idleTimeoutMillis: 60000,        // 60s : garde la connexion chaude pendant la navigation et le polling
  connectionTimeoutMillis: 10000,  // Tolère le réveil (cold start ~1-2s) de Neon sans erreur
  query_timeout: 30000,
  statement_timeout: 30000,
  allowExitOnIdle: true,           // Libère la socket quand le délai d'inactivité est écoulé
  keepAlive: true,                 // Évite les coupures silencieuses par les routeurs cloud
  keepAliveInitialDelayMillis: 10000,
});

console.log('🔧 Configuration PostgreSQL Neon:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  ssl: 'enabled'
});

// Création du pool de connexions PostgreSQL
const pool = new Pool(dbConfig);

// Gestion des événements du pool
pool.on('error', (err, client) => {
  logger.error('Erreur inattendue sur client PostgreSQL idle:', err.message);
});

pool.on('connect', (client) => {
  logger.dbDebug('✅ Nouvelle connexion PostgreSQL établie');
});

pool.on('acquire', (client) => {
  logger.dbDebug('🔗 Client PostgreSQL acquis du pool');
});

pool.on('remove', (client) => {
  logger.dbDebug('🔌 Client PostgreSQL retiré du pool');
});

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

// Fonction helper pour exécuter des requêtes avec retry automatique
const query = async (text, params, retries = 3) => {
  const start = Date.now();
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;

      // Alerte uniquement sur les requêtes anormalement lentes (> 500 ms) ou debug DB explicite
      if (duration > 500) {
        logger.slowQuery(text, duration);
      } else {
        logger.dbDebug('🔍 Requête exécutée:', {
          text: text.substring(0, 50).replace(/\s+/g, ' ') + '...',
          duration: duration + 'ms',
          rows: res.rowCount
        });
      }

      return res;
    } catch (error) {
      lastError = error;

      // Si c'est un timeout ou une connexion terminée, on retry
      if ((error.message.includes('timeout') || error.message.includes('terminated')) && attempt < retries) {
        console.warn(`⚠️ Tentative ${attempt}/${retries} échouée, retry dans ${attempt * 500}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
        continue;
      }

      // Sinon on throw l'erreur
      console.error('❌ Erreur requête PostgreSQL:', error.message);
      throw error;
    }
  }

  throw lastError;
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

// Fonction pour exécuter les migrations (déléguée au migration runner)
const runMigrations = async () => {
  try {
    await testConnection();
    const migrationRunner = require('../migrations/runner');
    return await migrationRunner.runMigrations();
  } catch (err) {
    console.error('❌ Migration DB échouée:', err.message);
  }
};

// Export des fonctions
module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool,
  runMigrations,
  // Compatibilité avec l'ancien code MySQL
  execute: query,
  getConnection: getClient
};
