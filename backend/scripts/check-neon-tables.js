#!/usr/bin/env node

/**
 * Vérification des tables dans PostgreSQL Neon
 */

const { Pool } = require('pg');
require('dotenv').config();

async function checkNeonTables() {
  console.log('🔍 VÉRIFICATION TABLES POSTGRESQL NEON');
  console.log('=====================================');
  
  const config = {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_NAME,
    ssl: { rejectUnauthorized: false }
  };
  
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    
    // 1. Lister toutes les tables
    console.log('1️⃣ Tables existantes dans Neon:');
    const tablesResult = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ Aucune table trouvée !');
    } else {
      tablesResult.rows.forEach(table => {
        console.log(`   📋 ${table.table_name} (${table.table_type})`);
      });
    }
    
    // 2. Compter les lignes dans chaque table
    console.log('\n2️⃣ Nombre de lignes par table:');
    for (const table of tablesResult.rows) {
      if (table.table_type === 'BASE TABLE') {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
          console.log(`   ${table.table_name}: ${countResult.rows[0].count} lignes`);
        } catch (error) {
          console.log(`   ${table.table_name}: Erreur lecture (${error.message})`);
        }
      }
    }
    
    // 3. Vérifier les tables attendues
    console.log('\n3️⃣ Vérification tables attendues:');
    const expectedTables = [
      'users', 'children', 'enrollments', 'attendance', 
      'holidays', 'nursery_settings'
    ];
    
    for (const expectedTable of expectedTables) {
      const exists = tablesResult.rows.some(t => t.table_name === expectedTable);
      console.log(`   ${exists ? '✅' : '❌'} ${expectedTable}`);
    }
    
    // 4. Vérifier les données de base
    console.log('\n4️⃣ Vérification données de base:');
    
    // Utilisateurs
    try {
      const usersResult = await client.query('SELECT id, email, role FROM users ORDER BY id');
      console.log('   👥 Utilisateurs:');
      usersResult.rows.forEach(user => {
        console.log(`      - ${user.email} (${user.role})`);
      });
    } catch (error) {
      console.log('   ❌ Erreur lecture users:', error.message);
    }
    
    // Paramètres
    try {
      const settingsResult = await client.query('SELECT setting_key, value_fr FROM nursery_settings LIMIT 5');
      console.log('   ⚙️ Paramètres (échantillon):');
      settingsResult.rows.forEach(setting => {
        console.log(`      - ${setting.setting_key}: ${setting.value_fr}`);
      });
    } catch (error) {
      console.log('   ❌ Erreur lecture nursery_settings:', error.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

// Exécution
if (require.main === module) {
  checkNeonTables().catch(console.error);
}

module.exports = { checkNeonTables };
