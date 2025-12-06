/**
 * Script d'audit de la base de données
 * Compare les tables/colonnes utilisées dans le code vs celles en DB
 * 
 * Usage: node scripts/db-audit.js
 */

require('dotenv').config();
const { pool } = require('../config/db_postgres');
const fs = require('fs');
const path = require('path');

// ============================================================
// PARTIE 1: Récupérer la structure de la base de données
// ============================================================

async function getDatabaseStructure() {
    console.log('\n📊 Récupération de la structure de la base de données...\n');

    const client = await pool.connect();

    try {
        // Récupérer toutes les tables
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

        const dbStructure = {};

        for (const table of tablesResult.rows) {
            const tableName = table.table_name;

            // Récupérer les colonnes de chaque table
            const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

            dbStructure[tableName] = columnsResult.rows.map(col => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
                default: col.column_default,
                maxLength: col.character_maximum_length
            }));
        }

        return dbStructure;

    } finally {
        client.release();
    }
}

// ============================================================
// PARTIE 2: Analyser le code pour trouver les tables/colonnes utilisées
// ============================================================

function analyzeCodeUsage() {
    console.log('\n🔍 Analyse du code source...\n');

    const codeUsage = {
        tables: new Set(),
        columns: {},
        queries: []
    };

    // Dossiers à analyser
    const dirsToAnalyze = [
        path.join(__dirname, '../controllers'),
        path.join(__dirname, '../routes_postgres'),
        path.join(__dirname, '../services'),
        path.join(__dirname, '../models'),
        path.join(__dirname, '../middleware'),
        path.join(__dirname, '../emails')
    ];

    // Patterns pour détecter les tables et colonnes
    const tablePatterns = [
        /FROM\s+(\w+)/gi,
        /JOIN\s+(\w+)/gi,
        /INTO\s+(\w+)/gi,
        /UPDATE\s+(\w+)/gi,
        /INSERT\s+INTO\s+(\w+)/gi,
        /DELETE\s+FROM\s+(\w+)/gi,
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi,
        /ALTER\s+TABLE\s+(\w+)/gi,
        /REFERENCES\s+(\w+)/gi
    ];

    // Colonnes connues à ignorer (mots-clés SQL)
    const sqlKeywords = new Set([
        'select', 'from', 'where', 'and', 'or', 'not', 'null', 'true', 'false',
        'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table',
        'if', 'exists', 'drop', 'alter', 'add', 'column', 'primary', 'key',
        'references', 'on', 'cascade', 'default', 'check', 'unique', 'index',
        'join', 'left', 'right', 'inner', 'outer', 'order', 'by', 'asc', 'desc',
        'limit', 'offset', 'group', 'having', 'count', 'sum', 'avg', 'min', 'max',
        'as', 'is', 'in', 'like', 'between', 'case', 'when', 'then', 'else', 'end',
        'coalesce', 'now', 'current_timestamp', 'current_date', 'to_char', 'date',
        'timestamp', 'integer', 'varchar', 'text', 'boolean', 'serial', 'decimal',
        'returning', 'with', 'distinct', 'all', 'any', 'some', 'lower', 'upper'
    ]);

    function analyzeFile(filePath) {
        if (!fs.existsSync(filePath)) return;

        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Extraire les requêtes SQL (entre backticks ou guillemets)
        const sqlMatches = content.match(/`[^`]*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)[^`]*`/gis) || [];
        const sqlMatches2 = content.match(/'[^']*(?:SELECT|INSERT|UPDATE|DELETE)[^']*'/gis) || [];
        const allSql = [...sqlMatches, ...sqlMatches2];

        for (const sql of allSql) {
            // Détecter les tables
            for (const pattern of tablePatterns) {
                let match;
                const regex = new RegExp(pattern.source, pattern.flags);
                while ((match = regex.exec(sql)) !== null) {
                    const tableName = match[1].toLowerCase();
                    if (!sqlKeywords.has(tableName) && tableName.length > 1) {
                        codeUsage.tables.add(tableName);
                    }
                }
            }

            // Détecter les colonnes (après SELECT, dans SET, dans WHERE, etc.)
            // Pattern: table.column ou juste column_name
            const columnPatterns = [
                /(\w+)\.(\w+)/g,  // table.column
                /(?:SELECT|SET|WHERE|AND|OR|ON)\s+[\w\s,.*]+?(?:FROM|WHERE|SET|VALUES|\)|$)/gi
            ];

            // Extraire colonnes avec alias de table
            let colMatch;
            const tableColRegex = /(\w+)\.(\w+)/g;
            while ((colMatch = tableColRegex.exec(sql)) !== null) {
                const tableName = colMatch[1].toLowerCase();
                const columnName = colMatch[2].toLowerCase();
                if (!sqlKeywords.has(tableName) && !sqlKeywords.has(columnName)) {
                    if (!codeUsage.columns[tableName]) {
                        codeUsage.columns[tableName] = new Set();
                    }
                    codeUsage.columns[tableName].add(columnName);
                }
            }
        }
    }

    function analyzeDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                analyzeDirectory(filePath);
            } else if (file.endsWith('.js')) {
                analyzeFile(filePath);
            }
        }
    }

    // Analyser tous les dossiers
    for (const dir of dirsToAnalyze) {
        analyzeDirectory(dir);
    }

    // Analyser aussi init_database.js et les migrations
    analyzeFile(path.join(__dirname, '../init_database.js'));
    analyzeDirectory(path.join(__dirname, '../database/migrations'));

    // Convertir les Sets en Arrays
    const result = {
        tables: Array.from(codeUsage.tables).sort(),
        columns: {}
    };

    for (const [table, cols] of Object.entries(codeUsage.columns)) {
        result.columns[table] = Array.from(cols).sort();
    }

    return result;
}

// ============================================================
// PARTIE 3: Générer le rapport de comparaison
// ============================================================

async function generateReport() {
    console.log('═'.repeat(70));
    console.log('  AUDIT BASE DE DONNÉES - CRÈCHE MIMA ELGHALIA');
    console.log('  Date: ' + new Date().toLocaleString('fr-FR'));
    console.log('═'.repeat(70));

    // 1. Récupérer la structure DB
    const dbStructure = await getDatabaseStructure();

    // 2. Analyser le code
    const codeUsage = analyzeCodeUsage();

    // 3. Générer le rapport
    const report = {
        generated_at: new Date().toISOString(),
        database: {
            tables: Object.keys(dbStructure).sort(),
            structure: dbStructure
        },
        code: codeUsage,
        comparison: {
            tables_in_db_not_in_code: [],
            tables_in_code_not_in_db: [],
            unused_columns: {},
            missing_columns: {}
        }
    };

    // Tables en DB mais pas dans le code
    for (const table of Object.keys(dbStructure)) {
        if (!codeUsage.tables.includes(table)) {
            report.comparison.tables_in_db_not_in_code.push(table);
        }
    }

    // Tables dans le code mais pas en DB
    for (const table of codeUsage.tables) {
        if (!dbStructure[table]) {
            report.comparison.tables_in_code_not_in_db.push(table);
        }
    }

    // Colonnes non utilisées (en DB mais pas dans le code)
    for (const [table, columns] of Object.entries(dbStructure)) {
        const usedCols = codeUsage.columns[table] || [];
        const unusedCols = columns
            .map(c => c.name)
            .filter(col => !usedCols.includes(col));

        if (unusedCols.length > 0) {
            report.comparison.unused_columns[table] = unusedCols;
        }
    }

    // ============================================================
    // AFFICHAGE DU RAPPORT
    // ============================================================

    console.log('\n\n📋 TABLES EN BASE DE DONNÉES (' + Object.keys(dbStructure).length + ')');
    console.log('─'.repeat(70));

    for (const [table, columns] of Object.entries(dbStructure)) {
        const isUsed = codeUsage.tables.includes(table);
        const status = isUsed ? '✅' : '⚠️ ';
        console.log(`\n${status} ${table.toUpperCase()} (${columns.length} colonnes)`);

        for (const col of columns) {
            const colUsed = (codeUsage.columns[table] || []).includes(col.name);
            const colStatus = colUsed ? '  ✓' : '  ○';
            const nullable = col.nullable ? '' : ' NOT NULL';
            const defaultVal = col.default ? ` DEFAULT ${col.default.substring(0, 20)}` : '';
            console.log(`${colStatus} ${col.name} (${col.type}${nullable}${defaultVal})`);
        }
    }

    console.log('\n\n' + '═'.repeat(70));
    console.log('📊 RÉSUMÉ DE LA COMPARAISON');
    console.log('═'.repeat(70));

    console.log('\n🔴 TABLES EN DB NON UTILISÉES DANS LE CODE:');
    if (report.comparison.tables_in_db_not_in_code.length === 0) {
        console.log('   Aucune');
    } else {
        for (const t of report.comparison.tables_in_db_not_in_code) {
            console.log(`   • ${t}`);
        }
    }

    console.log('\n🟡 TABLES DANS LE CODE MAIS PAS EN DB:');
    if (report.comparison.tables_in_code_not_in_db.length === 0) {
        console.log('   Aucune');
    } else {
        for (const t of report.comparison.tables_in_code_not_in_db) {
            console.log(`   • ${t}`);
        }
    }

    console.log('\n🟠 COLONNES POTENTIELLEMENT NON UTILISÉES:');
    console.log('   (Note: Certaines peuvent être utilisées dynamiquement)');
    let totalUnused = 0;
    for (const [table, cols] of Object.entries(report.comparison.unused_columns)) {
        if (cols.length > 0) {
            console.log(`\n   📁 ${table}:`);
            for (const col of cols) {
                console.log(`      ○ ${col}`);
                totalUnused++;
            }
        }
    }

    if (totalUnused === 0) {
        console.log('   Aucune colonne non utilisée détectée');
    }

    // Sauvegarder le rapport JSON
    const reportPath = path.join(__dirname, '../database/db-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n\n' + '═'.repeat(70));
    console.log(`📄 Rapport JSON sauvegardé: ${reportPath}`);
    console.log('═'.repeat(70));

    return report;
}

// ============================================================
// EXÉCUTION
// ============================================================

generateReport()
    .then(() => {
        console.log('\n✅ Audit terminé!\n');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erreur:', err);
        process.exit(1);
    });
