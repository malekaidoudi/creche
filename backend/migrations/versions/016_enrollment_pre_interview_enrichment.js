/**
 * Migration 016 - Enrichissement du parcours d'inscription et préparation au RDV
 * 
 * 1. Ajout de trusted_contacts, doctor_name, doctor_phone, allergies, habits_notes, weight_kg, height_cm
 *    sur enrollments et enrollments_archive
 * 2. Ajout de habits_notes sur children
 */

module.exports = {
  version: '016_enrollment_pre_interview_enrichment',
  name: 'Add pre-interview enrichment columns to enrollments and children',

  up: async (client) => {
    // 1. Colonnes sur enrollments
    await client.query(`
      ALTER TABLE enrollments
        ADD COLUMN IF NOT EXISTS trusted_contacts JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS doctor_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS allergies TEXT,
        ADD COLUMN IF NOT EXISTS habits_notes TEXT,
        ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2);
    `);

    // 2. Colonnes sur enrollments_archive
    await client.query(`
      ALTER TABLE enrollments_archive
        ADD COLUMN IF NOT EXISTS trusted_contacts JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS doctor_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS allergies TEXT,
        ADD COLUMN IF NOT EXISTS habits_notes TEXT,
        ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2);
    `);

    // 3. Colonne habits_notes sur children
    await client.query(`
      ALTER TABLE children
        ADD COLUMN IF NOT EXISTS habits_notes TEXT;
    `);

    console.log('✅ Migration 016 appliquée avec succès');
  },

  down: async (client) => {
    await client.query(`
      ALTER TABLE enrollments
        DROP COLUMN IF EXISTS trusted_contacts,
        DROP COLUMN IF EXISTS doctor_name,
        DROP COLUMN IF EXISTS doctor_phone,
        DROP COLUMN IF EXISTS allergies,
        DROP COLUMN IF EXISTS habits_notes,
        DROP COLUMN IF EXISTS weight_kg,
        DROP COLUMN IF EXISTS height_cm;

      ALTER TABLE enrollments_archive
        DROP COLUMN IF EXISTS trusted_contacts,
        DROP COLUMN IF EXISTS doctor_name,
        DROP COLUMN IF EXISTS doctor_phone,
        DROP COLUMN IF EXISTS allergies,
        DROP COLUMN IF EXISTS habits_notes,
        DROP COLUMN IF EXISTS weight_kg,
        DROP COLUMN IF EXISTS height_cm;

      ALTER TABLE children
        DROP COLUMN IF EXISTS habits_notes;
    `);

    console.log('↩️ Migration 016 annulée');
  }
};
