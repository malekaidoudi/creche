/**
 * Migration 002 - Add Medical Columns
 * 
 * Ajout des colonnes médicales et médecin traitant à la table children.
 * Rétro-compatible et idempotent (ADD COLUMN IF NOT EXISTS).
 */

module.exports = {
  version: '002_add_medical_columns',
  name: 'Add medical and doctor columns to children table',

  up: async (client) => {
    await client.query(`
      ALTER TABLE children ADD COLUMN IF NOT EXISTS allergies TEXT;
      ALTER TABLE children ADD COLUMN IF NOT EXISTS medical_notes TEXT;
      ALTER TABLE children ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(100);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS doctor_phone VARCHAR(20);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE children ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE children ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10);
    `);

    // Synchroniser medical_notes avec medical_info si vide
    await client.query(`
      UPDATE children 
      SET medical_notes = medical_info 
      WHERE medical_info IS NOT NULL AND (medical_notes IS NULL OR medical_notes = '');
    `);
  },

  down: async (client) => {
    // Non destructif en production
  }
};
