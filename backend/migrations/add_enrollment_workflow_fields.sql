-- Migration: Ajouter les champs pour le workflow d'inscription complet
-- Date: 2025-11-02

-- Ajouter les colonnes pour le workflow d'approbation/rejet
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_token_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS processed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS parent_chose_rdv BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_rdv_choice_date TIMESTAMP;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_enrollments_password_token ON enrollments(password_token);
CREATE INDEX IF NOT EXISTS idx_enrollments_processed_by ON enrollments(processed_by);
CREATE INDEX IF NOT EXISTS idx_enrollments_appointment_date ON enrollments(appointment_date);

-- Commentaires
COMMENT ON COLUMN enrollments.appointment_date IS 'Date du rendez-vous à la crèche';
COMMENT ON COLUMN enrollments.password_token IS 'Token pour création du mot de passe parent';
COMMENT ON COLUMN enrollments.password_token_expires IS 'Date d''expiration du token (48h)';
COMMENT ON COLUMN enrollments.rejection_type IS 'Type de rejet: age_depasse, maladie_contagieuse, dossier_manquant, autre';
COMMENT ON COLUMN enrollments.rejection_reason IS 'Raison personnalisée du rejet';
COMMENT ON COLUMN enrollments.processed_by IS 'ID de l''admin/staff qui a traité le dossier';
COMMENT ON COLUMN enrollments.processed_at IS 'Date de traitement du dossier';
COMMENT ON COLUMN enrollments.parent_chose_rdv IS 'Le parent a choisi de prendre RDV pour apporter les documents';
COMMENT ON COLUMN enrollments.parent_rdv_choice_date IS 'Date à laquelle le parent a fait son choix de RDV';
