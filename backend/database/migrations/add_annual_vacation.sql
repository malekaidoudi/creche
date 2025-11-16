-- =====================================================
-- MIGRATION: Ajouter les vacances annuelles
-- Date: 2025-11-15
-- =====================================================

-- Ajouter les colonnes pour les vacances annuelles dans nursery_settings
ALTER TABLE nursery_settings 
ADD COLUMN IF NOT EXISTS annual_vacation_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS annual_vacation_start_date DATE,
ADD COLUMN IF NOT EXISTS annual_vacation_end_date DATE;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_nursery_settings_annual_vacation 
ON nursery_settings(annual_vacation_enabled);

-- Insérer les paramètres par défaut si la table est vide
INSERT INTO nursery_settings (
    setting_key, 
    value_fr, 
    value_ar, 
    category, 
    annual_vacation_enabled,
    annual_vacation_start_date,
    annual_vacation_end_date
) VALUES (
    'annual_vacation',
    'Vacances annuelles de la crèche',
    'العطلة السنوية للحضانة',
    'schedule',
    FALSE,
    NULL,
    NULL
) ON CONFLICT (setting_key) DO NOTHING;

-- Commentaires
COMMENT ON COLUMN nursery_settings.annual_vacation_enabled IS 'Activer/désactiver les vacances annuelles';
COMMENT ON COLUMN nursery_settings.annual_vacation_start_date IS 'Date de début des vacances annuelles';
COMMENT ON COLUMN nursery_settings.annual_vacation_end_date IS 'Date de fin des vacances annuelles';
