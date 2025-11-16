/**
 * Script pour vérifier la structure de la table events
 */

const { pool } = require('../config/db_postgres');

async function checkEventsTable() {
  try {
    console.log('🔍 Vérification de la table events...\n');

    // Structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);

    console.log('📋 Structure de la table events:');
    console.table(columnsResult.rows);

    // Compter les mémos
    const countResult = await pool.query(`
      SELECT 
        type,
        COUNT(*) as total
      FROM events
      GROUP BY type
    `);

    console.log('\n📊 Répartition par type:');
    console.table(countResult.rows);

    // Exemples de mémos
    const memosResult = await pool.query(`
      SELECT id, title, type, created_by, status, created_at
      FROM events
      WHERE type = 'memo'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\n📝 Derniers mémos:');
    console.table(memosResult.rows);

    await pool.end();
    console.log('\n✅ Vérification terminée\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkEventsTable();
