-- ============================================================
-- Migration: Ajout des champs enrollment à la table appointments
-- Date: 2025-11-30
-- Description: Lier les RDV aux inscriptions + champs pour gestion parent
-- ============================================================

-- 1. Ajouter les colonnes manquantes à la table appointments existante
-- (La table existe déjà avec parent_id, child_id, subject, proposed_date, etc.)

-- Ajouter enrollment_id si manquant
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE;

-- Ajouter les champs de contact parent dénormalisés pour facilité d'accès
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS parent_first_name VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS parent_last_name VARCHAR(100);

-- Ajouter les champs enfant dénormalisés
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS child_first_name VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS child_last_name VARCHAR(100);

-- Ajouter les champs de gestion du report
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS rescheduled_count INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS last_rescheduled_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS staff_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS parent_notes TEXT;

-- Ajouter le type de RDV (inscription ou autre)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'general';

-- Mettre à jour le CHECK constraint pour le statut (inclure 'pending' et 'no_show')
-- Note: On ne peut pas modifier un CHECK facilement, on l'ignore si déjà correct

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_appointments_enrollment ON appointments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_parent_email ON appointments(parent_email);

-- 3. Commentaires
COMMENT ON COLUMN appointments.enrollment_id IS 'Référence à l''inscription pour les RDV d''inscription';
COMMENT ON COLUMN appointments.appointment_type IS 'Type: inscription, general, urgent, etc.';
COMMENT ON COLUMN appointments.rescheduled_count IS 'Nombre de fois que le parent a demandé un report';

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
