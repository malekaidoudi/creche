/**
 * Job de Backup Automatique
 * Crèche Mima Elghalia
 * 
 * Exécute un backup automatique tous les jours à 2h du matin
 */

const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const db = require('../config/db_postgres');

// Dossier de backup
const BACKUP_DIR = path.join(__dirname, '../backups/data');

// Tables à sauvegarder
const TABLES_TO_BACKUP = [
    'users',
    'children',
    'enrollments',
    'enrollment_documents',
    'attendance',
    'holidays',
    'holiday_policies',
    'nursery_settings',
    'notifications',
    'events',
    'tasks',
    'announcements',
    'appointments',
    'staff_messages',
    'personal_memos',
    'activities',
    'activity_logs',
    'absence_requests',
    'contact_messages',
    'logs'
];

/**
 * Créer le dossier de backup
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

/**
 * Générer un nom de fichier
 */
function generateBackupFilename() {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, 19);
    return `backup_auto_${timestamp}.json`;
}

/**
 * Effectuer un backup automatique
 */
async function performAutoBackup() {
    console.log('\n💾 [BACKUP AUTO] Démarrage du backup automatique...');
    console.log(`📅 ${new Date().toLocaleString('fr-FR')}`);

    ensureBackupDir();

    try {
        const backupData = {
            metadata: {
                created_at: new Date().toISOString(),
                type: 'automatic',
                database: process.env.DB_NAME,
                version: '1.0.0'
            },
            tables: {}
        };

        let totalRows = 0;
        let tablesBackedUp = 0;

        for (const tableName of TABLES_TO_BACKUP) {
            try {
                const tableExists = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [tableName]);

                if (!tableExists.rows[0].exists) continue;

                const result = await db.query(`SELECT * FROM ${tableName}`);

                if (result.rows.length > 0) {
                    backupData.tables[tableName] = result.rows;
                    totalRows += result.rows.length;
                    tablesBackedUp++;
                }
            } catch (e) {
                // Ignorer les erreurs silencieusement pour le job auto
            }
        }

        // Sauvegarder dans un fichier
        const filename = generateBackupFilename();
        const filepath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

        const stats = fs.statSync(filepath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);

        console.log(`✅ [BACKUP AUTO] Terminé: ${filename}`);
        console.log(`   📊 ${tablesBackedUp} tables, ${totalRows} lignes, ${fileSizeKB} KB`);

        // Nettoyer les anciens backups (garder les 30 derniers pour les auto)
        cleanOldBackups(30);

        return { success: true, filename, tables: tablesBackedUp, rows: totalRows };

    } catch (error) {
        console.error('❌ [BACKUP AUTO] Erreur:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Nettoyer les anciens backups
 */
function cleanOldBackups(keepCount = 30) {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length <= keepCount) return;

        const toDelete = files.slice(keepCount);

        for (const file of toDelete) {
            fs.unlinkSync(path.join(BACKUP_DIR, file));
            console.log(`   🗑️  Ancien backup supprimé: ${file}`);
        }
    } catch (e) {
        // Ignorer les erreurs de nettoyage
    }
}

/**
 * Démarrer le job de backup automatique
 */
function startBackupJob() {
    // Backup tous les jours à 2h du matin
    const dailyBackup = cron.schedule('0 2 * * *', async () => {
        await performAutoBackup();
    }, {
        scheduled: true,
        timezone: 'Africa/Tunis'
    });

    console.log('✅ Job backupScheduler démarré (quotidien à 02:00)');

    return dailyBackup;
}

module.exports = {
    startBackupJob,
    performAutoBackup
};
