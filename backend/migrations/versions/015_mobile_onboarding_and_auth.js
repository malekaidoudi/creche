/**
 * Migration 015 - Onboarding Mobile, Email Optionnel et Authentification Universelle
 * 
 * 1. Rendre email optionnel (DROP NOT NULL) sur la table users.
 * 2. Ajouter la colonne username (pseudo unique pour les comptes actifs).
 * 3. Ajouter l'index d'unicité partiel pour username : LOWER(username) WHERE is_active = true.
 * 4. Ajouter un index sur phone pour accélérer la recherche lors du login.
 */

module.exports = {
  version: '015_mobile_onboarding_and_auth',
  name: 'Allow null email, add username with active-only uniqueness, and index phone for login',

  up: async (client) => {
    // 1. Rendre l'email optionnel
    await client.query(`
      ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    `);

    // 2. Ajouter la colonne username si absente
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
    `);

    // 3. Index d'unicité pour username sur comptes actifs uniquement
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_active 
      ON users (LOWER(username)) 
      WHERE is_active = true;
    `);

    // 4. Index sur le téléphone pour le login rapide
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    `);
  },

  down: async (client) => {
    await client.query(`
      DROP INDEX IF EXISTS idx_users_username_active;
      DROP INDEX IF EXISTS idx_users_phone;
      ALTER TABLE users DROP COLUMN IF EXISTS username;
    `);
  }
};
