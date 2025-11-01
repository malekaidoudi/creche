-- =====================================================
-- MIGRATION 001: REFACTORISATION WORKFLOW ENROLLMENTS
-- =====================================================
-- Objectif: Supporter workflow en 4 phases sans parent_id obligatoire
-- Date: 2025-10-31
-- Version: 1.0.0

BEGIN;

-- 1) Créer le nouveau type ENUM pour les statuts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
    CREATE TYPE enrollment_status AS ENUM (
      'pending',           -- Dossier soumis, en attente
      'in_progress',       -- En cours de traitement
      'approved',          -- Approuvé, enfant et parent créés
      'rejected_incomplete', -- Rejeté pour informations manquantes
      'rejected_deleted',  -- Rejeté définitivement
      'archived'           -- Archivé (ancien dossier)
    );
  END IF;
END$$;

-- 2) Créer table d'archive pour backup
CREATE TABLE IF NOT EXISTS enrollments_archive AS TABLE enrollments WITH NO DATA;

-- 3) Sauvegarder les données existantes
INSERT INTO enrollments_archive SELECT * FROM enrollments;

-- 4) Modifier la table enrollments existante
-- Étape 4a: Supprimer les contraintes existantes
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_parent_id_fkey;
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_child_id_fkey;
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_child_id_key;

-- Étape 4b: Renommer parent_id pour garder trace
ALTER TABLE enrollments RENAME COLUMN parent_id TO legacy_parent_id;

-- Étape 4c: Ajouter les nouveaux champs applicant
ALTER TABLE enrollments 
  ADD COLUMN IF NOT EXISTS applicant_first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS applicant_last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS applicant_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS applicant_address TEXT,
  ADD COLUMN IF NOT EXISTS child_first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS child_last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS child_birth_date DATE,
  ADD COLUMN IF NOT EXISTS child_gender VARCHAR(10),
  ADD COLUMN IF NOT EXISTS child_medical_info TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- Étape 4d: Ajouter les champs de workflow
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS new_status enrollment_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS decision_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS submission_source VARCHAR(50) DEFAULT 'web_form';

-- Étape 4e: Ajouter le nouveau parent_id (nullable)
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES users(id);

-- Étape 4f: Modifier child_id pour être nullable (dossier sans enfant créé)
ALTER TABLE enrollments ALTER COLUMN child_id DROP NOT NULL;

-- 5) Créer la table enrollment_documents
CREATE TABLE IF NOT EXISTS enrollment_documents (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  document_type VARCHAR(50), -- 'birth_certificate', 'medical_record', 'photo', 'other'
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  notes TEXT
);

-- 6) Créer la table children_documents (pour après approbation)
CREATE TABLE IF NOT EXISTS children_documents (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  document_type VARCHAR(50),
  transferred_from_enrollment INTEGER, -- référence vers enrollment_documents.id
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- 7) Créer la table children_archive (pour soft delete)
CREATE TABLE IF NOT EXISTS children_archive AS TABLE children WITH NO DATA;

-- 8) Ajouter des champs d'audit aux tables existantes
ALTER TABLE children 
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- 9) Créer des index pour performance
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(new_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_applicant_email ON enrollments(applicant_email);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_enrollment_id ON enrollment_documents(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_children_documents_child_id ON children_documents(child_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_parent_id ON enrollments(parent_id);

-- 10) Migrer les données existantes
-- Copier les informations des utilisateurs existants vers applicant_*
UPDATE enrollments e
SET
  applicant_first_name = u.first_name,
  applicant_last_name = u.last_name,
  applicant_email = u.email,
  applicant_phone = u.phone,
  parent_id = u.id,
  new_status = CASE 
    WHEN e.status = 'approved' THEN 'approved'::enrollment_status
    WHEN e.status = 'rejected' THEN 'rejected_incomplete'::enrollment_status
    ELSE 'pending'::enrollment_status
  END
FROM users u
WHERE e.legacy_parent_id = u.id;

-- Copier les informations des enfants existants vers child_*
UPDATE enrollments e
SET
  child_first_name = c.first_name,
  child_last_name = c.last_name,
  child_birth_date = c.birth_date,
  child_gender = c.gender,
  child_medical_info = c.medical_info,
  emergency_contact_name = c.emergency_contact_name,
  emergency_contact_phone = c.emergency_contact_phone
FROM children c
WHERE e.child_id = c.id;

-- 11) Créer des triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollments_updated_at 
  BEFORE UPDATE ON enrollments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollment_documents_updated_at 
  BEFORE UPDATE ON enrollment_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12) Ajouter des contraintes de validation
ALTER TABLE enrollments 
  ADD CONSTRAINT check_applicant_email_format 
  CHECK (applicant_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE enrollments 
  ADD CONSTRAINT check_child_gender 
  CHECK (child_gender IN ('M', 'F', 'Autre'));

-- 13) Créer une vue pour faciliter les requêtes
CREATE OR REPLACE VIEW v_enrollments_full AS
SELECT 
  e.*,
  u.first_name as parent_first_name,
  u.last_name as parent_last_name,
  u.email as parent_email,
  c.first_name as existing_child_first_name,
  c.last_name as existing_child_last_name,
  c.is_active as child_is_active,
  approved_user.first_name as approved_by_name,
  rejected_user.first_name as rejected_by_name
FROM enrollments e
LEFT JOIN users u ON e.parent_id = u.id
LEFT JOIN children c ON e.child_id = c.id
LEFT JOIN users approved_user ON e.approved_by = approved_user.id
LEFT JOIN users rejected_user ON e.rejected_by = rejected_user.id;

COMMIT;

-- =====================================================
-- VÉRIFICATIONS POST-MIGRATION
-- =====================================================

-- Vérifier que toutes les données ont été migrées
DO $$
DECLARE
  original_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO original_count FROM enrollments_archive;
  SELECT COUNT(*) INTO migrated_count FROM enrollments WHERE applicant_email IS NOT NULL;
  
  RAISE NOTICE 'Migration terminée:';
  RAISE NOTICE '  - Enrollments originaux: %', original_count;
  RAISE NOTICE '  - Enrollments migrés: %', migrated_count;
  
  IF migrated_count < original_count THEN
    RAISE WARNING 'Attention: % enrollments n''ont pas été migrés correctement', (original_count - migrated_count);
  END IF;
END$$;
