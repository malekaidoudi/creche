-- Migration: Création de la table email_logs
-- Description: Table pour stocker l'historique des e-mails envoyés
-- Date: 2025-01-08

-- Créer la table email_logs si elle n'existe pas
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  resend_id VARCHAR(100),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_id);

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_logs_updated_at ON email_logs;
CREATE TRIGGER trigger_update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE email_logs IS 'Historique des e-mails envoyés par le système';
COMMENT ON COLUMN email_logs.email_type IS 'Type d''e-mail (registration_confirmation, enrollment_accepted, etc.)';
COMMENT ON COLUMN email_logs.recipient_email IS 'Adresse e-mail du destinataire';
COMMENT ON COLUMN email_logs.sender_email IS 'Adresse e-mail de l''expéditeur';
COMMENT ON COLUMN email_logs.subject IS 'Sujet de l''e-mail';
COMMENT ON COLUMN email_logs.status IS 'Statut de l''envoi (pending, sent, failed, bounced)';
COMMENT ON COLUMN email_logs.resend_id IS 'ID de l''e-mail dans Resend';
COMMENT ON COLUMN email_logs.error_message IS 'Message d''erreur en cas d''échec';
COMMENT ON COLUMN email_logs.metadata IS 'Données supplémentaires (variables du template, etc.)';
