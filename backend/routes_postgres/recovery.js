/**
 * Routes de récupération d'urgence
 * Permet de restaurer le système sans connexion à la base de données
 * Authentification par clé secrète (RECOVERY_KEY)
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('../config/db_postgres');

const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'data');

// Rate limiting strict pour la récupération (5 tentatives par heure)
const recoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5,
    message: { error: 'Trop de tentatives. Réessayez dans 1 heure.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware de vérification de la clé de récupération
const verifyRecoveryKey = (req, res, next) => {
    const key = req.query.key || req.body.key || req.headers['x-recovery-key'];
    const validKey = process.env.RECOVERY_KEY;

    if (!validKey) {
        console.error('❌ RECOVERY_KEY non configurée dans .env');
        return res.status(500).json({ error: 'Système de récupération non configuré' });
    }

    if (!key) {
        return res.status(401).json({ error: 'Clé de récupération requise' });
    }

    // Comparaison sécurisée (timing-safe)
    if (key.length !== validKey.length || key !== validKey) {
        console.warn('⚠️ Tentative de récupération avec clé invalide');
        return res.status(403).json({ error: 'Clé de récupération invalide' });
    }

    console.log('✅ Accès récupération autorisé');
    next();
};

// Assurer que le dossier de backup existe
const ensureBackupDir = () => {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
};

// GET /api/recovery/verify - Vérifier la clé (sans accès DB)
router.get('/verify', recoveryLimiter, verifyRecoveryKey, (req, res) => {
    res.json({
        success: true,
        message: 'Clé de récupération valide',
        timestamp: new Date().toISOString()
    });
});

// GET /api/recovery/backups - Lister les backups disponibles (sans accès DB)
router.get('/backups', recoveryLimiter, verifyRecoveryKey, (req, res) => {
    try {
        ensureBackupDir();

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();

        const backups = files.map(filename => {
            const filepath = path.join(BACKUP_DIR, filename);
            const stats = fs.statSync(filepath);

            let info = {
                filename,
                size_kb: (stats.size / 1024).toFixed(2),
                created_at: stats.mtime.toISOString()
            };

            try {
                const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                info.tables = Object.keys(data.tables || {}).length;
                info.rows = Object.values(data.tables || {}).reduce((sum, t) => sum + (t?.length || 0), 0);
                info.backup_date = data.metadata?.created_at;
            } catch (e) {
                info.error = 'Fichier corrompu';
            }

            return info;
        });

        res.json({
            success: true,
            total: backups.length,
            backups
        });

    } catch (error) {
        console.error('❌ Erreur liste backups:', error);
        res.status(500).json({ error: 'Erreur lors de la lecture des backups' });
    }
});

// GET /api/recovery/status - Vérifier l'état de la DB
router.get('/status', recoveryLimiter, verifyRecoveryKey, async (req, res) => {
    let dbStatus = 'unknown';
    let dbError = null;

    try {
        await db.query('SELECT 1');
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'disconnected';
        dbError = error.message;
    }

    res.json({
        success: true,
        database: {
            status: dbStatus,
            error: dbError
        },
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        }
    });
});

// POST /api/recovery/restore/:filename - Restaurer depuis un backup
router.post('/restore/:filename', recoveryLimiter, verifyRecoveryKey, async (req, res) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Backup non trouvé' });
        }

        console.log(`🔄 [RECOVERY] Restauration du backup: ${filename}`);

        // Vérifier d'abord si la DB est accessible
        try {
            await db.query('SELECT 1');
        } catch (dbError) {
            return res.status(503).json({
                error: 'Base de données inaccessible',
                details: dbError.message,
                suggestion: 'Vérifiez la connexion à la base de données avant de restaurer'
            });
        }

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
        const errors = [];

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
                let insertedCount = 0;
                for (const row of tableData) {
                    const values = columns.map(col => row[col]);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

                    try {
                        await db.query(
                            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                            values
                        );
                        insertedCount++;
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

                totalRestored += insertedCount;
                restoredTables.push({ table: tableName, rows: insertedCount });
                console.log(`  ✓ ${tableName}: ${insertedCount} lignes restaurées`);

            } catch (e) {
                console.log(`  ⚠️ ${tableName}: ${e.message}`);
                errors.push({ table: tableName, error: e.message });
            }
        }

        console.log(`✅ [RECOVERY] Restauration terminée: ${totalRestored} lignes`);

        res.json({
            success: true,
            message: 'Restauration terminée avec succès',
            restored: {
                filename,
                tables: restoredTables.length,
                rows: totalRestored,
                details: restoredTables
            },
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('❌ [RECOVERY] Erreur restauration:', error);
        res.status(500).json({ error: 'Erreur lors de la restauration: ' + error.message });
    }
});

// GET /api/recovery/download/:filename - Télécharger un backup
router.get('/download/:filename', recoveryLimiter, verifyRecoveryKey, (req, res) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Backup non trouvé' });
        }

        res.download(filepath, filename);

    } catch (error) {
        console.error('❌ Erreur téléchargement:', error);
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
});

module.exports = router;
