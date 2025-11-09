-- Migration: Création de la table tasks pour les tâches personnalisées
-- Date: 2025-01-09

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_date TIMESTAMP NOT NULL,
  task_time TIME,
  task_type VARCHAR(50) DEFAULT 'custom', -- 'custom' ou 'appointment'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  
  -- Référence optionnelle à un rendez-vous
  enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
  
  -- Créateur de la tâche
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Assignation (optionnel)
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Métadonnées
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Index pour améliorer les performances
  INDEX idx_task_date (task_date),
  INDEX idx_task_status (status),
  INDEX idx_task_type (task_type),
  INDEX idx_enrollment_id (enrollment_id),
  INDEX idx_created_by (created_by)
);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- Commentaires
COMMENT ON TABLE tasks IS 'Tâches personnalisées et rendez-vous pour le staff/admin';
COMMENT ON COLUMN tasks.task_type IS 'Type de tâche: custom (créée manuellement) ou appointment (rendez-vous auto)';
COMMENT ON COLUMN tasks.priority IS 'Priorité: low, normal, high, urgent';
COMMENT ON COLUMN tasks.status IS 'Statut: pending, in_progress, completed, cancelled';
