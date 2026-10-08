/**
 * Crée (ou met à jour) un compte staff de test dédié aux tests de gestion des accès.
 * Usage: node scripts/create_test_staff.js
 */
const { query } = require('../config/db_postgres');
const bcrypt = require('bcryptjs');

const EMAIL = 'staff-test@creche.com';
const PASSWORD = 'password';

async function createTestStaff() {
  try {
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    const existing = await query('SELECT id FROM users WHERE email = $1', [EMAIL]);

    if (existing.rows.length === 0) {
      const result = await query(
        `INSERT INTO users (email, password, first_name, last_name, role, is_active, phone, gender, staff_position)
         VALUES ($1, $2, 'Educatrice', 'Test', 'staff', true, '+216 20 000 000', 'female', 'educator')
         RETURNING id, email, first_name, last_name, role, staff_position, gender`,
        [EMAIL, hashedPassword]
      );
      console.log('Compte staff de test cree:', result.rows[0]);
    } else {
      const result = await query(
        `UPDATE users
         SET password = $1, is_active = true, role = 'staff', gender = 'female', staff_position = 'educator'
         WHERE email = $2
         RETURNING id, email, first_name, last_name, role, staff_position, gender`,
        [hashedPassword, EMAIL]
      );
      console.log('Compte staff de test mis a jour:', result.rows[0]);
    }

    console.log('\nIdentifiants de test:');
    console.log('  Email    :', EMAIL);
    console.log('  Password :', PASSWORD);

    process.exit(0);
  } catch (error) {
    console.error('Erreur creation compte staff de test:', error);
    process.exit(1);
  }
}

createTestStaff();
