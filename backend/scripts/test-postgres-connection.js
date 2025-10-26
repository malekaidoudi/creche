#!/usr/bin/env node

/**
 * Script de test de connexion PostgreSQL Neon
 * Valide la configuration et teste les opérations de base
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuration PostgreSQL
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
};

async function testConnection() {
  console.log('🧪 TEST DE CONNEXION POSTGRESQL NEON');
  console.log('=====================================');
  
  const pool = new Pool(config);
  
  try {
    // Test 1: Connexion de base
    console.log('1️⃣ Test de connexion...');
    const client = await pool.connect();
    console.log('✅ Connexion établie');
    
    // Test 2: Version PostgreSQL
    console.log('\n2️⃣ Vérification version PostgreSQL...');
    const versionResult = await client.query('SELECT version()');
    console.log('✅ Version:', versionResult.rows[0].version.split(' ')[0]);
    
    // Test 3: Heure serveur
    console.log('\n3️⃣ Test heure serveur...');
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Heure serveur:', timeResult.rows[0].current_time);
    
    // Test 4: Création table de test
    console.log('\n4️⃣ Test création table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_migration (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table test_migration créée');
    
    // Test 5: Insertion de données
    console.log('\n5️⃣ Test insertion données...');
    const insertResult = await client.query(
      'INSERT INTO test_migration (name) VALUES ($1) RETURNING id',
      ['Test Migration PostgreSQL']
    );
    console.log('✅ Données insérées, ID:', insertResult.rows[0].id);
    
    // Test 6: Lecture de données
    console.log('\n6️⃣ Test lecture données...');
    const selectResult = await client.query('SELECT * FROM test_migration');
    console.log('✅ Données lues:', selectResult.rows.length, 'lignes');
    
    // Test 7: Mise à jour
    console.log('\n7️⃣ Test mise à jour...');
    await client.query(
      'UPDATE test_migration SET name = $1 WHERE id = $2',
      ['Test Migration PostgreSQL - Modifié', insertResult.rows[0].id]
    );
    console.log('✅ Données mises à jour');
    
    // Test 8: Suppression table de test
    console.log('\n8️⃣ Nettoyage...');
    await client.query('DROP TABLE test_migration');
    console.log('✅ Table de test supprimée');
    
    client.release();
    
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('PostgreSQL Neon est prêt pour la migration');
    
  } catch (error) {
    console.error('\n❌ ERREUR DE TEST:', error.message);
    console.error('Détails:', error.detail || 'Aucun détail disponible');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Test de configuration
function validateConfig() {
  console.log('🔍 Validation de la configuration...');
  
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:', missing.join(', '));
    console.error('💡 Assurez-vous que votre fichier .env contient toutes les variables PostgreSQL');
    process.exit(1);
  }
  
  console.log('✅ Configuration valide');
  console.log('📋 Paramètres:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   SSL: Activé`);
}

// Exécution
if (require.main === module) {
  validateConfig();
  testConnection().catch(console.error);
}

module.exports = { testConnection, validateConfig };
