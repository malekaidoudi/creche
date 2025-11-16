-- Migration: Corriger la contrainte de type pour les événements
-- Date: 2025-11-16
-- Problème: Le type 'event' n'est pas accepté, causant une erreur 23514

-- Supprimer l'ancienne contrainte
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;

-- Ajouter la nouvelle contrainte avec tous les types nécessaires
ALTER TABLE events ADD CONSTRAINT events_type_check 
CHECK (type IN (
  'event',           -- Événement général
  'memo',            -- Mémo/Note
  'task',            -- Tâche
  'rdv',             -- Rendez-vous
  'meeting',         -- Réunion
  'birthday',        -- Anniversaire
  'vacation_reminder', -- Rappel vacances
  'medical',         -- Médical
  'custom'           -- Personnalisé
));

-- Commentaire
COMMENT ON CONSTRAINT events_type_check ON events IS 'Types d''événements autorisés incluant event, memo, task, rdv, meeting, birthday, vacation_reminder, medical, custom';
