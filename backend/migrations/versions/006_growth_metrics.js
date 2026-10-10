/**
 * Migration 006 - Growth Metrics
 * 
 * Ajout des mesures de croissance à la table children :
 * - weight_kg / height_cm / growth_measured_at : dernières mesures connues
 * - child_growth_records : historique des mesures pour l'analyse de croissance
 *   (courbes poids/taille, futur rôle Doctor)
 * 
 * Rétro-compatible et idempotent.
 */

module.exports = {
  version: '006_growth_metrics',
  name: 'Add growth metrics (weight/height) to children + history table',

  up: async (client) => {
    await client.query(`
      ALTER TABLE children ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS growth_measured_at TIMESTAMP WITH TIME ZONE;

      CREATE TABLE IF NOT EXISTS child_growth_records (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        weight_kg NUMERIC(5,2),
        height_cm NUMERIC(5,1),
        measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_growth_records_child ON child_growth_records(child_id, measured_at);
    `);
  },

  down: async (client) => {
    // Non destructif en production
  }
};
