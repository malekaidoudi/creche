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

// Migration automatique: Créer la table testimonials si elle n'existe pas
const ensureTestimonialsTable = async () => {
  try {
    const checkQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'testimonials';
    `;
    const res = await pool.query(checkQuery);

    if (res.rows.length === 0) {
      console.log('📝 Création de la table testimonials...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS testimonials (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          parent_name VARCHAR(100) NOT NULL,
          child_name VARCHAR(100),
          content TEXT NOT NULL,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          admin_notes TEXT,
          is_featured BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approved_at TIMESTAMP,
          approved_by INTEGER
        );
      `);

      // Créer les index
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);`);

      console.log('✅ Table testimonials créée avec succès');
    }
  } catch (error) {
    console.error('❌ Migration testimonials ÉCHOUÉE:', error.message);
    throw error;
  }
};

// Migration automatique: Ajouter la colonne last_active à users
const ensureLastActiveColumn = async () => {
  try {
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'last_active';
    `;
    const res = await pool.query(checkQuery);

    if (res.rows.length === 0) {
      console.log('📝 Ajout colonne last_active à users...');
      await pool.query(`ALTER TABLE users ADD COLUMN last_active TIMESTAMP WITH TIME ZONE;`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);`);
      console.log('✅ Colonne last_active ajoutée');
    }
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ Migration last_active:', error.message);
    }
  }
};

// Migration automatique: Créer la table admin_documents si elle n'existe pas
const ensureAdminDocumentsTable = async () => {
  try {
    const checkQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'admin_documents';
    `;
    const res = await pool.query(checkQuery);

    if (res.rows.length === 0) {
      console.log('📝 Création de la table admin_documents...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_documents (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          document_type VARCHAR(50) DEFAULT 'general',
          original_filename VARCHAR(255),
          cloudinary_url TEXT,
          cloudinary_public_id VARCHAR(255),
          file_size INTEGER,
          mime_type VARCHAR(100),
          is_public BOOLEAN DEFAULT FALSE,
          is_required BOOLEAN DEFAULT FALSE,
          uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_documents_type ON admin_documents(document_type);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_documents_created_at ON admin_documents(created_at DESC);`);

      console.log('✅ Table admin_documents créée avec succès');
    }
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ Migration admin_documents:', error.message);
    }
  }
};

// Migration automatique: Créer la table revoked_tokens pour la déconnexion sécurisée (blacklist JWT)
const ensureRevokedTokensTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token ON revoked_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);
    `);
    console.log('✅ Table revoked_tokens prête');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ Migration revoked_tokens:', error.message);
    }
  }
};

// Fonction pour exécuter les migrations secondaires (appelée depuis server.js)
const runMigrations = async () => {
  try {
    await testConnection();
    await ensurePhotoPrivacyColumn();
    await ensureTestimonialsTable();
    await ensureLastActiveColumn();
    await ensureAdminDocumentsTable();
    await ensureRevokedTokensTable();
    console.log('✅ Toutes les migrations DB terminées');
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
