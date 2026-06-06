/**
 * Script de correction : Fusionner deux comptes parent créés par erreur
 * 
 * Usage:
 *   node scripts/fix-parent-duplicate.js --fake-parent-id=XX --real-parent-id=YY [--dry-run]
 * 
 * Ce script:
 * 1. Met à jour children.parent_id (déjà fait manuellement? on vérifie)
 * 2. Met à jour enrollments.parent_id
 * 3. Met à jour activity_logs.target_id (si target_type='parent')
 * 4. Met à jour documents.user_id (si applicable)
 * 5. Met à jour payments/alertes si elles référencent le faux parent
 * 6. Supprime le faux parent de users
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixParentDuplicate(fakeParentId, realParentId, dryRun = false) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log(`\n${dryRun ? '[DRY-RUN]' : ''} Correction parent: faux=${fakeParentId} → réel=${realParentId}\n`);
    
    // 1. Vérifier que les deux parents existent
    const fakeParent = await client.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1 AND role = $2', [fakeParentId, 'parent']);
    const realParent = await client.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1 AND role = $2', [realParentId, 'parent']);
    
    if (fakeParent.rows.length === 0) {
      throw new Error(`Faux parent ID ${fakeParentId} non trouvé ou n'est pas un parent`);
    }
    if (realParent.rows.length === 0) {
      throw new Error(`Vrai parent ID ${realParentId} non trouvé ou n'est pas un parent`);
    }
    
    console.log(`✅ Faux parent:  ${fakeParent.rows[0].email} (${fakeParent.rows[0].first_name} ${fakeParent.rows[0].last_name})`);
    console.log(`✅ Vrai parent:   ${realParent.rows[0].email} (${realParent.rows[0].first_name} ${realParent.rows[0].last_name})`);
    
    const changes = [];
    
    // 2. Vérifier et corriger children
    const childrenCheck = await client.query('SELECT id, first_name FROM children WHERE parent_id = $1', [fakeParentId]);
    if (childrenCheck.rows.length > 0) {
      console.log(`\n📋 children: ${childrenCheck.rows.length} enfant(s) avec faux parent_id`);
      console.log(`   → ${childrenCheck.rows.map(c => `${c.first_name} (id:${c.id})`).join(', ')}`);
      if (!dryRun) {
        await client.query('UPDATE children SET parent_id = $1 WHERE parent_id = $2', [realParentId, fakeParentId]);
        changes.push(`children: ${childrenCheck.rows.length} mis à jour`);
      }
    } else {
      console.log('\n📋 children: déjà correct (0 enfant avec faux parent_id)');
    }
    
    // 3. Vérifier et corriger enrollments
    const enrollCheck = await client.query('SELECT id, child_id FROM enrollments WHERE parent_id = $1', [fakeParentId]);
    if (enrollCheck.rows.length > 0) {
      console.log(`\n📝 enrollments: ${enrollCheck.rows.length} inscription(s) avec faux parent_id`);
      if (!dryRun) {
        await client.query('UPDATE enrollments SET parent_id = $1 WHERE parent_id = $2', [realParentId, fakeParentId]);
        changes.push(`enrollments: ${enrollCheck.rows.length} mis à jour`);
      }
    } else {
      console.log('\n📝 enrollments: OK (aucun avec faux parent_id)');
    }
    
    // 4. Vérifier activity_logs (target_type = 'parent' ou user_id)
    const activityCheck = await client.query(
      "SELECT id, title FROM activity_logs WHERE user_id = $1 OR (target_type = 'parent' AND target_id = $1)",
      [fakeParentId]
    );
    if (activityCheck.rows.length > 0) {
      console.log(`\n📊 activity_logs: ${activityCheck.rows.length} log(s) avec référence au faux parent`);
      if (!dryRun) {
        await client.query('UPDATE activity_logs SET user_id = $1 WHERE user_id = $2', [realParentId, fakeParentId]);
        await client.query("UPDATE activity_logs SET target_id = $1 WHERE target_type = 'parent' AND target_id = $2", [realParentId, fakeParentId]);
        changes.push(`activity_logs: ${activityCheck.rows.length} mis à jour`);
      }
    } else {
      console.log('\n📊 activity_logs: OK');
    }
    
    // 5. Vérifier alerts
    const alertCheck = await client.query('SELECT id, title FROM alerts WHERE target_user_id = $1 OR assigned_to = $1', [fakeParentId]);
    if (alertCheck.rows.length > 0) {
      console.log(`\n🚨 alerts: ${alertCheck.rows.length} alerte(s) liée(s) au faux parent`);
      if (!dryRun) {
        await client.query('UPDATE alerts SET target_user_id = $1 WHERE target_user_id = $2', [realParentId, fakeParentId]);
        await client.query('UPDATE alerts SET assigned_to = $1 WHERE assigned_to = $2', [realParentId, fakeParentId]);
        changes.push(`alerts: ${alertCheck.rows.length} mis à jour`);
      }
    } else {
      console.log('\n🚨 alerts: OK');
    }
    
    // 6. Vérifier si le faux parent a des connexions (auth tokens)
    const authCheck = await client.query('SELECT COUNT(*) as cnt FROM auth_tokens WHERE user_id = $1', [fakeParentId]);
    if (parseInt(authCheck.rows[0].cnt) > 0) {
      console.log(`\n🔑 auth_tokens: ${authCheck.rows[0].cnt} token(s) à supprimer`);
      if (!dryRun) {
        await client.query('DELETE FROM auth_tokens WHERE user_id = $1', [fakeParentId]);
        changes.push(`auth_tokens: ${authCheck.rows[0].cnt} supprimés`);
      }
    }
    
    // 7. Supprimer le faux parent
    if (!dryRun) {
      await client.query('DELETE FROM users WHERE id = $1', [fakeParentId]);
      changes.push(`users: parent fake ID ${fakeParentId} supprimé`);
      console.log(`\n🗑️  Faux parent supprimé: ${fakeParent.rows[0].email}`);
    } else {
      console.log(`\n[DRY-RUN] Le faux parent ${fakeParent.rows[0].email} ne serait PAS supprimé`);
    }
    
    // Résumé
    console.log('\n' + '='.repeat(50));
    if (dryRun) {
      console.log('MODE DRY-RUN - Aucune modification effectuée');
      console.log('Relance sans --dry-run pour appliquer les changements');
    } else {
      console.log('CHANGEMENTS APPLIQUÉS:');
      changes.forEach(c => console.log(`  ✅ ${c}`));
    }
    console.log('='.repeat(50));
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERREUR:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Parser les arguments
const args = process.argv.slice(2);
const fakeParentIdArg = args.find(a => a.startsWith('--fake-parent-id='));
const realParentIdArg = args.find(a => a.startsWith('--real-parent-id='));
const dryRun = args.includes('--dry-run');

if (!fakeParentIdArg || !realParentIdArg) {
  console.log(`
Usage: node scripts/fix-parent-duplicate.js --fake-parent-id=XX --real-parent-id=YY [--dry-run]

Options:
  --fake-parent-id=ID   ID du faux parent (avec fausse email)
  --real-parent-id=ID   ID du vrai parent (email correct)
  --dry-run             Simule sans modifier (recommandé d'abord)

Exemple:
  node scripts/fix-parent-duplicate.js --fake-parent-id=15 --real-parent-id=7 --dry-run
  node scripts/fix-parent-duplicate.js --fake-parent-id=15 --real-parent-id=7
`);
  process.exit(1);
}

const fakeParentId = parseInt(fakeParentIdArg.split('=')[1]);
const realParentId = parseInt(realParentIdArg.split('=')[1]);

fixParentDuplicate(fakeParentId, realParentId, dryRun);
