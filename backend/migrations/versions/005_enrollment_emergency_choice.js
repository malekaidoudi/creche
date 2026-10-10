/**
 * Migration 005 - Enrollment Emergency Contact Choice
 *
 * Unifie le modèle du contact d'urgence sur toute la chaîne d'inscription :
 * - enrollments.emergency_contact_name (VARCHAR 100) : nom du tiers ('custom')
 * - enrollments.emergency_contact_phone (VARCHAR 20) : téléphone du tiers
 * - enrollments.emergency_contact_choice (VARCHAR 20) : 'father' | 'mother' | 'custom'
 *
 * Convention identique à children.emergency_contact_choice (migration 003) :
 * 'father'/'mother' = le tél. est déjà porté par father_phone/mother_phone,
 * 'custom' = nouveau nom + téléphone stockés sur la ligne.
 */

module.exports = {
  version: '005_enrollment_emergency_choice',
  name: 'Add emergency_contact_choice to enrollments (father|mother|custom)',

  up: async (client) => {
    await client.query(`
      ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
      ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
      ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS emergency_contact_choice VARCHAR(20) DEFAULT 'custom';
    `);
  },

  down: async (client) => {
    // Non destructif en production
  }
};
