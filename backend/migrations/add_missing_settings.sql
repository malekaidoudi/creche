-- Migration pour ajouter les champs manquants dans creche_settings
-- Date: 2025-01-05

-- Ajouter les champs arabes manquants
INSERT IGNORE INTO creche_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('nursery_name_ar', 'ميما الغالية', 'string', 'general', 'Nom de la crèche en arabe', TRUE),
('nursery_address_ar', '123 شارع السلام، 1000 تونس، تونس', 'string', 'contact', 'Adresse complète en arabe', TRUE),
('director_name_ar', 'السيدة فاطمة بن علي', 'string', 'general', 'Nom de la directrice en arabe', TRUE),

-- Statistiques manquantes
('staff_count', '8', 'number', 'statistics', 'Nombre d\'employés', TRUE),
('opening_year', '2019', 'number', 'statistics', 'Année d\'ouverture', TRUE),

-- Adresse pour la carte
('map_address', '123 Rue de la Paix, 1000 Tunis, Tunisie', 'string', 'contact', 'Adresse pour Google Maps', TRUE),

-- Mise à jour des horaires avec le format correct
('opening_hours', '{"monday": {"open": "07:00", "close": "18:00", "closed": false}, "tuesday": {"open": "07:00", "close": "18:00", "closed": false}, "wednesday": {"open": "07:00", "close": "18:00", "closed": false}, "thursday": {"open": "07:00", "close": "18:00", "closed": false}, "friday": {"open": "07:00", "close": "18:00", "closed": false}, "saturday": {"open": "08:00", "close": "12:00", "closed": false}, "sunday": {"open": "00:00", "close": "00:00", "closed": true}}', 'json', 'schedule', 'Horaires d\'ouverture détaillés', TRUE)

ON DUPLICATE KEY UPDATE 
setting_value = VALUES(setting_value),
updated_at = CURRENT_TIMESTAMP;

-- Vérification des données
SELECT setting_key, setting_value, setting_type, category 
FROM creche_settings 
WHERE setting_key IN (
    'nursery_name_ar', 
    'nursery_address_ar', 
    'director_name_ar',
    'staff_count',
    'opening_year',
    'map_address',
    'opening_hours'
)
ORDER BY category, setting_key;
