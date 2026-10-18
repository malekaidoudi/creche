/**
 * Migration 013 - Supprimer la contrainte restrictive sur le type de notification
 *
 * Dans 001_baseline_schema.js, notifications.type avait CHECK (type IN ('info', 'success', 'warning', 'error')).
 * Cela empêchait l'insertion des types modernes ('dev_alert', 'attendance_not_recorded', 'absence_request', etc.)
 * et provoquait une erreur SQL silencieuse bloquant l'envoi des push Web au developer.
 */

module.exports = {
  version: '013_drop_notifications_type_check',
  name: 'Drop notifications_type_check constraint to allow custom notification types',

  up: async (client) => {
    await client.query(`
      ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    `);
  },

  down: async (client) => {
    // Ne pas réintroduire la contrainte restrictive
  }
};
