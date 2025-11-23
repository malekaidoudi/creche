/**
 * Script pour vérifier l'état des documents dans la base de données
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDocuments() {
    const client = await pool.connect();

    try {
        console.log('🔍 Vérification des documents dans la base de données...\n');

        // Compter tous les documents
        const countResult = await client.query('SELECT COUNT(*) as total FROM enrollment_documents');
        console.log(`📊 Total de documents: ${countResult.rows[0].total}\n`);

        // Compter les documents avec cloudinary_url
        const withCloudinary = await client.query(`
      SELECT COUNT(*) as count 
      FROM enrollment_documents 
      WHERE cloudinary_url IS NOT NULL AND cloudinary_url != ''
    `);
        console.log(`✅ Documents avec Cloudinary URL: ${withCloudinary.rows[0].count}`);

        // Compter les documents sans cloudinary_url
        const withoutCloudinary = await client.query(`
      SELECT COUNT(*) as count 
      FROM enrollment_documents 
      WHERE cloudinary_url IS NULL OR cloudinary_url = ''
    `);
        console.log(`❌ Documents sans Cloudinary URL: ${withoutCloudinary.rows[0].count}\n`);

        // Afficher les 5 premiers documents
        const docsResult = await client.query(`
      SELECT 
        id, 
        enrollment_id,
        document_type, 
        original_filename,
        filename,
        cloudinary_url,
        cloudinary_public_id,
        file_path
      FROM enrollment_documents
      ORDER BY id
      LIMIT 5
    `);

        if (docsResult.rows.length > 0) {
            console.log('📄 Premiers documents:\n');
            docsResult.rows.forEach(doc => {
                console.log(`ID: ${doc.id}`);
                console.log(`  Enrollment: ${doc.enrollment_id}`);
                console.log(`  Type: ${doc.document_type}`);
                console.log(`  Filename: ${doc.original_filename || doc.filename}`);
                console.log(`  Cloudinary URL: ${doc.cloudinary_url || '❌ NULL'}`);
                console.log(`  Public ID: ${doc.cloudinary_public_id || '❌ NULL'}`);
                console.log(`  File Path: ${doc.file_path || '❌ NULL'}`);
                console.log('');
            });
        } else {
            console.log('⚠️  Aucun document trouvé dans la base de données');
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkDocuments();
