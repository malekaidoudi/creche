/**
 * Script pour synchroniser le schéma de DEV vers PROD
 * Copie EXACTEMENT toutes les tables de mima_elghalia_db vers neondb
 */

const path = require('path');
const { Pool } = require('pg');

// Connexion DEV
const devPool = new Pool({
    host: 'ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_ioMNXW9K2sbw',
    database: 'mima_elghalia_db',
    ssl: { rejectUnauthorized: false }
});

// Connexion PROD
const prodPool = new Pool({
    host: 'ep-soft-lake-aglnm655-pooler.c-2.eu-central-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_xsOVFf5lP1yk',
    database: 'neondb',
    ssl: { rejectUnauthorized: false }
});

const bcrypt = require('bcryptjs');

async function syncSchema() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔄 SYNCHRONISATION SCHÉMA DEV → PROD');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        // Test connexions
        console.log('📡 Test connexion DEV (mima_elghalia_db)...');
        await devPool.query('SELECT NOW()');
        console.log('✅ DEV connecté!\n');

        console.log('📡 Test connexion PROD (neondb)...');
        await prodPool.query('SELECT NOW()');
        console.log('✅ PROD connecté!\n');

        // 1. Récupérer toutes les tables de DEV
        const tablesResult = await devPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log(`📋 ${tablesResult.rows.length} tables trouvées dans DEV\n`);

        // 2. Supprimer toutes les tables en PROD
        console.log('🗑️  Suppression des tables existantes en PROD...');

        // Supprimer toutes les tables avec CASCADE (pas besoin de désactiver les FK)
        for (const row of tablesResult.rows) {
            try {
                await prodPool.query(`DROP TABLE IF EXISTS "${row.table_name}" CASCADE`);
            } catch (e) {
                // Ignorer les erreurs de suppression
            }
        }
        console.log('✅ Tables supprimées!\n');

        // 3. Créer les types ENUM si nécessaire
        console.log('📦 Création des types ENUM...');

        // Récupérer les types ENUM de DEV
        const enumsResult = await devPool.query(`
            SELECT t.typname, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as values
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            GROUP BY t.typname
        `);

        for (const enumType of enumsResult.rows) {
            const values = enumType.values.split(',').map(v => `'${v}'`).join(', ');
            await prodPool.query(`DROP TYPE IF EXISTS ${enumType.typname} CASCADE`);
            await prodPool.query(`CREATE TYPE ${enumType.typname} AS ENUM (${values})`);
            console.log(`   ✓ Type ${enumType.typname}`);
        }
        console.log('');

        // 4. Récupérer et exécuter le DDL de chaque table
        console.log('📦 Création des tables en PROD...\n');

        // Ordre de création (tables sans dépendances d'abord)
        const tableOrder = [
            'users',
            'children',
            'nursery_settings',
            'holidays',
            'enrollments',
            'enrollments_archive',
            'parent_children',
            'attendance',
            'absence_requests',
            'appointments',
            'daily_reports',
            'daily_meals',
            'daily_diaper_changes',
            'child_supplies',
            'daily_supplies_brought',
            'notifications',
            'staff_messages',
            'staff_age_assignments',
            'tasks',
            'events',
            'event_reminders',
            'event_history',
            'event_comments',
            'activity_logs',
            'personal_memos',
            'payment_reminders',
            'reports_history'
        ];

        // Ajouter les tables qui ne sont pas dans l'ordre
        const allTables = tablesResult.rows.map(r => r.table_name);
        for (const t of allTables) {
            if (!tableOrder.includes(t)) {
                tableOrder.push(t);
            }
        }

        for (const tableName of tableOrder) {
            if (!allTables.includes(tableName)) continue;

            try {
                // Récupérer la définition complète de la table
                const ddlResult = await devPool.query(`
                    SELECT 
                        column_name,
                        data_type,
                        udt_name,
                        character_maximum_length,
                        numeric_precision,
                        numeric_scale,
                        is_nullable,
                        column_default
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);

                // Construire le CREATE TABLE
                let columns = [];
                let hasPrimaryKey = false;

                for (const col of ddlResult.rows) {
                    let colDef = `"${col.column_name}" `;

                    // Déterminer le type
                    if (col.column_default && col.column_default.includes('nextval')) {
                        colDef += 'SERIAL';
                        hasPrimaryKey = true;
                    } else if (col.data_type === 'character varying') {
                        colDef += `VARCHAR(${col.character_maximum_length || 255})`;
                    } else if (col.data_type === 'integer') {
                        colDef += 'INTEGER';
                    } else if (col.data_type === 'bigint') {
                        colDef += 'BIGINT';
                    } else if (col.data_type === 'boolean') {
                        colDef += 'BOOLEAN';
                    } else if (col.data_type === 'text') {
                        colDef += 'TEXT';
                    } else if (col.data_type === 'date') {
                        colDef += 'DATE';
                    } else if (col.data_type === 'time without time zone') {
                        colDef += 'TIME';
                    } else if (col.data_type === 'timestamp without time zone') {
                        colDef += 'TIMESTAMP';
                    } else if (col.data_type === 'timestamp with time zone') {
                        colDef += 'TIMESTAMPTZ';
                    } else if (col.data_type === 'numeric') {
                        colDef += `DECIMAL(${col.numeric_precision},${col.numeric_scale})`;
                    } else if (col.data_type === 'jsonb') {
                        colDef += 'JSONB';
                    } else if (col.data_type === 'json') {
                        colDef += 'JSON';
                    } else if (col.data_type === 'ARRAY') {
                        colDef += 'TEXT[]';
                    } else if (col.data_type === 'USER-DEFINED') {
                        colDef += col.udt_name; // Type ENUM
                    } else {
                        colDef += col.data_type.toUpperCase();
                    }

                    // NOT NULL
                    if (col.is_nullable === 'NO' && !col.column_default?.includes('nextval')) {
                        colDef += ' NOT NULL';
                    }

                    // DEFAULT
                    if (col.column_default && !col.column_default.includes('nextval')) {
                        colDef += ` DEFAULT ${col.column_default}`;
                    }

                    columns.push(colDef);
                }

                // Ajouter PRIMARY KEY si SERIAL trouvé
                if (hasPrimaryKey) {
                    columns[0] += ' PRIMARY KEY';
                }

                const createSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columns.join(',\n  ')}\n)`;

                await prodPool.query(createSQL);
                console.log(`   ✓ ${tableName}`);

            } catch (err) {
                console.error(`   ❌ ${tableName}: ${err.message}`);
            }
        }

        // 5. Créer les index
        console.log('\n📊 Création des index...');

        const indexesResult = await devPool.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname NOT LIKE '%_pkey'
        `);

        for (const idx of indexesResult.rows) {
            try {
                // Modifier pour IF NOT EXISTS
                const indexDef = idx.indexdef.replace('CREATE INDEX', 'CREATE INDEX IF NOT EXISTS');
                await prodPool.query(indexDef);
                console.log(`   ✓ ${idx.indexname}`);
            } catch (err) {
                // Ignorer les erreurs d'index existants
            }
        }

        // 6. Créer le compte admin
        console.log('\n👤 Création du compte admin...');

        const hashedPassword = await bcrypt.hash('Admin@2024!Secure', 10);
        await prodPool.query(`
            INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            ON CONFLICT (email) DO NOTHING
        `, ['admin@mima-elghalia.com', hashedPassword, 'Admin', 'Crèche', '+216 00 000 000', 'admin']);

        console.log('   ✓ admin@mima-elghalia.com');

        // 7. Créer les paramètres par défaut
        console.log('\n⚙️  Configuration des paramètres...');

        const settings = [
            { key: 'nursery_name', value_fr: 'Crèche Mima Elghalia', value_ar: 'حضانة ميما الغالية', category: 'general' },
            { key: 'opening_time', value_fr: '07:00', value_ar: '07:00', category: 'schedule' },
            { key: 'closing_time', value_fr: '18:00', value_ar: '18:00', category: 'schedule' },
            { key: 'saturday_open', value_fr: 'false', value_ar: 'false', category: 'schedule' },
            { key: 'max_capacity', value_fr: '30', value_ar: '30', category: 'general' },
            { key: 'contact_phone', value_fr: '+216 00 000 000', value_ar: '+216 00 000 000', category: 'contact' },
            { key: 'contact_email', value_fr: 'contact@mima-elghalia.com', value_ar: 'contact@mima-elghalia.com', category: 'contact' },
            { key: 'address', value_fr: 'Tunisie', value_ar: 'تونس', category: 'contact' }
        ];

        for (const s of settings) {
            await prodPool.query(`
                INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (setting_key) DO NOTHING
            `, [s.key, s.value_fr, s.value_ar, s.category]);
        }
        console.log('   ✓ 8 paramètres configurés');

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('🎉 SYNCHRONISATION TERMINÉE AVEC SUCCÈS!');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n📧 Compte Admin:');
        console.log('   Email: admin@mima-elghalia.com');
        console.log('   Mot de passe: Admin@2024!Secure');
        console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await devPool.end();
        await prodPool.end();
    }
}

syncSchema();
