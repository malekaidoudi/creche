-- Migration SQL pour version1-mvp
-- IMPORTANT: Faire un backup de la base avant d'exécuter !

START TRANSACTION;

-- 1) Table uploads pour gérer tous les fichiers uploadés
CREATE TABLE IF NOT EXISTS uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  size INT,
  path VARCHAR(500) NOT NULL,
  uploaded_by INT,
  child_id INT NULL,
  category ENUM('photo','document','profile','internal_document') DEFAULT 'document',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- 2) Recréer table enrollments avec tous les champs nécessaires
DROP TABLE IF EXISTS enrollments;
CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_first_name VARCHAR(100) NOT NULL,
  child_last_name VARCHAR(100) NOT NULL,
  child_birth_date DATE NOT NULL,
  child_sex ENUM('M','F','other') DEFAULT 'M',
  child_medical_info TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  lunch_assistance BOOLEAN DEFAULT FALSE,
  preferred_start_date DATE,
  parent_first_name VARCHAR(100) NOT NULL,
  parent_last_name VARCHAR(100) NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(50),
  parent_password VARCHAR(255), -- hashed
  parent_profile_image VARCHAR(500),
  files JSON DEFAULT NULL, -- liste des fichiers uploadés
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_comment TEXT,
  preferred_visit_date DATETIME NULL,
  appointment_date DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3) S'assurer que la table children a les bonnes colonnes
ALTER TABLE children 
  ADD COLUMN IF NOT EXISTS parent_id INT NULL,
  ADD COLUMN IF NOT EXISTS medical_info TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS lunch_assistance BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enrollment_date DATE;

-- 4) Ajouter foreign key si elle n'existe pas
ALTER TABLE children 
  ADD CONSTRAINT fk_children_parent 
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL;

-- 5) S'assurer que la table users a les bonnes colonnes
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 6) Table attendance pour les présences
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_id INT NOT NULL,
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  checked_in_by INT,
  checked_out_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (checked_out_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_child_date (child_id, date)
);

-- 7) Table settings pour les paramètres
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8) Insérer quelques paramètres par défaut
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
('opening_hours', '{"monday": {"start": "07:30", "end": "18:00"}, "tuesday": {"start": "07:30", "end": "18:00"}, "wednesday": {"start": "07:30", "end": "18:00"}, "thursday": {"start": "07:30", "end": "18:00"}, "friday": {"start": "07:30", "end": "18:00"}, "saturday": {"start": "08:00", "end": "16:00"}, "sunday": {"closed": true}}', 'Horaires d\'ouverture de la crèche'),
('smtp_host', '', 'Serveur SMTP pour l\'envoi d\'emails'),
('smtp_port', '587', 'Port SMTP'),
('smtp_user', '', 'Utilisateur SMTP'),
('smtp_password', '', 'Mot de passe SMTP'),
('nursery_name', 'Mima Elghalia', 'Nom de la crèche'),
('nursery_address', '', 'Adresse de la crèche'),
('nursery_phone', '', 'Téléphone de la crèche'),
('nursery_email', '', 'Email de contact de la crèche');

-- 9) Créer les comptes de test si ils n'existent pas
INSERT IGNORE INTO users (first_name, last_name, email, password, role, created_at) VALUES
('Admin', 'Test', 'admin@creche.test', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW()),
('Staff', 'Test', 'staff@creche.test', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', NOW()),
('Parent', 'Test', 'parent@creche.test', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', NOW());

COMMIT;

-- Note: Le mot de passe hashé correspond à "Password123!"
