/**
 * Script pour vérifier la table logs
 * Usage: node scripts/check-logs-table.js
 */

const { pool } = require('../config/db_postgres');

async function checkLogsTable() {
  try {
    console.log('🔍 Vérification de la table logs...\n');

    // Structure de la table
    const columnsResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'logs'
      ORDER BY ordinal_position
    `);

    console.log('📋 Structure de la table logs:');
    console.table(columnsResult.rows);

    // Compter les logs
    const countResult = await pool.query('SELECT COUNT(*) as total FROM logs');
    console.log(`\n📈 Nombre de logs: ${countResult.rows[0].total}\n`);

    // Exemples de logs
    if (countResult.rows[0].total > 0) {
      const samplesResult = await pool.query(`
        SELECT *
        FROM logs
        ORDER BY created_at DESC
        LIMIT 5
      `);
      console.log('📝 Derniers logs:');
      console.table(samplesResult.rows);
    }

    await pool.end();
    console.log('\n✅ Vérification terminée\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkLogsTable();
