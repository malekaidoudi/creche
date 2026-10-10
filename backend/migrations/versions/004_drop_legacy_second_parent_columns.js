/**
 * Migration 004 - Drop Legacy Second Parent Columns
 * 
 * Suppression définitive des colonnes obsolètes et redondantes :
 * - second_parent_name
 * - second_parent_phone
 * 
 * Tout le système utilise désormais exclusivement :
 * - father_name / father_phone
 * - mother_name / mother_phone
 * - account_holder ('father' | 'mother')
 */

module.exports = {
  version: '004_drop_legacy_second_parent_columns',
  name: 'Drop obsolete second_parent_name and second_parent_phone columns from children table',

  up: async (client) => {
    // 1. Ultime sauvegarde / synchronisation des éventuelles valeurs résiduelles
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'children' AND column_name = 'second_parent_name'
        ) THEN
          UPDATE children
          SET 
            mother_name = COALESCE(NULLIF(mother_name, ''), NULLIF(second_parent_name, '')),
            mother_phone = COALESCE(NULLIF(mother_phone, ''), NULLIF(second_parent_phone, ''))
          WHERE (mother_name IS NULL OR mother_name = '') 
            AND (account_holder = 'father' OR account_holder IS NULL)
            AND second_parent_name IS NOT NULL AND second_parent_name != '';

          UPDATE children
          SET 
            father_name = COALESCE(NULLIF(father_name, ''), NULLIF(second_parent_name, '')),
            father_phone = COALESCE(NULLIF(father_phone, ''), NULLIF(second_parent_phone, ''))
          WHERE (father_name IS NULL OR father_name = '') 
            AND account_holder = 'mother'
            AND second_parent_name IS NOT NULL AND second_parent_name != '';
        END IF;
      END $$;
    `);

    // 2. Suppression définitive des colonnes obsolètes
    await client.query(`
      ALTER TABLE children 
        DROP COLUMN IF EXISTS second_parent_name,
        DROP COLUMN IF EXISTS second_parent_phone;
    `);
  },

  down: async (client) => {
    // Restauration en cas de rollback
    await client.query(`
      ALTER TABLE children ADD COLUMN IF NOT EXISTS second_parent_name VARCHAR(100);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS second_parent_phone VARCHAR(20);

      UPDATE children
      SET 
        second_parent_name = CASE WHEN account_holder = 'father' THEN mother_name ELSE father_name END,
        second_parent_phone = CASE WHEN account_holder = 'father' THEN mother_phone ELSE father_phone END;
    `);
  }
};
