#!/usr/bin/env node

/**
 * Script de migration pour le workflow Parent/Staff
 * Exécute la migration 003_workflow_parent_staff.sql
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db_postgres');

async function runMigration() {
    console.log('🚀 MIGRATION WORKFLOW PARENT/STAFF');
    console.log('===================================\n');

    const client = await pool.connect();

    try {
        // Lire le fichier SQL
        const sqlPath = path.join(__dirname, '../database/migrations/003_workflow_parent_staff.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Lecture du fichier de migration...');
        console.log(`   Chemin: ${sqlPath}\n`);

        // Exécuter la migration dans une transaction
        await client.query('BEGIN');
        console.log('🔄 Début de la transaction...\n');

        // Exécuter le SQL
        await client.query(sql);

        await client.query('COMMIT');
        console.log('✅ Migration exécutée avec succès!\n');

        // Vérifier les modifications
        console.log('📊 Vérification des modifications:\n');

        // Vérifier les colonnes ajoutées à children
        const childrenCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'children' 
      AND column_name IN ('parent_id', 'enrollment_status')
    `);
        console.log('   Table CHILDREN:');
        childrenCols.rows.forEach(col => {
            console.log(`   ✓ ${col.column_name} (${col.data_type})`);
        });

        // Vérifier les colonnes ajoutées à users
        const usersCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('gender', 'staff_position', 'password_token', 'password_token_expires', 'password_set', 'emergency_contact_name', 'emergency_contact_phone')
    `);
        console.log('\n   Table USERS:');
        usersCols.rows.forEach(col => {
            console.log(`   ✓ ${col.column_name} (${col.data_type})`);
        });

        // Vérifier la table parent_children
        const parentChildrenExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'parent_children'
      )
    `);
        console.log('\n   Table PARENT_CHILDREN:');
        console.log(`   ✓ Créée: ${parentChildrenExists.rows[0].exists}`);

        // Vérifier les vues
        const views = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('orphan_children', 'users_pending_password')
    `);
        console.log('\n   Vues créées:');
        views.rows.forEach(view => {
            console.log(`   ✓ ${view.table_name}`);
        });

        console.log('\n🎉 Migration terminée avec succès!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur lors de la migration:', error.message);
        console.error('\n   Détails:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Exécution
if (require.main === module) {
    runMigration().catch(console.error);
}

module.exports = { runMigration };
