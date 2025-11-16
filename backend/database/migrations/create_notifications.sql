-- Migration: Création de la table notifications
-- Date: 15/11/2025
-- Description: Table pour stocker toutes les notifications (alertes paiement, messages, etc.)

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  -- Types: 'info', 'success', 'warning', 'error', 'payment_alert', 'message', 'reminder'
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Métadonnées optionnelles
  metadata JSONB,
  
  -- Liens optionnels
  link_url VARCHAR(500),
  link_text VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Commentaires
COMMENT ON TABLE notifications IS 'Table des notifications pour tous les utilisateurs';
COMMENT ON COLUMN notifications.type IS 'Type de notification: info, success, warning, error, payment_alert, message, reminder';
COMMENT ON COLUMN notifications.metadata IS 'Données JSON supplémentaires (montant, date échéance, etc.)';
