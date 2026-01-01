-- =====================================================
-- MIGRATION: Ajouter les colonnes médicales à la table children
-- Date: 2025-12-14
-- Description: Ajoute allergies, medical_notes, doctor_name, doctor_phone
-- =====================================================

-- Ajouter les nouvelles colonnes si elles n'existent pas
ALTER TABLE children ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(100);
ALTER TABLE children ADD COLUMN IF NOT EXISTS doctor_phone VARCHAR(20);
ALTER TABLE children ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]';
ALTER TABLE children ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]';
ALTER TABLE children ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);

-- Migrer les données existantes de medical_info vers medical_notes si nécessaire
UPDATE children 
SET medical_notes = medical_info 
WHERE medical_info IS NOT NULL AND medical_notes IS NULL;

-- Vérifier les colonnes ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'children' 
AND column_name IN ('allergies', 'medical_notes', 'doctor_name', 'doctor_phone', 'medications', 'conditions', 'blood_type');
