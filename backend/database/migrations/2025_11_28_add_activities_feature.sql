-- =====================================================
-- MIGRATION: Fonctionnalité Activités (Fil d'actualités)
-- Date: 28 Novembre 2025
-- Description: Ajoute les tables pour le fil d'activités social
-- =====================================================

-- =====================================================
-- TABLE ACTIVITIES (Publications)
-- =====================================================
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'live', 'none')) DEFAULT 'none',
    media_url VARCHAR(500),
    media_thumbnail_url VARCHAR(500),
    cloudinary_public_id VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_activities_author ON activities(author_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_visible ON activities(is_visible);
CREATE INDEX IF NOT EXISTS idx_activities_pinned ON activities(is_pinned DESC, created_at DESC);

-- =====================================================
-- TABLE ACTIVITY_REACTIONS (Réactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_reactions (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'clap', 'celebrate')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reactions_activity ON activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON activity_reactions(user_id);

-- =====================================================
-- TABLE ACTIVITY_COMMENTS (Commentaires)
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_comments (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES activity_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_comments_activity ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON activity_comments(parent_comment_id);

-- =====================================================
-- Mise à jour de la contrainte sur notifications.type
-- =====================================================
-- Note: PostgreSQL ne permet pas facilement de modifier une contrainte CHECK
-- On supprime et recrée si nécessaire

-- Vérifier si la colonne type existe avec la bonne taille
DO $$
BEGIN
    -- Augmenter la taille du VARCHAR si nécessaire
    ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(30);
EXCEPTION
    WHEN others THEN
        -- Ignorer si la table n'existe pas ou autre erreur
        NULL;
END $$;

-- =====================================================
-- Données de test (optionnel - commenter en production)
-- =====================================================
-- INSERT INTO activities (author_id, title, description, media_type)
-- VALUES 
--     (1, 'Bienvenue sur le fil d''activités ! 🎉', 'Nous sommes ravis de lancer cette nouvelle fonctionnalité pour partager les moments magiques de la crèche avec vous.', 'none');

