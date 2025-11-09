#!/usr/bin/env node

/**
 * Script pour vérifier la structure des tables
 */

require('dotenv').config();
const db = require('../config/db_postgres');

async function checkTables() {
  try {
    console.log('🔍 VÉRIFICATION STRUCTURE DES TABLES\n');
    
    const tables = ['absence_requests', 'nursery_settings', 'holidays', 'attendance'];
    
    for (const tableName of tables) {
      console.log(`\n📋 Table: ${tableName}`);
      console.log('─'.repeat(60));
      
      const result = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      if (result.rows.length === 0) {
        console.log(`❌ Table "${tableName}" n'existe pas !`);
      } else {
        result.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? '✓' : '✗';
          const def = col.column_default ? ` = ${col.column_default}` : '';
          console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} NULL:${nullable}${def}`);
        });
      }
    }
    
    console.log('\n✅ Vérification terminée\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkTables();
