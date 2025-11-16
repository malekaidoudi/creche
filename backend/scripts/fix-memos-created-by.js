/**
 * Script pour corriger les mémos avec le mauvais created_by
 * Usage: node scripts/fix-memos-created-by.js
 */

const { pool } = require('../config/db_postgres');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixMemosCreatedBy() {
  try {
    console.log('🔧 CORRECTION DES MÉMOS - created_by\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Afficher tous les mémos avec leurs créateurs
    console.log('📋 1. MÉMOS ACTUELS:\n');
    const memosResult = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.created_by,
        u.first_name || ' ' || u.last_name as creator_name,
        u.role as creator_role,
        e.created_at
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.type = 'memo' AND e.deleted_at IS NULL
      ORDER BY e.created_at DESC
    `);

    console.table(memosResult.rows);

    // 2. Identifier les problèmes potentiels
    console.log('\n🔍 2. ANALYSE:\n');
    
    const memosWithoutCreator = memosResult.rows.filter(m => !m.created_by);
    const memosWithAdmin = memosResult.rows.filter(m => m.creator_role === 'admin');
    const memosWithStaff = memosResult.rows.filter(m => m.creator_role === 'staff');

    console.log(`Total mémos: ${memosResult.rows.length}`);
    console.log(`Mémos sans créateur: ${memosWithoutCreator.length}`);
    console.log(`Mémos créés par admin: ${memosWithAdmin.length}`);
    console.log(`Mémos créés par staff: ${memosWithStaff.length}`);

    if (memosWithoutCreator.length > 0) {
      console.log('\n⚠️  Mémos sans créateur trouvés:');
      console.table(memosWithoutCreator);
    }

    // 3. Récupérer les utilisateurs disponibles
    console.log('\n👥 3. UTILISATEURS DISPONIBLES:\n');
    const usersResult = await pool.query(`
      SELECT id, first_name, last_name, email, role
      FROM users
      WHERE role IN ('admin', 'staff')
      ORDER BY role, id
    `);

    console.table(usersResult.rows);

    // 4. Demander confirmation pour la correction
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔧 OPTIONS DE CORRECTION:\n');
    console.log('1. Supprimer les mémos du staff (si créés par erreur)');
    console.log('2. Corriger un mémo spécifique');
    console.log('3. Afficher les détails d\'un mémo');
    console.log('4. Quitter sans modification\n');

    const choice = await question('Votre choix (1-4): ');

    switch (choice.trim()) {
      case '1':
        // Supprimer les mémos du staff
        const staffMemos = memosResult.rows.filter(m => m.creator_role === 'staff');
        if (staffMemos.length === 0) {
          console.log('\n✅ Aucun mémo du staff à supprimer');
          break;
        }

        console.log(`\n⚠️  Vous allez supprimer ${staffMemos.length} mémo(s) du staff:`);
        console.table(staffMemos);

        const confirmDelete = await question('\nConfirmer la suppression? (oui/non): ');
        if (confirmDelete.toLowerCase() === 'oui') {
          const staffIds = staffMemos.map(m => m.id);
          await pool.query(`
            UPDATE events
            SET deleted_at = NOW()
            WHERE id = ANY($1)
          `, [staffIds]);

          console.log(`\n✅ ${staffMemos.length} mémo(s) supprimé(s)`);
        } else {
          console.log('\n❌ Suppression annulée');
        }
        break;

      case '2':
        // Corriger un mémo spécifique
        const memoId = await question('\nID du mémo à corriger: ');
        const newUserId = await question('Nouvel ID utilisateur (created_by): ');

        const memo = memosResult.rows.find(m => m.id === parseInt(memoId));
        if (!memo) {
          console.log('\n❌ Mémo non trouvé');
          break;
        }

        const newUser = usersResult.rows.find(u => u.id === parseInt(newUserId));
        if (!newUser) {
          console.log('\n❌ Utilisateur non trouvé');
          break;
        }

        console.log(`\n📝 Modification:`);
        console.log(`   Mémo: "${memo.title}"`);
        console.log(`   Ancien créateur: ${memo.creator_name} (ID: ${memo.created_by})`);
        console.log(`   Nouveau créateur: ${newUser.first_name} ${newUser.last_name} (ID: ${newUser.id})`);

        const confirmUpdate = await question('\nConfirmer? (oui/non): ');
        if (confirmUpdate.toLowerCase() === 'oui') {
          await pool.query(`
            UPDATE events
            SET created_by = $1
            WHERE id = $2
          `, [newUser.id, memo.id]);

          console.log('\n✅ Mémo mis à jour');
        } else {
          console.log('\n❌ Modification annulée');
        }
        break;

      case '3':
        // Afficher les détails
        const detailId = await question('\nID du mémo: ');
        const detailResult = await pool.query(`
          SELECT 
            e.*,
            u.first_name || ' ' || u.last_name as creator_name,
            u.role as creator_role
          FROM events e
          LEFT JOIN users u ON e.created_by = u.id
          WHERE e.id = $1
        `, [detailId]);

        if (detailResult.rows.length > 0) {
          console.log('\n📋 Détails du mémo:');
          console.log(detailResult.rows[0]);
        } else {
          console.log('\n❌ Mémo non trouvé');
        }
        break;

      case '4':
        console.log('\n👋 Aucune modification effectuée');
        break;

      default:
        console.log('\n❌ Choix invalide');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    rl.close();
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

fixMemosCreatedBy();
