#!/usr/bin/env node

/**
 * Script de migration MySQL vers PostgreSQL Neon
 * Exporte les données MySQL et les importe dans PostgreSQL
 */

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config();

// Configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_NAME || 'mima_elghalia_db'
};

const POSTGRES_CONFIG = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_NAME,
  ssl: { rejectUnauthorized: false }
};

// Tables à migrer dans l'ordre (dépendances)
const TABLES_ORDER = [
  'users',
  'children', 
  'enrollments',
  'attendance',
  'holidays',
  'nursery_settings'
];

// Mapping des types MySQL vers PostgreSQL
const TYPE_MAPPING = {
  'AUTO_INCREMENT': 'SERIAL',
  'TINYINT(1)': 'BOOLEAN',
  'DATETIME': 'TIMESTAMP',
  'ENUM': 'VARCHAR',
  'NOW()': 'CURRENT_TIMESTAMP'
};

class MigrationTool {
  constructor() {
    this.mysqlConnection = null;
    this.pgPool = null;
    this.migrationReport = {
      startTime: new Date(),
      tables: {},
      errors: [],
      summary: {}
    };
  }

  async initialize() {
    console.log('🔧 Initialisation des connexions...');
    
    console.log('📋 Configuration MySQL:', {
      host: MYSQL_CONFIG.host,
      port: MYSQL_CONFIG.port,
      user: MYSQL_CONFIG.user,
      database: MYSQL_CONFIG.database,
      passwordSet: !!MYSQL_CONFIG.password
    });
    
    // Connexion MySQL
    try {
      this.mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
      console.log('✅ Connexion MySQL établie');
    } catch (error) {
      console.error('❌ Erreur connexion MySQL:', error.message);
      console.error('❌ Code erreur:', error.code);
      console.error('❌ Configuration utilisée:', MYSQL_CONFIG);
      throw error;
    }

    // Connexion PostgreSQL
    try {
      this.pgPool = new Pool(POSTGRES_CONFIG);
      const client = await this.pgPool.connect();
      console.log('✅ Connexion PostgreSQL Neon établie');
      client.release();
    } catch (error) {
      console.error('❌ Erreur connexion PostgreSQL:', error.message);
      throw error;
    }
  }

  async exportMySQLData(tableName) {
    console.log(`📤 Export table MySQL: ${tableName}`);
    
    try {
      // Vérifier si la table existe
      const [tables] = await this.mysqlConnection.execute(
        'SHOW TABLES LIKE ?', [tableName]
      );
      
      if (tables.length === 0) {
        console.log(`⚠️  Table ${tableName} n'existe pas dans MySQL`);
        return { rows: [], count: 0 };
      }

      // Exporter les données
      const [rows] = await this.mysqlConnection.execute(`SELECT * FROM ${tableName}`);
      
      console.log(`✅ ${rows.length} lignes exportées de ${tableName}`);
      return { rows, count: rows.length };
      
    } catch (error) {
      console.error(`❌ Erreur export ${tableName}:`, error.message);
      this.migrationReport.errors.push({
        table: tableName,
        operation: 'export',
        error: error.message
      });
      return { rows: [], count: 0 };
    }
  }

  convertMySQLToPostgreSQL(tableName, rows) {
    console.log(`🔄 Conversion données ${tableName} pour PostgreSQL...`);
    
    if (!rows || rows.length === 0) return [];

    return rows.map(row => {
      const convertedRow = { ...row };
      
      // Conversions spécifiques par table
      switch (tableName) {
        case 'users':
          // Conversion ENUM role
          if (convertedRow.role) {
            convertedRow.role = convertedRow.role.toString();
          }
          // Conversion TINYINT(1) vers BOOLEAN
          if (typeof convertedRow.is_active === 'number') {
            convertedRow.is_active = convertedRow.is_active === 1;
          }
          break;
          
        case 'children':
          if (typeof convertedRow.is_active === 'number') {
            convertedRow.is_active = convertedRow.is_active === 1;
          }
          break;
          
        case 'enrollments':
          if (convertedRow.status) {
            convertedRow.status = convertedRow.status.toString();
          }
          if (typeof convertedRow.lunch_assistance === 'number') {
            convertedRow.lunch_assistance = convertedRow.lunch_assistance === 1;
          }
          if (typeof convertedRow.regulation_accepted === 'number') {
            convertedRow.regulation_accepted = convertedRow.regulation_accepted === 1;
          }
          break;
          
        case 'holidays':
          if (typeof convertedRow.is_closed === 'number') {
            convertedRow.is_closed = convertedRow.is_closed === 1;
          }
          break;
          
        case 'nursery_settings':
          if (typeof convertedRow.is_active === 'number') {
            convertedRow.is_active = convertedRow.is_active === 1;
          }
          break;
      }
      
      return convertedRow;
    });
  }

  async importToPostgreSQL(tableName, convertedRows) {
    console.log(`📥 Import dans PostgreSQL: ${tableName}`);
    
    if (!convertedRows || convertedRows.length === 0) {
      console.log(`⚠️  Aucune donnée à importer pour ${tableName}`);
      return 0;
    }

    const client = await this.pgPool.connect();
    let importedCount = 0;
    
    try {
      await client.query('BEGIN');
      
      // Vider la table avant import (CASCADE pour les FK)
      await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
      
      for (const row of convertedRows) {
        try {
          // Construire la requête d'insertion dynamiquement
          const columns = Object.keys(row).filter(key => key !== 'id'); // Exclure id (SERIAL)
          const values = columns.map(col => row[col]);
          const placeholders = columns.map((_, index) => `$${index + 1}`);
          
          const insertQuery = `
            INSERT INTO ${tableName} (${columns.join(', ')}) 
            VALUES (${placeholders.join(', ')})
          `;
          
          await client.query(insertQuery, values);
          importedCount++;
          
        } catch (error) {
          console.error(`❌ Erreur insertion ligne ${tableName}:`, error.message);
          this.migrationReport.errors.push({
            table: tableName,
            operation: 'insert',
            error: error.message,
            data: row
          });
        }
      }
      
      await client.query('COMMIT');
      console.log(`✅ ${importedCount} lignes importées dans ${tableName}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Erreur transaction ${tableName}:`, error.message);
      throw error;
    } finally {
      client.release();
    }
    
    return importedCount;
  }

  async migrateTable(tableName) {
    console.log(`\n🔄 Migration table: ${tableName}`);
    
    const startTime = Date.now();
    
    // 1. Export MySQL
    const { rows, count: exportCount } = await this.exportMySQLData(tableName);
    
    // 2. Conversion
    const convertedRows = this.convertMySQLToPostgreSQL(tableName, rows);
    
    // 3. Import PostgreSQL
    const importCount = await this.importToPostgreSQL(tableName, convertedRows);
    
    const duration = Date.now() - startTime;
    
    // Rapport
    this.migrationReport.tables[tableName] = {
      exportCount,
      importCount,
      duration: `${duration}ms`,
      success: exportCount === importCount
    };
    
    console.log(`✅ Migration ${tableName} terminée: ${importCount}/${exportCount} lignes (${duration}ms)`);
  }

  async validateMigration() {
    console.log('\n🔍 Validation de la migration...');
    
    const client = await this.pgPool.connect();
    
    try {
      for (const tableName of TABLES_ORDER) {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const pgCount = parseInt(result.rows[0].count);
        
        const mysqlResult = await this.mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const mysqlCount = mysqlResult[0][0].count;
        
        const isValid = pgCount === mysqlCount;
        
        console.log(`${isValid ? '✅' : '❌'} ${tableName}: MySQL(${mysqlCount}) → PostgreSQL(${pgCount})`);
        
        this.migrationReport.tables[tableName].validation = {
          mysqlCount,
          pgCount,
          isValid
        };
      }
    } catch (error) {
      console.error('❌ Erreur validation:', error.message);
    } finally {
      client.release();
    }
  }

  async generateReport() {
    console.log('\n📊 Génération du rapport de migration...');
    
    this.migrationReport.endTime = new Date();
    this.migrationReport.duration = this.migrationReport.endTime - this.migrationReport.startTime;
    
    // Calcul du résumé
    const totalTables = Object.keys(this.migrationReport.tables).length;
    const successfulTables = Object.values(this.migrationReport.tables)
      .filter(table => table.success).length;
    const totalExported = Object.values(this.migrationReport.tables)
      .reduce((sum, table) => sum + table.exportCount, 0);
    const totalImported = Object.values(this.migrationReport.tables)
      .reduce((sum, table) => sum + table.importCount, 0);
    
    this.migrationReport.summary = {
      totalTables,
      successfulTables,
      totalExported,
      totalImported,
      successRate: `${((successfulTables / totalTables) * 100).toFixed(1)}%`,
      errorCount: this.migrationReport.errors.length
    };
    
    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, '../migration_report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.migrationReport, null, 2));
    
    console.log('✅ Rapport sauvegardé:', reportPath);
    
    // Afficher le résumé
    console.log('\n📋 RÉSUMÉ DE LA MIGRATION:');
    console.log(`Tables migrées: ${successfulTables}/${totalTables}`);
    console.log(`Lignes migrées: ${totalImported}/${totalExported}`);
    console.log(`Taux de succès: ${this.migrationReport.summary.successRate}`);
    console.log(`Erreurs: ${this.migrationReport.summary.errorCount}`);
    console.log(`Durée totale: ${Math.round(this.migrationReport.duration / 1000)}s`);
  }

  async run() {
    try {
      console.log('🚀 DÉBUT DE LA MIGRATION MYSQL → POSTGRESQL NEON');
      console.log('================================================');
      
      await this.initialize();
      
      // Migration de chaque table dans l'ordre
      for (const tableName of TABLES_ORDER) {
        await this.migrateTable(tableName);
      }
      
      // Validation
      await this.validateMigration();
      
      // Rapport final
      await this.generateReport();
      
      console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
      
    } catch (error) {
      console.error('\n💥 ERREUR CRITIQUE:', error.message);
      process.exit(1);
    } finally {
      // Fermeture des connexions
      if (this.mysqlConnection) {
        await this.mysqlConnection.end();
      }
      if (this.pgPool) {
        await this.pgPool.end();
      }
    }
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const migration = new MigrationTool();
  migration.run().catch(console.error);
}

module.exports = MigrationTool;
