/**
 * Migration 015 - Système de tarification, régimes d'accueil et module financier
 *
 * 1. Paramètres par défaut dans nursery_settings (tarifs variables, feature flag billing_enabled)
 * 2. Ajout de care_schedule ('full_day' | 'half_day') et monthly_discount sur :
 *    - enrollments
 *    - enrollments_archive
 *    - children
 * 3. Table child_invoices : suivi des cotisations mensuelles, assurance annuelle, encaissements espèces et reçus
 * 4. Table nursery_expenses : extensible pour la gestion future des dépenses et le calcul de trésorerie
 */

module.exports = {
  version: '015_billing_and_care_schedule',
  name: 'Add care_schedule, billing settings, child_invoices and nursery_expenses tables',

  up: async (client) => {
    // 1. Clés de tarification dans nursery_settings (si non existantes)
    const defaultSettings = [
      { key: 'billing_enabled', value_fr: 'false', value_ar: 'false', category: 'billing' },
      { key: 'tariff_full_day_monthly', value_fr: '130', value_ar: '130', category: 'billing' },
      { key: 'tariff_half_day_monthly', value_fr: '100', value_ar: '100', category: 'billing' },
      { key: 'tariff_saturday_monthly', value_fr: '20', value_ar: '20', category: 'billing' },
      { key: 'tariff_insurance_annual', value_fr: '60', value_ar: '60', category: 'billing' },
      { key: 'billing_due_day', value_fr: '5', value_ar: '5', category: 'billing' }
    ];

    for (const setting of defaultSettings) {
      await client.query(`
        INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (setting_key) DO NOTHING;
      `, [setting.key, setting.value_fr, setting.value_ar, setting.category]);
    }

    // 2. Colonnes sur enrollments, enrollments_archive et children
    await client.query(`
      ALTER TABLE enrollments
        ADD COLUMN IF NOT EXISTS care_schedule VARCHAR(20) DEFAULT 'full_day',
        ADD COLUMN IF NOT EXISTS monthly_discount NUMERIC(10,2) DEFAULT 0.00;

      ALTER TABLE enrollments_archive
        ADD COLUMN IF NOT EXISTS care_schedule VARCHAR(20) DEFAULT 'full_day',
        ADD COLUMN IF NOT EXISTS monthly_discount NUMERIC(10,2) DEFAULT 0.00;

      ALTER TABLE children
        ADD COLUMN IF NOT EXISTS care_schedule VARCHAR(20) DEFAULT 'full_day',
        ADD COLUMN IF NOT EXISTS monthly_discount NUMERIC(10,2) DEFAULT 0.00;

      CREATE INDEX IF NOT EXISTS idx_children_care_schedule ON children(care_schedule);
    `);

    // 3. Table child_invoices (Factures / Cotisations enfants)
    await client.query(`
      CREATE TABLE IF NOT EXISTS child_invoices (
        id SERIAL PRIMARY KEY,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
        period_year INTEGER NOT NULL,
        school_year VARCHAR(20) NOT NULL,
        care_schedule VARCHAR(20) NOT NULL DEFAULT 'full_day',
        base_price NUMERIC(10,2) NOT NULL DEFAULT 130.00,
        saturday_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        insurance_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        previous_arrears NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        total_due NUMERIC(10,2) NOT NULL,
        amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
        payment_method VARCHAR(30) DEFAULT 'cash',
        receipt_number VARCHAR(50),
        notes TEXT,
        paid_at TIMESTAMP,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_child_invoice_period UNIQUE (child_id, period_year, period_month)
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_child_period ON child_invoices(child_id, period_year, period_month);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON child_invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_parent ON child_invoices(parent_id);

      ALTER TABLE child_invoices ADD COLUMN IF NOT EXISTS previous_arrears NUMERIC(10,2) NOT NULL DEFAULT 0.00;
    `);

    // 4. Table nursery_expenses (Dépenses de la crèche pour bilan financier et trésorerie)
    await client.query(`
      CREATE TABLE IF NOT EXISTS nursery_expenses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'other',
        amount NUMERIC(10,2) NOT NULL,
        expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
        period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
        period_year INTEGER NOT NULL,
        school_year VARCHAR(20),
        payment_method VARCHAR(30) DEFAULT 'cash',
        receipt_url VARCHAR(500),
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_period ON nursery_expenses(period_year, period_month);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON nursery_expenses(category);
    `);
  },

  down: async (client) => {
    await client.query(`
      DROP TABLE IF EXISTS nursery_expenses CASCADE;
      DROP TABLE IF EXISTS child_invoices CASCADE;

      ALTER TABLE children
        DROP COLUMN IF EXISTS care_schedule,
        DROP COLUMN IF EXISTS monthly_discount;

      ALTER TABLE enrollments_archive
        DROP COLUMN IF EXISTS care_schedule,
        DROP COLUMN IF EXISTS monthly_discount;

      ALTER TABLE enrollments
        DROP COLUMN IF EXISTS care_schedule,
        DROP COLUMN IF EXISTS monthly_discount;

      DELETE FROM nursery_settings WHERE setting_key IN (
        'billing_enabled',
        'tariff_full_day_monthly',
        'tariff_half_day_monthly',
        'tariff_saturday_monthly',
        'tariff_insurance_annual',
        'billing_due_day'
      );
    `);
  }
};
