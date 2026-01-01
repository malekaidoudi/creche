/**
 * Script de Seed - Initialisation des données de base
 * Crèche Mima Elghalia
 * 
 * Usage: node backend/scripts/seed.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Configuration PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: true },
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('🌱 SCRIPT DE SEED - Crèche Mima Elghalia');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`📍 Host: ${process.env.DB_HOST}`);
console.log(`📦 Database: ${process.env.DB_NAME}`);
console.log('═══════════════════════════════════════════════════════════════\n');

async function seed() {
    const client = await pool.connect();

    try {
        console.log('🔗 Connexion à la base de données...');

        // Vérifier la connexion
        const testResult = await client.query('SELECT NOW() as time');
        console.log(`✅ Connecté à PostgreSQL - ${testResult.rows[0].time}\n`);

        // ═══════════════════════════════════════════════════════════════
        // 1. CRÉER LES TABLES SI ELLES N'EXISTENT PAS
        // ═══════════════════════════════════════════════════════════════
        console.log('📋 Vérification des tables...');

        // Table users
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'parent',
        phone VARCHAR(50),
        profile_image TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('  ✓ Table users');

        // Table nursery_settings
        await client.query(`
      CREATE TABLE IF NOT EXISTS nursery_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        value_fr TEXT,
        value_ar TEXT,
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('  ✓ Table nursery_settings');

        // Table holidays
        await client.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL UNIQUE,
        type VARCHAR(50) DEFAULT 'custom',
        is_closed BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('  ✓ Table holidays');

        // Table holiday_policies
        await client.query(`
      CREATE TABLE IF NOT EXISTS holiday_policies (
        id SERIAL PRIMARY KEY,
        holiday_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255),
        type VARCHAR(50) NOT NULL DEFAULT 'national',
        fixed_day INTEGER,
        fixed_month INTEGER,
        days_count INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        is_recurring BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('  ✓ Table holiday_policies');

        // Table children
        await client.query(`
      CREATE TABLE IF NOT EXISTS children (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        birth_date DATE,
        gender VARCHAR(20),
        parent_id INTEGER REFERENCES users(id),
        photo_url TEXT,
        medical_info TEXT,
        is_active BOOLEAN DEFAULT true,
        photo_shared_with_staff BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('  ✓ Table children');

        // Table attendance
        await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        child_id INTEGER REFERENCES children(id),
        date DATE NOT NULL,
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'present',
        notes TEXT,
        recorded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('  ✓ Table attendance');

        console.log('');

        // ═══════════════════════════════════════════════════════════════
        // 2. CRÉER LE COMPTE ADMIN
        // ═══════════════════════════════════════════════════════════════
        console.log('👤 Création du compte admin...');

        const adminEmail = 'crechemimaelghalia@gmail.com';
        const adminPassword = await bcrypt.hash('password', 10);

        const existingAdmin = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [adminEmail]
        );

        if (existingAdmin.rows.length > 0) {
            await client.query(
                'UPDATE users SET password = $1, is_active = true, role = $2 WHERE email = $3',
                [adminPassword, 'admin', adminEmail]
            );
            console.log('  ✓ Compte admin mis à jour');
        } else {
            await client.query(
                `INSERT INTO users (email, password, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [adminEmail, adminPassword, 'Admin', 'Crèche', 'admin', true]
            );
            console.log('  ✓ Compte admin créé');
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. CRÉER LE COMPTE STAFF
        // ═══════════════════════════════════════════════════════════════
        console.log('👤 Création du compte staff...');

        const staffEmail = 'staff@mimaelghalia.tn';
        const staffPassword = await bcrypt.hash('password', 10);

        const existingStaff = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [staffEmail]
        );

        if (existingStaff.rows.length === 0) {
            await client.query(
                `INSERT INTO users (email, password, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [staffEmail, staffPassword, 'Staff', 'Crèche', 'staff', true]
            );
            console.log('  ✓ Compte staff créé');
        } else {
            console.log('  ✓ Compte staff existe déjà');
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. INITIALISER LES PARAMÈTRES DE LA CRÈCHE
        // ═══════════════════════════════════════════════════════════════
        console.log('⚙️  Initialisation des paramètres...');

        const settings = [
            { key: 'nursery_name', value_fr: 'Mima Elghalia', value_ar: 'ميما الغالية' },
            { key: 'address', value_fr: '8 Rue Bizerte Medenine', value_ar: '8 نهج بنزرت مدنين 4100' },
            { key: 'phone', value_fr: '+216 25 95 35 32', value_ar: '+216 25 95 35 32' },
            { key: 'email', value_fr: 'contact@mimaelghalia.tn', value_ar: 'contact@mimaelghalia.tn' },
            { key: 'capacity', value_fr: '40', value_ar: '40' },
            { key: 'working_hours_weekdays', value_fr: '07:00-18:00', value_ar: '07:00-18:00' },
            { key: 'saturday_open', value_fr: 'false', value_ar: 'false' },
            { key: 'working_hours_saturday', value_fr: '08:00-12:00', value_ar: '08:00-12:00' },
        ];

        for (const setting of settings) {
            await client.query(
                `INSERT INTO nursery_settings (setting_key, value_fr, value_ar)
         VALUES ($1, $2, $3)
         ON CONFLICT (setting_key) DO UPDATE SET value_fr = $2, value_ar = $3`,
                [setting.key, setting.value_fr, setting.value_ar]
            );
        }
        console.log('  ✓ Paramètres initialisés');

        // ═══════════════════════════════════════════════════════════════
        // 5. INITIALISER LES POLITIQUES DE JOURS FÉRIÉS
        // ═══════════════════════════════════════════════════════════════
        console.log('📅 Initialisation des politiques de jours fériés...');

        const nationalHolidays = [
            { key: 'new_year', name: "Jour de l'An", name_ar: 'رأس السنة الميلادية', day: 1, month: 1, order: 1 },
            { key: 'revolution_day', name: 'Fête de la Révolution', name_ar: 'عيد الثورة', day: 14, month: 1, order: 2 },
            { key: 'independence_day', name: "Fête de l'Indépendance", name_ar: 'عيد الاستقلال', day: 20, month: 3, order: 3 },
            { key: 'martyrs_day', name: 'Fête des Martyrs', name_ar: 'عيد الشهداء', day: 9, month: 4, order: 4 },
            { key: 'labor_day', name: 'Fête du Travail', name_ar: 'عيد العمال', day: 1, month: 5, order: 5 },
            { key: 'republic_day', name: 'Fête de la République', name_ar: 'عيد الجمهورية', day: 25, month: 7, order: 6 },
            { key: 'womens_day', name: 'Fête de la Femme', name_ar: 'عيد المرأة', day: 13, month: 8, order: 7 },
            { key: 'evacuation_day', name: "Fête de l'Évacuation", name_ar: 'عيد الجلاء', day: 15, month: 10, order: 8 },
        ];

        const religiousHolidays = [
            { key: 'hijri_new_year', name: 'Nouvel An Hégirien', name_ar: 'رأس السنة الهجرية', days: 1, order: 10 },
            { key: 'achoura', name: 'Achoura', name_ar: 'عاشوراء', days: 1, order: 11 },
            { key: 'mawlid', name: 'Mawlid (Naissance du Prophète)', name_ar: 'المولد النبوي الشريف', days: 1, order: 12 },
            { key: 'isra_miraj', name: 'Isra et Miraj', name_ar: 'ليلة الإسراء والمعراج', days: 1, order: 13 },
            { key: 'eid_fitr', name: 'Aïd el-Fitr', name_ar: 'عيد الفطر', days: 3, order: 14 },
            { key: 'arafat', name: "Jour d'Arafat", name_ar: 'وقفة عرفة', days: 1, order: 15 },
            { key: 'eid_adha', name: 'Aïd el-Adha', name_ar: 'عيد الأضحى', days: 4, order: 16 },
        ];

        for (const h of nationalHolidays) {
            await client.query(
                `INSERT INTO holiday_policies (holiday_key, name, name_ar, type, fixed_day, fixed_month, is_active, display_order)
         VALUES ($1, $2, $3, 'national', $4, $5, true, $6)
         ON CONFLICT (holiday_key) DO NOTHING`,
                [h.key, h.name, h.name_ar, h.day, h.month, h.order]
            );
        }

        for (const h of religiousHolidays) {
            await client.query(
                `INSERT INTO holiday_policies (holiday_key, name, name_ar, type, days_count, is_active, display_order)
         VALUES ($1, $2, $3, 'religious', $4, true, $5)
         ON CONFLICT (holiday_key) DO NOTHING`,
                [h.key, h.name, h.name_ar, h.days, h.order]
            );
        }
        console.log('  ✓ Politiques de jours fériés initialisées');

        // ═══════════════════════════════════════════════════════════════
        // RÉSUMÉ
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('✅ SEED TERMINÉ AVEC SUCCÈS !');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n📋 Comptes créés:');
        console.log('   Admin: crechemimaelghalia@gmail.com / password');
        console.log('   Staff: staff@mimaelghalia.tn / password');
        console.log('\n⚠️  IMPORTANT: Changez les mots de passe en production !');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
