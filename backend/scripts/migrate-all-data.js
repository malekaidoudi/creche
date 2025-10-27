#!/usr/bin/env node

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 8889,
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

async function migrateAllData() {
  console.log('🚀 MIGRATION COMPLÈTE MYSQL → POSTGRESQL');
  
  const mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
  const pgPool = new Pool(POSTGRES_CONFIG);
  const pgClient = await pgPool.connect();
  
  try {
    // 1. Nursery Settings - TOUS les paramètres
    console.log('\n1️⃣ Migration nursery_settings...');
    const [settings] = await mysqlConnection.execute('SELECT * FROM nursery_settings');
    console.log(`📤 ${settings.length} paramètres trouvés dans MySQL`);
    
    await pgClient.query('TRUNCATE TABLE nursery_settings RESTART IDENTITY CASCADE');
    
    for (const setting of settings) {
      await pgClient.query(`
        INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        setting.setting_key, setting.value_fr, setting.value_ar, 
        setting.category || 'general', setting.is_active === 1
      ]);
      console.log(`   ✅ ${setting.setting_key}`);
    }
    
    // 2. Users - Mise à jour complète
    console.log('\n2️⃣ Migration users...');
    const [users] = await mysqlConnection.execute('SELECT * FROM users');
    console.log(`📤 ${users.length} utilisateurs trouvés`);
    
    for (const user of users) {
      const existing = await pgClient.query('SELECT id FROM users WHERE email = $1', [user.email]);
      
      if (existing.rows.length > 0) {
        await pgClient.query(`
          UPDATE users SET first_name = $1, last_name = $2, phone = $3, 
                          role = $4, profile_image = $5, is_active = $6, password = $7
          WHERE email = $8
        `, [user.first_name, user.last_name, user.phone, user.role, 
            user.profile_image, user.is_active === 1, user.password, user.email]);
        console.log(`   🔄 ${user.email}`);
      } else {
        await pgClient.query(`
          INSERT INTO users (first_name, last_name, email, password, phone, role, profile_image, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [user.first_name, user.last_name, user.email, user.password, 
            user.phone, user.role, user.profile_image, user.is_active === 1]);
        console.log(`   ✅ ${user.email}`);
      }
    }
    
    // 3. Children
    console.log('\n3️⃣ Migration children...');
    const [children] = await mysqlConnection.execute('SELECT * FROM children');
    console.log(`📤 ${children.length} enfants trouvés`);
    
    await pgClient.query('TRUNCATE TABLE children RESTART IDENTITY CASCADE');
    
    for (const child of children) {
      // Normaliser le genre pour PostgreSQL
      let gender = child.gender;
      if (gender && !['male', 'female'].includes(gender.toLowerCase())) {
        // Convertir les valeurs non standard
        if (gender.toLowerCase().includes('m') || gender.toLowerCase().includes('garçon') || gender.toLowerCase().includes('boy')) {
          gender = 'male';
        } else if (gender.toLowerCase().includes('f') || gender.toLowerCase().includes('fille') || gender.toLowerCase().includes('girl')) {
          gender = 'female';
        } else {
          gender = null; // Laisser NULL si indéterminé
        }
      }
      
      await pgClient.query(`
        INSERT INTO children (first_name, last_name, birth_date, gender, medical_info,
                             emergency_contact_name, emergency_contact_phone, photo_url, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [child.first_name, child.last_name, child.birth_date, gender, child.medical_info,
          child.emergency_contact_name, child.emergency_contact_phone, child.photo_url, child.is_active === 1]);
      console.log(`   ✅ ${child.first_name} ${child.last_name} (genre: ${gender || 'non spécifié'})`);
    }
    
    // 4. Enrollments
    console.log('\n4️⃣ Migration enrollments...');
    const [enrollments] = await mysqlConnection.execute('SELECT * FROM enrollments');
    console.log(`📤 ${enrollments.length} inscriptions trouvées`);
    
    await pgClient.query('TRUNCATE TABLE enrollments RESTART IDENTITY CASCADE');
    
    for (const enrollment of enrollments) {
      await pgClient.query(`
        INSERT INTO enrollments (parent_id, child_id, enrollment_date, status,
                                lunch_assistance, regulation_accepted, admin_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [enrollment.parent_id, enrollment.child_id, enrollment.enrollment_date, enrollment.status,
          enrollment.lunch_assistance === 1, enrollment.regulation_accepted === 1, enrollment.admin_notes]);
      console.log(`   ✅ Inscription ${enrollment.id}`);
    }
    
    // 5. Attendance avec correction des heures
    console.log('\n5️⃣ Migration attendance...');
    const [attendances] = await mysqlConnection.execute('SELECT * FROM attendance');
    console.log(`📤 ${attendances.length} présences trouvées`);
    
    await pgClient.query('TRUNCATE TABLE attendance RESTART IDENTITY CASCADE');
    
    for (const attendance of attendances) {
      let checkInTime = null;
      let checkOutTime = null;
      
      // Convertir la date en format YYYY-MM-DD
      const dateStr = attendance.date instanceof Date 
        ? attendance.date.toISOString().split('T')[0]
        : attendance.date.toString().split('T')[0];
      
      if (attendance.check_in_time && attendance.check_in_time.includes(':')) {
        checkInTime = `${dateStr} ${attendance.check_in_time}`;
      }
      if (attendance.check_out_time && attendance.check_out_time.includes(':')) {
        checkOutTime = `${dateStr} ${attendance.check_out_time}`;
      }
      
      await pgClient.query(`
        INSERT INTO attendance (child_id, date, check_in_time, check_out_time, notes)
        VALUES ($1, $2, $3, $4, $5)
      `, [attendance.child_id, dateStr, checkInTime, checkOutTime, attendance.notes]);
      console.log(`   ✅ Présence enfant ${attendance.child_id} le ${dateStr}`);
    }
    
    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mysqlConnection.end();
    pgClient.release();
    await pgPool.end();
  }
}

if (require.main === module) {
  migrateAllData().catch(console.error);
}

module.exports = { migrateAllData };
