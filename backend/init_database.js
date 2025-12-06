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
