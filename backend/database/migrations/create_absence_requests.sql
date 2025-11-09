-- =====================================================
-- TABLE ABSENCE_REQUESTS
-- =====================================================
-- Table pour gérer les demandes d'absence des enfants

CREATE TABLE IF NOT EXISTS absence_requests (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'approved', 'rejected')),
    created_by INTEGER REFERENCES users(id),
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_absence_requests_child_id ON absence_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_status ON absence_requests(status);
CREATE INDEX IF NOT EXISTS idx_absence_requests_start_date ON absence_requests(start_date);

-- Commentaires
COMMENT ON TABLE absence_requests IS 'Demandes d''absence des enfants';
COMMENT ON COLUMN absence_requests.start_date IS 'Date de début de l''absence';
COMMENT ON COLUMN absence_requests.end_date IS 'Date de fin de l''absence (optionnelle pour absence d''un seul jour)';
COMMENT ON COLUMN absence_requests.reason IS 'Raison de l''absence';
COMMENT ON COLUMN absence_requests.status IS 'Statut: pending, acknowledged, approved, rejected';
