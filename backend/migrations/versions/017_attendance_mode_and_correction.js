/**
 * Migration 017 - Mode de pointage configurable (horaire / journalier) et traçabilité des corrections
 * 
 * 1. Initialisation du paramètre attendance_mode dans nursery_settings
 * 2. Ajout de status, updated_by et is_exceptional_saturday sur la table attendance
 */

module.exports = {
  version: '017_attendance_mode_and_correction',
  name: 'Add attendance mode setting and correction tracking columns to attendance',

  up: async (client) => {
    // 1. Initialiser le paramètre attendance_mode dans nursery_settings ('hourly' par défaut)
    await client.query(`
      INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
      VALUES ('attendance_mode', 'hourly', 'hourly', 'schedule', true)
      ON CONFLICT (setting_key) DO NOTHING;
    `);

    // 2. Colonnes sur la table attendance
    await client.query(`
      ALTER TABLE attendance
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'present',
        ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS is_exceptional_saturday BOOLEAN DEFAULT FALSE;
    `);

    // Contrainte CHECK sur le statut si elle n'existe pas
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'attendance_status_check'
        ) THEN
          ALTER TABLE attendance ADD CONSTRAINT attendance_status_check 
          CHECK (status IN ('present', 'absent', 'late', 'excused'));
        END IF;
      END $$;
    `);

    console.log('✅ Migration 017 appliquée avec succès');
  },

  down: async (client) => {
    await client.query(`
      DELETE FROM nursery_settings WHERE setting_key = 'attendance_mode';

      ALTER TABLE attendance
        DROP CONSTRAINT IF EXISTS attendance_status_check,
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS updated_by,
        DROP COLUMN IF EXISTS is_exceptional_saturday;
    `);

    console.log('↩️ Migration 017 annulée');
  }
};

