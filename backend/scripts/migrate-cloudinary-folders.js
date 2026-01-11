/**
 * Script de migration des dossiers Cloudinary
 * 
 * Structure cible:
 * - admin_documents/     → Documents administratifs
 * - activities/          → Médias des activités
 * - virtual-tour/        → Images visite virtuelle
 * - profiles/            → Photos de profil utilisateurs
 * - enrollments/         → Documents inscription (temporaire)
 *   └── enrollment_{id}/
 * - children/            → Documents enfants inscrits
 *   └── child_{id}/
 * - archives/            → Documents enfants partis
 *   └── child_{id}/
 * 
 * Usage: node scripts/migrate-cloudinary-folders.js [--dry-run]
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const DRY_RUN = process.argv.includes('--dry-run');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  MIGRATION DES DOSSIERS CLOUDINARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (simulation)' : '🚀 EXÉCUTION RÉELLE'}`);
console.log('');

/**
 * Lister toutes les ressources d'un dossier
 */
async function listAllResources(folder) {
    const allResources = [];

    for (const resourceType of ['image', 'video', 'raw']) {
        try {
            let nextCursor = null;
            do {
                const options = {
                    type: 'upload',
                    prefix: folder,
                    max_results: 500,
                    resource_type: resourceType
                };
                if (nextCursor) options.next_cursor = nextCursor;

                const result = await cloudinary.api.resources(options);
                allResources.push(...(result.resources || []));
                nextCursor = result.next_cursor;
            } while (nextCursor);
        } catch (e) {
            // Ignorer les erreurs pour certains types
        }
    }

    return allResources;
}

/**
 * Renommer un fichier sur Cloudinary
 */
async function renameResource(oldPublicId, newPublicId, resourceType = 'image') {
    if (DRY_RUN) {
        console.log(`  [DRY RUN] Renommer: ${oldPublicId} → ${newPublicId}`);
        return { success: true, dryRun: true };
    }

    try {
        await cloudinary.uploader.rename(oldPublicId, newPublicId, { resource_type: resourceType });
        console.log(`  ✅ Renommé: ${oldPublicId} → ${newPublicId}`);
        return { success: true };
    } catch (error) {
        console.error(`  ❌ Erreur: ${oldPublicId} - ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Migrer les fichiers de enrollments/child_{id} vers children/child_{id}
 */
async function migrateEnrollmentsChildToChildren() {
    console.log('\n📦 Migration: enrollments/child_* → children/child_*');
    console.log('─'.repeat(60));

    const resources = await listAllResources('enrollments/child_');
    console.log(`  Trouvé: ${resources.length} fichier(s)`);

    let migrated = 0;
    let errors = 0;
    const urlMappings = [];

    for (const resource of resources) {
        const oldPublicId = resource.public_id;
        const newPublicId = oldPublicId.replace('enrollments/child_', 'children/child_');

        const result = await renameResource(oldPublicId, newPublicId, resource.resource_type);
        if (result.success) {
            migrated++;
            urlMappings.push({
                oldPublicId,
                newPublicId,
                oldUrl: resource.secure_url,
                newUrl: resource.secure_url.replace('/enrollments/child_', '/children/child_')
            });
        } else {
            errors++;
        }
    }

    console.log(`  Résultat: ${migrated} migré(s), ${errors} erreur(s)`);
    return urlMappings;
}

/**
 * Migrer les fichiers de enrollments/{childId} (ancien format) vers children/child_{id}
 */
async function migrateOldEnrollmentsFormat() {
    console.log('\n📦 Migration: enrollments/{childId} (ancien format) → children/child_{id}');
    console.log('─'.repeat(60));

    // Récupérer tous les enfants actifs
    const childrenResult = await pool.query('SELECT id FROM children WHERE is_active = true');
    const childIds = childrenResult.rows.map(r => r.id);

    let totalMigrated = 0;
    let totalErrors = 0;
    const allUrlMappings = [];

    for (const childId of childIds) {
        // Chercher les fichiers dans l'ancien format enrollments/{childId}
        const resources = await listAllResources(`enrollments/${childId}`);

        if (resources.length === 0) continue;

        console.log(`  Enfant #${childId}: ${resources.length} fichier(s)`);

        for (const resource of resources) {
            const oldPublicId = resource.public_id;
            // Remplacer enrollments/{childId}/ par children/child_{childId}/
            const newPublicId = oldPublicId.replace(`enrollments/${childId}/`, `children/child_${childId}/`);

            const result = await renameResource(oldPublicId, newPublicId, resource.resource_type);
            if (result.success) {
                totalMigrated++;
                allUrlMappings.push({
                    childId,
                    oldPublicId,
                    newPublicId,
                    oldUrl: resource.secure_url,
                    newUrl: resource.secure_url.replace(`/enrollments/${childId}/`, `/children/child_${childId}/`)
                });
            } else {
                totalErrors++;
            }
        }
    }

    console.log(`  Résultat total: ${totalMigrated} migré(s), ${totalErrors} erreur(s)`);
    return allUrlMappings;
}

/**
 * Mettre à jour les URLs dans la base de données
 */
async function updateDatabaseUrls(urlMappings) {
    if (DRY_RUN || urlMappings.length === 0) {
        console.log(`\n📝 Mise à jour base de données: ${urlMappings.length} URL(s) à mettre à jour`);
        if (DRY_RUN) console.log('  [DRY RUN] Aucune modification effectuée');
        return;
    }

    console.log(`\n📝 Mise à jour base de données: ${urlMappings.length} URL(s)`);
    console.log('─'.repeat(60));

    let updated = 0;

    for (const mapping of urlMappings) {
        try {
            // Mettre à jour children_documents
            const result = await pool.query(`
        UPDATE children_documents 
        SET cloudinary_url = $1, cloudinary_public_id = $2, file_path = $1
        WHERE cloudinary_url = $3 OR cloudinary_public_id = $4
      `, [mapping.newUrl, mapping.newPublicId, mapping.oldUrl, mapping.oldPublicId]);

            if (result.rowCount > 0) {
                updated += result.rowCount;
                console.log(`  ✅ Mis à jour: ${mapping.oldPublicId}`);
            }
        } catch (error) {
            console.error(`  ❌ Erreur DB: ${error.message}`);
        }
    }

    console.log(`  Total mis à jour: ${updated} enregistrement(s)`);
}

/**
 * Afficher un résumé de l'état actuel
 */
async function showCurrentState() {
    console.log('\n📊 ÉTAT ACTUEL DES DOSSIERS CLOUDINARY');
    console.log('─'.repeat(60));

    const folders = [
        'admin_documents',
        'activities',
        'virtual-tour',
        'profiles',
        'enrollments',
        'children',
        'archives'
    ];

    for (const folder of folders) {
        const resources = await listAllResources(folder);
        const icon = resources.length > 0 ? '📁' : '📂';
        console.log(`  ${icon} ${folder}: ${resources.length} fichier(s)`);
    }
}

/**
 * Exécution principale
 */
async function main() {
    try {
        // Afficher l'état actuel
        await showCurrentState();

        // Migration enrollments/child_* → children/child_*
        const mappings1 = await migrateEnrollmentsChildToChildren();

        // Migration enrollments/{childId} → children/child_{childId}
        const mappings2 = await migrateOldEnrollmentsFormat();

        // Combiner tous les mappings
        const allMappings = [...mappings1, ...mappings2];

        // Mettre à jour la base de données
        await updateDatabaseUrls(allMappings);

        // Afficher l'état final
        console.log('\n');
        await showCurrentState();

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('  MIGRATION TERMINÉE');
        console.log('═══════════════════════════════════════════════════════════════');

        if (DRY_RUN) {
            console.log('\n⚠️  Mode DRY RUN - Aucune modification effectuée');
            console.log('   Pour exécuter réellement: node scripts/migrate-cloudinary-folders.js');
        }

    } catch (error) {
        console.error('\n❌ ERREUR FATALE:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
