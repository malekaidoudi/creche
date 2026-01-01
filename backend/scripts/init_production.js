/**
 * Script d'initialisation de la base de données PRODUCTION
 * Crée uniquement le compte admin et les tables nécessaires
 * 
 * Usage: NODE_ENV=production node scripts/init_production.js
 */

const path = require('path');
const envPath = path.join(__dirname, '..', '.env.production');
require('dotenv').config({ path: envPath, override: true });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Debug: afficher les variables chargées
console.log('📁 Fichier env chargé:', envPath);
console.log('🔧 Configuration DB:', {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER
});

// Configuration de la connexion
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

const ADMIN_CONFIG = {
    email: 'admin@mima-elghalia.com',
    password: 'Admin@2024!Secure', // À changer après première connexion
    first_name: 'Admin',
    last_name: 'Crèche',
    phone: '+216 00 000 000',
    role: 'admin'
};

async function initProduction() {
    console.log('🚀 Initialisation de la base de données PRODUCTION...\n');

    try {
        // Test de connexion
        console.log('📡 Test de connexion à la base de données...');
        await pool.query('SELECT NOW()');
        console.log('✅ Connexion réussie!\n');

        // Créer les tables
        console.log('📦 Création des tables...');
        await createTables();
        console.log('✅ Tables créées!\n');

        // Créer le compte admin
        console.log('👤 Création du compte administrateur...');
        await createAdminAccount();
        console.log('✅ Compte admin créé!\n');

        // Créer les paramètres par défaut
        console.log('⚙️ Configuration des paramètres par défaut...');
        await createDefaultSettings();
        console.log('✅ Paramètres configurés!\n');

        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 INITIALISATION PRODUCTION TERMINÉE AVEC SUCCÈS!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('\n📧 Compte Admin:');
        console.log(`   Email: ${ADMIN_CONFIG.email}`);
        console.log(`   Mot de passe: ${ADMIN_CONFIG.password}`);
        console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

async function createTables() {
    // Table users
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            role VARCHAR(20) DEFAULT 'parent' CHECK (role IN ('admin', 'staff', 'parent')),
            avatar_url TEXT,
            is_active BOOLEAN DEFAULT true,
            email_verified BOOLEAN DEFAULT false,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table children
    await pool.query(`
        CREATE TABLE IF NOT EXISTS children (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            birth_date DATE NOT NULL,
            gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
            photo_url TEXT,
            parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            medical_notes TEXT,
            allergies TEXT,
            emergency_contact VARCHAR(255),
            emergency_phone VARCHAR(20),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table enrollments
    await pool.query(`
        CREATE TABLE IF NOT EXISTS enrollments (
            id SERIAL PRIMARY KEY,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist')),
            start_date DATE,
            end_date DATE,
            schedule_type VARCHAR(50),
            notes TEXT,
            documents JSONB,
            reviewed_by INTEGER REFERENCES users(id),
            reviewed_at TIMESTAMP,
            appointment_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table attendance
    await pool.query(`
        CREATE TABLE IF NOT EXISTS attendance (
            id SERIAL PRIMARY KEY,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            check_in_time TIME,
            check_out_time TIME,
            checked_in_by INTEGER REFERENCES users(id),
            checked_out_by INTEGER REFERENCES users(id),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(child_id, date)
        )
    `);

    // Table daily_reports
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_reports (
            id SERIAL PRIMARY KEY,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            report_date DATE NOT NULL,
            status VARCHAR(20) DEFAULT 'draft',
            temperature DECIMAL(4,2),
            medication TEXT,
            meals_count INTEGER,
            meal_type VARCHAR(50),
            period VARCHAR(20),
            appetite VARCHAR(20),
            appetite_notes TEXT,
            diaper_changes INTEGER,
            diaper_nature VARCHAR(20),
            diaper_notes TEXT,
            skin_condition VARCHAR(50),
            skin_notes TEXT,
            sleep_quality VARCHAR(20),
            sleep_start TIME,
            sleep_end TIME,
            sleep_notes TEXT,
            activities TEXT,
            observations TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(child_id, report_date)
        )
    `);

    // Table daily_meals
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_meals (
            id SERIAL PRIMARY KEY,
            report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            meal_date DATE NOT NULL,
            period VARCHAR(20),
            meal_type VARCHAR(50),
            meal_description TEXT,
            quantity VARCHAR(20),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table daily_diaper_changes
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_diaper_changes (
            id SERIAL PRIMARY KEY,
            report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            change_date DATE NOT NULL,
            change_time TIME,
            nature VARCHAR(20),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table child_supplies
    await pool.query(`
        CREATE TABLE IF NOT EXISTS child_supplies (
            id SERIAL PRIMARY KEY,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            supply_type VARCHAR(50) NOT NULL,
            quantity INTEGER DEFAULT 0,
            alert_threshold INTEGER DEFAULT 10,
            last_refill_date DATE,
            last_refill_quantity INTEGER,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(child_id, supply_type)
        )
    `);

    // Table daily_supplies_brought
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_supplies_brought (
            id SERIAL PRIMARY KEY,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            brought_date DATE NOT NULL DEFAULT CURRENT_DATE,
            supply_type VARCHAR(50) NOT NULL,
            quantity INTEGER DEFAULT 1,
            description TEXT,
            recorded_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table staff_age_assignments
    await pool.query(`
        CREATE TABLE IF NOT EXISTS staff_age_assignments (
            id SERIAL PRIMARY KEY,
            staff_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            age_group VARCHAR(20) CHECK (age_group IN ('baby', 'child', 'both')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(staff_id)
        )
    `);

    // Table announcements
    await pool.query(`
        CREATE TABLE IF NOT EXISTS announcements (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            target_audience VARCHAR(50) DEFAULT 'all',
            is_active BOOLEAN DEFAULT true,
            start_date DATE,
            end_date DATE,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table staff_messages
    await pool.query(`
        CREATE TABLE IF NOT EXISTS staff_messages (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            subject VARCHAR(255),
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT false,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table holidays
    await pool.query(`
        CREATE TABLE IF NOT EXISTS holidays (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            type VARCHAR(50) DEFAULT 'national',
            is_closed BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(date)
        )
    `);

    // Table nursery_settings
    await pool.query(`
        CREATE TABLE IF NOT EXISTS nursery_settings (
            id SERIAL PRIMARY KEY,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table tasks
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            task_date DATE NOT NULL,
            task_time TIME,
            task_type VARCHAR(50) DEFAULT 'custom',
            priority VARCHAR(20) DEFAULT 'normal',
            status VARCHAR(20) DEFAULT 'pending',
            enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE SET NULL,
            created_by INTEGER REFERENCES users(id),
            assigned_to INTEGER REFERENCES users(id),
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Créer les index
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_child_date ON attendance(child_id, date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_daily_reports_child_date ON daily_reports(child_id, report_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status)`);
}

async function createAdminAccount() {
    // Vérifier si l'admin existe déjà
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [ADMIN_CONFIG.email]);

    if (existing.rows.length > 0) {
        console.log('   ℹ️  Le compte admin existe déjà');
        return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);

    // Créer le compte admin
    await pool.query(`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, true, true)
    `, [
        ADMIN_CONFIG.email,
        hashedPassword,
        ADMIN_CONFIG.first_name,
        ADMIN_CONFIG.last_name,
        ADMIN_CONFIG.phone,
        ADMIN_CONFIG.role
    ]);
}

async function createDefaultSettings() {
    const defaultSettings = [
        { key: 'nursery_name', value: 'Crèche Mima Elghalia', description: 'Nom de la crèche' },
        { key: 'opening_time', value: '07:00', description: 'Heure d\'ouverture' },
        { key: 'closing_time', value: '18:00', description: 'Heure de fermeture' },
        { key: 'saturday_open', value: 'false', description: 'Ouvert le samedi' },
        { key: 'max_capacity', value: '30', description: 'Capacité maximale' },
        { key: 'contact_phone', value: '+216 00 000 000', description: 'Téléphone de contact' },
        { key: 'contact_email', value: 'contact@mima-elghalia.com', description: 'Email de contact' },
        { key: 'address', value: 'Tunisie', description: 'Adresse de la crèche' }
    ];

    for (const setting of defaultSettings) {
        await pool.query(`
            INSERT INTO nursery_settings (setting_key, setting_value, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (setting_key) DO NOTHING
        `, [setting.key, setting.value, setting.description]);
    }
}

// Exécuter
initProduction();
