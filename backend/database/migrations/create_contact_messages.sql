-- Migration: Création de la table contact_messages
-- Description: Table pour stocker les messages du formulaire de contact
-- Date: 2025-01-08

-- Créer la table contact_messages si elle n'existe pas
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  responded_at TIMESTAMP,
  responded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE contact_messages IS 'Messages reçus via le formulaire de contact du site';
COMMENT ON COLUMN contact_messages.name IS 'Nom de l''expéditeur';
COMMENT ON COLUMN contact_messages.email IS 'Adresse e-mail de l''expéditeur';
COMMENT ON COLUMN contact_messages.phone IS 'Numéro de téléphone (optionnel)';
COMMENT ON COLUMN contact_messages.subject IS 'Sujet du message';
COMMENT ON COLUMN contact_messages.message IS 'Contenu du message';
COMMENT ON COLUMN contact_messages.status IS 'Statut du message (new, read, responded)';
COMMENT ON COLUMN contact_messages.responded_at IS 'Date de réponse au message';
COMMENT ON COLUMN contact_messages.responded_by IS 'ID de l''utilisateur qui a répondu';
