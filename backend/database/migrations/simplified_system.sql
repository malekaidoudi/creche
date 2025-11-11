-- ============================================================================
-- SYSTÈME SIMPLIFIÉ - SÉPARATION DES RESPONSABILITÉS
-- ============================================================================
-- Date: 2025-11-11
-- Description: Refonte complète avec tables spécialisées
-- ============================================================================

-- ============================================================================
-- 1. TÂCHES (Admin → Staff)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

COMMENT ON TABLE tasks IS 'Tâches assignées par admin au staff';

-- ============================================================================
-- 2. ANNONCES/ÉVÉNEMENTS (Admin → Parents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP NOT NULL,
  event_type VARCHAR(50) DEFAULT 'general' CHECK (event_type IN ('general', 'reunion', 'fete', 'sortie', 'fermeture')),
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'specific')),
  target_children INTEGER[], -- IDs des enfants concernés si specific
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_event_date ON announcements(event_date);
CREATE INDEX idx_announcements_published ON announcements(is_published);

COMMENT ON TABLE announcements IS 'Actualités et événements pour les parents';

-- ============================================================================
-- 3. RENDEZ-VOUS (Admin ↔ Parent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  proposed_date TIMESTAMP NOT NULL,
  confirmed_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'rescheduled', 'completed', 'cancelled')),
  location VARCHAR(255) DEFAULT 'Crèche',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_parent ON appointments(parent_id);
CREATE INDEX idx_appointments_date ON appointments(proposed_date);
CREATE INDEX idx_appointments_status ON appointments(status);

COMMENT ON TABLE appointments IS 'Rendez-vous entre admin et parents';

-- ============================================================================
-- 4. RAPPELS DE PAIEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_reminders (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  sent_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_reminders_parent ON payment_reminders(parent_id);
CREATE INDEX idx_payment_reminders_status ON payment_reminders(status);

COMMENT ON TABLE payment_reminders IS 'Rappels de paiement aux parents';

-- ============================================================================
-- 5. MESSAGES (Staff ↔ Admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_message_id INTEGER REFERENCES staff_messages(id) ON DELETE CASCADE, -- Pour les réponses
  subject VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_messages_sender ON staff_messages(sender_id);
CREATE INDEX idx_staff_messages_recipient ON staff_messages(recipient_id);
CREATE INDEX idx_staff_messages_read ON staff_messages(is_read);
CREATE INDEX idx_staff_messages_parent ON staff_messages(parent_message_id);

COMMENT ON TABLE staff_messages IS 'Messages entre staff et admin avec possibilité de réponse';

-- ============================================================================
-- 6. MÉMOS PERSONNELS
-- ============================================================================
CREATE TABLE IF NOT EXISTS personal_memos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  memo_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personal_memos_user ON personal_memos(user_id);
CREATE INDEX idx_personal_memos_date ON personal_memos(memo_date);
CREATE INDEX idx_personal_memos_completed ON personal_memos(is_completed);

COMMENT ON TABLE personal_memos IS 'Mémos personnels pour chaque utilisateur';

-- ============================================================================
-- 7. SIMPLIFICATION DE LA TABLE EVENTS (Calendrier uniquement)
-- ============================================================================
-- On garde events mais simplifiée pour le calendrier général
-- Les types spécifiques sont maintenant dans leurs tables dédiées

-- Ajouter une colonne pour lier aux nouvelles tables
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_table VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_events_source ON events(source_table, source_id);

COMMENT ON COLUMN events.source_table IS 'Table source: tasks, announcements, appointments, etc.';
COMMENT ON COLUMN events.source_id IS 'ID dans la table source';

-- ============================================================================
-- 8. TRIGGERS POUR AUTO-UPDATE
-- ============================================================================

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer aux tables
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personal_memos_updated_at ON personal_memos;
CREATE TRIGGER update_personal_memos_updated_at
    BEFORE UPDATE ON personal_memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. VUES UTILES
-- ============================================================================

-- Vue: Tâches d'aujourd'hui (admin)
CREATE OR REPLACE VIEW admin_today_tasks AS
SELECT 
  'task' as type,
  t.id,
  t.title,
  t.description,
  t.assigned_to,
  u.first_name || ' ' || u.last_name as assigned_to_name,
  t.status,
  t.priority,
  t.due_date as date,
  t.created_at
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE DATE(t.due_date) = CURRENT_DATE
  AND t.status != 'completed'

UNION ALL

SELECT 
  'appointment' as type,
  a.id,
  a.subject as title,
  a.description,
  a.parent_id as assigned_to,
  u.first_name || ' ' || u.last_name as assigned_to_name,
  a.status,
  'medium' as priority,
  COALESCE(a.confirmed_date, a.proposed_date) as date,
  a.created_at
FROM appointments a
LEFT JOIN users u ON a.parent_id = u.id
WHERE DATE(COALESCE(a.confirmed_date, a.proposed_date)) = CURRENT_DATE
  AND a.status IN ('confirmed', 'proposed')

UNION ALL

SELECT 
  'memo' as type,
  m.id,
  LEFT(m.content, 100) as title,
  m.content as description,
  m.user_id as assigned_to,
  u.first_name || ' ' || u.last_name as assigned_to_name,
  CASE WHEN m.is_completed THEN 'completed' ELSE 'pending' END as status,
  'low' as priority,
  m.memo_date::timestamp as date,
  m.created_at
FROM personal_memos m
LEFT JOIN users u ON m.user_id = u.id
WHERE m.memo_date = CURRENT_DATE
  AND m.is_completed = false
  AND m.user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)

ORDER BY priority DESC, date ASC;

-- Vue: Tâches d'aujourd'hui (staff)
CREATE OR REPLACE VIEW staff_today_tasks AS
SELECT 
  'task' as type,
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date as date,
  t.created_at,
  t.assigned_to
FROM tasks t
WHERE DATE(t.due_date) = CURRENT_DATE
  AND t.status != 'completed'

UNION ALL

SELECT 
  'memo' as type,
  m.id,
  LEFT(m.content, 100) as title,
  m.content as description,
  CASE WHEN m.is_completed THEN 'completed' ELSE 'pending' END as status,
  'low' as priority,
  m.memo_date::timestamp as date,
  m.created_at,
  m.user_id as assigned_to
FROM personal_memos m
WHERE m.memo_date = CURRENT_DATE
  AND m.is_completed = false

ORDER BY priority DESC, date ASC;

-- Vue: Tâches en retard (admin uniquement)
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.assigned_to,
  u.first_name || ' ' || u.last_name as assigned_to_name,
  u.email as assigned_to_email,
  t.status,
  t.priority,
  t.due_date,
  t.created_at,
  CURRENT_DATE - DATE(t.due_date) as days_overdue
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.due_date < CURRENT_TIMESTAMP
  AND t.status != 'completed'
ORDER BY t.priority DESC, t.due_date ASC;

-- Vue: Anniversaires à venir (3 jours avant)
CREATE OR REPLACE VIEW upcoming_birthdays AS
SELECT 
  c.id as child_id,
  c.first_name || ' ' || c.last_name as child_name,
  c.date_of_birth,
  DATE_PART('year', AGE(CURRENT_DATE, c.date_of_birth))::INTEGER + 1 as turning_age,
  (DATE(DATE_PART('year', CURRENT_DATE) || '-' || 
        DATE_PART('month', c.date_of_birth) || '-' || 
        DATE_PART('day', c.date_of_birth))) as next_birthday,
  c.parent_id,
  u.first_name || ' ' || u.last_name as parent_name,
  u.phone as parent_phone
FROM children c
LEFT JOIN users u ON c.parent_id = u.id
WHERE (DATE(DATE_PART('year', CURRENT_DATE) || '-' || 
           DATE_PART('month', c.date_of_birth) || '-' || 
           DATE_PART('day', c.date_of_birth))) 
      BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
ORDER BY next_birthday ASC;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
