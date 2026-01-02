/**
 * Script pour ajouter contact_email dans nursery_settings (PROD + DEV)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production'), override: true });
const { Pool } = require('pg');

// PROD
const prodPool = new Pool({
    host: 'ep-soft-lake-aglnm655-pooler.c-2.eu-central-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_xsOVFf5lP1yk',
    database: 'neondb',
    ssl: { rejectUnauthorized: false }
});

// DEV
const devPool = new Pool({
    host: 'ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_ioMNXW9K2sbw',
    database: 'mima_elghalia_db',
    ssl: { rejectUnauthorized: false }
});

async function addContactEmail(pool, envName) {
    try {
        // Vérifier si contact_email existe
        const check = await pool.query("SELECT 1 FROM nursery_settings WHERE setting_key = 'contact_email'");

        if (check.rows.length === 0) {
            await pool.query(`
                INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
                VALUES ('contact_email', 'contact@mima-elghalia.com', 'contact@mima-elghalia.com', 'contact', true)
            `);
            console.log(`✅ ${envName}: contact_email ajouté`);
        } else {
            await pool.query(`
                UPDATE nursery_settings 
                SET value_fr = 'contact@mima-elghalia.com', value_ar = 'contact@mima-elghalia.com'
                WHERE setting_key = 'contact_email'
            `);
            console.log(`✅ ${envName}: contact_email mis à jour`);
        }
    } catch (error) {
        console.error(`❌ ${envName} Erreur:`, error.message);
    }
}

async function run() {
    console.log('🔧 Ajout de contact_email dans nursery_settings...\n');

    await addContactEmail(prodPool, 'PROD');
    await addContactEmail(devPool, 'DEV');

    await prodPool.end();
    await devPool.end();

    console.log('\n✅ Terminé!');
}

run();
