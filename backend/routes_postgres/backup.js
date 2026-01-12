/**
 * Routes API pour le système de backup
 * Crèche Mima Elghalia
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
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
    return `backup_${timestamp}.json`;
}

// GET /api/backup - Lister les backups disponibles
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
        }

        ensureBackupDir();

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();

        const backups = files.map(file => {
            const filepath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filepath);

            try {
                const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                const tables = Object.keys(data.tables || {}).length;
                const rows = Object.values(data.tables || {}).reduce((sum, t) => sum + (t?.length || 0), 0);

                return {
                    filename: file,
                    created_at: data.metadata?.created_at,
                    tables,
                    rows,
                    size_kb: (stats.size / 1024).toFixed(2)
                };
            } catch (e) {
                return {
                    filename: file,
                    size_kb: (stats.size / 1024).toFixed(2),
                    error: 'Fichier corrompu'
                };
            }
        });

        res.json({
            success: true,
            backups,
            total: backups.length
        });

    } catch (error) {
        console.error('❌ Erreur liste backups:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des backups' });
    }
});

// POST /api/backup - Créer un nouveau backup
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
        }

        console.log('💾 Création d\'un backup via API...');
        ensureBackupDir();

        const backupData = {
            metadata: {
                created_at: new Date().toISOString(),
                created_by: req.user.email,
                database: process.env.DB_NAME,
                version: '1.0.0'
            },
            tables: {}
        };

        let totalRows = 0;
        let tablesBackedUp = 0;

        for (const tableName of TABLES_TO_BACKUP) {
            try {
                // Vérifier si la table existe
                const tableExists = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [tableName]);

                if (!tableExists.rows[0].exists) continue;

                // Récupérer les données
                const result = await db.query(`SELECT * FROM ${tableName}`);

                if (result.rows.length > 0) {
                    backupData.tables[tableName] = result.rows;
                    totalRows += result.rows.length;
                    tablesBackedUp++;
                }
            } catch (e) {
                console.log(`  ⚠️  ${tableName}: ${e.message}`);
            }
        }

        // Sauvegarder dans un fichier
        const filename = generateBackupFilename();
        const filepath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

        const stats = fs.statSync(filepath);
        const fileSizeKB = (stats.size / 1024).toFixed(2);

        console.log(`✅ Backup créé: ${filename} (${tablesBackedUp} tables, ${totalRows} lignes)`);

        // Nettoyer les anciens backups (garder les 10 derniers)
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length > 10) {
            const toDelete = files.slice(10);
            for (const file of toDelete) {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
                console.log(`🗑️  Ancien backup supprimé: ${file}`);
            }
        }

        res.json({
            success: true,
            message: 'Backup créé avec succès',
            backup: {
                filename,
                tables: tablesBackedUp,
                rows: totalRows,
                size_kb: fileSizeKB,
                created_at: backupData.metadata.created_at
            }
        });

    } catch (error) {
        console.error('❌ Erreur création backup:', error);
        res.status(500).json({ error: 'Erreur lors de la création du backup' });
    }
});

// GET /api/backup/download/:filename - Télécharger un backup
router.get('/download/:filename', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
        }

        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Backup non trouvé' });
        }

        res.download(filepath, filename);

    } catch (error) {
        console.error('❌ Erreur téléchargement backup:', error);
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
});

// DELETE /api/backup/:filename - Supprimer un backup
router.delete('/:filename', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
        }

        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Backup non trouvé' });
        }

        fs.unlinkSync(filepath);
        console.log(`🗑️  Backup supprimé: ${filename}`);

        res.json({
            success: true,
            message: 'Backup supprimé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur suppression backup:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

// POST /api/backup/restore/:filename - Restaurer depuis un backup
router.post('/restore/:filename', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
        }

        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Backup non trouvé' });
        }

        console.log(`🔄 Restauration du backup: ${filename}`);

        // Lire le backup
        const backupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        // Tables à restaurer dans l'ordre (respecter les FK)
        const tablesToRestore = [
            'users',
            'children',
            'enrollments',
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
            'absence_requests'
        ];

        let totalRestored = 0;
        const restoredTables = [];

        // Restaurer chaque table
        for (const tableName of tablesToRestore) {
            const tableData = backupData.tables[tableName];

            if (!tableData || tableData.length === 0) continue;

            try {
                // Vider la table
                await db.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);

                // Obtenir les colonnes
                const columns = Object.keys(tableData[0]);

                // Insérer les données
                for (const row of tableData) {
                    const values = columns.map(col => row[col]);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

                    try {
                        await db.query(
                            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                            values
                        );
                    } catch (e) {
                        // Ignorer les erreurs d'insertion individuelles
                    }
                }

                // Réinitialiser la séquence
                try {
                    await db.query(`
                        SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
                                      COALESCE((SELECT MAX(id) FROM ${tableName}), 1))
                    `);
                } catch (e) {
                    // Pas de séquence pour cette table
                }

                totalRestored += tableData.length;
                restoredTables.push({ table: tableName, rows: tableData.length });
                console.log(`  ✓ ${tableName}: ${tableData.length} lignes restaurées`);

            } catch (e) {
                console.log(`  ⚠️ ${tableName}: ${e.message}`);
            }
        }

        console.log(`✅ Restauration terminée: ${totalRestored} lignes`);

        res.json({
            success: true,
            message: 'Restauration terminée avec succès',
            restored: {
                filename,
                tables: restoredTables.length,
                rows: totalRestored,
                details: restoredTables
            }
        });

    } catch (error) {
        console.error('❌ Erreur restauration backup:', error);
        res.status(500).json({ error: 'Erreur lors de la restauration: ' + error.message });
    }
});

// GET /api/backup/status - Statut du système de backup
router.get('/status', authenticateToken, async (req, res) => {
    try {
        ensureBackupDir();

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();

        const lastBackup = files.length > 0 ? files[0] : null;
        let lastBackupInfo = null;

        if (lastBackup) {
            const filepath = path.join(BACKUP_DIR, lastBackup);
            const stats = fs.statSync(filepath);

            try {
                const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                lastBackupInfo = {
                    filename: lastBackup,
                    created_at: data.metadata?.created_at,
                    tables: Object.keys(data.tables || {}).length,
                    rows: Object.values(data.tables || {}).reduce((sum, t) => sum + (t?.length || 0), 0),
                    size_kb: (stats.size / 1024).toFixed(2)
                };
            } catch (e) {
                lastBackupInfo = { filename: lastBackup, error: 'Fichier corrompu' };
            }
        }

        res.json({
            success: true,
            backup_dir: BACKUP_DIR,
            total_backups: files.length,
            last_backup: lastBackupInfo,
            auto_cleanup: true,
            max_backups: 10
        });

    } catch (error) {
        console.error('❌ Erreur statut backup:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
    }
});

module.exports = router;
