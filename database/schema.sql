-- Création de la base de données
CREATE DATABASE IF NOT EXISTS mima_elghalia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mima_elghalia_db;

-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'staff', 'parent') NOT NULL DEFAULT 'parent',
    profile_picture VARCHAR(500) NULL COMMENT 'URL de la photo de profil',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- Table des enfants
CREATE TABLE children (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    medical_info TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    photo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (first_name, last_name),
    INDEX idx_birth_date (birth_date)
);

-- Table des inscriptions
CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,
    child_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    medical_record BOOLEAN DEFAULT FALSE COMMENT 'Carnet médical fourni',
    lunch_assistance BOOLEAN DEFAULT FALSE COMMENT 'Assistance au déjeuner',
    regulation_accepted BOOLEAN DEFAULT FALSE COMMENT 'Règlement intérieur accepté',
    regulation_accepted_at TIMESTAMP NULL COMMENT 'Date d\'acceptation du règlement',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    INDEX idx_parent (parent_id),
    INDEX idx_child (child_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_enrollment (parent_id, child_id)
);

-- Table des présences
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    child_id INT NOT NULL,
    staff_id INT NOT NULL,
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_child (child_id),
    INDEX idx_staff (staff_id),
    INDEX idx_date (check_in_time),
    INDEX idx_check_in (check_in_time),
    INDEX idx_check_out (check_out_time)
);

-- Table des articles
CREATE TABLE articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title_fr VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    content_fr TEXT NOT NULL,
    content_ar TEXT,
    image_url VARCHAR(500),
    status ENUM('draft', 'published') DEFAULT 'draft',
    author_id INT NOT NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_author (author_id),
    INDEX idx_published (published_at),
    FULLTEXT idx_content_fr (title_fr, content_fr),
    FULLTEXT idx_content_ar (title_ar, content_ar)
);

-- Table des actualités
CREATE TABLE news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title_fr VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    description_fr TEXT NOT NULL,
    description_ar TEXT,
    image_url VARCHAR(500),
    event_date DATE,
    status ENUM('draft', 'published') DEFAULT 'draft',
    author_id INT NOT NULL,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_author (author_id),
    INDEX idx_event_date (event_date),
    INDEX idx_published (published_at)
);

-- Table des contacts
CREATE TABLE contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    replied_at TIMESTAMP NULL,
    replied_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_created (created_at)
);

-- Table des fichiers uploadés
CREATE TABLE uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_mimetype (mimetype),
    INDEX idx_created (created_at)
);

-- Insertion des données de test
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin@creche.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin'),
('staff@creche.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff', 'Member', 'staff'),
('parent@creche.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Parent', 'Test', 'parent');

-- Mot de passe par défaut pour tous les comptes de test: "password"

INSERT INTO children (first_name, last_name, birth_date, gender, emergency_contact_name, emergency_contact_phone) VALUES
('Ahmed', 'Benali', '2020-03-15', 'M', 'Fatima Benali', '0612345678'),
('Lina', 'Dubois', '2019-08-22', 'F', 'Marie Dubois', '0687654321'),
('Youssef', 'El Amrani', '2021-01-10', 'M', 'Aicha El Amrani', '0698765432');

INSERT INTO enrollments (parent_id, child_id, enrollment_date, status) VALUES
(3, 1, '2024-01-15', 'approved'),
(3, 2, '2024-02-01', 'approved'),
(3, 3, '2024-03-01', 'pending');

INSERT INTO articles (title_fr, title_ar, content_fr, content_ar, status, author_id, published_at) VALUES
('Bienvenue dans notre crèche', 'مرحباً بكم في حضانتنا', 'Nous sommes ravis de vous accueillir dans notre établissement...', 'نحن سعداء لاستقبالكم في مؤسستنا...', 'published', 1, NOW()),
('Activités pédagogiques', 'الأنشطة التعليمية', 'Découvrez nos activités éducatives adaptées à chaque âge...', 'اكتشفوا أنشطتنا التعليمية المناسبة لكل عمر...', 'published', 1, NOW());

INSERT INTO news (title_fr, title_ar, description_fr, description_ar, event_date, status, author_id, published_at) VALUES
('Journée portes ouvertes', 'يوم الأبواب المفتوحة', 'Venez découvrir notre crèche lors de notre journée portes ouvertes...', 'تعالوا لاكتشاف حضانتنا خلال يوم الأبواب المفتوحة...', '2024-12-15', 'published', 1, NOW()),
('Spectacle de fin d\'année', 'عرض نهاية السنة', 'Les enfants présenteront leur spectacle de fin d\'année...', 'سيقدم الأطفال عرضهم لنهاية السنة...', '2024-12-20', 'published', 1, NOW());
