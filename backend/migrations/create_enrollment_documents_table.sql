-- Migration simple: Créer la table enrollment_documents
-- Date: 2025-11-02
-- À exécuter sur Neon Database

-- Créer la table enrollment_documents
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_enrollment_id 
ON enrollment_documents(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_documents_uploaded_at 
ON enrollment_documents(uploaded_at DESC);

-- Commentaires
COMMENT ON TABLE enrollment_documents IS 'Documents uploadés lors de l''inscription (avant approbation)';
COMMENT ON COLUMN enrollment_documents.enrollment_id IS 'ID du dossier d''inscription';
COMMENT ON COLUMN enrollment_documents.document_type IS 'Type: carnet_medical, acte_naissance, certificat_medical';
COMMENT ON COLUMN enrollment_documents.file_path IS 'Chemin du fichier sur le serveur';
COMMENT ON COLUMN enrollment_documents.is_verified IS 'Document vérifié par un admin';

-- Vérifier que la table a été créée
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'enrollment_documents'
ORDER BY ordinal_position;
