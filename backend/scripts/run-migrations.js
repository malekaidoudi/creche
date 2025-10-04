#!/usr/bin/env node
/*
  Simple migration runner: executes all .sql files in database/migrations in filename order.
  Uses env from project .env (MAMP/socket supported via backend/config/database.js).
*/
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

(async () => {
  try {
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found:', migrationsDir);
      process.exit(0);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files to run.');
      process.exit(0);
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const file of files) {
        const fullPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(fullPath, 'utf8');
        console.log(`\n➡️ Running migration: ${file}`);
        // Split on semicolons; naive but acceptable for our simple migrations
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        for (const stmt of statements) {
          await conn.query(stmt);
        }
        console.log(`✅ Completed: ${file}`);
      }

      await conn.commit();
      console.log('\n🎉 All migrations applied successfully');
    } catch (err) {
      await conn.rollback();
      console.error('\n❌ Migration failed:', err.message);
      process.exitCode = 1;
    } finally {
      conn.release();
      process.exit();
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    process.exit(1);
  }
})();
