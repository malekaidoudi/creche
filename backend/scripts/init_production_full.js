/**
 * Script d'initialisation COMPLÈTE de la base de données PRODUCTION
 * Crée toutes les tables nécessaires + compte admin
 * 
 * Usage: node scripts/init_production_full.js [--reset]
 */

const path = require('path');
const envPath = path.join(__dirname, '..', '.env.production');
require('dotenv').config({ path: envPath, override: true });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

console.log('📁 Fichier env chargé:', envPath);
console.log('🔧 Configuration DB:', {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER
});

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
    password: 'Admin@2024!Secure',
    first_name: 'Admin',
    last_name: 'Crèche',
    phone: '+216 00 000 000',
    role: 'admin'
};

async function initProductionFull() {
    console.log('🚀 Initialisation COMPLÈTE de la base de données PRODUCTION...\n');

    try {
        console.log('📡 Test de connexion...');
        await pool.query('SELECT NOW()');
        console.log('✅ Connexion réussie!\n');

        if (process.argv.includes('--reset')) {
            console.log('🗑️  Suppression des tables existantes...');
            await dropAllTables();
            console.log('✅ Tables supprimées!\n');
        }

        console.log('📦 Création des tables...');
        await createAllTables();
        console.log('✅ Tables créées!\n');

        console.log('👤 Création du compte admin...');
        await createAdminAccount();
        console.log('✅ Compte admin créé!\n');

        console.log('⚙️ Configuration des paramètres...');
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
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

async function dropAllTables() {
    const tables = [
        'logs', 'event_history', 'event_reminders', 'events',
        'tasks', 'holidays', 'staff_messages', 'announcements',
        'staff_age_assignments', 'daily_supplies_brought', 'child_supplies',
        'daily_diaper_changes', 'daily_meals', 'daily_reports',
        'notifications', 'absence_requests', 'appointments',
        'attendance', 'enrollments', 'children', 'activity_logs',
        'nursery_settings', 'users'
    ];

    for (const table of tables) {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
}

async function createAllTables() {
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
            profile_image VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ users');

    // Table children
    await pool.query(`
        CREATE TABLE IF NOT EXISTS children (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            birth_date DATE NOT NULL,
            gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
            medical_info TEXT,
            allergies TEXT,
            special_needs TEXT,
            emergency_contact_name VARCHAR(100),
            emergency_contact_phone VARCHAR(20),
            photo_url VARCHAR(500),
            parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ children');

    // Table enrollments
    await pool.query(`
        CREATE TABLE IF NOT EXISTS enrollments (
            id SERIAL PRIMARY KEY,
            parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            enrollment_date DATE DEFAULT CURRENT_DATE,
            status VARCHAR(50) DEFAULT 'pending',
            lunch_assistance BOOLEAN DEFAULT FALSE,
            regulation_accepted BOOLEAN DEFAULT FALSE,
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(child_id)
        )
    `);
    console.log('   ✓ enrollments');

    // Table attendance
    await pool.query(`
        CREATE TABLE IF NOT EXISTS attendance (
            id SERIAL PRIMARY KEY,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            check_in_time TIME,
            check_out_time TIME,
            notes TEXT,
            status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_departure')),
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(child_id, date)
        )
    `);
    console.log('   ✓ attendance');

    // Table holidays (avec colonnes pour les politiques de jours fériés)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS holidays (
            id SERIAL PRIMARY KEY,
            holiday_key VARCHAR(100),
            name VARCHAR(255) NOT NULL,
            name_ar VARCHAR(255),
            type VARCHAR(50) DEFAULT 'custom',
            fixed_day INTEGER,
            fixed_month INTEGER,
            days_count INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT TRUE,
            is_closed BOOLEAN DEFAULT TRUE,
            display_order INTEGER DEFAULT 0,
            date DATE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ holidays');

    // Table nursery_settings
    await pool.query(`
        CREATE TABLE IF NOT EXISTS nursery_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ nursery_settings');

    // Table notifications
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            related_id INTEGER,
            related_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ notifications');

    // Table appointments
    await pool.query(`
        CREATE TABLE IF NOT EXISTS appointments (
            id SERIAL PRIMARY KEY,
            enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
            parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            appointment_date DATE NOT NULL,
            appointment_time TIME NOT NULL,
            status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
            notes TEXT,
            admin_notes TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ appointments');

    // Table absence_requests
    await pool.query(`
        CREATE TABLE IF NOT EXISTS absence_requests (
            id SERIAL PRIMARY KEY,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            reason TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ absence_requests');

    // Table daily_reports
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_reports (
            id SERIAL PRIMARY KEY,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            report_date DATE NOT NULL DEFAULT CURRENT_DATE,
            report_type VARCHAR(20) DEFAULT 'child' CHECK (report_type IN ('baby', 'child')),
            created_by INTEGER REFERENCES users(id),
            temperature DECIMAL(3,1),
            medication TEXT,
            meals_count INTEGER DEFAULT 0,
            meal_type VARCHAR(50),
            period VARCHAR(20),
            appetite VARCHAR(20),
            appetite_notes TEXT,
            diaper_changes INTEGER DEFAULT 0,
            diaper_nature VARCHAR(20),
            diaper_notes TEXT,
            skin_condition VARCHAR(20) DEFAULT 'good',
            skin_notes TEXT,
            sleep_quality VARCHAR(20),
            sleep_start TIME,
            sleep_end TIME,
            sleep_notes TEXT,
            activities TEXT,
            observations TEXT,
            status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'sent')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(child_id, report_date)
        )
    `);
    console.log('   ✓ daily_reports');

    // Table daily_meals
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_meals (
            id SERIAL PRIMARY KEY,
            report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
            period VARCHAR(20) NOT NULL,
            meal_type VARCHAR(50) NOT NULL,
            meal_description TEXT,
            quantity VARCHAR(20),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ daily_meals');

    // Table daily_diaper_changes
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_diaper_changes (
            id SERIAL PRIMARY KEY,
            report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
            child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
            change_date DATE NOT NULL DEFAULT CURRENT_DATE,
            change_time TIME DEFAULT CURRENT_TIME,
            nature VARCHAR(20) NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ daily_diaper_changes');

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
    console.log('   ✓ child_supplies');

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
    console.log('   ✓ daily_supplies_brought');

    // Table staff_age_assignments
    await pool.query(`
        CREATE TABLE IF NOT EXISTS staff_age_assignments (
            id SERIAL PRIMARY KEY,
            staff_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('baby', 'child', 'both')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(staff_id)
        )
    `);
    console.log('   ✓ staff_age_assignments');

    // Table staff_messages
    await pool.query(`
        CREATE TABLE IF NOT EXISTS staff_messages (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            subject VARCHAR(255),
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ staff_messages');

    // Table activity_logs
    await pool.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            description TEXT,
            entity_type VARCHAR(50),
            entity_id INTEGER,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ activity_logs');

    // Table events (pour les tâches et événements)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(50) DEFAULT 'task',
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP,
            all_day BOOLEAN DEFAULT FALSE,
            is_recurring BOOLEAN DEFAULT FALSE,
            recurrence_rule JSONB,
            status VARCHAR(20) DEFAULT 'pending',
            priority VARCHAR(20) DEFAULT 'medium',
            created_by INTEGER REFERENCES users(id),
            assigned_to INTEGER REFERENCES users(id),
            child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
            enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE SET NULL,
            reminder_enabled BOOLEAN DEFAULT FALSE,
            reminder_offset INTEGER,
            color VARCHAR(20),
            attendees JSONB DEFAULT '[]',
            metadata JSONB DEFAULT '{}',
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ events');

    // Table event_reminders
    await pool.query(`
        CREATE TABLE IF NOT EXISTS event_reminders (
            id SERIAL PRIMARY KEY,
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            offset_minutes INTEGER NOT NULL,
            notification_type VARCHAR(20) DEFAULT 'email',
            scheduled_for TIMESTAMP,
            sent BOOLEAN DEFAULT FALSE,
            sent_at TIMESTAMP,
            recipient_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ event_reminders');

    // Table event_history
    await pool.query(`
        CREATE TABLE IF NOT EXISTS event_history (
            id SERIAL PRIMARY KEY,
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id),
            action VARCHAR(50) NOT NULL,
            changes JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ event_history');

    // Table logs (pour les logs simples)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('   ✓ logs');

    // Créer les index
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_child_date ON attendance(child_id, date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_daily_reports_child_date ON daily_reports(child_id, report_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)`);
    console.log('   ✓ index créés');
}

async function createAdminAccount() {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [ADMIN_CONFIG.email]);
    if (existing.rows.length > 0) {
        console.log('   ℹ️  Compte admin existe déjà');
        return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);
    await pool.query(`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
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
    const settings = [
        { key: 'nursery_name', value: 'Crèche Mima Elghalia', description: 'Nom de la crèche' },
        { key: 'opening_time', value: '07:00', description: 'Heure d\'ouverture' },
        { key: 'closing_time', value: '18:00', description: 'Heure de fermeture' },
        { key: 'saturday_open', value: 'false', description: 'Ouvert le samedi' },
        { key: 'max_capacity', value: '30', description: 'Capacité maximale' },
        { key: 'contact_phone', value: '+216 00 000 000', description: 'Téléphone' },
        { key: 'contact_email', value: 'contact@mima-elghalia.com', description: 'Email' },
        { key: 'address', value: 'Tunisie', description: 'Adresse' }
    ];

    for (const s of settings) {
        await pool.query(`
            INSERT INTO nursery_settings (key, value, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (key) DO NOTHING
        `, [s.key, s.value, s.description]);
    }
}

initProductionFull();
