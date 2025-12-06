-- ============================================================
-- MIGRATION: Workflow Inscription avec RDV
-- ============================================================

-- ============================================================
-- 0. MISE À JOUR CONTRAINTE STATUS APPOINTMENTS
-- ============================================================
-- Ajouter les statuts 'failed' et 'no_show' à la contrainte
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('proposed', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'failed', 'no_show'));

-- 
-- NOUVEAU WORKFLOW:
-- 1. Inscription créée → status = 'pending'
-- 2. Dossier approuvé par crèche → status = 'in_progress' + RDV créé
-- 3. RDV validé (succès) → status = 'approved'
-- 4. RDV échoué + reprogrammation → status reste 'in_progress' + nouveau RDV
-- 5. RDV échoué + abandon → status = 'rejected_deleted' + suppression compte parent
--
-- STATUTS ENROLLMENTS:
-- - pending: En attente de traitement
-- - in_progress: Dossier approuvé, en attente du RDV
-- - approved: RDV validé, inscription finalisée
-- - rejected_incomplete: Dossier rejeté (documents manquants)
-- - rejected_deleted: Dossier abandonné/supprimé
-- - archived: Archivé
--
-- STATUTS APPOINTMENTS (pour RDV d'inscription):
-- - proposed: RDV proposé par la crèche
-- - confirmed: RDV confirmé par le parent
-- - rescheduled: RDV reporté
-- - completed: RDV effectué avec succès → enrollment.status = 'approved'
-- - failed: RDV échoué (parent absent, etc.) → décision: reprogrammer ou abandonner
-- - cancelled: RDV annulé
-- - no_show: Parent absent (legacy, remplacé par 'failed')
-- ============================================================

-- 1. Ajouter colonne outcome pour les RDV d'inscription
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_outcome VARCHAR(50);

COMMENT ON COLUMN appointments.appointment_outcome IS 
'Résultat du RDV: success (inscription validée), reschedule (à reprogrammer), abandon (inscription abandonnée)';

-- 2. Ajouter compteur d'échecs sur enrollments
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS failed_appointments_count INTEGER DEFAULT 0;

COMMENT ON COLUMN enrollments.failed_appointments_count IS 
'Nombre de RDV échoués pour cette inscription';

-- 3. Ajouter colonne pour stocker l'ID du compte parent créé
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS created_parent_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN enrollments.created_parent_user_id IS 
'ID du compte utilisateur parent créé lors de l''approbation (pour suppression si abandon)';

-- 4. Ajouter date de finalisation
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP;

COMMENT ON COLUMN enrollments.finalized_at IS 
'Date de finalisation de l''inscription (après RDV réussi)';

-- 5. Ajouter colonne pour l'ID du RDV actif
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS active_appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL;

COMMENT ON COLUMN enrollments.active_appointment_id IS 
'ID du RDV actif pour cette inscription';

-- 6. Index pour performance
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_active_appointment ON enrollments(active_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_enrollment_id ON appointments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- 7. Vérifier/mettre à jour les statuts existants
-- Les dossiers actuellement 'approved' sans RDV validé devraient être 'in_progress'
-- (À exécuter manuellement si nécessaire après analyse)

-- SELECT e.id, e.status, a.status as appointment_status
-- FROM enrollments e
-- LEFT JOIN appointments a ON e.id = a.enrollment_id
-- WHERE e.status = 'approved';
