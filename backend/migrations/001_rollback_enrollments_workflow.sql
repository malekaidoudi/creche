-- =====================================================
-- ROLLBACK 001: RESTAURATION WORKFLOW ENROLLMENTS
-- =====================================================
-- Objectif: Annuler la refactorisation et restaurer l'ancien schéma
-- Date: 2025-10-31
-- Version: 1.0.0
-- ATTENTION: Ce script supprime définitivement les nouvelles données

BEGIN;

-- 1) Vérifier que la table d'archive existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments_archive') THEN
    RAISE EXCEPTION 'Table enrollments_archive introuvable. Impossible de faire le rollback.';
  END IF;
END$$;

-- 2) Sauvegarder les nouvelles données avant rollback (optionnel)
CREATE TABLE IF NOT EXISTS enrollments_new_backup AS 
SELECT * FROM enrollments WHERE new_status IS NOT NULL;

-- 3) Supprimer les nouvelles tables créées
DROP TABLE IF EXISTS children_documents CASCADE;
DROP TABLE IF EXISTS enrollment_documents CASCADE;
DROP VIEW IF EXISTS v_enrollments_full CASCADE;

-- 4) Supprimer les triggers
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
DROP TRIGGER IF EXISTS update_enrollment_documents_updated_at ON enrollment_documents;

-- 5) Restaurer la structure originale de enrollments
-- Supprimer les nouvelles colonnes
ALTER TABLE enrollments DROP COLUMN IF EXISTS applicant_first_name;
ALTER TABLE enrollments DROP COLUMN IF EXISTS applicant_last_name;
ALTER TABLE enrollments DROP COLUMN IF EXISTS applicant_email;
ALTER TABLE enrollments DROP COLUMN IF EXISTS applicant_phone;
ALTER TABLE enrollments DROP COLUMN IF EXISTS applicant_address;
ALTER TABLE enrollments DROP COLUMN IF EXISTS child_first_name;
ALTER TABLE enrollments DROP COLUMN IF EXISTS child_last_name;
ALTER TABLE enrollments DROP COLUMN IF EXISTS child_birth_date;
ALTER TABLE enrollments DROP COLUMN IF EXISTS child_gender;
ALTER TABLE enrollments DROP COLUMN IF EXISTS child_medical_info;
ALTER TABLE enrollments DROP COLUMN IF EXISTS emergency_contact_name;
ALTER TABLE enrollments DROP COLUMN IF EXISTS emergency_contact_phone;
ALTER TABLE enrollments DROP COLUMN IF EXISTS new_status;
ALTER TABLE enrollments DROP COLUMN IF EXISTS decision_notes;
ALTER TABLE enrollments DROP COLUMN IF EXISTS approved_by;
ALTER TABLE enrollments DROP COLUMN IF EXISTS approved_at;
ALTER TABLE enrollments DROP COLUMN IF EXISTS rejected_by;
ALTER TABLE enrollments DROP COLUMN IF EXISTS rejected_at;
ALTER TABLE enrollments DROP COLUMN IF EXISTS submission_source;
ALTER TABLE enrollments DROP COLUMN IF EXISTS parent_id;

-- 6) Restaurer legacy_parent_id vers parent_id
ALTER TABLE enrollments RENAME COLUMN legacy_parent_id TO parent_id;

-- 7) Restaurer les contraintes NOT NULL
ALTER TABLE enrollments ALTER COLUMN child_id SET NOT NULL;

-- 8) Vider la table enrollments et restaurer depuis l'archive
TRUNCATE TABLE enrollments RESTART IDENTITY CASCADE;
INSERT INTO enrollments SELECT * FROM enrollments_archive;

-- 9) Restaurer les contraintes foreign key
ALTER TABLE enrollments 
  ADD CONSTRAINT enrollments_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE enrollments 
  ADD CONSTRAINT enrollments_child_id_fkey 
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- 10) Restaurer la contrainte unique
ALTER TABLE enrollments 
  ADD CONSTRAINT enrollments_child_id_key 
  UNIQUE (child_id);

-- 11) Supprimer les colonnes d'archive des children
ALTER TABLE children DROP COLUMN IF EXISTS archived_at;
ALTER TABLE children DROP COLUMN IF EXISTS archived_by;
ALTER TABLE children DROP COLUMN IF EXISTS archive_reason;

-- 12) Supprimer les tables d'archive (optionnel - commenté pour sécurité)
-- DROP TABLE IF EXISTS enrollments_archive;
-- DROP TABLE IF EXISTS children_archive;

-- 13) Supprimer le type ENUM
DROP TYPE IF EXISTS enrollment_status;

-- 14) Supprimer la fonction trigger
DROP FUNCTION IF EXISTS update_updated_at_column();

COMMIT;

-- =====================================================
-- VÉRIFICATIONS POST-ROLLBACK
-- =====================================================

DO $$
DECLARE
  current_count INTEGER;
  archive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count FROM enrollments;
  SELECT COUNT(*) INTO archive_count FROM enrollments_archive;
  
  RAISE NOTICE 'Rollback terminé:';
  RAISE NOTICE '  - Enrollments restaurés: %', current_count;
  RAISE NOTICE '  - Enrollments dans archive: %', archive_count;
  
  IF current_count != archive_count THEN
    RAISE WARNING 'Attention: Le nombre d''enrollments restaurés (%) ne correspond pas à l''archive (%)', current_count, archive_count;
  ELSE
    RAISE NOTICE 'Rollback réussi: toutes les données ont été restaurées correctement';
  END IF;
END$$;
