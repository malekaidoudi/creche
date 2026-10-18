/**
 * Migration 012 - Notifications Push (Web Push)
 *
 * Table de stockage des abonnements Push Web (PushSubscription API) par
 * utilisateur. Un même utilisateur peut avoir plusieurs abonnements actifs
 * (un par appareil/navigateur installé en PWA).
 */

module.exports = {
  version: '012_push_subscriptions',
  name: 'Create push_subscriptions table for Web Push notifications',

  up: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
    `);
  },

  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS push_subscriptions;`);
  }
};
