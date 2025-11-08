-- =====================================================
-- AJOUTER LES COLONNES CLOUDINARY
-- À exécuter dans Neon SQL Editor
-- =====================================================

-- Ajouter les colonnes pour Cloudinary
ALTER TABLE enrollment_documents
  ADD COLUMN IF NOT EXISTS cloudinary_url TEXT,
  ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'enrollment_documents' 
  AND column_name IN ('cloudinary_url', 'cloudinary_public_id')
ORDER BY column_name;
