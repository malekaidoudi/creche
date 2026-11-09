/**
 * Migration 019 - Gestion des cotisations par foyer familial, avoirs/crédits d'avance et paiements multi-mois
 * 
 * 1. Ajout de `credit_balance` (avoir de la famille) sur la table `users`
 * 2. Ajout de `credit_used` sur la table `child_invoices`
 */

module.exports = {
  version: '019_family_billing_and_credit',
  name: 'Add credit_balance to users and credit_used to child_invoices',

  up: async (client) => {
    // 1. Solde d'avoir / crédit familial sur le compte parent
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00;
    `);

    // 2. Traçabilité de l'utilisation d'avoir sur chaque facture
    await client.query(`
      ALTER TABLE child_invoices
        ADD COLUMN IF NOT EXISTS credit_used NUMERIC(10,2) NOT NULL DEFAULT 0.00;
    `);

    console.log('✅ Migration 019 appliquée avec succès (crédit familial & avoirs)');
  },

  down: async (client) => {
    await client.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS credit_balance;
      ALTER TABLE child_invoices DROP COLUMN IF EXISTS credit_used;
    `);

    console.log('↩️ Migration 019 annulée');
  }
};

