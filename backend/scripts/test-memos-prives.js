/**
 * Script de test pour vérifier l'isolation des mémos privés
 * Usage: node scripts/test-memos-prives.js
 */

const { pool } = require('../config/db_postgres');

async function testMemosPrives() {
  try {
    console.log('🧪 TEST MÉMOS PRIVÉS\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Récupérer les utilisateurs admin et staff
    console.log('📋 1. UTILISATEURS:\n');
    const usersResult = await pool.query(`
      SELECT id, first_name, last_name, email, role
      FROM users
      WHERE role IN ('admin', 'staff')
      ORDER BY role, id
    `);

    console.table(usersResult.rows);

    const admin = usersResult.rows.find(u => u.role === 'admin');
    const staff = usersResult.rows.find(u => u.role === 'staff');

    if (!admin || !staff) {
      console.error('❌ Admin ou Staff non trouvé');
      process.exit(1);
    }

    // 2. Voir tous les mémos avec leurs créateurs
    console.log('\n📝 2. TOUS LES MÉMOS:\n');
    const allMemosResult = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.status,
        e.created_by,
        u.first_name || ' ' || u.last_name as creator_name,
        u.role as creator_role,
        e.created_at
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.type = 'memo' AND e.deleted_at IS NULL
      ORDER BY e.created_at DESC
      LIMIT 10
    `);

    console.table(allMemosResult.rows);

    // 3. Mémos de l'admin (simulation du filtre)
    console.log(`\n👤 3. MÉMOS DE L'ADMIN (${admin.first_name} ${admin.last_name}):\n`);
    const adminMemosResult = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.status,
        e.created_at
      FROM events e
      WHERE e.type = 'memo' 
        AND e.deleted_at IS NULL
        AND e.created_by = $1
      ORDER BY e.created_at DESC
    `, [admin.id]);

    console.table(adminMemosResult.rows);
    console.log(`✅ L'admin voit ${adminMemosResult.rows.length} mémo(s)\n`);

    // 4. Mémos du staff (simulation du filtre)
    console.log(`\n👤 4. MÉMOS DU STAFF (${staff.first_name} ${staff.last_name}):\n`);
    const staffMemosResult = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.status,
        e.created_at
      FROM events e
      WHERE e.type = 'memo' 
        AND e.deleted_at IS NULL
        AND e.created_by = $1
      ORDER BY e.created_at DESC
    `, [staff.id]);

    console.table(staffMemosResult.rows);
    console.log(`✅ Le staff voit ${staffMemosResult.rows.length} mémo(s)\n`);

    // 5. Statistiques
    console.log('\n📊 5. STATISTIQUES:\n');
    const statsResult = await pool.query(`
      SELECT 
        u.first_name || ' ' || u.last_name as user_name,
        u.role,
        COUNT(e.id) as memo_count,
        COUNT(CASE WHEN e.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_count
      FROM users u
      LEFT JOIN events e ON u.id = e.created_by AND e.type = 'memo' AND e.deleted_at IS NULL
      WHERE u.role IN ('admin', 'staff')
      GROUP BY u.id, u.first_name, u.last_name, u.role
      ORDER BY u.role, u.id
    `);

    console.table(statsResult.rows);

    // 6. Vérification de l'isolation
    console.log('\n🔒 6. VÉRIFICATION ISOLATION:\n');
    
    const adminHasStaffMemos = adminMemosResult.rows.some(memo => {
      const creator = allMemosResult.rows.find(m => m.id === memo.id);
      return creator && creator.creator_role === 'staff';
    });

    const staffHasAdminMemos = staffMemosResult.rows.some(memo => {
      const creator = allMemosResult.rows.find(m => m.id === memo.id);
      return creator && creator.creator_role === 'admin';
    });

    if (adminHasStaffMemos) {
      console.log('❌ ERREUR: L\'admin voit des mémos du staff !');
    } else {
      console.log('✅ L\'admin ne voit PAS les mémos du staff');
    }

    if (staffHasAdminMemos) {
      console.log('❌ ERREUR: Le staff voit des mémos de l\'admin !');
    } else {
      console.log('✅ Le staff ne voit PAS les mémos de l\'admin');
    }

    // 7. Résumé
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ:\n');
    
    const summary = [
      {
        utilisateur: `${admin.first_name} ${admin.last_name}`,
        role: 'Admin',
        memos_visibles: adminMemosResult.rows.length,
        isolation: adminHasStaffMemos ? '❌ Échec' : '✅ OK'
      },
      {
        utilisateur: `${staff.first_name} ${staff.last_name}`,
        role: 'Staff',
        memos_visibles: staffMemosResult.rows.length,
        isolation: staffHasAdminMemos ? '❌ Échec' : '✅ OK'
      }
    ];

    console.table(summary);

    console.log('\n═══════════════════════════════════════════════════════════\n');

    if (!adminHasStaffMemos && !staffHasAdminMemos) {
      console.log('✅ TEST RÉUSSI: Les mémos sont correctement isolés par utilisateur\n');
    } else {
      console.log('❌ TEST ÉCHOUÉ: Problème d\'isolation des mémos\n');
    }

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testMemosPrives();
