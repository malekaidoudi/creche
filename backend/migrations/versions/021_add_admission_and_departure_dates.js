/**
 * Migration 021 - Ajout des colonnes admission_date, departure_date et departure_reason sur children
 * 
 * Assure la persistance de la date officielle d'admission et de la date de suspension/départ
 * utilisées pour la facturation et le filtrage des cotisations.
 */

module.exports = {
  version: '021_add_admission_and_departure_dates',
  name: 'Add admission_date and departure_date to children table',

  up: async (client) => {
    await client.query(`
      ALTER TABLE children ADD COLUMN IF NOT EXISTS admission_date DATE;
      ALTER TABLE children ADD COLUMN IF NOT EXISTS departure_date TIMESTAMP;
      ALTER TABLE children ADD COLUMN IF NOT EXISTS departure_reason TEXT;

      -- Initialiser admission_date avec la date de created_at si elle est NULL
      UPDATE children
      SET admission_date = created_at::date
      WHERE admission_date IS NULL;
    `);
  },

  down: async (client) => {
    // Ne pas supprimer les colonnes en production pour préserver l'intégrité des données
  }
};
