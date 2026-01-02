/**
 * Script pour extraire le schéma complet de la base DEV
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development'), override: true });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function exportSchema() {
    console.log('📊 Connexion à la base DEV:', process.env.DB_NAME);
    console.log('   Host:', process.env.DB_HOST);

    try {
        // 1. Lister toutes les tables
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📋 TABLES TROUVÉES:', tablesResult.rows.length);
        console.log('═══════════════════════════════════════════════════════\n');

        for (const row of tablesResult.rows) {
            console.log(`  - ${row.table_name}`);
        }

        // 2. Pour chaque table, extraire la structure
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📐 STRUCTURE DES TABLES');
        console.log('═══════════════════════════════════════════════════════\n');

        for (const row of tablesResult.rows) {
            const tableName = row.table_name;

            // Récupérer les colonnes
            const columnsResult = await pool.query(`
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);

            console.log(`\n📦 TABLE: ${tableName}`);
            console.log('─'.repeat(60));

            for (const col of columnsResult.rows) {
                let type = col.data_type;
                if (col.character_maximum_length) {
                    type += `(${col.character_maximum_length})`;
                } else if (col.numeric_precision && col.data_type === 'numeric') {
                    type += `(${col.numeric_precision},${col.numeric_scale})`;
                }

                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';

                console.log(`   ${col.column_name.padEnd(30)} ${type.padEnd(20)} ${nullable}${defaultVal}`);
            }
        }

        // 3. Générer le SQL CREATE TABLE
        console.log('\n\n═══════════════════════════════════════════════════════');
        console.log('📝 SQL CREATE TABLE STATEMENTS');
        console.log('═══════════════════════════════════════════════════════\n');

        for (const row of tablesResult.rows) {
            const tableName = row.table_name;

            // Utiliser pg_dump style query pour obtenir la définition exacte
            const ddlResult = await pool.query(`
                SELECT 
                    'CREATE TABLE IF NOT EXISTS ' || $1 || ' (' ||
                    string_agg(
                        column_name || ' ' || 
                        CASE 
                            WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '255') || ')'
                            WHEN data_type = 'integer' AND column_default LIKE 'nextval%' THEN 'SERIAL'
                            WHEN data_type = 'integer' THEN 'INTEGER'
                            WHEN data_type = 'bigint' THEN 'BIGINT'
                            WHEN data_type = 'boolean' THEN 'BOOLEAN'
                            WHEN data_type = 'text' THEN 'TEXT'
                            WHEN data_type = 'date' THEN 'DATE'
                            WHEN data_type = 'time without time zone' THEN 'TIME'
                            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
                            WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
                            WHEN data_type = 'numeric' THEN 'DECIMAL(' || numeric_precision || ',' || numeric_scale || ')'
                            WHEN data_type = 'jsonb' THEN 'JSONB'
                            WHEN data_type = 'json' THEN 'JSON'
                            WHEN data_type = 'ARRAY' THEN 'TEXT[]'
                            ELSE UPPER(data_type)
                        END ||
                        CASE WHEN is_nullable = 'NO' AND column_default NOT LIKE 'nextval%' THEN ' NOT NULL' ELSE '' END ||
                        CASE 
                            WHEN column_default IS NOT NULL AND column_default NOT LIKE 'nextval%' 
                            THEN ' DEFAULT ' || column_default 
                            ELSE '' 
                        END,
                        ', '
                        ORDER BY ordinal_position
                    ) || ');' as create_statement
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                GROUP BY table_name
            `, [tableName]);

            if (ddlResult.rows.length > 0) {
                console.log(`-- Table: ${tableName}`);
                console.log(ddlResult.rows[0].create_statement);
                console.log('');
            }
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await pool.end();
    }
}

exportSchema();
