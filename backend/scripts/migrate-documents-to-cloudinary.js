/**
 * Script de migration des documents vers Cloudinary
 * Upload tous les documents locaux vers Cloudinary et met à jour la base de données
 */

require('dotenv').config();
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

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

// Statistiques
const stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
};

/**
 * Upload un fichier vers Cloudinary
 */
async function uploadToCloudinary(filePath, folder = 'enrollments') {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `creche/${folder}`,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true
        });

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('❌ Erreur upload Cloudinary:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Mettre à jour la base de données avec les URLs Cloudinary
 */
async function updateDatabase(documentId, cloudinaryUrl, cloudinaryPublicId) {
    const client = await pool.connect();
    try {
        await client.query(`
      UPDATE enrollment_documents 
      SET cloudinary_url = $1, 
          cloudinary_public_id = $2,
          updated_at = NOW()
      WHERE id = $3
    `, [cloudinaryUrl, cloudinaryPublicId, documentId]);

        return { success: true };
    } catch (error) {
        console.error('❌ Erreur mise à jour BDD:', error.message);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Migrer tous les documents
 */
async function migrateDocuments() {
    console.log('🚀 Démarrage de la migration des documents vers Cloudinary...\n');

    const client = await pool.connect();

    try {
        // Récupérer tous les documents sans URL Cloudinary
        const result = await client.query(`
      SELECT 
        id, 
        enrollment_id,
        document_type, 
        filename,
        original_filename,
        file_path,
        mime_type
      FROM enrollment_documents
      WHERE cloudinary_url IS NULL OR cloudinary_url = ''
      ORDER BY id
    `);

        stats.total = result.rows.length;
        console.log(`📊 ${stats.total} documents à migrer\n`);

        if (stats.total === 0) {
            console.log('✅ Aucun document à migrer. Tous les documents sont déjà sur Cloudinary.');
            return;
        }

        // Traiter chaque document
        for (const doc of result.rows) {
            console.log(`\n📄 Document #${doc.id} - ${doc.original_filename || doc.filename}`);
            console.log(`   Type: ${doc.document_type}`);
            console.log(`   Chemin: ${doc.file_path}`);

            // Construire le chemin complet du fichier
            const uploadsDir = path.join(__dirname, '../uploads/enrollments');
            const filePath = path.join(uploadsDir, doc.filename);

            // Vérifier si le fichier existe
            if (!fs.existsSync(filePath)) {
                console.log(`   ⚠️  Fichier non trouvé localement, passage au suivant`);
                stats.skipped++;
                stats.errors.push({
                    id: doc.id,
                    filename: doc.filename,
                    error: 'Fichier non trouvé'
                });
                continue;
            }

            // Upload vers Cloudinary
            console.log(`   ⬆️  Upload vers Cloudinary...`);
            const uploadResult = await uploadToCloudinary(filePath, 'enrollments');

            if (!uploadResult.success) {
                console.log(`   ❌ Échec de l'upload: ${uploadResult.error}`);
                stats.failed++;
                stats.errors.push({
                    id: doc.id,
                    filename: doc.filename,
                    error: uploadResult.error
                });
                continue;
            }

            console.log(`   ✅ Upload réussi: ${uploadResult.url}`);

            // Mettre à jour la base de données
            console.log(`   💾 Mise à jour de la base de données...`);
            const updateResult = await updateDatabase(doc.id, uploadResult.url, uploadResult.publicId);

            if (!updateResult.success) {
                console.log(`   ❌ Échec de la mise à jour BDD: ${updateResult.error}`);
                stats.failed++;
                stats.errors.push({
                    id: doc.id,
                    filename: doc.filename,
                    error: updateResult.error
                });
                continue;
            }

            console.log(`   ✅ Base de données mise à jour`);
            stats.success++;

            // Petite pause pour ne pas surcharger Cloudinary
            await new Promise(resolve => setTimeout(resolve, 500));
        }

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Afficher les statistiques finales
 */
function displayStats() {
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 STATISTIQUES DE MIGRATION');
    console.log('='.repeat(60));
    console.log(`Total de documents:     ${stats.total}`);
    console.log(`✅ Migrés avec succès:  ${stats.success}`);
    console.log(`❌ Échecs:              ${stats.failed}`);
    console.log(`⚠️  Ignorés:             ${stats.skipped}`);
    console.log('='.repeat(60));

    if (stats.errors.length > 0) {
        console.log('\n❌ ERREURS DÉTAILLÉES:');
        stats.errors.forEach((err, index) => {
            console.log(`\n${index + 1}. Document #${err.id} - ${err.filename}`);
            console.log(`   Erreur: ${err.error}`);
        });
    }

    console.log('\n');
}

/**
 * Point d'entrée principal
 */
async function main() {
    try {
        // Vérifier la configuration Cloudinary
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw new Error('Configuration Cloudinary manquante dans .env');
        }

        console.log('✅ Configuration Cloudinary OK');
        console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);

        // Vérifier la connexion à la base de données
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Connexion PostgreSQL OK\n');

        // Lancer la migration
        await migrateDocuments();

        // Afficher les statistiques
        displayStats();

        // Fermer la connexion
        await pool.end();

        // Code de sortie
        process.exit(stats.failed > 0 ? 1 : 0);

    } catch (error) {
        console.error('\n❌ ERREUR FATALE:', error.message);
        console.error(error.stack);
        await pool.end();
        process.exit(1);
    }
}

// Lancer le script
main();
