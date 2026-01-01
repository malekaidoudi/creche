const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔄 Checking photo_shared_with_staff column...');

        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'children' AND column_name = 'photo_shared_with_staff';
        `;
        const res = await client.query(checkQuery);

        if (res.rows.length === 0) {
            console.log('📝 Column does not exist. Adding photo_shared_with_staff...');
            await client.query(`
                ALTER TABLE children 
                ADD COLUMN photo_shared_with_staff BOOLEAN DEFAULT TRUE;
            `);
            console.log('✅ Column added successfully!');
        } else {
            console.log('ℹ️ Column already exists.');
        }

        // Verify
        const verify = await client.query(checkQuery);
        if (verify.rows.length > 0) {
            console.log('✅ Verification passed: Column exists.');
        } else {
            console.error('❌ Verification failed: Column NOT found.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
