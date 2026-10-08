const { query } = require('../config/db_postgres');
const bcrypt = require('bcryptjs');

async function resetTestUsers() {
  try {
    const hashedPassword = await bcrypt.hash('password', 10);
    console.log('Mot de passe hashé généré pour "password"');

    // 1. Admin: crechemimaelghalia@gmail.com
    await query(
      `UPDATE users 
       SET password = $1, is_active = true, role = 'admin' 
       WHERE email = 'crechemimaelghalia@gmail.com'`,
      [hashedPassword]
    );
    console.log('✅ Admin crechemimaelghalia@gmail.com mis à jour');

    // 2. Staff: staff@creche.com
    const staffRes = await query('SELECT id FROM users WHERE email = $1', ['staff@creche.com']);
    if (staffRes.rows.length === 0) {
      await query(
        `INSERT INTO users (email, password, first_name, last_name, role, is_active, phone, staff_position)
         VALUES ('staff@creche.com', $1, 'Éducatrice', 'Staff', 'staff', true, '+216 55 123 456', 'educator')`,
        [hashedPassword]
      );
      console.log('✅ staff@creche.com créé');
    } else {
      await query(
        `UPDATE users 
         SET password = $1, is_active = true, role = 'staff', staff_position = 'educator'
         WHERE email = 'staff@creche.com'`,
        [hashedPassword]
      );
      console.log('✅ staff@creche.com mis à jour');
    }

    // 3. Staff backup: staff@mimaelghalia.tn
    await query(
      `UPDATE users 
       SET password = $1, is_active = true 
       WHERE email = 'staff@mimaelghalia.tn'`,
      [hashedPassword]
    );
    console.log('✅ staff@mimaelghalia.tn mis à jour');

    // 4. Parent: parent@creche.com
    let parentId;
    const parentRes = await query('SELECT id FROM users WHERE email = $1', ['parent@creche.com']);
    if (parentRes.rows.length === 0) {
      const ins = await query(
        `INSERT INTO users (email, password, first_name, last_name, role, is_active, phone)
         VALUES ('parent@creche.com', $1, 'Mohamed', 'Trabelsi', 'parent', true, '+216 98 765 432')
         RETURNING id`,
        [hashedPassword]
      );
      parentId = ins.rows[0].id;
      console.log('✅ parent@creche.com créé (id:', parentId, ')');
    } else {
      parentId = parentRes.rows[0].id;
      await query(
        `UPDATE users 
         SET password = $1, is_active = true, role = 'parent'
         WHERE email = 'parent@creche.com'`,
        [hashedPassword]
      );
      console.log('✅ parent@creche.com mis à jour (id:', parentId, ')');
    }

    // 5. Parent backup: parent1@example.com
    await query(
      `UPDATE users 
       SET password = $1, is_active = true 
       WHERE email = 'parent1@example.com'`,
      [hashedPassword]
    );
    console.log('✅ parent1@example.com mis à jour');

    // 6. Developer account
    await query(
      `UPDATE users 
       SET password = $1, is_active = true 
       WHERE email = 'aidoudimalek@yahoo.com'`,
      [hashedPassword]
    );
    console.log('✅ aidoudimalek@yahoo.com mis à jour');

    // 7. Associer les enfants à parent@creche.com si besoin
    const childCheck = await query('SELECT id FROM children WHERE parent_id = $1', [parentId]);
    if (childCheck.rows.length === 0) {
      await query('UPDATE children SET parent_id = $1 WHERE id IN (1, 2)', [parentId]);
      console.log('✅ Enfants attachés à parent@creche.com');
    }

    console.log('\n🎉 TOUS LES COMPTES DE TEST SONT PRÊTS ET OPÉRATIONNELS !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation des comptes:', error);
    process.exit(1);
  }
}

resetTestUsers();
