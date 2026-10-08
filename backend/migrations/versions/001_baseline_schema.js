/**
 * Migration 001 - Baseline Schema
 * 
 * Schéma complet de base de données de départ pour la crèche.
 * Si la base de données existe déjà (Neon en production), cette migration
 * est automatiquement enregistrée comme appliquée sans exécuter le DDL (Baseline Pattern).
 */

module.exports = {
  version: '001_baseline_schema',
  name: 'Initial baseline schema for Creche system',

  up: async (client) => {
    // 1. Table users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'parent' CHECK (role IN ('admin', 'staff', 'parent', 'developer')),
        profile_image VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        last_active TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // 2. Table children
    await client.query(`
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
        photo_shared_with_staff BOOLEAN DEFAULT TRUE,
        parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
    `);

    // 3. Table enrollments
    await client.query(`
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
      );
      CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
      CREATE INDEX IF NOT EXISTS idx_enrollments_parent ON enrollments(parent_id);
    `);

    // 4. Table attendance
    await client.query(`
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
      );
      CREATE INDEX IF NOT EXISTS idx_attendance_child_date ON attendance(child_id, date);
    `);

    // 5. Table holidays
    await client.query(`
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
      );
    `);

    // 6. Table nursery_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS nursery_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        value_fr TEXT,
        value_ar TEXT,
        category VARCHAR(50) DEFAULT 'general',
        is_active BOOLEAN DEFAULT TRUE,
        annual_vacation_enabled BOOLEAN DEFAULT FALSE,
        annual_vacation_start_date DATE,
        annual_vacation_end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Table notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        is_read BOOLEAN DEFAULT FALSE,
        related_id INTEGER,
        related_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
    `);

    // 8. Table appointments
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show', 'failed')),
        notes TEXT,
        admin_notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Table absence_requests
    await client.query(`
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
      );
    `);

    // 10. Table daily_reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id SERIAL PRIMARY KEY,
        child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
        report_date DATE NOT NULL DEFAULT CURRENT_DATE,
        report_type VARCHAR(20) DEFAULT 'child' CHECK (report_type IN ('baby', 'child')),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        temperature DECIMAL(3,1),
        medication TEXT,
        meals_count INTEGER DEFAULT 0,
        meal_type VARCHAR(50) CHECK (meal_type IN ('bottle', 'compote', 'fruit', 'solid', 'other', NULL)),
        period VARCHAR(20) CHECK (period IN ('morning', 'noon', 'afternoon', 'full_day', NULL)),
        appetite VARCHAR(20) CHECK (appetite IN ('good', 'medium', 'none', NULL)),
        appetite_notes TEXT,
        diaper_changes INTEGER DEFAULT 0,
        diaper_nature VARCHAR(20) CHECK (diaper_nature IN ('pee', 'poop', 'mixed', NULL)),
        diaper_notes TEXT,
        skin_condition VARCHAR(20) DEFAULT 'good' CHECK (skin_condition IN ('good', 'other', NULL)),
        skin_notes TEXT,
        sleep_quality VARCHAR(20) CHECK (sleep_quality IN ('calm', 'discontinuous', 'deep', NULL)),
        sleep_start TIME,
        sleep_end TIME,
        sleep_notes TEXT,
        activities TEXT,
        observations TEXT,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'sent')),
        UNIQUE(child_id, report_date)
      );
      CREATE INDEX IF NOT EXISTS idx_daily_reports_child_date ON daily_reports(child_id, report_date);
      CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
      CREATE INDEX IF NOT EXISTS idx_daily_reports_created_by ON daily_reports(created_by);
    `);

    // 11. Table daily_meals
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_meals (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
        child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
        meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
        period VARCHAR(20) NOT NULL CHECK (period IN ('morning', 'noon', 'afternoon', 'snack')),
        meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('bottle', 'compote', 'fruit', 'other')),
        meal_description TEXT,
        quantity VARCHAR(20) CHECK (quantity IN ('none', 'little', 'half', 'good', 'full')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_daily_meals_report ON daily_meals(report_id);
      CREATE INDEX IF NOT EXISTS idx_daily_meals_child_date ON daily_meals(child_id, meal_date);
    `);

    // 12. Table daily_diaper_changes
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_diaper_changes (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
        child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
        change_date DATE NOT NULL DEFAULT CURRENT_DATE,
        change_time TIME DEFAULT CURRENT_TIME,
        nature VARCHAR(20) NOT NULL CHECK (nature IN ('pee', 'poop', 'mixed')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_daily_diaper_changes_report ON daily_diaper_changes(report_id);
      CREATE INDEX IF NOT EXISTS idx_daily_diaper_changes_child_date ON daily_diaper_changes(child_id, change_date);
    `);

    // 13. Table child_supplies
    await client.query(`
      CREATE TABLE IF NOT EXISTS child_supplies (
        id SERIAL PRIMARY KEY,
        child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
        supply_type VARCHAR(50) NOT NULL CHECK (supply_type IN ('diapers', 'wipes', 'cream', 'other')),
        quantity INTEGER DEFAULT 0,
        alert_threshold INTEGER DEFAULT 10,
        last_refill_date DATE,
        last_refill_quantity INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(child_id, supply_type)
      );
      CREATE INDEX IF NOT EXISTS idx_child_supplies_child ON child_supplies(child_id);
    `);

    // 14. Table daily_supplies_brought
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_supplies_brought (
        id SERIAL PRIMARY KEY,
        child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
        brought_date DATE NOT NULL DEFAULT CURRENT_DATE,
        supply_type VARCHAR(50) NOT NULL CHECK (supply_type IN ('diapers', 'food', 'wipes', 'cream', 'clothes', 'other')),
        quantity INTEGER DEFAULT 1,
        description TEXT,
        recorded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_daily_supplies_brought_child_date ON daily_supplies_brought(child_id, brought_date);
    `);

    // 15. Table staff_age_assignments
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_age_assignments (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('baby', 'child', 'both')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(staff_id)
      );
      CREATE INDEX IF NOT EXISTS idx_staff_age_assignments_staff ON staff_age_assignments(staff_id);
    `);

    // 16. Table staff_messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 17. Table activity_logs
    await client.query(`
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
      );
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
    `);

    // 18. Table events
    await client.query(`
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
      );
      CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);
    `);

    // 19. Table testimonials
    await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        parent_name VARCHAR(100) NOT NULL,
        child_name VARCHAR(100),
        content TEXT NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_notes TEXT,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
      CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);
      CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);
    `);

    // 20. Table admin_documents
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        document_type VARCHAR(50) DEFAULT 'general',
        original_filename VARCHAR(255),
        cloudinary_url TEXT,
        cloudinary_public_id VARCHAR(255),
        file_size INTEGER,
        mime_type VARCHAR(100),
        is_public BOOLEAN DEFAULT FALSE,
        is_required BOOLEAN DEFAULT FALSE,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_admin_documents_type ON admin_documents(document_type);
      CREATE INDEX IF NOT EXISTS idx_admin_documents_created_at ON admin_documents(created_at DESC);
    `);

    // 21. Table revoked_tokens
    await client.query(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token ON revoked_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);
    `);

    // Default nursery_settings
    const settings = [
      { setting_key: 'nursery_name', value_fr: 'Crèche Mima Elghalia', value_ar: 'روضة ميما الغالية', category: 'general' },
      { setting_key: 'address', value_fr: '16 Rue Bizerte, Medenine 4100, Tunisie', value_ar: '16 نهج بنزرت، مدنين 4100، تونس', category: 'contact' },
      { setting_key: 'phone', value_fr: '+216 25 95 35 32', value_ar: '+216 25 95 35 32', category: 'contact' },
      { setting_key: 'email', value_fr: 'contact@mima-elghalia.com', value_ar: 'contact@mima-elghalia.com', category: 'contact' },
      { setting_key: 'capacity', value_fr: '40 enfants', value_ar: '40 طفل', category: 'general' },
      { setting_key: 'working_hours_weekdays', value_fr: '07:00-18:00', value_ar: '07:00-18:00', category: 'hours' },
      { setting_key: 'working_hours_saturday', value_fr: '08:00-15:00', value_ar: '08:00-15:00', category: 'hours' },
      { setting_key: 'saturday_open', value_fr: 'true', value_ar: 'true', category: 'hours' },
      { setting_key: 'annual_vacation', value_fr: 'false', value_ar: 'false', category: 'vacation' }
    ];

    for (const setting of settings) {
      await client.query(
        `INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active) 
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (setting_key) DO UPDATE SET value_fr = $2, value_ar = $3, category = $4`,
        [setting.setting_key, setting.value_fr, setting.value_ar, setting.category]
      );
    }
  },

  down: async (client) => {
    // Dans le cadre d'un baseline, down n'est pas recommandé sans purge manuelle explicite
    console.warn('⚠️ Rollback de la baseline 001 non recommandé.');
  }
};
