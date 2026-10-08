/**
 * Database Migration Runner pour PostgreSQL (Neon Serverless)
 * Crèche Mima Elghalia
 * 
 * Fonctionnalités :
 * - Table de suivi `schema_migrations`
 * - Pattern "Baseline" : si la DB Neon est déjà provisionnée (table users existe),
 *   la baseline 001 est automatiquement marquée comme appliquée sans réexécuter de DDL (0 risque).
 * - Exécution transactionnelle pour chaque nouvelle migration (BEGIN/COMMIT/ROLLBACK).
 * - Boot ultra-rapide au démarrage du serveur (1 seule requête SELECT au lieu de ~30 DDL).
 * - Support CLI (statut, exécution manuelle).
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/db_postgres');
const logger = require('../utils/logger');

const VERSIONS_DIR = path.join(__dirname, 'versions');

/**
 * Assure l'existence de la table `schema_migrations`
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
  `);
}

/**
 * Récupère les migrations disponibles dans le dossier `versions`
 */
function getAvailableMigrations() {
  if (!fs.existsSync(VERSIONS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(VERSIONS_DIR)
    .filter(file => /^\d{3}_.*\.js$/.test(file))
    .sort();

  return files.map(file => {
    const fullPath = path.join(VERSIONS_DIR, file);
    const migration = require(fullPath);
    return {
      file,
      version: migration.version || path.basename(file, '.js'),
      name: migration.name || file,
      up: migration.up,
      down: migration.down
    };
  });
}

/**
 * Récupère les migrations déjà appliquées depuis la base de données
 */
async function getAppliedMigrations(client) {
  const result = await client.query('SELECT version, name, executed_at FROM schema_migrations ORDER BY version ASC');
  const appliedMap = new Map();
  for (const row of result.rows) {
    appliedMap.set(row.version, row);
  }
  return appliedMap;
}

/**
 * Baseline Pattern : si la table schema_migrations est vide et que la base contient déjà les tables,
 * on enregistre la baseline comme déjà exécutée sans lancer de DDL.
 */
async function checkAndApplyBaselineIfNeeded(client, appliedMap, availableMigrations) {
  if (appliedMap.size > 0) {
    return false;
  }

  // Vérifier si la base de données est déjà provisionnée (ex: présence de la table users)
  const checkTable = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    ) AS exists;
  `);

  const hasExistingUsersTable = checkTable.rows[0]?.exists === true;

  if (hasExistingUsersTable) {
    const baseline = availableMigrations.find(m => m.version === '001_baseline_schema');
    if (baseline) {
      await client.query(
        'INSERT INTO schema_migrations (version, name, executed_at) VALUES ($1, $2, NOW()) ON CONFLICT (version) DO NOTHING;',
        [baseline.version, baseline.name]
      );
      appliedMap.set(baseline.version, {
        version: baseline.version,
        name: baseline.name,
        executed_at: new Date()
      });
      logger.info('🛡️ [Migrations] Base Neon existante détectée : baseline 001_baseline_schema enregistrée avec succès (aucun DDL réexécuté).');
      return true;
    }
  }

  return false;
}

/**
 * Exécute les migrations en attente
 */
async function runMigrations() {
  const startTime = Date.now();
  let client;

  try {
    client = await db.getClient();
    await ensureMigrationsTable(client);

    const available = getAvailableMigrations();
    const appliedMap = await getAppliedMigrations(client);

    // Détection de la baseline sur base existante
    await checkAndApplyBaselineIfNeeded(client, appliedMap, available);

    // Migrations en attente
    const pending = available.filter(m => !appliedMap.has(m.version));

    if (pending.length === 0) {
      const elapsed = Date.now() - startTime;
      logger.dbDebug(`⚡ [Migrations] Schéma à jour (${appliedMap.size} migrations appliquées en ${elapsed}ms)`);
      return { success: true, applied: [], totalApplied: appliedMap.size };
    }

    logger.info(`🚀 [Migrations] ${pending.length} migration(s) en attente...`);

    const appliedThisRun = [];

    for (const migration of pending) {
      const migStart = Date.now();
      logger.info(`⏳ [Migrations] Exécution de ${migration.version} - ${migration.name}...`);

      try {
        await client.query('BEGIN');
        
        if (typeof migration.up === 'function') {
          await migration.up(client);
        }

        await client.query(
          'INSERT INTO schema_migrations (version, name, executed_at) VALUES ($1, $2, NOW())',
          [migration.version, migration.name]
        );

        await client.query('COMMIT');

        const migElapsed = Date.now() - migStart;
        logger.info(`✅ [Migrations] ${migration.version} complétée avec succès (${migElapsed}ms)`);
        appliedThisRun.push(migration.version);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`❌ [Migrations] Échec sur ${migration.version}: ${err.message}`);
        throw err;
      }
    }

    const totalElapsed = Date.now() - startTime;
    logger.info(`🎉 [Migrations] Toutes les migrations terminées (${appliedThisRun.length} exécutées en ${totalElapsed}ms)`);

    return {
      success: true,
      applied: appliedThisRun,
      totalApplied: appliedMap.size + appliedThisRun.length
    };
  } catch (error) {
    logger.error('❌ [Migrations] Erreur lors de l\'exécution:', error.message);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Affiche l'état des migrations (CLI)
 */
async function showStatus() {
  let client;
  try {
    client = await db.getClient();
    await ensureMigrationsTable(client);

    const available = getAvailableMigrations();
    const appliedMap = await getAppliedMigrations(client);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 STATUT DES MIGRATIONS - Crèche Mima Elghalia');
    console.log('═══════════════════════════════════════════════════════════════');

    if (available.length === 0) {
      console.log('Aucun fichier de migration trouvé dans versions/\n');
      return;
    }

    console.log(`Total versions : ${available.length} | Appliquées : ${appliedMap.size}\n`);

    available.forEach(m => {
      const applied = appliedMap.get(m.version);
      if (applied) {
        const dateStr = new Date(applied.executed_at).toLocaleString('fr-FR');
        console.log(`  ✅ [APPLIQUÉE] ${m.version.padEnd(25)} (${dateStr}) - ${m.name}`);
      } else {
        console.log(`  ⏳ [EN ATTENTE] ${m.version.padEnd(25)}                  - ${m.name}`);
      }
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Erreur statut migrations:', error.message);
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Support CLI si exécuté directement via node backend/migrations/runner.js
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === 'status') {
    showStatus()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  runMigrations,
  showStatus,
  getAvailableMigrations,
  getAppliedMigrations
};
