-- Script de recréation complète de la base de données
-- ATTENTION: Ce script supprime toutes les données existantes !

-- Supprimer la base si elle existe et la recréer
DROP DATABASE IF EXISTS mima_elghalia_db;
CREATE DATABASE mima_elghalia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mima_elghalia_db;

-- Table users (utilisateurs du système)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'parent') NOT NULL DEFAULT 'parent',
  phone VARCHAR(50),
  profile_image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table children (enfants)
CREATE TABLE children (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  gender ENUM('M', 'F') NOT NULL,
  parent_id INT,
  medical_info TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  lunch_assistance BOOLEAN DEFAULT FALSE,
  enrollment_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table enrollments (demandes d'inscription)
CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_first_name VARCHAR(100) NOT NULL,
  child_last_name VARCHAR(100) NOT NULL,
  child_birth_date DATE NOT NULL,
  child_gender ENUM('M', 'F') NOT NULL,
  child_medical_info TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  lunch_assistance BOOLEAN DEFAULT FALSE,
  preferred_start_date DATE,
  parent_first_name VARCHAR(100) NOT NULL,
  parent_last_name VARCHAR(100) NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(50),
  parent_password VARCHAR(255),
  parent_profile_image VARCHAR(500),
  files JSON,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_comment TEXT,
  preferred_visit_date DATETIME,
  appointment_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table attendance (présences)
CREATE TABLE attendance (
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

-- Table uploads (fichiers uploadés)
CREATE TABLE uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  size INT,
  path VARCHAR(500) NOT NULL,
  uploaded_by INT,
  child_id INT,
  category ENUM('photo', 'document', 'profile', 'internal_document') DEFAULT 'document',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Table settings (paramètres du système)
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertion des utilisateurs de test
INSERT INTO users (first_name, last_name, email, password, role, phone) VALUES
('Admin', 'Test', 'admin@creche.test', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '+33123456789'),
('Staff', 'Test', 'staff@creche.test', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '+33123456790'),
('Parent', 'Test', 'parent@creche.test', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '+33123456791'),
('Sarah', 'Martin', 'sarah.martin@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '+33123456792'),
('Pierre', 'Dubois', 'pierre.dubois@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', '+33123456793'),
('Marie', 'Leroy', 'marie.leroy@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '+33123456794');

-- Insertion des enfants de test
INSERT INTO children (first_name, last_name, birth_date, gender, parent_id, medical_info, emergency_contact_name, emergency_contact_phone, lunch_assistance, enrollment_date) VALUES
('Emma', 'Martin', '2021-03-15', 'F', 4, 'Allergie aux arachides', 'Grand-mère Martin', '+33123456800', TRUE, '2024-01-15'),
('Lucas', 'Dubois', '2020-07-22', 'M', 5, 'Aucune allergie connue', 'Tante Dubois', '+33123456801', FALSE, '2024-01-20'),
('Léa', 'Test', '2021-11-10', 'F', 3, 'Asthme léger', 'Oncle Test', '+33123456802', TRUE, '2024-02-01'),
('Noah', 'Leroy', '2022-01-05', 'M', NULL, 'RAS', 'Papa Leroy', '+33123456803', FALSE, '2024-02-15'),
('Chloé', 'Bernard', '2021-09-18', 'F', NULL, 'Allergie au lactose', 'Maman Bernard', '+33123456804', TRUE, '2024-03-01');

-- Insertion des présences de test (pour aujourd'hui et hier)
INSERT INTO attendance (child_id, date, check_in_time, check_out_time, checked_in_by, checked_out_by, notes) VALUES
(1, CURDATE(), '08:30:00', NULL, 2, NULL, 'Arrivée normale'),
(2, CURDATE(), '09:00:00', NULL, 2, NULL, 'Légèrement en retard'),
(3, CURDATE(), '08:15:00', '16:30:00', 2, 6, 'Journée complète'),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:45:00', '17:00:00', 2, 6, 'Bonne journée'),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:30:00', '16:45:00', 2, 6, 'RAS'),
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:15:00', '17:15:00', 2, 6, 'Premier jour');

-- Insertion des demandes d'inscription de test
INSERT INTO enrollments (child_first_name, child_last_name, child_birth_date, child_gender, child_medical_info, emergency_contact_name, emergency_contact_phone, lunch_assistance, preferred_start_date, parent_first_name, parent_last_name, parent_email, parent_phone, status, admin_comment) VALUES
('Antoine', 'Moreau', '2021-12-03', 'M', 'Aucune allergie', 'Grand-père Moreau', '+33123456805', FALSE, '2024-04-01', 'Julie', 'Moreau', 'julie.moreau@email.com', '+33123456806', 'pending', NULL),
('Camille', 'Rousseau', '2022-02-14', 'F', 'Allergie aux œufs', 'Tante Rousseau', '+33123456807', TRUE, '2024-04-15', 'Thomas', 'Rousseau', 'thomas.rousseau@email.com', '+33123456808', 'pending', NULL),
('Gabriel', 'Petit', '2021-08-25', 'M', 'Asthme', 'Maman Petit', '+33123456809', FALSE, '2024-05-01', 'Amélie', 'Petit', 'amelie.petit@email.com', '+33123456810', 'approved', 'Dossier complet, inscription validée');

-- Insertion des paramètres système
INSERT INTO settings (setting_key, setting_value, description) VALUES
('nursery_name', 'Crèche Mima Elghalia', 'Nom de la crèche'),
('nursery_address', '123 Rue de la Paix, 75001 Paris', 'Adresse de la crèche'),
('nursery_phone', '+33123456789', 'Téléphone de la crèche'),
('nursery_email', 'contact@mimaelghalia.fr', 'Email de contact'),
('opening_hours', '{"monday": {"start": "07:30", "end": "18:00"}, "tuesday": {"start": "07:30", "end": "18:00"}, "wednesday": {"start": "07:30", "end": "18:00"}, "thursday": {"start": "07:30", "end": "18:00"}, "friday": {"start": "07:30", "end": "18:00"}, "saturday": {"start": "08:00", "end": "16:00"}, "sunday": {"closed": true}}', 'Horaires d\'ouverture'),
('max_capacity', '50', 'Capacité maximale d\'enfants'),
('smtp_host', '', 'Serveur SMTP'),
('smtp_port', '587', 'Port SMTP'),
('smtp_user', '', 'Utilisateur SMTP'),
('smtp_password', '', 'Mot de passe SMTP');

-- Afficher un résumé
SELECT 'Base de données recréée avec succès !' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_children FROM children;
SELECT COUNT(*) as total_enrollments FROM enrollments;
SELECT COUNT(*) as total_attendance FROM attendance;
SELECT COUNT(*) as total_settings FROM settings;

-- Note: Le mot de passe hashé correspond à "Password123!"
