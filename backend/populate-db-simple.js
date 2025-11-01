require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function populate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Peuplement base de données...');
    
    // Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(`
      INSERT INTO users (email, password, role, first_name, last_name, phone, is_verified)
      VALUES ($1, $2, 'admin', 'Admin', 'Crèche', '+216 12 345 678', true)
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
      RETURNING id
    `, ['crechemimaelghalia@gmail.com', hashedPassword]);
    
    const adminId = adminResult.rows[0].id;
    console.log('✅ Admin créé');
    
    // Parent
    const parentResult = await client.query(`
      INSERT INTO users (email, password, role, first_name, last_name, phone, is_verified)
      VALUES ($1, $2, 'parent', 'Ahmed', 'Ben Ali', '+216 20 123 456', true)
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
      RETURNING id
    `, ['parent@gmail.com', hashedPassword]);
    
    const parentId = parentResult.rows[0].id;
    console.log('✅ Parent créé');
    
    // Enfants
    const children = [
      { firstName: 'Yasmine', lastName: 'Ben Ali', birthDate: '2021-03-15' },
      { firstName: 'Adam', lastName: 'Ben Ali', birthDate: '2022-07-22' },
      { firstName: 'Lina', lastName: 'Trabelsi', birthDate: '2021-11-08' },
      { firstName: 'Omar', lastName: 'Trabelsi', birthDate: '2023-01-12' },
      { firstName: 'Salma', lastName: 'Karray', birthDate: '2022-05-30' },
      { firstName: 'Youssef', lastName: 'Karray', birthDate: '2021-09-18' },
      { firstName: 'Nour', lastName: 'Bouaziz', birthDate: '2022-12-03' },
      { firstName: 'Hamza', lastName: 'Bouaziz', birthDate: '2023-04-25' }
    ];
    
    for (const child of children) {
      const childResult = await client.query(`
        INSERT INTO children (first_name, last_name, birth_date, parent_id, gender, medical_info, emergency_contact)
        VALUES ($1, $2, $3, $4, 'other', 'Aucune allergie', '+216 20 123 456')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [child.firstName, child.lastName, child.birthDate, parentId]);
      
      if (childResult.rows.length > 0) {
        const childId = childResult.rows[0].id;
        
        await client.query(`
          INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, approved_by, approved_at)
          VALUES ($1, $2, 'approved', CURRENT_DATE, $3, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
        `, [childId, parentId, adminId]);
        
        console.log(`✅ ${child.firstName} ${child.lastName} créé`);
      }
    }
    
    const count = await client.query('SELECT COUNT(*) FROM children');
    console.log(`🎉 ${count.rows[0].count} enfants en base !`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

populate();
