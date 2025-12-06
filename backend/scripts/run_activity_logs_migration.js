/**
 * Script de migration pour le système de journal d'activité
 * Exécute le script SQL de création des tables
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🚀 Démarrage de la migration du système de journal d\'activité...\n');

    try {
        // Lire le fichier SQL
        const sqlPath = path.join(__dirname, 'create_activity_logs_system.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Exécuter le SQL
        console.log('📝 Exécution du script SQL...');
        await pool.query(sql);

        console.log('\n✅ Migration terminée avec succès!');
        console.log('\nTables créées:');
        console.log('  - activity_logs (journal principal)');
        console.log('  - activity_logs_archive (archives)');
        console.log('  - alerts (alertes système)');
        console.log('  - reports_history (historique des rapports)');
        console.log('\nVues créées:');
        console.log('  - v_recent_activities');
        console.log('  - v_active_alerts');
        console.log('\nFonctions créées:');
        console.log('  - archive_old_activity_logs()');
        console.log('  - cleanup_old_archives()');
        console.log('  - get_daily_stats()');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
        if (error.detail) console.error('Détail:', error.detail);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
