/**
 * Script pour renommer les dossiers Cloudinary "7" et "8" en "children/child_7" et "children/child_8"
 * et mettre à jour les références dans la base de données
 * 
 * Usage: node scripts/rename-folders-7-8.js [--dry-run]
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
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

const DRY_RUN = process.argv.includes('--dry-run');

async function listFolderResources(folderPath) {
    try {
        const resources = [];

        // Récupérer les images
        const images = await cloudinary.api.resources({
            type: 'upload',
            prefix: folderPath,
            resource_type: 'image',
            max_results: 500
        });
        resources.push(...(images.resources || []));

        // Récupérer les fichiers raw (PDF, etc.)
        const raw = await cloudinary.api.resources({
            type: 'upload',
            prefix: folderPath,
            resource_type: 'raw',
            max_results: 500
        });
        resources.push(...(raw.resources || []));

        return resources;
    } catch (error) {
        if (error.error?.http_code === 404) {
            return [];
        }
        throw error;
    }
}

async function moveFile(oldPublicId, newPublicId, resourceType = 'image') {
    if (DRY_RUN) {
        console.log(`  [DRY-RUN] Déplacerait: ${oldPublicId} → ${newPublicId}`);
        return { public_id: newPublicId, secure_url: `https://res.cloudinary.com/xxx/${newPublicId}` };
    }

    try {
        const result = await cloudinary.uploader.rename(oldPublicId, newPublicId, {
            resource_type: resourceType,
            overwrite: false,
            invalidate: true
        });
        console.log(`  ✅ Déplacé: ${oldPublicId} → ${newPublicId}`);
        return result;
    } catch (error) {
        console.error(`  ❌ Erreur déplacement ${oldPublicId}:`, error.message);
        throw error;
    }
}

async function updateDatabaseUrls(oldFolder, newFolder) {
    const tables = [
        { table: 'children_documents', column: 'cloudinary_url' },
        { table: 'enrollments', column: 'acte_naissance_url' },
        { table: 'enrollments', column: 'carnet_medical_url' },
        { table: 'enrollments', column: 'certificat_medical_url' },
        { table: 'children', column: 'photo_url' }
    ];

    for (const { table, column } of tables) {
        try {
            const query = `
        UPDATE ${table} 
        SET ${column} = REPLACE(${column}, '/${oldFolder}/', '/${newFolder}/')
        WHERE ${column} LIKE '%/${oldFolder}/%'
        RETURNING id, ${column}
      `;

            if (DRY_RUN) {
                // En mode dry-run, juste vérifier ce qui serait modifié
                const checkQuery = `
          SELECT id, ${column} FROM ${table} 
          WHERE ${column} LIKE '%/${oldFolder}/%'
        `;
                const result = await pool.query(checkQuery);
                if (result.rows.length > 0) {
                    console.log(`  [DRY-RUN] Mettrait à jour ${result.rows.length} enregistrement(s) dans ${table}.${column}`);
                    result.rows.forEach(row => {
                        console.log(`    - ID ${row.id}: ${row[column]?.substring(0, 80)}...`);
                    });
                }
            } else {
                const result = await pool.query(query);
                if (result.rows.length > 0) {
                    console.log(`  ✅ Mis à jour ${result.rows.length} enregistrement(s) dans ${table}.${column}`);
                }
            }
        } catch (error) {
            // Ignorer les erreurs si la colonne n'existe pas
            if (!error.message.includes('does not exist')) {
                console.error(`  ⚠️ Erreur mise à jour ${table}.${column}:`, error.message);
            }
        }
    }
}

async function renameFolder(oldFolder, newFolder) {
    console.log(`\n📁 Renommage: ${oldFolder} → ${newFolder}`);
    console.log('─'.repeat(50));

    // 1. Lister les fichiers dans l'ancien dossier
    console.log(`\n🔍 Recherche des fichiers dans "${oldFolder}"...`);
    const resources = await listFolderResources(oldFolder);

    if (resources.length === 0) {
        console.log(`  ⚠️ Aucun fichier trouvé dans "${oldFolder}"`);
        return;
    }

    console.log(`  📄 ${resources.length} fichier(s) trouvé(s)`);

    // 2. Déplacer chaque fichier
    console.log(`\n📦 Déplacement des fichiers...`);
    const movedFiles = [];

    for (const resource of resources) {
        const oldPublicId = resource.public_id;
        const filename = oldPublicId.split('/').pop();
        const newPublicId = `${newFolder}/${filename}`;

        try {
            const result = await moveFile(oldPublicId, newPublicId, resource.resource_type);
            movedFiles.push({
                oldPublicId,
                newPublicId,
                oldUrl: resource.secure_url,
                newUrl: result.secure_url
            });
        } catch (error) {
            console.error(`  ❌ Échec pour ${oldPublicId}`);
        }
    }

    // 3. Mettre à jour les URLs dans la base de données
    console.log(`\n🗄️ Mise à jour de la base de données...`);
    await updateDatabaseUrls(oldFolder, newFolder);

    // 4. Supprimer l'ancien dossier vide (si pas en dry-run)
    if (!DRY_RUN && movedFiles.length > 0) {
        try {
            await cloudinary.api.delete_folder(oldFolder);
            console.log(`\n🗑️ Ancien dossier "${oldFolder}" supprimé`);
        } catch (error) {
            console.log(`  ⚠️ Impossible de supprimer l'ancien dossier: ${error.message}`);
        }
    }

    console.log(`\n✅ Terminé pour ${oldFolder} → ${newFolder}`);
    console.log(`   ${movedFiles.length} fichier(s) déplacé(s)`);
}

async function main() {
    console.log('═'.repeat(60));
    console.log('🔄 RENOMMAGE DES DOSSIERS CLOUDINARY');
    console.log('═'.repeat(60));

    if (DRY_RUN) {
        console.log('\n⚠️  MODE DRY-RUN: Aucune modification ne sera effectuée\n');
    }

    try {
        // Renommer le dossier "children/7" en "children/child_7"
        await renameFolder('children/7', 'children/child_7');

        // Renommer le dossier "children/8" en "children/child_8"
        // Note: children/child_8 existe déjà, les fichiers seront fusionnés
        await renameFolder('children/8', 'children/child_8');

        console.log('\n' + '═'.repeat(60));
        console.log('✅ MIGRATION TERMINÉE');
        console.log('═'.repeat(60));

        if (DRY_RUN) {
            console.log('\n💡 Pour exécuter réellement, relancez sans --dry-run');
        }

    } catch (error) {
        console.error('\n❌ Erreur:', error);
    } finally {
        await pool.end();
    }
}

main();
