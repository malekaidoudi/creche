#!/usr/bin/env node
/**
 * 🧹 Script de nettoyage de la base de données
 * 
 * Ce script analyse et nettoie les tables de la base de données :
 * - Supprime les inscriptions orphelines ou corrompues
 * - Nettoie les documents sans inscription associée
 * - Génère un rapport de nettoyage
 */

require('dotenv').config();
const db = require('../config/db_postgres');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    section: (msg) => console.log(`\n${colors.cyan}${'═'.repeat(60)}\n${msg}\n${'═'.repeat(60)}${colors.reset}`)
};

const report = {
    analyzed: {},
    cleaned: {},
    errors: []
};

async function analyzeTable(tableName) {
    try {
        const countResult = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
        const count = parseInt(countResult.rows[0].count);
        report.analyzed[tableName] = count;
        log.info(`Table ${tableName}: ${count} enregistrements`);
        return count;
    } catch (error) {
        log.error(`Erreur analyse ${tableName}: ${error.message}`);
        report.errors.push({ table: tableName, error: error.message });
        return 0;
    }
}

async function cleanEnrollments() {
    log.section('🧹 NETTOYAGE TABLE ENROLLMENTS');

    try {
        // 1. Identifier les inscriptions avec données manquantes critiques
        const invalidEnrollments = await db.query(`
      SELECT id, child_first_name, applicant_email, new_status, created_at
      FROM enrollments
      WHERE child_first_name IS NULL 
         OR child_first_name = ''
         OR applicant_email IS NULL 
         OR applicant_email = ''
    `);

        if (invalidEnrollments.rows.length > 0) {
            log.warning(`${invalidEnrollments.rows.length} inscriptions avec données manquantes`);

            // Supprimer les inscriptions invalides
            const deleteResult = await db.query(`
        DELETE FROM enrollments
        WHERE child_first_name IS NULL 
           OR child_first_name = ''
           OR applicant_email IS NULL 
           OR applicant_email = ''
        RETURNING id
      `);

            log.success(`${deleteResult.rowCount} inscriptions invalides supprimées`);
            report.cleaned.enrollments_invalid = deleteResult.rowCount;
        } else {
            log.success('Aucune inscription invalide détectée');
            report.cleaned.enrollments_invalid = 0;
        }

        // 2. Identifier les inscriptions de test (emails test@, demo@, example@)
        const testEnrollments = await db.query(`
      SELECT id, applicant_email, child_first_name
      FROM enrollments
      WHERE applicant_email LIKE 'test%@%'
         OR applicant_email LIKE 'demo%@%'
         OR applicant_email LIKE '%@example.%'
         OR applicant_email LIKE '%@test.%'
    `);

        if (testEnrollments.rows.length > 0) {
            log.info(`${testEnrollments.rows.length} inscriptions de test trouvées:`);
            testEnrollments.rows.forEach(e => {
                console.log(`   - #${e.id}: ${e.child_first_name} (${e.applicant_email})`);
            });
            report.cleaned.test_enrollments_found = testEnrollments.rows.length;
            // Note: On ne supprime pas automatiquement, l'utilisateur doit confirmer
        }

        // 3. Vérifier les statuts valides
        const statusCheck = await db.query(`
      SELECT new_status, COUNT(*) as count
      FROM enrollments
      GROUP BY new_status
      ORDER BY count DESC
    `);

        log.info('Répartition des statuts:');
        statusCheck.rows.forEach(s => {
            console.log(`   - ${s.new_status || 'NULL'}: ${s.count}`);
        });

    } catch (error) {
        log.error(`Erreur nettoyage enrollments: ${error.message}`);
        report.errors.push({ table: 'enrollments', error: error.message });
    }
}

async function cleanDocuments() {
    log.section('🧹 NETTOYAGE TABLE ENROLLMENT_DOCUMENTS');

    try {
        // Supprimer les documents orphelins (sans inscription)
        const orphanDocs = await db.query(`
      SELECT ed.id, ed.filename
      FROM enrollment_documents ed
      LEFT JOIN enrollments e ON ed.enrollment_id = e.id
      WHERE e.id IS NULL
    `);

        if (orphanDocs.rows.length > 0) {
            log.warning(`${orphanDocs.rows.length} documents orphelins trouvés`);

            const deleteResult = await db.query(`
        DELETE FROM enrollment_documents
        WHERE enrollment_id NOT IN (SELECT id FROM enrollments)
        RETURNING id
      `);

            log.success(`${deleteResult.rowCount} documents orphelins supprimés`);
            report.cleaned.orphan_documents = deleteResult.rowCount;
        } else {
            log.success('Aucun document orphelin');
            report.cleaned.orphan_documents = 0;
        }

    } catch (error) {
        log.error(`Erreur nettoyage documents: ${error.message}`);
        report.errors.push({ table: 'enrollment_documents', error: error.message });
    }
}

async function cleanEmailLogs() {
    log.section('🧹 NETTOYAGE TABLE EMAIL_LOGS');

    try {
        // Supprimer les logs d'emails de plus de 90 jours
        const oldLogs = await db.query(`
      SELECT COUNT(*) 
      FROM email_logs 
      WHERE created_at < NOW() - INTERVAL '90 days'
    `);

        const oldCount = parseInt(oldLogs.rows[0].count);
        if (oldCount > 0) {
            const deleteResult = await db.query(`
        DELETE FROM email_logs 
        WHERE created_at < NOW() - INTERVAL '90 days'
        RETURNING id
      `);

            log.success(`${deleteResult.rowCount} anciens logs d'emails supprimés (>90 jours)`);
            report.cleaned.old_email_logs = deleteResult.rowCount;
        } else {
            log.success('Aucun ancien log d\'email à supprimer');
            report.cleaned.old_email_logs = 0;
        }

    } catch (error) {
        // Table peut ne pas exister
        if (error.message.includes('does not exist')) {
            log.info('Table email_logs non trouvée (normal si non utilisée)');
        } else {
            log.error(`Erreur nettoyage email_logs: ${error.message}`);
        }
    }
}

async function cleanActivityLogs() {
    log.section('🧹 NETTOYAGE TABLE ACTIVITY_LOGS');

    try {
        // Supprimer les logs d'activité de plus de 60 jours
        const oldLogs = await db.query(`
      SELECT COUNT(*) 
      FROM activity_logs 
      WHERE created_at < NOW() - INTERVAL '60 days'
    `);

        const oldCount = parseInt(oldLogs.rows[0].count);
        if (oldCount > 0) {
            const deleteResult = await db.query(`
        DELETE FROM activity_logs 
        WHERE created_at < NOW() - INTERVAL '60 days'
        RETURNING id
      `);

            log.success(`${deleteResult.rowCount} anciens logs d'activité supprimés (>60 jours)`);
            report.cleaned.old_activity_logs = deleteResult.rowCount;
        } else {
            log.success('Aucun ancien log d\'activité à supprimer');
            report.cleaned.old_activity_logs = 0;
        }

    } catch (error) {
        if (error.message.includes('does not exist')) {
            log.info('Table activity_logs non trouvée');
        } else {
            log.error(`Erreur nettoyage activity_logs: ${error.message}`);
        }
    }
}

async function optimizeDatabase() {
    log.section('⚡ OPTIMISATION');

    try {
        // Analyser les tables pour les statistiques du planificateur
        const tables = ['enrollments', 'enrollment_documents', 'users', 'nursery_settings'];

        for (const table of tables) {
            try {
                await db.query(`ANALYZE ${table}`);
                log.success(`Table ${table} analysée`);
            } catch (e) {
                if (!e.message.includes('does not exist')) {
                    log.warning(`Impossible d'analyser ${table}`);
                }
            }
        }

    } catch (error) {
        log.error(`Erreur optimisation: ${error.message}`);
    }
}

async function generateReport() {
    log.section('📊 RAPPORT FINAL');

    console.log('\n📈 Statistiques des tables:');
    Object.entries(report.analyzed).forEach(([table, count]) => {
        console.log(`   - ${table}: ${count} enregistrements`);
    });

    console.log('\n🧹 Éléments nettoyés:');
    Object.entries(report.cleaned).forEach(([key, count]) => {
        const label = key.replace(/_/g, ' ');
        console.log(`   - ${label}: ${count}`);
    });

    if (report.errors.length > 0) {
        console.log('\n❌ Erreurs rencontrées:');
        report.errors.forEach(e => {
            console.log(`   - ${e.table}: ${e.error}`);
        });
    }

    const totalCleaned = Object.values(report.cleaned).reduce((a, b) => a + b, 0);
    log.success(`Total d'éléments nettoyés: ${totalCleaned}`);
}

async function main() {
    console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════╗
║     🧹 SCRIPT DE NETTOYAGE BASE DE DONNÉES                   ║
║     Crèche Mima Elghalia                                     ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);

    try {
        // Analyser toutes les tables
        log.section('📊 ANALYSE DES TABLES');
        await analyzeTable('enrollments');
        await analyzeTable('enrollment_documents');
        await analyzeTable('users');
        await analyzeTable('nursery_settings');

        // Nettoyage
        await cleanEnrollments();
        await cleanDocuments();
        await cleanEmailLogs();
        await cleanActivityLogs();

        // Optimisation
        await optimizeDatabase();

        // Rapport
        await generateReport();

        log.success('\n✨ Nettoyage terminé avec succès!');

    } catch (error) {
        log.error(`Erreur fatale: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Exécuter
main();
