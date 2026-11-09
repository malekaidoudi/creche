/**
 * Migration 018 - Suivi de l'assurance scolaire annuelle par enfant et transition de production
 * 
 * 1. Ajout de la colonne `insurance_paid_school_year` sur la table `children`
 * 2. Rétroactivité : tous les enfants déjà actifs sont marqués comme ayant réglé leur assurance 2026-2027
 * 3. Réconciliation : rectification des factures non soldées du mois en cours qui avaient reçu à tort l'assurance
 */

module.exports = {
  version: '018_annual_insurance_tracking',
  name: 'Add insurance_paid_school_year to children and reconcile current invoices',

  up: async (client) => {
    // 1. Ajout de la colonne sur la table children
    await client.query(`
      ALTER TABLE children
        ADD COLUMN IF NOT EXISTS insurance_paid_school_year VARCHAR(20) DEFAULT NULL;

      CREATE INDEX IF NOT EXISTS idx_children_insurance_school_year 
        ON children(insurance_paid_school_year);
    `);

    // 2. Rétroactivité de mise en service : les enfants déjà inscrits ont réglé leur assurance à la rentrée
    await client.query(`
      UPDATE children
      SET insurance_paid_school_year = '2026-2027'
      WHERE is_active = true AND insurance_paid_school_year IS NULL;
    `);

    // 3. Réconciliation : supprimer l'assurance indue (+60 DT) sur les factures non payées de l'année scolaire en cours
    await client.query(`
      UPDATE child_invoices
      SET 
        insurance_price = 0.00,
        total_due = GREATEST(0, base_price + saturday_price - discount_amount + previous_arrears),
        notes = CASE 
          WHEN notes IS NULL OR notes = '' THEN '[Assurance 2026-2027 déjà acquittée]'
          ELSE notes || ' - [Assurance 2026-2027 déjà acquittée]'
        END,
        updated_at = NOW()
      WHERE school_year = '2026-2027'
        AND status != 'paid'
        AND insurance_price > 0;
    `);

    console.log('✅ Migration 018 appliquée avec succès (assurance annuelle par enfant)');
  },

  down: async (client) => {
    await client.query(`
      DROP INDEX IF EXISTS idx_children_insurance_school_year;
      ALTER TABLE children DROP COLUMN IF EXISTS insurance_paid_school_year;
    `);

    console.log('↩️ Migration 018 annulée');
  }
};

