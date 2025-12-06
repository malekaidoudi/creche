/**
 * Script de migration: Déplacer les RDV de enrollments vers appointments
 * Date: 2025-01-30
 * 
 * Ce script:
 * 1. Crée la table appointments si elle n'existe pas
 * 2. Copie les RDV existants depuis enrollments
 * 3. Supprime les colonnes appointment de enrollments (optionnel)
 * 
 * Usage: node database/migrations/migrate_appointments.js
 */

require('dotenv').config();
const db = require('../../config/db_postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🚀 Début de la migration des rendez-vous...\n');

    try {
        // 1. Lire et exécuter le fichier SQL de création de table
        console.log('📋 Étape 1: Création de la table appointments...');
        const sqlPath = path.join(__dirname, 'create_appointments.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Exécuter chaque statement SQL séparément
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await db.query(statement);
                } catch (err) {
                    // Ignorer les erreurs "already exists"
                    if (!err.message.includes('already exists')) {
                        console.warn(`⚠️  Avertissement: ${err.message.substring(0, 100)}`);
                    }
                }
            }
        }
        console.log('✅ Table appointments créée/vérifiée\n');

        // 2. Vérifier les RDV existants dans enrollments
        console.log('📋 Étape 2: Recherche des RDV existants dans enrollments...');

        const existingAppointments = await db.query(`
      SELECT 
        e.id as enrollment_id,
        e.applicant_first_name as parent_first_name,
        e.applicant_last_name as parent_last_name,
        e.applicant_email as parent_email,
        e.applicant_phone as parent_phone,
        e.child_first_name,
        e.child_last_name,
        e.appointment_date,
        e.approved_by as proposed_by,
        e.status
      FROM enrollments e
      WHERE e.appointment_date IS NOT NULL
    `);

        console.log(`📊 ${existingAppointments.rows.length} RDV trouvé(s) dans enrollments\n`);

        // 3. Migrer les RDV vers la table appointments
        if (existingAppointments.rows.length > 0) {
            console.log('📋 Étape 3: Migration des RDV vers appointments...');

            let migrated = 0;
            let skipped = 0;

            for (const row of existingAppointments.rows) {
                // Vérifier si ce RDV existe déjà dans appointments
                const existing = await db.query(
                    'SELECT id FROM appointments WHERE enrollment_id = $1',
                    [row.enrollment_id]
                );

                if (existing.rows.length > 0) {
                    console.log(`   ⏭️  RDV #${row.enrollment_id} déjà migré, ignoré`);
                    skipped++;
                    continue;
                }

                // Déterminer le statut du RDV
                let status = 'pending';
                if (row.status === 'approved') {
                    status = 'confirmed';
                } else if (row.status === 'rejected_incomplete') {
                    status = 'pending';
                }

                // Insérer le RDV
                await db.query(`
          INSERT INTO appointments (
            enrollment_id,
            parent_first_name,
            parent_last_name,
            parent_email,
            parent_phone,
            child_first_name,
            child_last_name,
            title,
            description,
            appointment_date,
            status,
            priority,
            proposed_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
                    row.enrollment_id,
                    row.parent_first_name || 'Parent',
                    row.parent_last_name || '',
                    row.parent_email || 'email@inconnu.com',
                    row.parent_phone || '',
                    row.child_first_name || 'Enfant',
                    row.child_last_name || '',
                    `Rendez-vous d'inscription - ${row.child_first_name || 'Enfant'}`,
                    `Rendez-vous pour finaliser l'inscription de ${row.child_first_name} ${row.child_last_name || ''}`,
                    row.appointment_date,
                    status,
                    'high',
                    row.proposed_by
                ]);

                console.log(`   ✅ RDV #${row.enrollment_id} migré: ${row.child_first_name} - ${new Date(row.appointment_date).toLocaleDateString('fr-FR')}`);
                migrated++;
            }

            console.log(`\n📊 Résumé: ${migrated} migré(s), ${skipped} ignoré(s)\n`);
        }

        // 4. Optionnel: Supprimer les colonnes de enrollments
        // ATTENTION: Décommenter seulement après avoir vérifié que tout fonctionne
        /*
        console.log('📋 Étape 4: Suppression des colonnes appointment de enrollments...');
        await db.query(`
          ALTER TABLE enrollments 
          DROP COLUMN IF EXISTS appointment_date,
          DROP COLUMN IF EXISTS appointment_time
        `);
        console.log('✅ Colonnes supprimées\n');
        */

        console.log('⚠️  Étape 4: Les colonnes appointment_date et appointment_time sont conservées pour l\'instant.');
        console.log('    Exécutez une migration séparée pour les supprimer une fois tout validé.\n');

        console.log('🎉 Migration terminée avec succès !');
        console.log('\n📋 Prochaines étapes:');
        console.log('   1. Vérifier les données dans la table appointments');
        console.log('   2. Tester les nouvelles fonctionnalités');
        console.log('   3. Supprimer les colonnes obsolètes de enrollments');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Exécuter la migration
runMigration();
