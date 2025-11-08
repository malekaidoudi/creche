#!/usr/bin/env node

/**
 * Script pour insérer des logs de test dans la base de données
 */

const { Pool } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_NAME,
  ssl: { rejectUnauthorized: false }
};

async function seedLogs() {
  console.log('📝 INSERTION DES LOGS DE TEST');
  console.log('==============================\n');
  
  const pool = new Pool(config);
  const client = await pool.connect();
  
  try {
    // Récupérer les IDs des utilisateurs existants
    const usersResult = await client.query('SELECT id, first_name, last_name, role FROM users LIMIT 5');
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }
    
    console.log(`✅ ${users.length} utilisateurs trouvés\n`);
    
    // Logs de test variés
    const testLogs = [
      {
        user_id: users[0].id,
        action: 'login',
        description: `${users[0].first_name} ${users[0].last_name} s'est connecté au système`
      },
      {
        user_id: users[1]?.id || users[0].id,
        action: 'create_child',
        description: `Nouvel enfant ajouté par ${users[1]?.first_name || users[0].first_name} ${users[1]?.last_name || users[0].last_name}`
      },
      {
        user_id: users[0].id,
        action: 'approve_enrollment',
        description: `${users[0].first_name} ${users[0].last_name} a approuvé une demande d'inscription`
      },
      {
        user_id: users[2]?.id || users[0].id,
        action: 'check_in',
        description: `Arrivée enregistrée par ${users[2]?.first_name || users[0].first_name} ${users[2]?.last_name || users[0].last_name}`
      },
      {
        user_id: users[1]?.id || users[0].id,
        action: 'update_profile',
        description: `${users[1]?.first_name || users[0].first_name} ${users[1]?.last_name || users[0].last_name} a mis à jour son profil`
      },
      {
        user_id: users[0].id,
        action: 'create_enrollment',
        description: `Nouvelle demande d'inscription créée par ${users[0].first_name} ${users[0].last_name}`
      },
      {
        user_id: users[3]?.id || users[0].id,
        action: 'check_out',
        description: `Départ enregistré par ${users[3]?.first_name || users[0].first_name} ${users[3]?.last_name || users[0].last_name}`
      },
      {
        user_id: users[2]?.id || users[0].id,
        action: 'create_document',
        description: `Document ajouté par ${users[2]?.first_name || users[0].first_name} ${users[2]?.last_name || users[0].last_name}`
      },
      {
        user_id: users[0].id,
        action: 'reject_enrollment',
        description: `${users[0].first_name} ${users[0].last_name} a rejeté une demande d'inscription`
      },
      {
        user_id: users[4]?.id || users[0].id,
        action: 'logout',
        description: `${users[4]?.first_name || users[0].first_name} ${users[4]?.last_name || users[0].last_name} s'est déconnecté`
      }
    ];
    
    // Insérer les logs avec des timestamps échelonnés
    console.log('📝 Insertion des logs...\n');
    
    for (let i = 0; i < testLogs.length; i++) {
      const log = testLogs[i];
      const minutesAgo = (testLogs.length - i) * 15; // Échelonner les logs toutes les 15 minutes
      
      await client.query(`
        INSERT INTO logs (user_id, action, description, created_at)
        VALUES ($1, $2, $3, NOW() - INTERVAL '${minutesAgo} minutes')
      `, [log.user_id, log.action, log.description]);
      
      console.log(`✅ Log ${i + 1}/${testLogs.length}: ${log.action} (il y a ${minutesAgo} min)`);
    }
    
    console.log('\n✅ TOUS LES LOGS ONT ÉTÉ INSÉRÉS AVEC SUCCÈS !');
    console.log(`📊 Total: ${testLogs.length} logs créés\n`);
    
    // Afficher un aperçu des logs
    const logsResult = await client.query(`
      SELECT 
        l.id,
        l.action,
        l.description,
        l.created_at,
        u.first_name,
        u.last_name
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `);
    
    console.log('📋 APERÇU DES 5 DERNIERS LOGS:');
    console.log('================================');
    logsResult.rows.forEach((log, index) => {
      console.log(`${index + 1}. [${log.action}] ${log.description}`);
      console.log(`   Par: ${log.first_name} ${log.last_name}`);
      console.log(`   Date: ${new Date(log.created_at).toLocaleString('fr-FR')}\n`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution
if (require.main === module) {
  seedLogs().catch(console.error);
}

module.exports = { seedLogs };
