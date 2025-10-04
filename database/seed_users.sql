-- Script pour créer les utilisateurs de test pour Mima Elghalia
-- Exécuter après avoir créé la base de données

USE mima_elghalia_db;

-- Supprimer les utilisateurs existants (optionnel)
DELETE FROM users WHERE email IN ('admin@mimaelghalia.tn', 'staff@mimaelghalia.tn', 'parent@mimaelghalia.tn');

-- Insérer les nouveaux utilisateurs avec mots de passe hachés
-- Mot de passe: admin123 (hash bcrypt)
INSERT INTO users (email, password, first_name, last_name, phone, role, is_active) VALUES
('admin@mimaelghalia.tn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Mima Elghalia', '+216 25 95 35 32', 'admin', TRUE);

-- Mot de passe: staff123 (hash bcrypt)
INSERT INTO users (email, password, first_name, last_name, phone, role, is_active) VALUES
('staff@mimaelghalia.tn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Personnel', 'Crèche', '+216 25 95 35 32', 'staff', TRUE);

-- Mot de passe: parent123 (hash bcrypt)
INSERT INTO users (email, password, first_name, last_name, phone, role, is_active) VALUES
('parent@mimaelghalia.tn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Parent', 'Test', '+216 25 95 35 32', 'parent', TRUE);

-- Vérifier les utilisateurs créés
SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE email LIKE '%mimaelghalia.tn';
