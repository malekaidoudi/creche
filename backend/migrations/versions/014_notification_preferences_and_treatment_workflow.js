/**
 * Migration 014 - Table des préférences de notification et workflow d'approbation des traitements
 * 
 * 1. Crée user_notification_preferences pour l'alerte présence programmable et le résumé du soir
 * 2. Ajoute les colonnes d'approbation et d'assignation à child_treatments
 */

module.exports = {
  version: '014_notification_preferences_and_treatment_workflow',
  name: 'Create user_notification_preferences and add treatment approval/assignment columns',

  up: async (client) => {
    // 1. Table des préférences de notification
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        attendance_reminder_enabled BOOLEAN DEFAULT true,
        attendance_reminder_time VARCHAR(5) DEFAULT '08:30',
        attendance_reminder_days INTEGER[] DEFAULT '{1,2,3,4,5,6}',
        daily_report_reminder_enabled BOOLEAN DEFAULT true,
        daily_report_reminder_time VARCHAR(5) DEFAULT '19:00',
        email_notifications BOOLEAN DEFAULT true,
        push_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Colonnes pour le workflow de traitement médical
    await client.query(`
      ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS assigned_staff_id INTEGER REFERENCES users(id);
      ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';
      ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
      ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
      ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE child_treatments ADD COLUMN IF NOT EXISTS document_url VARCHAR(500);

      CREATE INDEX IF NOT EXISTS idx_treatments_approval ON child_treatments(approval_status);
      CREATE INDEX IF NOT EXISTS idx_treatments_assigned_staff ON child_treatments(assigned_staff_id);
    `);
  },

  down: async (client) => {
    await client.query(`
      DROP TABLE IF EXISTS user_notification_preferences;
      ALTER TABLE child_treatments DROP COLUMN IF EXISTS assigned_staff_id;
      ALTER TABLE child_treatments DROP COLUMN IF EXISTS approval_status;
      ALTER TABLE child_treatments DROP COLUMN IF EXISTS approved_by;
      ALTER TABLE child_treatments DROP COLUMN IF EXISTS approved_at;
      ALTER TABLE child_treatments DROP COLUMN IF EXISTS rejection_reason;
      ALTER TABLE child_treatments DROP COLUMN IF EXISTS document_url;
    `);
  }
};
