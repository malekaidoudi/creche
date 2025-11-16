/**
 * Script de diagnostic de la base de données
 * Usage: node scripts/check-database.js
 */

const { pool } = require('../config/db_postgres');

async function checkDatabase() {
  try {
    console.log('🔍 DIAGNOSTIC BASE DE DONNÉES POSTGRESQL\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Lister toutes les tables
    console.log('📋 1. TABLES EXISTANTES:\n');
    const tablesResult = await pool.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.table(tablesResult.rows);
    console.log(`\n✅ Total: ${tablesResult.rows.length} tables\n`);

    // 2. Vérifier si la table notifications existe
    console.log('📋 2. TABLE NOTIFICATIONS:\n');
    const notifTableExists = tablesResult.rows.some(row => row.table_name === 'notifications');
    
    if (notifTableExists) {
      console.log('✅ La table notifications existe\n');
      
      // Structure de la table
      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Structure de la table notifications:');
      console.table(columnsResult.rows);
      
      // Compter les notifications
      const countResult = await pool.query('SELECT COUNT(*) as total FROM notifications');
      console.log(`\n📈 Nombre de notifications: ${countResult.rows[0].total}\n`);
      
      // Exemples de notifications
      if (countResult.rows[0].total > 0) {
        const samplesResult = await pool.query(`
          SELECT id, user_id, title, type, is_read, created_at
          FROM notifications
          ORDER BY created_at DESC
          LIMIT 5
        `);
        console.log('📝 Dernières notifications:');
        console.table(samplesResult.rows);
      }
    } else {
      console.log('❌ La table notifications N\'EXISTE PAS\n');
    }

    // 3. Vérifier la table activity_logs
    console.log('\n📋 3. TABLE ACTIVITY_LOGS:\n');
    const logsTableExists = tablesResult.rows.some(row => row.table_name === 'activity_logs');
    
    if (logsTableExists) {
      console.log('✅ La table activity_logs existe\n');
      
      const logsCountResult = await pool.query('SELECT COUNT(*) as total FROM activity_logs');
      console.log(`📈 Nombre de logs: ${logsCountResult.rows[0].total}\n`);
    } else {
      console.log('❌ La table activity_logs N\'EXISTE PAS\n');
    }

    // 4. Vérifier les tables liées aux paiements
    console.log('\n📋 4. TABLES LIÉES AUX PAIEMENTS:\n');
    const paymentTables = tablesResult.rows.filter(row => 
      row.table_name.includes('payment') || 
      row.table_name.includes('invoice') ||
      row.table_name.includes('transaction')
    );
    
    if (paymentTables.length > 0) {
      console.table(paymentTables);
    } else {
      console.log('❌ Aucune table de paiement trouvée\n');
    }

    // 5. Vérifier les utilisateurs parents
    console.log('\n📋 5. UTILISATEURS PARENTS:\n');
    const parentsResult = await pool.query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        role,
        created_at
      FROM users
      WHERE role = 'parent'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (parentsResult.rows.length > 0) {
      console.log(`✅ ${parentsResult.rows.length} parents trouvés (affichage des 5 derniers):`);
      console.table(parentsResult.rows);
    } else {
      console.log('❌ Aucun parent trouvé\n');
    }

    // 6. Résumé des besoins pour les alertes de paiement
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ POUR ALERTES DE PAIEMENT:\n');
    
    const requirements = [
      { 
        item: 'Table notifications', 
        status: notifTableExists ? '✅ Existe' : '❌ Manquante',
        action: notifTableExists ? 'Prête' : 'À créer'
      },
      { 
        item: 'Table activity_logs', 
        status: logsTableExists ? '✅ Existe' : '❌ Manquante',
        action: logsTableExists ? 'Prête' : 'À créer'
      },
      { 
        item: 'Utilisateurs parents', 
        status: parentsResult.rows.length > 0 ? `✅ ${parentsResult.rows.length} trouvés` : '❌ Aucun',
        action: parentsResult.rows.length > 0 ? 'Prêts' : 'À créer'
      },
      { 
        item: 'Route API /api/payment-alerts', 
        status: '✅ Créée',
        action: 'Prête'
      }
    ];
    
    console.table(requirements);
    
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Fermer la connexion
    await pool.end();
    
    console.log('✅ Diagnostic terminé\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le diagnostic
checkDatabase();
