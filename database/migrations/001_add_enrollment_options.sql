-- Migration pour ajouter les nouvelles options d'inscription
-- Date: 2024-01-15
-- Description: Ajout des options carnet médical, assistance déjeuner et acceptation règlement

USE mima_elghalia_db;

-- Ajouter les nouvelles colonnes à la table enrollments
ALTER TABLE enrollments 
ADD COLUMN medical_record BOOLEAN DEFAULT FALSE COMMENT 'Carnet médical fourni',
ADD COLUMN lunch_assistance BOOLEAN DEFAULT FALSE COMMENT 'Assistance au déjeuner',
ADD COLUMN regulation_accepted BOOLEAN DEFAULT FALSE COMMENT 'Règlement intérieur accepté',
ADD COLUMN regulation_accepted_at TIMESTAMP NULL COMMENT 'Date d\'acceptation du règlement';

-- Ajouter la colonne photo de profil à la table users
ALTER TABLE users 
ADD COLUMN profile_picture VARCHAR(500) NULL COMMENT 'URL de la photo de profil';

-- Mettre à jour les données existantes (optionnel)
UPDATE enrollments SET regulation_accepted = TRUE WHERE status = 'approved';

-- Ajouter des index pour les performances
CREATE INDEX idx_medical_record ON enrollments(medical_record);
CREATE INDEX idx_lunch_assistance ON enrollments(lunch_assistance);
CREATE INDEX idx_regulation_accepted ON enrollments(regulation_accepted);
