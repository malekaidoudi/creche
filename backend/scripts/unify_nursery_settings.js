/**
 * Script pour unifier les paramètres nursery_settings
 * Supprime les doublons et met à jour les valeurs arabes
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production'), override: true });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function unifySettings() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔧 UNIFICATION DES PARAMÈTRES NURSERY_SETTINGS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        // 1. Afficher l'état actuel
        console.log('📋 État actuel des paramètres:');
        const current = await pool.query('SELECT setting_key, value_fr, value_ar FROM nursery_settings ORDER BY setting_key');
        current.rows.forEach(r => {
            console.log(`   ${r.setting_key.padEnd(25)} FR: ${(r.value_fr || '').padEnd(20)} AR: ${r.value_ar || '(vide)'}`);
        });

        console.log('\n🔄 Début de l\'unification...\n');

        // 2. Récupérer les valeurs actuelles pour working_hours_weekdays
        const workingHours = await pool.query("SELECT value_fr FROM nursery_settings WHERE setting_key = 'working_hours_weekdays'");
        let openingTime = '07:00';
        let closingTime = '18:00';

        if (workingHours.rows.length > 0 && workingHours.rows[0].value_fr) {
            const parts = workingHours.rows[0].value_fr.split('-');
            if (parts.length === 2) {
                openingTime = parts[0].trim();
                closingTime = parts[1].trim();
            }
        }
        console.log(`   📍 Horaires extraits: ${openingTime} - ${closingTime}`);

        // 3. Mettre à jour opening_time et closing_time avec les valeurs de working_hours_weekdays
        await pool.query(`
            UPDATE nursery_settings 
            SET value_fr = $1, value_ar = $1 
            WHERE setting_key = 'opening_time'
        `, [openingTime]);
        console.log(`   ✅ opening_time mis à jour: ${openingTime}`);

        await pool.query(`
            UPDATE nursery_settings 
            SET value_fr = $1, value_ar = $1 
            WHERE setting_key = 'closing_time'
        `, [closingTime]);
        console.log(`   ✅ closing_time mis à jour: ${closingTime}`);

        // 4. Supprimer working_hours_weekdays (doublon)
        await pool.query("DELETE FROM nursery_settings WHERE setting_key = 'working_hours_weekdays'");
        console.log('   🗑️  working_hours_weekdays supprimé (doublon)');

        // 5. Supprimer working_hours_saturday (on garde saturday_open + opening/closing)
        await pool.query("DELETE FROM nursery_settings WHERE setting_key = 'working_hours_saturday'");
        console.log('   🗑️  working_hours_saturday supprimé (doublon)');

        // 6. Récupérer la capacité de max_capacity
        const maxCap = await pool.query("SELECT value_fr FROM nursery_settings WHERE setting_key = 'max_capacity'");
        const capacityValue = maxCap.rows.length > 0 ? maxCap.rows[0].value_fr : '30';

        // 7. Supprimer capacity (doublon) - on garde max_capacity
        await pool.query("DELETE FROM nursery_settings WHERE setting_key = 'capacity'");
        console.log('   🗑️  capacity supprimé (on garde max_capacity)');

        // 8. Mettre à jour les valeurs arabes manquantes
        const arabicUpdates = [
            { key: 'nursery_name', ar: 'حضانة ميما الغالية' },
            { key: 'address', ar: '8 نهج بنزرت، مدنين 4100، تونس' },
            { key: 'phone', ar: '+216 25 95 35 32' },
            { key: 'email', ar: 'crechemimaelghalia@gmail.com' },
            { key: 'max_capacity', ar: capacityValue },
            { key: 'contact_phone', ar: '+216 25 95 35 32' },
            { key: 'contact_email', ar: 'contact@mima-elghalia.com' },
            { key: 'saturday_open', ar: 'false' }
        ];

        console.log('\n   📝 Mise à jour des valeurs arabes:');
        for (const update of arabicUpdates) {
            await pool.query(`
                UPDATE nursery_settings 
                SET value_ar = $1 
                WHERE setting_key = $2 AND (value_ar IS NULL OR value_ar = '')
            `, [update.ar, update.key]);
        }
        console.log('   ✅ Valeurs arabes mises à jour');

        // 9. Ajouter saturday_opening_time et saturday_closing_time si manquants
        const saturdaySettings = [
            { key: 'saturday_opening_time', fr: '08:00', ar: '08:00', category: 'schedule' },
            { key: 'saturday_closing_time', fr: '12:00', ar: '12:00', category: 'schedule' }
        ];

        for (const setting of saturdaySettings) {
            const exists = await pool.query('SELECT 1 FROM nursery_settings WHERE setting_key = $1', [setting.key]);
            if (exists.rows.length === 0) {
                await pool.query(`
                    INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category)
                    VALUES ($1, $2, $3, $4)
                `, [setting.key, setting.fr, setting.ar, setting.category]);
                console.log(`   ➕ ${setting.key} ajouté`);
            }
        }

        // 10. Afficher l'état final
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📋 État final des paramètres:');
        console.log('═══════════════════════════════════════════════════════════════');
        const final = await pool.query('SELECT setting_key, value_fr, value_ar FROM nursery_settings ORDER BY setting_key');
        final.rows.forEach(r => {
            console.log(`   ${r.setting_key.padEnd(25)} FR: ${(r.value_fr || '').padEnd(20)} AR: ${r.value_ar || '(vide)'}`);
        });

        console.log('\n✅ UNIFICATION TERMINÉE!');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await pool.end();
    }
}

unifySettings();
