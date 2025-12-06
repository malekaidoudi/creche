-- ============================================================
-- SYSTÈME DE JOURNAL D'ACTIVITÉ - CRÈCHE MIMA EL GHALIA
-- Script de création des tables et index
-- ============================================================

-- 1. TYPE ENUM pour les catégories d'activités
DO $$ BEGIN
    CREATE TYPE activity_category AS ENUM (
        'auth',           -- Connexions et authentification
        'enrollment',     -- Inscriptions
        'attendance',     -- Présences
        'document',       -- Documents
        'account',        -- Gestion des comptes
        'system',         -- Système et technique
        'security',       -- Sécurité
        'contact',        -- Contacts et communications
        'child',          -- Gestion des enfants
        'payment',        -- Paiements
        'other'           -- Autres
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TYPE ENUM pour les niveaux d'importance
DO $$ BEGIN
    CREATE TYPE activity_severity AS ENUM (
        'critical',   -- 🔴 Urgent - intervention immédiate
        'warning',    -- 🟡 Important - à surveiller
        'info',       -- 🟢 Normal - activité quotidienne
        'debug'       -- ℹ️ Information - détails
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TYPE ENUM pour les statuts d'alerte
DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM (
        'active',     -- Alerte active
        'acknowledged', -- Alerte vue
        'resolved',   -- Alerte résolue
        'dismissed'   -- Alerte ignorée
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. TABLE PRINCIPALE: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    
    -- Identification
    action VARCHAR(100) NOT NULL,
    category activity_category NOT NULL DEFAULT 'other',
    severity activity_severity NOT NULL DEFAULT 'info',
    
    -- Description
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Utilisateur concerné
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Cible de l'action (enfant, inscription, document, etc.)
    target_type VARCHAR(50),
    target_id INTEGER,
    target_name VARCHAR(255),
    
    -- Métadonnées
    ip_address INET,
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),
    response_status INTEGER,
    
    -- Données additionnelles (JSON flexible)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Archivage
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- 5. TABLE: activity_logs_archive (pour les logs > 1 mois)
CREATE TABLE IF NOT EXISTS activity_logs_archive (
    id INTEGER PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    category activity_category NOT NULL,
    severity activity_severity NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    target_type VARCHAR(50),
    target_id INTEGER,
    target_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),
    response_status INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLE: alerts
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    
    -- Type et niveau
    type VARCHAR(100) NOT NULL,
    severity activity_severity NOT NULL DEFAULT 'warning',
    status alert_status NOT NULL DEFAULT 'active',
    
    -- Contenu
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Lien avec l'activité source
    activity_log_id INTEGER REFERENCES activity_logs(id) ON DELETE SET NULL,
    
    -- Utilisateur concerné / destinataire
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Notifications
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE
);

-- 7. TABLE: reports_history
CREATE TABLE IF NOT EXISTS reports_history (
    id SERIAL PRIMARY KEY,
    
    -- Type de rapport
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- Période couverte
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Contenu
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    
    -- Statistiques (JSON)
    statistics JSONB NOT NULL DEFAULT '{}',
    
    -- Fichiers générés
    pdf_url VARCHAR(500),
    excel_url VARCHAR(500),
    
    -- Génération
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'
);

-- 8. INDEX pour optimisation des requêtes

-- Index sur activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON activity_logs(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON activity_logs(severity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target ON activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_is_archived ON activity_logs(is_archived);
CREATE INDEX IF NOT EXISTS idx_activity_logs_search ON activity_logs USING gin(to_tsvector('french', title || ' ' || COALESCE(description, '')));

-- Index sur alerts
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_target_user ON alerts(target_user_id);

-- Index sur reports_history
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports_history(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_period ON reports_history(period_start, period_end);

-- Index sur archive
CREATE INDEX IF NOT EXISTS idx_archive_created_at ON activity_logs_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_category ON activity_logs_archive(category);

-- 9. FONCTION: Archivage automatique des logs > 1 mois
CREATE OR REPLACE FUNCTION archive_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Déplacer les logs de plus d'un mois vers l'archive
    WITH moved AS (
        DELETE FROM activity_logs
        WHERE created_at < NOW() - INTERVAL '1 month'
        AND is_archived = FALSE
        RETURNING *
    )
    INSERT INTO activity_logs_archive (
        id, action, category, severity, title, description,
        user_id, user_email, user_name, user_role,
        target_type, target_id, target_name,
        ip_address, user_agent, request_path, request_method, response_status,
        metadata, created_at, archived_at
    )
    SELECT 
        id, action, category, severity, title, description,
        user_id, user_email, user_name, user_role,
        target_type, target_id, target_name,
        ip_address, user_agent, request_path, request_method, response_status,
        metadata, created_at, NOW()
    FROM moved;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- 10. FONCTION: Suppression des archives > 1 an
CREATE OR REPLACE FUNCTION cleanup_old_archives()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM activity_logs_archive
    WHERE archived_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 11. FONCTION: Obtenir les statistiques du jour
CREATE OR REPLACE FUNCTION get_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'date', target_date,
        'total_activities', COUNT(*),
        'logins_success', COUNT(*) FILTER (WHERE action = 'login_success'),
        'logins_failed', COUNT(*) FILTER (WHERE action = 'login_failed'),
        'new_enrollments', COUNT(*) FILTER (WHERE action = 'enrollment_created'),
        'enrollments_approved', COUNT(*) FILTER (WHERE action = 'enrollment_approved'),
        'documents_uploaded', COUNT(*) FILTER (WHERE category = 'document'),
        'critical_events', COUNT(*) FILTER (WHERE severity = 'critical'),
        'warnings', COUNT(*) FILTER (WHERE severity = 'warning'),
        'by_category', jsonb_object_agg(category, cat_count),
        'by_severity', jsonb_object_agg(severity, sev_count)
    ) INTO result
    FROM activity_logs,
    LATERAL (
        SELECT category, COUNT(*) as cat_count 
        FROM activity_logs 
        WHERE DATE(created_at) = target_date 
        GROUP BY category
    ) cats,
    LATERAL (
        SELECT severity, COUNT(*) as sev_count 
        FROM activity_logs 
        WHERE DATE(created_at) = target_date 
        GROUP BY severity
    ) sevs
    WHERE DATE(created_at) = target_date;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- 12. VUE: Activités récentes avec informations utilisateur
CREATE OR REPLACE VIEW v_recent_activities AS
SELECT 
    al.id,
    al.action,
    al.category,
    al.severity,
    al.title,
    al.description,
    al.user_id,
    COALESCE(al.user_name, u.first_name || ' ' || u.last_name) as user_name,
    COALESCE(al.user_email, u.email) as user_email,
    COALESCE(al.user_role, u.role) as user_role,
    al.target_type,
    al.target_id,
    al.target_name,
    al.ip_address,
    al.metadata,
    al.created_at,
    -- Formatage pour l'affichage
    CASE al.severity
        WHEN 'critical' THEN '🔴'
        WHEN 'warning' THEN '🟡'
        WHEN 'info' THEN '🟢'
        WHEN 'debug' THEN 'ℹ️'
    END as severity_icon,
    CASE al.category
        WHEN 'auth' THEN '🔐'
        WHEN 'enrollment' THEN '📋'
        WHEN 'attendance' THEN '📅'
        WHEN 'document' THEN '📄'
        WHEN 'account' THEN '👤'
        WHEN 'system' THEN '⚙️'
        WHEN 'security' THEN '🔒'
        WHEN 'contact' THEN '📞'
        WHEN 'child' THEN '👶'
        WHEN 'payment' THEN '💰'
        ELSE '📝'
    END as category_icon
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.is_archived = FALSE
ORDER BY al.created_at DESC;

-- 13. VUE: Alertes actives
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT 
    a.*,
    u.first_name || ' ' || u.last_name as target_user_name,
    u.email as target_user_email,
    CASE a.severity
        WHEN 'critical' THEN '🔴'
        WHEN 'warning' THEN '🟡'
        WHEN 'info' THEN '🟢'
        ELSE 'ℹ️'
    END as severity_icon
FROM alerts a
LEFT JOIN users u ON a.target_user_id = u.id
WHERE a.status = 'active'
ORDER BY 
    CASE a.severity 
        WHEN 'critical' THEN 1 
        WHEN 'warning' THEN 2 
        ELSE 3 
    END,
    a.created_at DESC;

COMMENT ON TABLE activity_logs IS 'Journal principal des activités de la crèche';
COMMENT ON TABLE activity_logs_archive IS 'Archive des activités de plus d''un mois';
COMMENT ON TABLE alerts IS 'Alertes système pour la direction';
COMMENT ON TABLE reports_history IS 'Historique des rapports générés';
