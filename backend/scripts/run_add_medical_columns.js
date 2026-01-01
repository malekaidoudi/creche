/**
 * Script pour ajouter les colonnes médicales à la table children
 * Exécuter avec: node scripts/run_add_medical_columns.js
 */

const { pool } = require('../config/db_postgres');

async function addMedicalColumns() {
    console.log('🔄 Ajout des colonnes médicales à la table children...');

    try {
        // Ajouter les colonnes
        const alterQueries = [
            'ALTER TABLE children ADD COLUMN IF NOT EXISTS allergies TEXT',
            'ALTER TABLE children ADD COLUMN IF NOT EXISTS medical_notes TEXT',
            'ALTER TABLE children ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(100)',
            'ALTER TABLE children ADD COLUMN IF NOT EXISTS doctor_phone VARCHAR(20)',
            "ALTER TABLE children ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'",
            "ALTER TABLE children ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'",
            'ALTER TABLE children ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10)'
        ];

        for (const query of alterQueries) {
            try {
                await pool.query(query);
                console.log('✅', query.replace('ALTER TABLE children ADD COLUMN IF NOT EXISTS ', 'Colonne ajoutée: '));
            } catch (err) {
                if (err.code === '42701') {
                    console.log('ℹ️ Colonne existe déjà:', query.split(' ')[7]);
                } else {
                    throw err;
                }
            }
        }

        // Migrer les données existantes
        console.log('🔄 Migration des données medical_info vers medical_notes...');
        const migrateResult = await pool.query(`
            UPDATE children 
            SET medical_notes = medical_info 
            WHERE medical_info IS NOT NULL AND medical_notes IS NULL
            RETURNING id
        `);
        console.log(`✅ ${migrateResult.rowCount} enregistrements migrés`);

        // Vérifier les colonnes
        const checkResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'children' 
            AND column_name IN ('allergies', 'medical_notes', 'doctor_name', 'doctor_phone', 'medications', 'conditions', 'blood_type')
            ORDER BY column_name
        `);

        console.log('\n📋 Colonnes médicales dans la table children:');
        checkResult.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type}`);
        });

        console.log('\n✅ Migration terminée avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

addMedicalColumns();
