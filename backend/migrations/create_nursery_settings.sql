-- Migration pour créer la table des paramètres de la crèche
CREATE TABLE IF NOT EXISTS nursery_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  value_fr TEXT,
  value_ar TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insérer les données de base de la crèche
INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category) VALUES
-- Informations générales
('nursery_name', 'Crèche Mima Elghalia', 'حضانة ميما الغالية', 'general'),
('nursery_description', 'Un environnement sûr et bienveillant pour l\'épanouissement de votre enfant', 'بيئة آمنة ومحبة لنمو طفلك وتطوره', 'general'),

-- Coordonnées
('address', '8 Rue Bizerte, Medenine 4100, Tunisie', '8 شارع بنزرت، مدنين 4100، تونس', 'contact'),
('phone', '+216 25 95 35 32', '+216 25 95 35 32', 'contact'),
('email', 'contact@mimaelghalia.tn', 'contact@mimaelghalia.tn', 'contact'),
('whatsapp', '+216 25 95 35 32', '+216 25 95 35 32', 'contact'),

-- Horaires de travail (format JSON pour flexibilité)
('working_hours_weekdays', '{"start": "07:00", "end": "18:00"}', '{"start": "07:00", "end": "18:00"}', 'schedule'),
('working_hours_saturday', '{"start": "08:00", "end": "14:00"}', '{"start": "08:00", "end": "14:00"}', 'schedule'),
('working_days', 'Lundi - Samedi', 'الاثنين - السبت', 'schedule'),
('closed_days', 'Dimanche et jours fériés', 'الأحد والعطل الرسمية', 'schedule'),

-- Réseaux sociaux
('facebook_url', 'https://facebook.com/mimaelghalia', 'https://facebook.com/mimaelghalia', 'social'),
('instagram_url', 'https://instagram.com/mimaelghalia', 'https://instagram.com/mimaelghalia', 'social'),

-- Informations supplémentaires
('capacity', '50 enfants', '50 طفل', 'general'),
('age_range', '3 mois - 5 ans', '3 أشهر - 5 سنوات', 'general'),
('license_number', 'CR-MDN-2024-001', 'CR-MDN-2024-001', 'legal'),

-- Textes pour la page contact
('contact_page_title', 'Contactez-nous', 'اتصل بنا', 'contact'),
('contact_page_subtitle', 'Nous sommes là pour répondre à toutes vos questions', 'نحن هنا للإجابة على جميع أسئلتكم', 'contact'),
('contact_form_message', 'Envoyez-nous un message et nous vous répondrons dans les plus brefs délais', 'أرسل لنا رسالة وسنرد عليك في أقرب وقت ممكن', 'contact');
