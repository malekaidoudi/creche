/**
 * Script d'analyse de la base de données
 * Identifie toutes les tables et colonnes utilisées dans le code
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db_postgres');

// Tables et colonnes utilisées dans le code
const usedTables = new Set();
const usedColumns = new Map(); // table -> Set(columns)

// Parcourir tous les fichiers JS
function scanDirectory(dir, fileCallback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        scanDirectory(filePath, fileCallback);
      }
    } else if (file.endsWith('.js') || file.endsWith('.sql')) {
      fileCallback(filePath);
    }
  }
}

// Extraire les tables et colonnes des requêtes SQL
function extractTablesAndColumns(content) {
  // Patterns pour détecter les tables
  const tablePatterns = [
    /FROM\s+([a-z_]+)/gi,
    /JOIN\s+([a-z_]+)/gi,
    /INSERT\s+INTO\s+([a-z_]+)/gi,
    /UPDATE\s+([a-z_]+)/gi,
    /DELETE\s+FROM\s+([a-z_]+)/gi,
  ];
  
  // Extraire les tables
  tablePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const tableName = match[1].toLowerCase();
      if (tableName && !tableName.includes('(') && tableName.length > 2) {
        usedTables.add(tableName);
        if (!usedColumns.has(tableName)) {
          usedColumns.set(tableName, new Set());
        }
      }
    }
  });
  
  // Extraire les colonnes (SELECT col1, col2 FROM...)
  const selectPattern = /SELECT\s+(.*?)\s+FROM/gis;
  let match;
  while ((match = selectPattern.exec(content)) !== null) {
    const columns = match[1];
    // Extraire les noms de colonnes
    const colMatches = columns.match(/([a-z_]+\.[a-z_]+|[a-z_]+)/gi);
    if (colMatches) {
      colMatches.forEach(col => {
        if (col !== '*' && col !== 'SELECT' && col !== 'DISTINCT') {
          const parts = col.split('.');
          if (parts.length === 2) {
            const [table, column] = parts;
            if (usedColumns.has(table.toLowerCase())) {
              usedColumns.get(table.toLowerCase()).add(column.toLowerCase());
            }
          }
        }
      });
    }
  }
}

async function analyzeDatabaseSchema() {
  console.log('🔍 Analyse de la base de données...\n');
  
  try {
    // 1. Scanner tous les fichiers du projet
    console.log('📂 Scan des fichiers du projet...');
    const backendDir = path.join(__dirname, '..');
    
    scanDirectory(backendDir, (filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      extractTablesAndColumns(content);
    });
    
    console.log(`✅ ${usedTables.size} tables trouvées dans le code\n`);
    
    // 2. Récupérer le schéma réel de la base
    console.log('📊 Récupération du schéma PostgreSQL...');
    const schemaQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    
    const result = await pool.query(schemaQuery);
    
    // Organiser par table
    const dbSchema = new Map();
    result.rows.forEach(row => {
      if (!dbSchema.has(row.table_name)) {
        dbSchema.set(row.table_name, []);
      }
      dbSchema.get(row.table_name).push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable
      });
    });
    
    console.log(`✅ ${dbSchema.size} tables dans la base\n`);
    
    // 3. Comparer et identifier les tables/colonnes inutilisées
    console.log('🔍 Analyse des différences...\n');
    console.log('='.repeat(80));
    console.log('TABLES UTILISÉES DANS LE CODE:');
    console.log('='.repeat(80));
    Array.from(usedTables).sort().forEach(table => {
      const cols = usedColumns.get(table);
      console.log(`\n📋 ${table}`);
      if (cols && cols.size > 0) {
        console.log(`   Colonnes: ${Array.from(cols).sort().join(', ')}`);
      }
    });
    
    console.log('\n\n' + '='.repeat(80));
    console.log('TABLES DANS LA BASE MAIS NON UTILISÉES:');
    console.log('='.repeat(80));
    const unusedTables = [];
    dbSchema.forEach((columns, tableName) => {
      if (!usedTables.has(tableName)) {
        unusedTables.push(tableName);
        console.log(`\n❌ ${tableName}`);
        console.log(`   Colonnes: ${columns.map(c => c.column).join(', ')}`);
      }
    });
    
    // 4. Générer le rapport
    const report = {
      timestamp: new Date().toISOString(),
      usedTables: Array.from(usedTables).sort(),
      unusedTables: unusedTables.sort(),
      totalTablesInDb: dbSchema.size,
      totalTablesUsed: usedTables.size,
      schema: Object.fromEntries(dbSchema)
    };
    
    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, 'database-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n\n' + '='.repeat(80));
    console.log('RÉSUMÉ:');
    console.log('='.repeat(80));
    console.log(`📊 Tables dans la base: ${dbSchema.size}`);
    console.log(`✅ Tables utilisées: ${usedTables.size}`);
    console.log(`❌ Tables inutilisées: ${unusedTables.length}`);
    console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

async function main() {
  try {
    const report = await analyzeDatabaseSchema();
    
    console.log('\n\n' + '='.repeat(80));
    console.log('TABLES À SUPPRIMER:');
    console.log('='.repeat(80));
    
    if (report.unusedTables.length > 0) {
      console.log('\nCommandes SQL pour supprimer les tables inutilisées:\n');
      report.unusedTables.forEach(table => {
        console.log(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      });
    } else {
      console.log('\n✅ Aucune table inutilisée détectée');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();
