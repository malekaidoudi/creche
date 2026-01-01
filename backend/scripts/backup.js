/**
 * Script de Backup - Sauvegarde des données PostgreSQL
 * Crèche Mima Elghalia
 * 
 * Usage: 
 *   node backend/scripts/backup.js           # Backup complet
 *   node backend/scripts/backup.js --tables  # Liste des tables
 *   node backend/scripts/backup.js --restore <fichier>  # Restaurer
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const fs = require('fs');
const { Pool } = require('pg');

// Configuration PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: true },
});

// Dossier de backup
const BACKUP_DIR = path.join(__dirname, '../backups/data');

// Tables à sauvegarder (dans l'ordre pour respecter les FK)
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
    'event_reminders',
    'event_comments',
    'event_history',
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
 * Créer le dossier de backup s'il n'existe pas
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`📁 Dossier de backup créé: ${BACKUP_DIR}`);
    }
}

/**
 * Générer un nom de fichier avec timestamp
 */
function generateBackupFilename() {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, 19);
    return `backup_${timestamp}.json`;
}

/**
 * Sauvegarder une table
 */
async function backupTable(client, tableName) {
    try {
        // Vérifier si la table existe
        const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);

        if (!tableExists.rows[0].exists) {
            return { table: tableName, exists: false, rows: 0, data: [] };
        }

        // Récupérer les données
        const result = await client.query(`SELECT * FROM ${tableName}`);

        return {
            table: tableName,
            exists: true,
            rows: result.rows.length,
            data: result.rows
        };
    } catch (error) {
        console.error(`  ⚠️  Erreur sur ${tableName}: ${error.message}`);
        return { table: tableName, exists: false, rows: 0, data: [], error: error.message };
    }
}

/**
 * Effectuer un backup complet
 */
async function performBackup() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💾 BACKUP - Crèche Mima Elghalia');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`📦 Database: ${process.env.DB_NAME}`);
    console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    ensureBackupDir();

    const client = await pool.connect();

    try {
        console.log('🔗 Connexion à la base de données...');
        const testResult = await client.query('SELECT NOW() as time');
        console.log(`✅ Connecté - ${testResult.rows[0].time}\n`);

        console.log('📋 Sauvegarde des tables...');

        const backupData = {
            metadata: {
                created_at: new Date().toISOString(),
                database: process.env.DB_NAME,
                host: process.env.DB_HOST,
                version: '1.0.0'
            },
            tables: {}
        };

        let totalRows = 0;
        let tablesBackedUp = 0;

        for (const tableName of TABLES_TO_BACKUP) {
            const tableData = await backupTable(client, tableName);

            if (tableData.exists && tableData.rows > 0) {
                backupData.tables[tableName] = tableData.data;
                totalRows += tableData.rows;
                tablesBackedUp++;
                console.log(`  ✓ ${tableName}: ${tableData.rows} lignes`);
            } else if (tableData.exists) {
                console.log(`  ○ ${tableName}: vide`);
            } else {
                console.log(`  - ${tableName}: n'existe pas`);
            }
        }

        // Sauvegarder dans un fichier
        const filename = generateBackupFilename();
        const filepath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

        // Calculer la taille du fichier
        const stats = fs.statSync(filepath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('✅ BACKUP TERMINÉ AVEC SUCCÈS !');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📁 Fichier: ${filename}`);
        console.log(`📊 Tables: ${tablesBackedUp}`);
        console.log(`📝 Lignes: ${totalRows}`);
        console.log(`💾 Taille: ${fileSizeKB} KB`);
        console.log(`📍 Chemin: ${filepath}`);
        console.log('═══════════════════════════════════════════════════════════════\n');

        return { success: true, filename, filepath, tables: tablesBackedUp, rows: totalRows };

    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        return { success: false, error: error.message };
    } finally {
        client.release();
        await pool.end();
    }
}

/**
 * Restaurer depuis un backup
 */
async function restoreBackup(backupFile) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔄 RESTAURATION - Crèche Mima Elghalia');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📁 Fichier: ${backupFile}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Vérifier si le fichier existe
    let filepath = backupFile;
    if (!fs.existsSync(filepath)) {
        filepath = path.join(BACKUP_DIR, backupFile);
        if (!fs.existsSync(filepath)) {
            console.error(`❌ Fichier non trouvé: ${backupFile}`);
            process.exit(1);
        }
    }

    // Lire le backup
    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    console.log(`📅 Backup créé le: ${backupData.metadata.created_at}`);
    console.log(`📦 Database: ${backupData.metadata.database}\n`);

    const client = await pool.connect();

    try {
        console.log('⚠️  ATTENTION: Cette opération va REMPLACER les données existantes !');
        console.log('   Appuyez sur Ctrl+C dans les 5 secondes pour annuler...\n');

        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('🔄 Restauration en cours...\n');

        await client.query('BEGIN');

        // Ordre inverse pour respecter les FK lors de la suppression
        const tablesReverse = [...TABLES_TO_BACKUP].reverse();

        // Vider les tables existantes
        console.log('🗑️  Vidage des tables...');
        for (const tableName of tablesReverse) {
            try {
                await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
                console.log(`  ✓ ${tableName} vidée`);
            } catch (e) {
                // Table n'existe peut-être pas
            }
        }

        // Restaurer les données
        console.log('\n📥 Insertion des données...');
        let totalRestored = 0;

        for (const tableName of TABLES_TO_BACKUP) {
            const tableData = backupData.tables[tableName];

            if (!tableData || tableData.length === 0) continue;

            // Obtenir les colonnes
            const columns = Object.keys(tableData[0]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

            for (const row of tableData) {
                const values = columns.map(col => row[col]);

                try {
                    await client.query(
                        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})
             ON CONFLICT DO NOTHING`,
                        values
                    );
                } catch (e) {
                    // Ignorer les erreurs de contraintes
                }
            }

            // Réinitialiser la séquence
            try {
                await client.query(`
          SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
                        COALESCE((SELECT MAX(id) FROM ${tableName}), 1))
        `);
            } catch (e) {
                // Pas de séquence
            }

            console.log(`  ✓ ${tableName}: ${tableData.length} lignes`);
            totalRestored += tableData.length;
        }

        await client.query('COMMIT');

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('✅ RESTAURATION TERMINÉE !');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📝 Lignes restaurées: ${totalRestored}`);
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ ERREUR:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

/**
 * Lister les backups disponibles
 */
function listBackups() {
    ensureBackupDir();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 BACKUPS DISPONIBLES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

    if (files.length === 0) {
        console.log('Aucun backup trouvé.\n');
        return;
    }

    for (const file of files) {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
        const sizeKB = (stats.size / 1024).toFixed(2);

        try {
            const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            const tables = Object.keys(data.tables || {}).length;
            const rows = Object.values(data.tables || {}).reduce((sum, t) => sum + (t?.length || 0), 0);

            console.log(`📁 ${file}`);
            console.log(`   📅 ${new Date(data.metadata?.created_at).toLocaleString('fr-FR')}`);
            console.log(`   📊 ${tables} tables, ${rows} lignes, ${sizeKB} KB\n`);
        } catch (e) {
            console.log(`📁 ${file} (${sizeKB} KB)\n`);
        }
    }
}

/**
 * Nettoyer les anciens backups (garder les 10 derniers)
 */
function cleanOldBackups(keepCount = 10) {
    ensureBackupDir();

    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

    if (files.length <= keepCount) {
        console.log(`✓ ${files.length} backups conservés (max: ${keepCount})`);
        return;
    }

    const toDelete = files.slice(keepCount);

    for (const file of toDelete) {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
        console.log(`🗑️  Supprimé: ${file}`);
    }

    console.log(`✓ ${toDelete.length} anciens backups supprimés`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('--list') || args.includes('-l')) {
    listBackups();
} else if (args.includes('--restore') || args.includes('-r')) {
    const fileIndex = args.findIndex(a => a === '--restore' || a === '-r');
    const backupFile = args[fileIndex + 1];

    if (!backupFile) {
        console.error('❌ Spécifiez le fichier de backup à restaurer');
        console.log('Usage: node backup.js --restore <fichier.json>');
        process.exit(1);
    }

    restoreBackup(backupFile);
} else if (args.includes('--clean') || args.includes('-c')) {
    cleanOldBackups();
} else {
    performBackup().then(() => {
        cleanOldBackups();
    });
}

module.exports = { performBackup, restoreBackup, listBackups, cleanOldBackups };
