const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db_postgres');

/**
 * Script de migration pour créer la table email_logs
 */
async function migrateEmailLogs() {
  try {
    console.log('🚀 Début de la migration email_logs...\n');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../database/migrations/create_email_logs.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');

    console.log('📄 Exécution du script SQL...');
    
    // Exécuter le script SQL
    await db.query(sql);

    console.log('✅ Table email_logs créée avec succès !');
    console.log('✅ Index créés avec succès !');
    console.log('✅ Trigger updated_at créé avec succès !');

    // Vérifier que la table existe
    const checkQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'email_logs') as column_count
      FROM information_schema.tables 
      WHERE table_name = 'email_logs'
    `;
    
    const result = await db.query(checkQuery);
    
    if (result.rows.length > 0) {
      console.log(`\n📊 Table email_logs vérifiée:`);
      console.log(`   - Colonnes: ${result.rows[0].column_count}`);
      console.log(`   - Statut: ✅ Opérationnelle`);
    }

    console.log('\n🎉 Migration terminée avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    console.error('Détails:', error.message);
    process.exit(1);
  }
}

// Exécuter la migration
migrateEmailLogs();
