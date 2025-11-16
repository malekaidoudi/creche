/**
 * Script pour créer la table activity_logs
 * Usage: node scripts/create-activity-logs.js
 */

const { pool } = require('../config/db_postgres');

async function createActivityLogs() {
  try {
    console.log('🔄 Création de la table activity_logs...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Index pour optimiser les requêtes
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

      -- Commentaires
      COMMENT ON TABLE activity_logs IS 'Logs de toutes les actions des utilisateurs';
      COMMENT ON COLUMN activity_logs.action IS 'Type d action: login, logout, create, update, delete, payment_alert_sent, etc.';
    `);

    console.log('✅ Table activity_logs créée avec succès !');
    console.log('✅ Index créés');

    // Vérifier la création
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'activity_logs'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Structure de la table:');
    console.table(result.rows);

    await pool.end();
    console.log('\n✅ Terminé\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createActivityLogs();
