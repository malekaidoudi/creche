-- Migration: Ajouter la colonne cloudinary_public_id à la table users
-- Date: 2025-11-08
-- Description: Permet de stocker l'ID public Cloudinary pour les photos de profil

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_cloudinary_public_id ON users(cloudinary_public_id);

-- Commentaire sur la colonne
COMMENT ON COLUMN users.cloudinary_public_id IS 'ID public Cloudinary de la photo de profil';

-- Afficher le résultat
SELECT 'Migration terminée: colonne cloudinary_public_id ajoutée à la table users' AS status;
