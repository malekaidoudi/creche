/**
 * Script de nettoyage de la base de données
 * Supprime les tables et colonnes inutilisées
 * 
 * ⚠️ ATTENTION: Ce script modifie la base de données de manière permanente
 * 
 * Usage: 
 *   node scripts/db-cleanup.js --dry-run    # Affiche ce qui serait supprimé
 *   node scripts/db-cleanup.js --execute    # Exécute le nettoyage
 */

require('dotenv').config();
const { pool } = require('../config/db_postgres');

const isDryRun = process.argv.includes('--dry-run');
const isExecute = process.argv.includes('--execute');

if (!isDryRun && !isExecute) {
    console.log('⚠️  Usage:');
    console.log('   node scripts/db-cleanup.js --dry-run    # Affiche ce qui serait supprimé');
    console.log('   node scripts/db-cleanup.js --execute    # Exécute le nettoyage');
    process.exit(1);
}

// Tables à supprimer
const TABLES_TO_DROP = [
    'contacts',     // Doublon de contact_messages
    'documents',    // Non utilisé, remplacé par enrollment_documents
    'uploads',      // Non utilisé, Cloudinary utilisé
    // 'enrollments_archive', // Décommenter si confirmé
];

// Colonnes à supprimer par table
const COLUMNS_TO_DROP = {
    'enrollments': [
        'appointment_date',        // Migré vers appointments.proposed_date
        'appointment_time',        // Non utilisé
        'parent_chose_rdv',        // Remplacé par appointments.status
        'parent_rdv_choice_date',  // Remplacé par appointments.confirmed_date
    ],
    'tasks': [
        'parent_name',      // Non utilisé
        'parent_email',     // Non utilisé
        'parent_phone',     // Non utilisé
        'child_name',       // Non utilisé
        'is_confirmed',     // Non utilisé
        'confirmed_at',     // Non utilisé
        'original_date',    // Non utilisé
        'reschedule_count', // Non utilisé
    ]
};

async function runCleanup() {
    console.log('═'.repeat(70));
    console.log('  NETTOYAGE BASE DE DONNÉES - CRÈCHE MIMA ELGHALIA');
    console.log('  Mode: ' + (isDryRun ? '🔍 DRY RUN (simulation)' : '⚠️  EXÉCUTION RÉELLE'));
    console.log('  Date: ' + new Date().toLocaleString('fr-FR'));
    console.log('═'.repeat(70));

    const client = await pool.connect();

    try {
        if (!isDryRun) {
            await client.query('BEGIN');
        }

        // ============================================================
        // PARTIE 1: Vérifier les tables à supprimer
        // ============================================================
        console.log('\n\n📋 PARTIE 1: TABLES À SUPPRIMER');
        console.log('─'.repeat(70));

        for (const table of TABLES_TO_DROP) {
            // Vérifier si la table existe
            const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);

            if (!exists.rows[0].exists) {
                console.log(`   ⏭️  Table "${table}" n'existe pas`);
                continue;
            }

            // Compter les lignes
            const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
            const rowCount = parseInt(count.rows[0].count);

            if (isDryRun) {
                console.log(`   🔍 DROP TABLE ${table} (${rowCount} lignes)`);
            } else {
                console.log(`   🗑️  Suppression de "${table}" (${rowCount} lignes)...`);
                await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.log(`   ✅ Table "${table}" supprimée`);
            }
        }

        // ============================================================
        // PARTIE 2: Supprimer les colonnes
        // ============================================================
        console.log('\n\n📋 PARTIE 2: COLONNES À SUPPRIMER');
        console.log('─'.repeat(70));

        for (const [table, columns] of Object.entries(COLUMNS_TO_DROP)) {
            console.log(`\n   📁 Table: ${table}`);

            // Vérifier si la table existe
            const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);

            if (!tableExists.rows[0].exists) {
                console.log(`      ⏭️  Table n'existe pas`);
                continue;
            }

            for (const column of columns) {
                // Vérifier si la colonne existe
                const colExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1 
            AND column_name = $2
          )
        `, [table, column]);

                if (!colExists.rows[0].exists) {
                    console.log(`      ⏭️  Colonne "${column}" n'existe pas`);
                    continue;
                }

                if (isDryRun) {
                    console.log(`      🔍 ALTER TABLE ${table} DROP COLUMN ${column}`);
                } else {
                    console.log(`      🗑️  Suppression de "${column}"...`);
                    await client.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS ${column}`);
                    console.log(`      ✅ Colonne "${column}" supprimée`);
                }
            }
        }

        // ============================================================
        // PARTIE 3: Résumé
        // ============================================================
        console.log('\n\n' + '═'.repeat(70));

        if (isDryRun) {
            console.log('🔍 MODE DRY RUN - Aucune modification effectuée');
            console.log('\nPour exécuter réellement le nettoyage:');
            console.log('   node scripts/db-cleanup.js --execute');
        } else {
            await client.query('COMMIT');
            console.log('✅ NETTOYAGE TERMINÉ AVEC SUCCÈS');

            // Afficher la nouvelle structure
            const tablesResult = await client.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as cols
        FROM information_schema.tables t
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

            console.log('\n📊 Structure actuelle de la base de données:');
            console.log(`   ${tablesResult.rows.length} tables`);
            for (const row of tablesResult.rows) {
                console.log(`   • ${row.table_name} (${row.cols} colonnes)`);
            }
        }

        console.log('═'.repeat(70));

    } catch (error) {
        if (!isDryRun) {
            await client.query('ROLLBACK');
        }
        console.error('\n❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

runCleanup();
