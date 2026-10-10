/**
 * Migration 003 - Standardize Parents and Emergency Contacts
 * 
 * Standardisation des colonnes de filiation et coordonnées dans la table children :
 * - father_name (VARCHAR 100) : Nom complet du père
 * - father_phone (VARCHAR 20) : Numéro de téléphone du père
 * - mother_name (VARCHAR 100) : Nom complet de la mère
 * - mother_phone (VARCHAR 20) : Numéro de téléphone de la mère
 * - account_holder (VARCHAR 20) : Titulaire du compte utilisateur lié ('father' | 'mother')
 * - emergency_contact_choice (VARCHAR 20) : Choix contact urgence ('custom', 'father', 'mother')
 * - trusted_contacts (JSONB) : Personnes de confiance autorisées (max 2)
 * 
 * Rétro-compatibilité :
 * - Maintient second_parent_name et second_parent_phone synchronisés.
 * - Pré-remplissage intelligent des données existantes depuis users et children.
 */

module.exports = {
  version: '003_standardize_parents_and_contacts',
  name: 'Standardize parents identity, phone numbers and account holder in children table',

  up: async (client) => {
    // 1. Ajout idempotent des colonnes
    await client.query(`
      ALTER TABLE children ADD COLUMN IF NOT EXISTS father_name VARCHAR(100);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS father_phone VARCHAR(20);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS mother_name VARCHAR(100);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(20);
      ALTER TABLE children ADD COLUMN IF NOT EXISTS account_holder VARCHAR(20) DEFAULT 'father';
      ALTER TABLE children ADD COLUMN IF NOT EXISTS emergency_contact_choice VARCHAR(20) DEFAULT 'custom';
      ALTER TABLE children ADD COLUMN IF NOT EXISTS trusted_contacts JSONB DEFAULT '[]'::jsonb;
    `);

    // 2. Synchronisation / Migration des données existantes
    // Si l'enfant est rattaché à un compte parent (users)
    await client.query(`
      UPDATE children c
      SET 
        father_name = CASE 
          WHEN c.father_name IS NOT NULL AND c.father_name != '' THEN c.father_name
          WHEN u.gender = 'female' THEN c.second_parent_name
          ELSE NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '')
        END,
        father_phone = CASE 
          WHEN c.father_phone IS NOT NULL AND c.father_phone != '' THEN c.father_phone
          WHEN u.gender = 'female' THEN c.second_parent_phone
          ELSE u.phone
        END,
        mother_name = CASE 
          WHEN c.mother_name IS NOT NULL AND c.mother_name != '' THEN c.mother_name
          WHEN u.gender = 'female' THEN NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '')
          ELSE c.second_parent_name
        END,
        mother_phone = CASE 
          WHEN c.mother_phone IS NOT NULL AND c.mother_phone != '' THEN c.mother_phone
          WHEN u.gender = 'female' THEN u.phone
          ELSE c.second_parent_phone
        END,
        account_holder = CASE 
          WHEN u.gender = 'female' THEN 'mother'
          ELSE 'father'
        END
      FROM users u
      WHERE c.parent_id = u.id;
    `);

    // 3. Synchronisation de second_parent_name et second_parent_phone pour rétrocompatibilité
    await client.query(`
      UPDATE children
      SET 
        second_parent_name = COALESCE(second_parent_name, CASE WHEN account_holder = 'father' THEN mother_name ELSE father_name END),
        second_parent_phone = COALESCE(second_parent_phone, CASE WHEN account_holder = 'father' THEN mother_phone ELSE father_phone END);
    `);
  },

  down: async (client) => {
    // Non destructif en production
  }
};
