require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function querySettings() {
    try {
        console.log('🔍 Requête: SELECT * FROM nursery_settings\n');

        const result = await pool.query('SELECT * FROM nursery_settings ORDER BY id');

        console.log('📊 Total:', result.rows.length, 'lignes trouvées\n');

        if (result.rows.length === 0) {
            console.log('❌ La table nursery_settings est vide\n');
        } else {
            console.log('📋 Données:\n');
            console.table(result.rows);

            console.log('\n🔍 Clés liées aux horaires:');
            const hoursKeys = result.rows.filter(r =>
                r.setting_key && (
                    r.setting_key.includes('working') ||
                    r.setting_key.includes('saturday') ||
                    r.setting_key.includes('hours')
                )
            );

            if (hoursKeys.length > 0) {
                console.log('✅ Trouvé', hoursKeys.length, 'clés:');
                hoursKeys.forEach(k => {
                    console.log('\n  Key:', k.setting_key);
                    console.log('  Value FR:', k.value_fr);
                    console.log('  Value AR:', k.value_ar);
                    console.log('  Active:', k.is_active);
                });
            } else {
                console.log('❌ Aucune clé liée aux horaires trouvée');
                console.log('\n💡 Vous devez exécuter: node backend/scripts/add-working-hours.js');
            }
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await pool.end();
    }
}

querySettings();
