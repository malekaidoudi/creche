/**
 * Script pour renommer new_status en status dans la table enrollments
 * 
 * Ce script:
 * 1. Supprime l'ancienne colonne 'status' (3 valeurs)
 * 2. Renomme 'new_status' en 'status'
 * 
 * Usage: node scripts/rename-status-column.js
 */

require('dotenv').config();
const { pool } = require('../config/db_postgres');

async function renameStatusColumn() {
    console.log('═'.repeat(60));
    console.log('  MIGRATION: new_status → status');
    console.log('  Table: enrollments');
    console.log('═'.repeat(60));

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Vérifier si l'ancienne colonne 'status' existe
        console.log('\n📋 Étape 1: Vérification des colonnes...');

        const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enrollments' 
        AND column_name IN ('status', 'new_status')
    `);

        const existingColumns = columnsCheck.rows.map(r => r.column_name);
        console.log('   Colonnes trouvées:', existingColumns.join(', '));

        // 2. Supprimer l'ancienne colonne 'status' si elle existe
        if (existingColumns.includes('status')) {
            console.log('\n📋 Étape 2: Suppression de l\'ancienne colonne status...');
            await client.query('ALTER TABLE enrollments DROP COLUMN IF EXISTS status CASCADE');
            console.log('   ✅ Colonne status supprimée');
        } else {
            console.log('\n📋 Étape 2: Colonne status déjà absente');
        }

        // 3. Renommer new_status en status
        if (existingColumns.includes('new_status')) {
            console.log('\n📋 Étape 3: Renommage new_status → status...');
            await client.query('ALTER TABLE enrollments RENAME COLUMN new_status TO status');
            console.log('   ✅ Colonne renommée avec succès');
        } else {
            console.log('\n⚠️  Colonne new_status introuvable!');
            throw new Error('Colonne new_status non trouvée');
        }

        // 4. Vérification finale
        console.log('\n📋 Étape 4: Vérification finale...');
        const finalCheck = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'enrollments' 
        AND column_name = 'status'
    `);

        if (finalCheck.rows.length > 0) {
            const col = finalCheck.rows[0];
            console.log(`   ✅ Colonne status: ${col.data_type} (default: ${col.column_default})`);
        }

        // 5. Afficher les valeurs possibles
        const statusValues = await client.query(`
      SELECT status, COUNT(*) as count
      FROM enrollments
      GROUP BY status
      ORDER BY count DESC
    `);

        console.log('\n📊 Répartition des statuts:');
        for (const row of statusValues.rows) {
            console.log(`   • ${row.status || 'NULL'}: ${row.count}`);
        }

        await client.query('COMMIT');

        console.log('\n' + '═'.repeat(60));
        console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS');
        console.log('═'.repeat(60));
        console.log('\n📝 Résumé:');
        console.log('   • Ancienne colonne "status" (3 valeurs) supprimée');
        console.log('   • Colonne "new_status" (6 valeurs) renommée en "status"');
        console.log('   • Valeurs possibles: pending, in_progress, approved,');
        console.log('     rejected_incomplete, rejected_deleted, archived');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

renameStatusColumn();
