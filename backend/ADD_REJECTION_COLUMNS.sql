-- =====================================================
-- AJOUTER LES COLONNES DE REJET MANQUANTES
-- À exécuter dans Neon SQL Editor
-- =====================================================

-- Ajouter les colonnes de rejet si elles n'existent pas
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
  AND column_name IN ('rejected_by', 'rejected_at', 'rejection_type', 'rejection_reason')
ORDER BY column_name;
