// Script simple pour vérifier nursery_settings
const db = require('../config/db_postgres');

async function checkSettings() {
    try {
        console.log('🔍 SELECT * FROM nursery_settings\n');

        const result = await db.query('SELECT * FROM nursery_settings ORDER BY id');

        console.log('📊 Total:', result.rows.length, 'lignes\n');

        if (result.rows.length === 0) {
            console.log('❌ Table vide\n');
        } else {
            console.table(result.rows);

            // Chercher les clés horaires
            const hoursKeys = result.rows.filter(r =>
                r.setting_key && (
                    r.setting_key.includes('working') ||
                    r.setting_key.includes('saturday') ||
                    r.setting_key.includes('hours')
                )
            );

            console.log('\n🔍 Clés horaires trouvées:', hoursKeys.length);
            if (hoursKeys.length > 0) {
                hoursKeys.forEach(k => {
                    console.log('\n  ✅', k.setting_key);
                    console.log('     FR:', k.value_fr);
                    console.log('     AR:', k.value_ar);
                });
            } else {
                console.log('\n❌ Aucune clé horaire trouvée');
                console.log('💡 Exécutez: curl -X POST http://localhost:3003/api/contact/init-hours');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

checkSettings();
