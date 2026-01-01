const db = require('./config/db_postgres');

async function initializeDatabase() {
  try {
    console.log('🔄 Initialisation de la base de données...');

    // Table users (déjà créée mais on s'assure)
    await db.query(`
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
    console.log('✅ Table users créée/vérifiée');

    // Table children
    await db.query(`
      CREATE TABLE IF NOT EXISTS children (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        birth_date DATE NOT NULL,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
        medical_info TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        photo_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table children créée/vérifiée');

    // Table enrollments
    // Note: status peut être: pending, in_progress, approved, rejected_incomplete, rejected_deleted, archived
    // Les RDV sont maintenant stockés dans la table appointments
    await db.query(`
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
    console.log('✅ Table enrollments créée/vérifiée');

    // Table attendance
    await db.query(`
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
    console.log('✅ Table attendance créée/vérifiée');

    // Table holidays (déjà créée mais on s'assure)
    await db.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        is_closed BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date)
      )
    `);
    console.log('✅ Table holidays créée/vérifiée');

    // Table nursery_settings (déjà créée mais on s'assure)
    await db.query(`
      CREATE TABLE IF NOT EXISTS nursery_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table nursery_settings créée/vérifiée');

    // Table notifications
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table notifications créée/vérifiée');

    // Table daily_reports - Rapports journaliers de suivi des enfants
    await db.query(`
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
      )
    `);
    console.log('✅ Table daily_reports créée/vérifiée');

    // Index pour daily_reports
    await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_reports_child_date ON daily_reports(child_id, report_date)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_reports_created_by ON daily_reports(created_by)`);
    console.log('✅ Index daily_reports créés/vérifiés');

    // Table daily_meals - Détail de chaque repas par période
    await db.query(`
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
      )
    `);
    console.log('✅ Table daily_meals créée/vérifiée');

    // Table daily_diaper_changes - Détail de chaque changement de couche
    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_diaper_changes (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES daily_reports(id) ON DELETE CASCADE,
        child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
        change_date DATE NOT NULL DEFAULT CURRENT_DATE,
        change_time TIME DEFAULT CURRENT_TIME,
        nature VARCHAR(20) NOT NULL CHECK (nature IN ('pee', 'poop', 'mixed')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table daily_diaper_changes créée/vérifiée');

    // Table child_supplies - Stock de fournitures par enfant (couches, etc.)
    await db.query(`
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
      )
    `);
    console.log('✅ Table child_supplies créée/vérifiée');

    // Table daily_supplies_brought - Fournitures apportées par les parents chaque jour
    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_supplies_brought (
        id SERIAL PRIMARY KEY,
        child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
        brought_date DATE NOT NULL DEFAULT CURRENT_DATE,
        supply_type VARCHAR(50) NOT NULL CHECK (supply_type IN ('diapers', 'food', 'wipes', 'cream', 'clothes', 'other')),
        quantity INTEGER DEFAULT 1,
        description TEXT,
        recorded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table daily_supplies_brought créée/vérifiée');

    // Index pour les nouvelles tables
    await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_meals_report ON daily_meals(report_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_meals_child_date ON daily_meals(child_id, meal_date)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_diaper_changes_report ON daily_diaper_changes(report_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_diaper_changes_child_date ON daily_diaper_changes(child_id, change_date)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_child_supplies_child ON child_supplies(child_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_supplies_brought_child_date ON daily_supplies_brought(child_id, brought_date)`);
    console.log('✅ Index nouvelles tables créés/vérifiés');

    // Table staff_age_assignments - Affectation des tranches d'âge aux membres du staff
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff_age_assignments (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('baby', 'child', 'both')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(staff_id)
      )
    `);
    console.log('✅ Table staff_age_assignments créée/vérifiée');
    await db.query(`CREATE INDEX IF NOT EXISTS idx_staff_age_assignments_staff ON staff_age_assignments(staff_id)`);

    // Insérer des données de test si les tables sont vides
    await insertTestData();

    console.log('🎉 Base de données initialisée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

async function insertTestData() {
  try {
    // Vérifier si des données existent déjà
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('📊 Données existantes détectées, pas d\'insertion de données de test');
      return;
    }

    console.log('📊 Insertion des données de test...');

    // Insérer des utilisateurs de test
    const users = [
      {
        email: 'crechemimaelghalia@gmail.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        first_name: 'Admin',
        last_name: 'Crèche',
        role: 'admin',
        phone: '+216 25 95 35 32'
      },
      {
        email: 'staff@creche.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        first_name: 'Staff',
        last_name: 'Member',
        role: 'staff',
        phone: '+216 20 123 456'
      },
      {
        email: 'parent@creche.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        first_name: 'Parent',
        last_name: 'Test',
        role: 'parent',
        phone: '+216 25 789 123'
      }
    ];

    for (const user of users) {
      await db.query(
        `INSERT INTO users (email, password, first_name, last_name, role, phone) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [user.email, user.password, user.first_name, user.last_name, user.role, user.phone]
      );
    }

    // Insérer des enfants de test
    const children = [
      {
        first_name: 'Ahmed',
        last_name: 'Ben Ali',
        birth_date: '2021-03-15',
        gender: 'male',
        medical_info: 'Aucune allergie connue',
        emergency_contact_name: 'Fatima Ben Ali',
        emergency_contact_phone: '+216 25 111 222'
      },
      {
        first_name: 'Lina',
        last_name: 'Trabelsi',
        birth_date: '2020-08-22',
        gender: 'female',
        medical_info: 'Allergie aux arachides',
        emergency_contact_name: 'Mohamed Trabelsi',
        emergency_contact_phone: '+216 25 333 444'
      },
      {
        first_name: 'Youssef',
        last_name: 'Karray',
        birth_date: '2022-01-10',
        gender: 'male',
        medical_info: null,
        emergency_contact_name: 'Amina Karray',
        emergency_contact_phone: '+216 25 555 666'
      }
    ];

    for (const child of children) {
      await db.query(
        `INSERT INTO children (first_name, last_name, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [child.first_name, child.last_name, child.birth_date, child.gender, child.medical_info, child.emergency_contact_name, child.emergency_contact_phone]
      );
    }

    // Insérer des inscriptions de test pour TOUS les enfants
    const parentUser = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['parent']);
    const allChildrenIds = await db.query('SELECT id FROM children');

    if (parentUser.rows.length > 0 && allChildrenIds.rows.length > 0) {
      const parentId = parentUser.rows[0].id;

      console.log(`📝 Création de ${allChildrenIds.rows.length} enrollments pour le parent ${parentId}`);

      for (const child of allChildrenIds.rows) {
        await db.query(
          `INSERT INTO enrollments (parent_id, child_id, status, lunch_assistance, regulation_accepted) 
           VALUES ($1, $2, $3, $4, $5)`,
          [parentId, child.id, 'approved', true, true]
        );
        console.log(`✅ Enrollment créé: enfant ${child.id} → parent ${parentId}`);
      }
    }

    // Insérer des présences de test
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const child of allChildrenIds.rows) {
      await db.query(
        `INSERT INTO attendance (child_id, date, check_in_time, check_out_time, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [child.id, today, '08:00', '16:30', 'present']
      );

      await db.query(
        `INSERT INTO attendance (child_id, date, check_in_time, check_out_time, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [child.id, yesterday, '08:15', '16:00', 'present']
      );
    }

    // Insérer des paramètres de crèche
    const settings = [
      { key: 'nursery_name', value: 'Crèche Mima Elghalia', description: 'Nom de la crèche' },
      { key: 'address', value: '16 Rue Bizerte, Medenine 4100, Tunisie', description: 'Adresse de la crèche' },
      { key: 'phone', value: '+216 25 95 35 32', description: 'Numéro de téléphone' },
      { key: 'email', value: 'contact@mimaelghalia.tn', description: 'Email de contact' },
      { key: 'capacity', value: '40 enfants', description: 'Capacité d\'accueil' },
      { key: 'working_hours_weekdays', value: '07:00-18:00', description: 'Horaires en semaine' },
      { key: 'working_hours_saturday', value: '08:00-15:00', description: 'Horaires le samedi' },
      { key: 'saturday_open', value: 'true', description: 'Ouvert le samedi' }
    ];

    for (const setting of settings) {
      await db.query(
        `INSERT INTO nursery_settings (key, value, description) 
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = $2, description = $3`,
        [setting.key, setting.value, setting.description]
      );
    }

    console.log('✅ Données de test insérées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error);
  }
}

module.exports = { initializeDatabase };
