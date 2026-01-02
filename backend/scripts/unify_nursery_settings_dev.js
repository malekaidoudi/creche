/**
 * Script pour unifier les paramètres nursery_settings sur DEV
 * Supprime les doublons et met à jour les valeurs arabes
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development'), override: true });
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
    console.log('🔧 UNIFICATION DES PARAMÈTRES NURSERY_SETTINGS (DEV)');
    console.log('   Base:', process.env.DB_NAME);
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

        // 3. Vérifier si opening_time existe, sinon le créer
        const openingExists = await pool.query("SELECT 1 FROM nursery_settings WHERE setting_key = 'opening_time'");
        if (openingExists.rows.length === 0) {
            await pool.query(`
                INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
                VALUES ('opening_time', $1, $1, 'schedule', true)
            `, [openingTime]);
            console.log(`   ➕ opening_time créé: ${openingTime}`);
        } else {
            await pool.query(`
                UPDATE nursery_settings 
                SET value_fr = $1, value_ar = $1 
                WHERE setting_key = 'opening_time'
            `, [openingTime]);
            console.log(`   ✅ opening_time mis à jour: ${openingTime}`);
        }

        // 4. Vérifier si closing_time existe, sinon le créer
        const closingExists = await pool.query("SELECT 1 FROM nursery_settings WHERE setting_key = 'closing_time'");
        if (closingExists.rows.length === 0) {
            await pool.query(`
                INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
                VALUES ('closing_time', $1, $1, 'schedule', true)
            `, [closingTime]);
            console.log(`   ➕ closing_time créé: ${closingTime}`);
        } else {
            await pool.query(`
                UPDATE nursery_settings 
                SET value_fr = $1, value_ar = $1 
                WHERE setting_key = 'closing_time'
            `, [closingTime]);
            console.log(`   ✅ closing_time mis à jour: ${closingTime}`);
        }

        // 5. Supprimer working_hours_weekdays (doublon)
        await pool.query("DELETE FROM nursery_settings WHERE setting_key = 'working_hours_weekdays'");
        console.log('   🗑️  working_hours_weekdays supprimé (doublon)');

        // 6. Supprimer working_hours_saturday et créer saturday_opening_time/saturday_closing_time
        const saturdayHours = await pool.query("SELECT value_fr FROM nursery_settings WHERE setting_key = 'working_hours_saturday'");
        let satOpeningTime = '08:00';
        let satClosingTime = '12:00';

        if (saturdayHours.rows.length > 0 && saturdayHours.rows[0].value_fr) {
            const parts = saturdayHours.rows[0].value_fr.split('-');
            if (parts.length === 2) {
                satOpeningTime = parts[0].trim();
                satClosingTime = parts[1].trim();
            }
        }

        await pool.query("DELETE FROM nursery_settings WHERE setting_key = 'working_hours_saturday'");
        console.log('   🗑️  working_hours_saturday supprimé (doublon)');

        // Ajouter saturday_opening_time et saturday_closing_time
        const satSettings = [
            { key: 'saturday_opening_time', value: satOpeningTime },
            { key: 'saturday_closing_time', value: satClosingTime }
        ];

        for (const setting of satSettings) {
            const exists = await pool.query('SELECT 1 FROM nursery_settings WHERE setting_key = $1', [setting.key]);
            if (exists.rows.length === 0) {
                await pool.query(`
                    INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
                    VALUES ($1, $2, $2, 'schedule', true)
                `, [setting.key, setting.value]);
                console.log(`   ➕ ${setting.key} créé: ${setting.value}`);
            } else {
                await pool.query(`
                    UPDATE nursery_settings SET value_fr = $1, value_ar = $1 WHERE setting_key = $2
                `, [setting.value, setting.key]);
                console.log(`   ✅ ${setting.key} mis à jour: ${setting.value}`);
            }
        }

        // 7. Récupérer la capacité de max_capacity ou capacity
        const maxCap = await pool.query("SELECT value_fr FROM nursery_settings WHERE setting_key = 'max_capacity'");
        const cap = await pool.query("SELECT value_fr FROM nursery_settings WHERE setting_key = 'capacity'");
        let capacityValue = '30';

        if (maxCap.rows.length > 0) {
            capacityValue = maxCap.rows[0].value_fr?.replace(/\D/g, '') || '30';
        } else if (cap.rows.length > 0) {
            capacityValue = cap.rows[0].value_fr?.replace(/\D/g, '') || '30';
        }

        // Mettre à jour ou créer max_capacity
        const maxCapExists = await pool.query("SELECT 1 FROM nursery_settings WHERE setting_key = 'max_capacity'");
        if (maxCapExists.rows.length === 0) {
            await pool.query(`
                INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
                VALUES ('max_capacity', $1, $1, 'general', true)
            `, [capacityValue]);
            console.log(`   ➕ max_capacity créé: ${capacityValue}`);
        } else {
            await pool.query(`
                UPDATE nursery_settings SET value_fr = $1, value_ar = $1 WHERE setting_key = 'max_capacity'
            `, [capacityValue]);
            console.log(`   ✅ max_capacity mis à jour: ${capacityValue}`);
        }

        // 8. Supprimer capacity (doublon)
        await pool.query("DELETE FROM nursery_settings WHERE setting_key = 'capacity'");
        console.log('   🗑️  capacity supprimé (on garde max_capacity)');

        // 9. Mettre à jour les valeurs arabes manquantes
        const arabicUpdates = [
            { key: 'nursery_name', ar: 'حضانة ميما الغالية' },
            { key: 'address', ar: '8 نهج بنزرت، مدنين 4100، تونس' },
            { key: 'phone', ar: '+216 25 95 35 32' },
            { key: 'email', ar: 'crechemimaelghalia@gmail.com' },
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

        // 10. Afficher l'état final
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('📋 État final des paramètres:');
        console.log('═══════════════════════════════════════════════════════════════');
        const final = await pool.query('SELECT setting_key, value_fr, value_ar FROM nursery_settings ORDER BY setting_key');
        final.rows.forEach(r => {
            console.log(`   ${r.setting_key.padEnd(25)} FR: ${(r.value_fr || '').padEnd(20)} AR: ${r.value_ar || '(vide)'}`);
        });

        console.log('\n✅ UNIFICATION DEV TERMINÉE!');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await pool.end();
    }
}

unifySettings();
