-- =====================================================
-- SYSTÈME UNIFIÉ DE GESTION D'ÉVÉNEMENTS
-- Version: 1.0.0
-- Date: 09/11/2025
-- =====================================================

-- Table principale des événements
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  
  -- Informations de base
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'memo', 'task', 'rdv', 'birthday', 'vacation_reminder', 
    'medical', 'meeting', 'custom'
  )),
  
  -- Dates
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  all_day BOOLEAN DEFAULT false,
  
  -- Récurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule JSONB,
  parent_event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  
  -- Statut et priorité
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled', 'overdue'
  )),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),
  
  -- Assignation
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
  
  -- Rappels
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_offset INTEGER, -- En minutes
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP,
  
  -- Métadonnées
  color VARCHAR(20),
  location VARCHAR(255),
  attendees JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Soft delete
  deleted_at TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_events_type ON events(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_priority ON events(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_start_date ON events(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_end_date ON events(end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_assigned_to ON events(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_child_id ON events(child_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_created_by ON events(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_deleted_at ON events(deleted_at);
CREATE INDEX idx_events_is_recurring ON events(is_recurring) WHERE deleted_at IS NULL;

-- Index composite pour requêtes fréquentes
CREATE INDEX idx_events_type_status_date ON events(type, status, start_date) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_events_assigned_status ON events(assigned_to, status) 
  WHERE deleted_at IS NULL;

-- =====================================================
-- Table des rappels
-- =====================================================

CREATE TABLE IF NOT EXISTS event_reminders (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Configuration du rappel
  offset_minutes INTEGER NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'email', 'in_app'
  )),
  
  -- Destinataire (optionnel, sinon utilise assigned_to de l'événement)
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Statut
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  scheduled_for TIMESTAMP NOT NULL,
  error_message TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour le job de rappels
CREATE INDEX idx_event_reminders_scheduled ON event_reminders(scheduled_for, sent);
CREATE INDEX idx_event_reminders_event ON event_reminders(event_id);

-- =====================================================
-- Table des commentaires
-- =====================================================

CREATE TABLE IF NOT EXISTS event_comments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  comment TEXT NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_event_comments_event ON event_comments(event_id) 
  WHERE deleted_at IS NULL;
CREATE INDEX idx_event_comments_user ON event_comments(user_id) 
  WHERE deleted_at IS NULL;

-- =====================================================
-- Table des pièces jointes
-- =====================================================

CREATE TABLE IF NOT EXISTS event_attachments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  deleted_at TIMESTAMP
);

CREATE INDEX idx_event_attachments_event ON event_attachments(event_id) 
  WHERE deleted_at IS NULL;

-- =====================================================
-- Table de l'historique des changements
-- =====================================================

CREATE TABLE IF NOT EXISTS event_history (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(50) NOT NULL, -- created, updated, status_changed, completed, deleted
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_history_event ON event_history(event_id);
CREATE INDEX idx_event_history_created ON event_history(created_at);

-- =====================================================
-- Fonction pour mettre à jour updated_at automatiquement
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour events
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour event_comments
CREATE TRIGGER update_event_comments_updated_at 
  BEFORE UPDATE ON event_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Fonction pour logger les changements
-- =====================================================

CREATE OR REPLACE FUNCTION log_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO event_history (event_id, user_id, action, field_name, old_value, new_value)
    VALUES (NEW.id, NEW.assigned_to, 'status_changed', 'status', OLD.status, NEW.status);
  END IF;
  
  -- Log completion
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = CURRENT_TIMESTAMP;
    INSERT INTO event_history (event_id, user_id, action)
    VALUES (NEW.id, NEW.assigned_to, 'completed');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour logger les changements
CREATE TRIGGER log_event_changes_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION log_event_changes();

-- =====================================================
-- Vues utiles
-- =====================================================

-- Vue des événements à venir
CREATE OR REPLACE VIEW upcoming_events AS
SELECT 
  e.*,
  u1.first_name || ' ' || u1.last_name as created_by_name,
  u2.first_name || ' ' || u2.last_name as assigned_to_name,
  c.first_name || ' ' || c.last_name as child_name
FROM events e
LEFT JOIN users u1 ON e.created_by = u1.id
LEFT JOIN users u2 ON e.assigned_to = u2.id
LEFT JOIN children c ON e.child_id = c.id
WHERE e.deleted_at IS NULL
  AND e.start_date >= CURRENT_TIMESTAMP
  AND e.status NOT IN ('completed', 'cancelled')
ORDER BY e.start_date ASC;

-- Vue des événements en retard
CREATE OR REPLACE VIEW overdue_events AS
SELECT 
  e.*,
  u1.first_name || ' ' || u1.last_name as created_by_name,
  u2.first_name || ' ' || u2.last_name as assigned_to_name,
  c.first_name || ' ' || c.last_name as child_name
FROM events e
LEFT JOIN users u1 ON e.created_by = u1.id
LEFT JOIN users u2 ON e.assigned_to = u2.id
LEFT JOIN children c ON e.child_id = c.id
WHERE e.deleted_at IS NULL
  AND e.end_date < CURRENT_TIMESTAMP
  AND e.status NOT IN ('completed', 'cancelled')
ORDER BY e.end_date ASC;

-- Vue des tâches (pour Kanban)
CREATE OR REPLACE VIEW tasks_kanban AS
SELECT 
  e.*,
  u1.first_name || ' ' || u1.last_name as created_by_name,
  u2.first_name || ' ' || u2.last_name as assigned_to_name,
  COUNT(ec.id) as comments_count
FROM events e
LEFT JOIN users u1 ON e.created_by = u1.id
LEFT JOIN users u2 ON e.assigned_to = u2.id
LEFT JOIN event_comments ec ON e.id = ec.event_id AND ec.deleted_at IS NULL
WHERE e.deleted_at IS NULL
  AND e.type = 'task'
GROUP BY e.id, u1.first_name, u1.last_name, u2.first_name, u2.last_name
ORDER BY 
  CASE e.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  e.start_date ASC;

-- =====================================================
-- Données de test (optionnel)
-- =====================================================

-- Insérer quelques événements de test
-- (À exécuter seulement en développement)

-- Commentaire: Décommenter pour insérer des données de test
/*
INSERT INTO events (title, description, type, start_date, end_date, status, priority, created_by, assigned_to)
VALUES 
  ('Réunion équipe', 'Réunion mensuelle de l''équipe pédagogique', 'meeting', 
   CURRENT_TIMESTAMP + INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '1 hour',
   'pending', 'high', 1, 1),
   
  ('Préparer activité peinture', 'Acheter matériel et préparer la salle', 'task',
   CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days',
   'pending', 'medium', 1, 2),
   
  ('Rappel: Fermeture vacances', 'Rappeler aux parents la fermeture pour les vacances', 'vacation_reminder',
   CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '7 days',
   'pending', 'urgent', 1, 1);
*/

-- =====================================================
-- Fin de la migration
-- =====================================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE 'Migration events_system terminée avec succès!';
  RAISE NOTICE 'Tables créées: events, event_reminders, event_comments, event_attachments, event_history';
  RAISE NOTICE 'Vues créées: upcoming_events, overdue_events, tasks_kanban';
END $$;
