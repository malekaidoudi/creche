-- =====================================================
-- SCHÉMA POSTGRESQL POUR CRÈCHE MIMA ELGHALIA
-- Migration depuis MySQL vers PostgreSQL Neon
-- =====================================================

-- Supprimer les tables existantes si elles existent (ordre inverse des dépendances)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS nursery_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLE USERS
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('admin', 'staff', 'parent')) DEFAULT 'parent',
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =====================================================
-- TABLE CHILDREN
-- =====================================================
CREATE TABLE children (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    medical_info TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    photo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_children_birth_date ON children(birth_date);
CREATE INDEX idx_children_is_active ON children(is_active);
CREATE INDEX idx_children_name ON children(first_name, last_name);

-- =====================================================
-- TABLE ENROLLMENTS
-- =====================================================
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    lunch_assistance BOOLEAN DEFAULT FALSE,
    regulation_accepted BOOLEAN DEFAULT FALSE,
    appointment_date DATE,
    appointment_time TIME,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(parent_id, child_id)
);

-- Index pour les performances
CREATE INDEX idx_enrollments_parent_id ON enrollments(parent_id);
CREATE INDEX idx_enrollments_child_id ON enrollments(child_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_date ON enrollments(enrollment_date);

-- =====================================================
-- TABLE ATTENDANCE
-- =====================================================
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(child_id, date)
);

-- Index pour les performances
CREATE INDEX idx_attendance_child_id ON attendance(child_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_check_in_time ON attendance(check_in_time);
CREATE INDEX idx_attendance_check_out_time ON attendance(check_out_time);

-- =====================================================
-- TABLE HOLIDAYS
-- =====================================================
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unique pour éviter les doublons de dates
    UNIQUE(date)
);

-- Index pour les performances
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_is_closed ON holidays(is_closed);

-- =====================================================
-- TABLE NURSERY_SETTINGS
-- =====================================================
CREATE TABLE nursery_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    value_fr TEXT,
    value_ar TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_nursery_settings_key ON nursery_settings(setting_key);
CREATE INDEX idx_nursery_settings_category ON nursery_settings(category);
CREATE INDEX idx_nursery_settings_is_active ON nursery_settings(is_active);

-- =====================================================
-- TRIGGERS POUR UPDATED_AT (équivalent MySQL ON UPDATE CURRENT_TIMESTAMP)
-- =====================================================

-- Fonction générique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour chaque table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nursery_settings_updated_at BEFORE UPDATE ON nursery_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONNÉES DE TEST INITIALES
-- =====================================================

-- Utilisateur admin par défaut
INSERT INTO users (first_name, last_name, email, password, role, phone) VALUES
('Malek', 'Aidoudi', 'malekaidoudi@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '+216123456789'),
('Staff', 'Member', 'staff@creche.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '+216987654321'),
('Parent', 'Test', 'parent@creche.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '+216555666777');

-- Paramètres de la crèche
INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category) VALUES
('nursery_name', 'Crèche Mima Elghalia', 'حضانة ميما الغالية', 'general'),
('nursery_description', 'Un environnement sûr et bienveillant pour l''épanouissement de votre enfant', 'بيئة آمنة ومحبة لنمو طفلك وتطوره', 'general'),
('address', '8 Rue Bizerte, Medenine 4100, Tunisie', '8 شارع بنزرت، مدنين 4100، تونس', 'contact'),
('phone', '+216 75 123 456', '+216 75 123 456', 'contact'),
('email', 'contact@mimaelghalia.tn', 'contact@mimaelghalia.tn', 'contact'),
('opening_hours', 'Lundi - Vendredi: 7h00 - 18h00', 'الاثنين - الجمعة: 7:00 - 18:00', 'schedule'),
('capacity', '50', '50', 'general');

-- Quelques jours fériés de test
INSERT INTO holidays (name, date, is_closed, description) VALUES
('Jour de l''An', '2025-01-01', TRUE, 'Nouvel An'),
('Fête du Travail', '2025-05-01', TRUE, 'Fête internationale du travail'),
('Fête de l''Indépendance', '2025-03-20', TRUE, 'Indépendance de la Tunisie');

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les inscriptions avec détails parent/enfant
CREATE VIEW enrollment_details AS
SELECT 
    e.id,
    e.enrollment_date,
    e.status,
    e.lunch_assistance,
    e.regulation_accepted,
    e.appointment_date,
    e.appointment_time,
    e.admin_notes,
    u.first_name as parent_first_name,
    u.last_name as parent_last_name,
    u.email as parent_email,
    u.phone as parent_phone,
    c.first_name as child_first_name,
    c.last_name as child_last_name,
    c.birth_date as child_birth_date,
    c.gender as child_gender,
    e.created_at,
    e.updated_at
FROM enrollments e
JOIN users u ON e.parent_id = u.id
JOIN children c ON e.child_id = c.id;

-- Vue pour les présences avec détails enfant
CREATE VIEW attendance_details AS
SELECT 
    a.id,
    a.date,
    a.check_in_time,
    a.check_out_time,
    a.notes,
    c.first_name as child_first_name,
    c.last_name as child_last_name,
    c.birth_date as child_birth_date,
    a.created_at,
    a.updated_at
FROM attendance a
JOIN children c ON a.child_id = c.id;

-- =====================================================
-- COMMENTAIRES FINAUX
-- =====================================================

-- Ce schéma PostgreSQL est équivalent au schéma MySQL original avec les conversions suivantes :
-- - AUTO_INCREMENT → SERIAL
-- - ENUM → VARCHAR avec CHECK constraint
-- - TINYINT(1) → BOOLEAN
-- - ON UPDATE CURRENT_TIMESTAMP → Triggers PostgreSQL
-- - ENGINE=InnoDB → Non nécessaire en PostgreSQL
-- - CHARSET/COLLATE → UTF-8 par défaut en PostgreSQL

COMMENT ON DATABASE CURRENT_DATABASE() IS 'Base de données PostgreSQL pour la crèche Mima Elghalia - Migration depuis MySQL';
