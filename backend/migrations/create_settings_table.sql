-- Migration pour créer la table des paramètres de la crèche
-- Date: 2025-01-04

CREATE TABLE IF NOT EXISTS creche_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json', 'image') DEFAULT 'string',
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertion des paramètres par défaut
INSERT INTO creche_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
-- Informations générales
('nursery_name', 'Mima Elghalia', 'string', 'general', 'Nom de la crèche', TRUE),
('nursery_logo', '/images/logo.png', 'image', 'general', 'Logo de la crèche', TRUE),
('director_name', 'Mme Fatima Ben Ali', 'string', 'general', 'Nom de la directrice', TRUE),
('nursery_address', '123 Rue de la Paix, 1000 Tunis, Tunisie', 'string', 'contact', 'Adresse complète', TRUE),
('nursery_phone', '+216 71 123 456', 'string', 'contact', 'Numéro de téléphone principal', TRUE),
('nursery_email', 'contact@mimaelghalia.tn', 'string', 'contact', 'Email de contact', TRUE),
('nursery_website', 'https://mimaelghalia.tn', 'string', 'contact', 'Site web', TRUE),

-- Capacité et âges
('total_capacity', '30', 'number', 'capacity', 'Nombre total de places', TRUE),
('available_spots', '5', 'number', 'capacity', 'Places disponibles actuellement', TRUE),
('min_age_months', '3', 'number', 'capacity', 'Âge minimum en mois', TRUE),
('max_age_months', '48', 'number', 'capacity', 'Âge maximum en mois', TRUE),

-- Horaires
('opening_hours', '{"monday": {"open": "07:00", "close": "18:00"}, "tuesday": {"open": "07:00", "close": "18:00"}, "wednesday": {"open": "07:00", "close": "18:00"}, "thursday": {"open": "07:00", "close": "18:00"}, "friday": {"open": "07:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "16:00"}, "sunday": {"open": null, "close": null}}', 'json', 'schedule', 'Horaires d\'ouverture par jour', TRUE),
('closure_periods', '[]', 'json', 'schedule', 'Périodes de fermeture annuelles', TRUE),

-- Messages et contenu
('welcome_message_fr', 'Bienvenue à la crèche Mima Elghalia, un lieu d\'épanouissement pour vos enfants dans un environnement sécurisé et bienveillant.', 'string', 'content', 'Message d\'accueil en français', TRUE),
('welcome_message_ar', 'مرحباً بكم في حضانة ميما الغالية، مكان لنمو أطفالكم في بيئة آمنة ومحبة.', 'string', 'content', 'Message d\'accueil en arabe', TRUE),
('about_description_fr', 'Notre crèche offre un environnement éducatif stimulant avec une équipe qualifiée dédiée au bien-être de chaque enfant.', 'string', 'content', 'Description à propos en français', TRUE),
('about_description_ar', 'توفر حضانتنا بيئة تعليمية محفزة مع فريق مؤهل مكرس لرفاهية كل طفل.', 'string', 'content', 'Description à propos en arabe', TRUE),

-- Thème et apparence
('site_theme', 'light', 'string', 'appearance', 'Thème du site (light/dark/auto)', TRUE),
('primary_color', '#3B82F6', 'string', 'appearance', 'Couleur primaire', TRUE),
('secondary_color', '#8B5CF6', 'string', 'appearance', 'Couleur secondaire', TRUE),
('accent_color', '#F59E0B', 'string', 'appearance', 'Couleur d\'accent', TRUE),

-- Réseaux sociaux
('facebook_url', '', 'string', 'social', 'URL Facebook', TRUE),
('instagram_url', '', 'string', 'social', 'URL Instagram', TRUE),
('linkedin_url', '', 'string', 'social', 'URL LinkedIn', TRUE),

-- Paramètres techniques
('enrollment_enabled', 'true', 'boolean', 'system', 'Inscription en ligne activée', FALSE),
('maintenance_mode', 'false', 'boolean', 'system', 'Mode maintenance', FALSE),
('google_analytics_id', '', 'string', 'system', 'ID Google Analytics', FALSE),

-- Informations légales
('siret_number', '', 'string', 'legal', 'Numéro SIRET', FALSE),
('license_number', 'CR-2025-001', 'string', 'legal', 'Numéro d\'agrément', TRUE),
('insurance_company', 'Assurance Générale de Tunisie', 'string', 'legal', 'Compagnie d\'assurance', FALSE);

-- Index pour optimiser les requêtes
CREATE INDEX idx_settings_category ON creche_settings(category);
CREATE INDEX idx_settings_public ON creche_settings(is_public);
CREATE INDEX idx_settings_key ON creche_settings(setting_key);
