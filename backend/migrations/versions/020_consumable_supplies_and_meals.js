/**
 * Migration 020 - Assouplissement des contraintes sur les repas et les fournitures consommables
 *
 * - daily_meals : autorise les nouvelles catégories standards de repas ('bottle', 'meal', 'compote', 'fruit', 'snack', 'other')
 *   ainsi que les horaires ('HH:MM') dans la colonne period pour les bébés.
 * - child_supplies & daily_supplies_brought : autorise tous les types de produits consommables
 *   ('diapers', 'wipes', 'cream', 'tissues', 'clothes', 'serum', 'other', 'food').
 */

module.exports = {
  version: '020_consumable_supplies_and_meals',
  name: 'Relax daily_meals and supplies check constraints for consumable products and meal categories',

  up: async (client) => {
    await client.query(`
      ALTER TABLE daily_meals DROP CONSTRAINT IF EXISTS daily_meals_meal_type_check;
      ALTER TABLE daily_meals DROP CONSTRAINT IF EXISTS daily_meals_period_check;
      ALTER TABLE child_supplies DROP CONSTRAINT IF EXISTS child_supplies_supply_type_check;
      ALTER TABLE daily_supplies_brought DROP CONSTRAINT IF EXISTS daily_supplies_brought_supply_type_check;
    `);
  },

  down: async (client) => {
    // Ne pas réintroduire les contraintes restrictives
  }
};

