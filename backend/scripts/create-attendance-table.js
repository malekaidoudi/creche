require('dotenv').config({ path: '../.env' });
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function createAttendanceTable() {
  try {
    console.log('🔄 Création de la table attendance...');
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '../database/attendance_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Diviser les requêtes par point-virgule
    const queries = sqlContent.split(';').filter(query => query.trim().length > 0);
    
    // Exécuter chaque requête
    for (const query of queries) {
      if (query.trim()) {
        console.log('Exécution:', query.trim().substring(0, 50) + '...');
        await db.execute(query.trim());
      }
    }
    
    console.log('✅ Table attendance créée avec succès !');
    
    // Vérifier les données
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM attendance');
    console.log(`📊 ${rows[0].count} enregistrements de présence créés`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAttendanceTable();
