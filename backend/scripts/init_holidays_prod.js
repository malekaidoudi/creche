/**
 * Script pour initialiser les jours fériés tunisiens en PRODUCTION
 * À exécuter une seule fois au premier lancement
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

async function initHolidays() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎄 INITIALISATION DES JOURS FÉRIÉS TUNISIENS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        // Vérifier si des jours fériés existent déjà
        const existing = await pool.query('SELECT COUNT(*) as count FROM holidays');
        const count = parseInt(existing.rows[0].count);

        if (count > 0) {
            console.log(`ℹ️  ${count} jours fériés déjà configurés`);
            console.log('   Utilisez --force pour réinitialiser\n');

            if (!process.argv.includes('--force')) {
                await pool.end();
                return;
            }

            console.log('🗑️  Suppression des jours fériés existants...');
            await pool.query('DELETE FROM holidays');
        }

        // Liste des politiques de jours fériés tunisiens
        const holidayPolicies = [
            // Jours fériés nationaux (dates fixes)
            { holiday_key: 'new_year', name: "Jour de l'An", name_ar: "رأس السنة الميلادية", type: 'national', fixed_day: 1, fixed_month: 1, days_count: 1, is_active: true, display_order: 1 },
            { holiday_key: 'revolution_day', name: "Fête de la Révolution", name_ar: "عيد الثورة", type: 'national', fixed_day: 14, fixed_month: 1, days_count: 1, is_active: true, display_order: 2 },
            { holiday_key: 'independence_day', name: "Fête de l'Indépendance", name_ar: "عيد الاستقلال", type: 'national', fixed_day: 20, fixed_month: 3, days_count: 1, is_active: true, display_order: 3 },
            { holiday_key: 'martyrs_day', name: "Fête des Martyrs", name_ar: "عيد الشهداء", type: 'national', fixed_day: 9, fixed_month: 4, days_count: 1, is_active: true, display_order: 4 },
            { holiday_key: 'labor_day', name: "Fête du Travail", name_ar: "عيد العمال", type: 'national', fixed_day: 1, fixed_month: 5, days_count: 1, is_active: true, display_order: 5 },
            { holiday_key: 'republic_day', name: "Fête de la République", name_ar: "عيد الجمهورية", type: 'national', fixed_day: 25, fixed_month: 7, days_count: 1, is_active: true, display_order: 6 },
            { holiday_key: 'womens_day', name: "Fête de la Femme", name_ar: "عيد المرأة", type: 'national', fixed_day: 13, fixed_month: 8, days_count: 1, is_active: true, display_order: 7 },
            { holiday_key: 'evacuation_day', name: "Fête de l'Évacuation", name_ar: "عيد الجلاء", type: 'national', fixed_day: 15, fixed_month: 10, days_count: 1, is_active: true, display_order: 8 },

            // Jours fériés religieux (dates variables - calculées automatiquement)
            { holiday_key: 'hijri_new_year', name: "Nouvel An Hégirien", name_ar: "رأس السنة الهجرية", type: 'religious', days_count: 1, is_active: true, display_order: 10 },
            { holiday_key: 'achoura', name: "Achoura", name_ar: "عاشوراء", type: 'religious', days_count: 1, is_active: true, display_order: 11 },
            { holiday_key: 'mawlid', name: "Mawlid (Naissance du Prophète)", name_ar: "المولد النبوي الشريف", type: 'religious', days_count: 1, is_active: true, display_order: 12 },
            { holiday_key: 'isra_miraj', name: "Isra et Miraj", name_ar: "ليلة الإسراء والمعراج", type: 'religious', days_count: 1, is_active: true, display_order: 13 },
            { holiday_key: 'eid_fitr', name: "Aïd el-Fitr", name_ar: "عيد الفطر", type: 'religious', days_count: 3, is_active: true, display_order: 14 },
            { holiday_key: 'arafat', name: "Jour d'Arafat", name_ar: "وقفة عرفة", type: 'religious', days_count: 1, is_active: true, display_order: 15 },
            { holiday_key: 'eid_adha', name: "Aïd el-Adha", name_ar: "عيد الأضحى", type: 'religious', days_count: 4, is_active: true, display_order: 16 },

            // Vacances scolaires (désactivées par défaut - l'admin peut les activer)
            { holiday_key: 'autumn_vacation', name: "Vacances d'Automne", name_ar: "عطلة الخريف", type: 'school', days_count: 1, is_active: false, display_order: 20 },
            { holiday_key: 'winter_vacation', name: "Vacances d'Hiver", name_ar: "عطلة الشتاء", type: 'school', days_count: 1, is_active: false, display_order: 21 },
            { holiday_key: 'spring_vacation', name: "Vacances de Printemps", name_ar: "عطلة الربيع", type: 'school', days_count: 1, is_active: false, display_order: 22 },
            { holiday_key: 'summer_vacation', name: "Vacances d'Été", name_ar: "عطلة الصيف", type: 'school', days_count: 1, is_active: false, display_order: 23 },
        ];

        console.log('📦 Création des jours fériés...\n');

        let added = 0;
        for (const policy of holidayPolicies) {
            await pool.query(`
                INSERT INTO holidays (holiday_key, name, name_ar, type, fixed_day, fixed_month, days_count, is_active, is_closed, display_order, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10)
            `, [
                policy.holiday_key,
                policy.name,
                policy.name_ar,
                policy.type,
                policy.fixed_day || null,
                policy.fixed_month || null,
                policy.days_count,
                policy.is_active,
                policy.display_order,
                policy.name_ar
            ]);

            const status = policy.is_active ? '✅' : '⬜';
            console.log(`   ${status} ${policy.name} (${policy.type})`);
            added++;
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log(`🎉 ${added} JOURS FÉRIÉS TUNISIENS INITIALISÉS!`);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n📋 Résumé:');
        console.log('   • 8 jours fériés nationaux (activés)');
        console.log('   • 7 jours fériés religieux (activés)');
        console.log('   • 4 vacances scolaires (désactivées par défaut)');
        console.log('\n💡 L\'admin peut maintenant paramétrer les jours fériés');
        console.log('   depuis Dashboard > Paramètres > Jours fériés');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await pool.end();
    }
}

initHolidays();
