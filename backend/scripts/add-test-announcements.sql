-- Script pour ajouter des annonces de test avec tous les types
-- À exécuter dans PostgreSQL

-- Annonce type: general
INSERT INTO announcements (title, description, event_date, event_type, target_audience, created_by, is_published)
VALUES 
('Information importante', 'Nous vous informons que la crèche sera fermée le 25 décembre pour les fêtes de fin d''année.', '2025-12-25', 'general', 'all', 1, true);

-- Annonce type: urgent
INSERT INTO announcements (title, description, event_date, event_type, target_audience, created_by, is_published)
VALUES 
('URGENT: Fermeture exceptionnelle', 'En raison de travaux urgents, la crèche sera fermée demain 12 novembre. Merci de votre compréhension.', '2025-11-12', 'urgent', 'all', 1, true);

-- Annonce type: meeting (Réunion)
INSERT INTO announcements (title, description, event_date, event_type, target_audience, created_by, is_published)
VALUES 
('Réunion parents', 'Réunion de rentrée pour tous les parents le 15 novembre à 18h. Présence obligatoire.', '2025-11-15', 'meeting', 'all', 1, true);

INSERT INTO announcements (title, description, event_date, event_type, target_audience, created_by, is_published)
VALUES 
('Réunion trimestrielle', 'Réunion trimestrielle pour faire le point sur l''évolution des enfants. Le 20 décembre à 17h30.', '2025-12-20', 'meeting', 'all', 1, true);

-- Annonce type: event (Événement)
INSERT INTO announcements (title, description, event_date, event_type, target_audience, created_by, is_published)
VALUES 
('Fête de Noël', 'Grande fête de Noël à la crèche ! Spectacle, goûter et distribution de cadeaux. Le 22 décembre à 15h.', '2025-12-22', 'event', 'all', 1, true);

INSERT INTO announcements (title, description, event_date, event_type, target_audience, created_by, is_published)
VALUES 
('Sortie au parc', 'Sortie pédagogique au parc municipal pour les enfants de 3-4 ans. Prévoir casquette et eau. Le 18 novembre.', '2025-11-18', 'event', 'all', 1, true);

-- Annonce type: celebration (Célébration)
INSERT INTO announcements (title, description, event_date, event_type, target_audience, created_by, is_published)
VALUES 
('Anniversaire collectif', 'Célébration des anniversaires du mois de novembre. Gâteau et jeux au programme ! Le 30 novembre.', '2025-11-30', 'celebration', 'all', 1, true);

-- Vérifier les annonces créées
SELECT id, title, event_type, event_date, is_published FROM announcements ORDER BY event_date;
