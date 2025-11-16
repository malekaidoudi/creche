/**
 * Script pour tester l'API /api/events avec filtrage des mémos
 * Simule les requêtes comme le frontend
 */

const { pool } = require('../config/db_postgres');

async function testAPIMemos() {
  try {
    console.log('🧪 TEST API /api/events - Filtrage Mémos\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Récupérer les IDs des utilisateurs
    const usersResult = await pool.query(`
      SELECT id, first_name, last_name, role
      FROM users
      WHERE role IN ('admin', 'staff')
      ORDER BY role, id
    `);

    const admin = usersResult.rows.find(u => u.role === 'admin');
    const staff = usersResult.rows.find(u => u.role === 'staff');

    console.log('👥 Utilisateurs de test:\n');
    console.table([admin, staff]);

    // Simuler la requête du service eventService.getEvents()
    console.log('\n📡 1. SIMULATION REQUÊTE ADMIN (user_id = ' + admin.id + '):\n');
    
    const adminQuery = `
      SELECT 
        e.id,
        e.title,
        e.type,
        e.created_by,
        u1.first_name || ' ' || u1.last_name as created_by_name
      FROM events e
      LEFT JOIN users u1 ON e.created_by = u1.id
      WHERE e.deleted_at IS NULL
        AND (e.type != 'memo' OR e.created_by = $1)
      ORDER BY e.created_at DESC
      LIMIT 20
    `;

    const adminResult = await pool.query(adminQuery, [admin.id]);
    
    console.log('Résultats pour Admin:');
    console.table(adminResult.rows);
    
    const adminMemos = adminResult.rows.filter(r => r.type === 'memo');
    console.log(`\n✅ Admin voit ${adminMemos.length} mémo(s)`);
    console.log('Créateurs des mémos:');
    adminMemos.forEach(m => {
      console.log(`  - ${m.title} (créé par: ${m.created_by_name}, ID: ${m.created_by})`);
    });

    // Simuler la requête du staff
    console.log('\n\n📡 2. SIMULATION REQUÊTE STAFF (user_id = ' + staff.id + '):\n');
    
    const staffQuery = `
      SELECT 
        e.id,
        e.title,
        e.type,
        e.created_by,
        u1.first_name || ' ' || u1.last_name as created_by_name
      FROM events e
      LEFT JOIN users u1 ON e.created_by = u1.id
      WHERE e.deleted_at IS NULL
        AND (e.type != 'memo' OR e.created_by = $1)
      ORDER BY e.created_at DESC
      LIMIT 20
    `;

    const staffResult = await pool.query(staffQuery, [staff.id]);
    
    console.log('Résultats pour Staff:');
    console.table(staffResult.rows);
    
    const staffMemos = staffResult.rows.filter(r => r.type === 'memo');
    console.log(`\n✅ Staff voit ${staffMemos.length} mémo(s)`);
    console.log('Créateurs des mémos:');
    staffMemos.forEach(m => {
      console.log(`  - ${m.title} (créé par: ${m.created_by_name}, ID: ${m.created_by})`);
    });

    // Vérification croisée
    console.log('\n\n🔒 3. VÉRIFICATION CROISÉE:\n');
    
    const adminHasStaffMemos = adminMemos.some(m => m.created_by === staff.id);
    const staffHasAdminMemos = staffMemos.some(m => m.created_by === admin.id);

    if (adminHasStaffMemos) {
      console.log('❌ ERREUR: Admin voit des mémos du staff !');
      const leaked = adminMemos.filter(m => m.created_by === staff.id);
      console.log('Mémos fuitants:');
      console.table(leaked);
    } else {
      console.log('✅ Admin ne voit PAS les mémos du staff');
    }

    if (staffHasAdminMemos) {
      console.log('❌ ERREUR: Staff voit des mémos de l\'admin !');
      const leaked = staffMemos.filter(m => m.created_by === admin.id);
      console.log('Mémos fuitants:');
      console.table(leaked);
    } else {
      console.log('✅ Staff ne voit PAS les mémos de l\'admin');
    }

    // Résumé
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ:\n');
    
    console.table([
      {
        utilisateur: `${admin.first_name} ${admin.last_name}`,
        role: 'Admin',
        events_total: adminResult.rows.length,
        memos: adminMemos.length,
        isolation: adminHasStaffMemos ? '❌ Échec' : '✅ OK'
      },
      {
        utilisateur: `${staff.first_name} ${staff.last_name}`,
        role: 'Staff',
        events_total: staffResult.rows.length,
        memos: staffMemos.length,
        isolation: staffHasAdminMemos ? '❌ Échec' : '✅ OK'
      }
    ]);

    console.log('\n═══════════════════════════════════════════════════════════\n');

    if (!adminHasStaffMemos && !staffHasAdminMemos) {
      console.log('✅ TEST RÉUSSI: Le filtre SQL fonctionne correctement\n');
      console.log('💡 Si vous voyez encore des mémos d\'un autre utilisateur dans le frontend,');
      console.log('   le problème vient probablement de:');
      console.log('   1. L\'authentification (req.user.id incorrect)');
      console.log('   2. Le cache du navigateur');
      console.log('   3. Un ancien mémo créé avec le mauvais created_by\n');
    } else {
      console.log('❌ TEST ÉCHOUÉ: Le filtre SQL ne fonctionne pas\n');
    }

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAPIMemos();
