-- Migration pour supporter les images Base64 dans la table creche_settings
-- Cette migration modifie la colonne setting_value pour utiliser MEDIUMTEXT
-- afin de pouvoir stocker des images Base64 (jusqu'à 16MB)

USE creche_db;

-- Modifier la colonne setting_value pour supporter les images Base64
ALTER TABLE creche_settings 
MODIFY COLUMN setting_value MEDIUMTEXT;

-- Ajouter un index sur setting_type pour optimiser les requêtes
ALTER TABLE creche_settings 
ADD INDEX idx_setting_type (setting_type);

-- Vérifier la structure mise à jour
DESCRIBE creche_settings;
