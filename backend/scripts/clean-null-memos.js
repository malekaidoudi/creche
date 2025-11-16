/**
 * Script pour nettoyer les mémos avec created_by = NULL
 * Usage: node scripts/clean-null-memos.js
 */

const { pool } = require('../config/db_postgres');

async function cleanNullMemos() {
  try {
    console.log('🧹 NETTOYAGE DES MÉMOS NULL\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Trouver les mémos avec created_by NULL
    console.log('🔍 Recherche des mémos avec created_by = NULL...\n');
    
    const nullMemosResult = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.status,
        e.created_by,
        e.created_at
      FROM events e
      WHERE e.type = 'memo' 
        AND e.created_by IS NULL
        AND e.deleted_at IS NULL
      ORDER BY e.created_at DESC
    `);

    if (nullMemosResult.rows.length === 0) {
      console.log('✅ Aucun mémo avec created_by = NULL trouvé\n');
      console.log('Le système est propre ! 🎉\n');
      await pool.end();
      process.exit(0);
    }

    console.log(`⚠️  ${nullMemosResult.rows.length} mémo(s) avec created_by = NULL trouvé(s):\n`);
    console.table(nullMemosResult.rows);

    // 2. Afficher les statistiques
    console.log('\n📊 STATISTIQUES:\n');
    
    const statsResult = await pool.query(`
      SELECT 
        CASE 
          WHEN created_by IS NULL THEN 'NULL (à supprimer)'
          ELSE 'Valide'
        END as status,
        COUNT(*) as count
      FROM events
      WHERE type = 'memo' AND deleted_at IS NULL
      GROUP BY created_by IS NULL
    `);

    console.table(statsResult.rows);

    // 3. Supprimer les mémos NULL
    console.log('\n🗑️  SUPPRESSION DES MÉMOS NULL...\n');

    const deleteResult = await pool.query(`
      UPDATE events
      SET deleted_at = NOW()
      WHERE type = 'memo' 
        AND created_by IS NULL
        AND deleted_at IS NULL
      RETURNING id, title
    `);

    console.log(`✅ ${deleteResult.rows.length} mémo(s) supprimé(s):\n`);
    console.table(deleteResult.rows);

    // 4. Vérification finale
    console.log('\n✅ VÉRIFICATION FINALE:\n');
    
    const finalCheckResult = await pool.query(`
      SELECT 
        COUNT(*) as total_memos,
        COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_memos,
        COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as valid_memos
      FROM events
      WHERE type = 'memo' AND deleted_at IS NULL
    `);

    console.table(finalCheckResult.rows);

    if (finalCheckResult.rows[0].null_memos === '0') {
      console.log('\n🎉 Nettoyage terminé avec succès !');
      console.log('✅ Tous les mémos ont maintenant un created_by valide\n');
    } else {
      console.log('\n⚠️  Il reste encore des mémos NULL\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

cleanNullMemos();
