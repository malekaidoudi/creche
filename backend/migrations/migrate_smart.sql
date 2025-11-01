-- Migration intelligente qui vérifie l'existence avant création
BEGIN;

-- 1) Créer le type ENUM seulement s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
    CREATE TYPE enrollment_status AS ENUM (
      'pending', 'in_progress', 'approved', 
      'rejected_incomplete', 'rejected_deleted', 'archived'
    );
    RAISE NOTICE 'Type enrollment_status créé';
  ELSE
    RAISE NOTICE 'Type enrollment_status existe déjà';
  END IF;
END$$;

-- 2) Ajouter colonnes seulement si elles n'existent pas
DO $$
BEGIN
  -- Vérifier et ajouter applicant_first_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'applicant_first_name') THEN
    ALTER TABLE enrollments ADD COLUMN applicant_first_name VARCHAR(100);
    RAISE NOTICE 'Colonne applicant_first_name ajoutée';
  END IF;
  
  -- Vérifier et ajouter applicant_last_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'applicant_last_name') THEN
    ALTER TABLE enrollments ADD COLUMN applicant_last_name VARCHAR(100);
    RAISE NOTICE 'Colonne applicant_last_name ajoutée';
  END IF;
  
  -- Vérifier et ajouter applicant_email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'applicant_email') THEN
    ALTER TABLE enrollments ADD COLUMN applicant_email VARCHAR(255);
    RAISE NOTICE 'Colonne applicant_email ajoutée';
  END IF;
  
  -- Vérifier et ajouter new_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'new_status') THEN
    ALTER TABLE enrollments ADD COLUMN new_status enrollment_status DEFAULT 'pending';
    RAISE NOTICE 'Colonne new_status ajoutée';
  END IF;
  
  -- Vérifier et ajouter approved_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'approved_by') THEN
    ALTER TABLE enrollments ADD COLUMN approved_by INTEGER REFERENCES users(id);
    RAISE NOTICE 'Colonne approved_by ajoutée';
  END IF;
  
  -- Vérifier et ajouter approved_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'approved_at') THEN
    ALTER TABLE enrollments ADD COLUMN approved_at TIMESTAMP;
    RAISE NOTICE 'Colonne approved_at ajoutée';
  END IF;
END$$;

-- 3) Créer table enrollment_documents si elle n'existe pas
CREATE TABLE IF NOT EXISTS enrollment_documents (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  document_type VARCHAR(50),
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  notes TEXT
);

-- 4) Créer table children_documents si elle n'existe pas
CREATE TABLE IF NOT EXISTS children_documents (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  document_type VARCHAR(50),
  transferred_from_enrollment INTEGER,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- 5) Créer table d'archive si elle n'existe pas
CREATE TABLE IF NOT EXISTS enrollments_archive AS TABLE enrollments WITH NO DATA;

-- 6) Mettre à jour les données existantes
UPDATE enrollments 
SET new_status = CASE 
  WHEN status = 'approved' THEN 'approved'::enrollment_status
  WHEN status = 'rejected' THEN 'rejected_incomplete'::enrollment_status
  ELSE 'pending'::enrollment_status
END
WHERE new_status IS NULL;

-- 7) Créer index seulement s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_enrollments_new_status ON enrollments(new_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_applicant_email ON enrollments(applicant_email);
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_enrollment_id ON enrollment_documents(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_children_documents_child_id ON children_documents(child_id);

COMMIT;

-- Afficher le résultat
DO $$
DECLARE
  enrollments_count INTEGER;
  documents_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO enrollments_count FROM enrollments;
  SELECT COUNT(*) INTO documents_count FROM enrollment_documents;
  
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '📊 Enrollments: %', enrollments_count;
  RAISE NOTICE '📎 Documents: %', documents_count;
END$$;
