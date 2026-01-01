const { Pool } = require('pg');
const path = require('path');

// Charger le .env depuis la racine du projet
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuration PostgreSQL pour Neon avec timeouts optimisés
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  // SSL activé pour Neon - les certificats Neon sont valides, pas besoin de désactiver la vérification
  ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: true },

  // Configuration du pool optimisée pour Neon
  max: 5, // Réduire le nombre de connexions max
  min: 0, // Pas de connexions minimum
  idleTimeoutMillis: 10000, // Fermer les connexions inactives après 10s
  connectionTimeoutMillis: 10000, // Augmenter le timeout de connexion à 10s

  // Paramètres de requête
  query_timeout: 30000, // Timeout de requête à 30s
  statement_timeout: 30000, // Timeout de statement à 30s

  // Retry sur erreur de connexion
  allowExitOnIdle: true, // Permettre au pool de se fermer si inactif
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

// Gestion des événements du pool
pool.on('error', (err, client) => {
  console.error('❌ Erreur inattendue sur client PostgreSQL idle:', err.message);
  // Ne pas crasher l'application, juste logger
});

pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Nouvelle connexion PostgreSQL établie');
  }
});

pool.on('acquire', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Client PostgreSQL acquis du pool');
  }
});

pool.on('remove', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 Client PostgreSQL retiré du pool');
  }
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

      // Log seulement en développement pour éviter le spam
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Requête exécutée:', {
          text: text.substring(0, 50) + '...',
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

// Migration automatique: Ajouter la colonne photo_shared_with_staff si elle n'existe pas
const ensurePhotoPrivacyColumn = async () => {
  try {
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'children' AND column_name = 'photo_shared_with_staff';
    `;
    const res = await pool.query(checkQuery);

    if (res.rows.length === 0) {
      console.log('📝 Ajout colonne photo_shared_with_staff...');
      await pool.query(`
        ALTER TABLE children 
        ADD COLUMN photo_shared_with_staff BOOLEAN DEFAULT TRUE;
      `);
      console.log('✅ Colonne photo_shared_with_staff ajoutée');
    }
  } catch (error) {
    // Ignorer l'erreur si la colonne existe déjà ou si la table n'existe pas encore
    if (!error.message.includes('already exists')) {
      console.log('⚠️ Migration photo_shared_with_staff:', error.message);
    }
  }
};

// Test de connexion au démarrage puis migration
testConnection()
  .then(() => ensurePhotoPrivacyColumn())
  .catch(console.error);

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
