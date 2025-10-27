#!/usr/bin/env node

/**
 * Migration simple des données importantes MySQL → PostgreSQL
 */

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 8889,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
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

async function migrateData() {
  console.log('🚀 MIGRATION DONNÉES MYSQL → POSTGRESQL');
  console.log('======================================');
  
  let mysqlConnection, pgPool;
  
  try {
    // Connexions
    console.log('🔧 Connexion aux bases de données...');
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    pgPool = new Pool(POSTGRES_CONFIG);
    const pgClient = await pgPool.connect();
    
    console.log('✅ Connexions établies');
    
    // 1. Migrer les enfants
    console.log('\n1️⃣ Migration enfants...');
    const [children] = await mysqlConnection.execute('SELECT * FROM children');
    console.log(`📤 ${children.length} enfants trouvés dans MySQL`);
    
    for (const child of children) {
      try {
        await pgClient.query(`
          INSERT INTO children (first_name, last_name, birth_date, gender, medical_info, 
                               emergency_contact_name, emergency_contact_phone, photo_url, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
        `, [
          child.first_name, child.last_name, child.birth_date, child.gender,
          child.medical_info, child.emergency_contact_name, child.emergency_contact_phone,
          child.photo_url, child.is_active === 1
        ]);
        console.log(`   ✅ ${child.first_name} ${child.last_name}`);
      } catch (error) {
        console.log(`   ❌ Erreur ${child.first_name}: ${error.message}`);
      }
    }
    
    // 2. Migrer les inscriptions
    console.log('\n2️⃣ Migration inscriptions...');
    const [enrollments] = await mysqlConnection.execute('SELECT * FROM enrollments');
    console.log(`📤 ${enrollments.length} inscriptions trouvées dans MySQL`);
    
    for (const enrollment of enrollments) {
      try {
        await pgClient.query(`
          INSERT INTO enrollments (parent_id, child_id, enrollment_date, status, 
                                  lunch_assistance, regulation_accepted, admin_notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING
        `, [
          enrollment.parent_id, enrollment.child_id, enrollment.enrollment_date,
          enrollment.status, enrollment.lunch_assistance === 1, 
          enrollment.regulation_accepted === 1, enrollment.admin_notes
        ]);
        console.log(`   ✅ Inscription ${enrollment.id}`);
      } catch (error) {
        console.log(`   ❌ Erreur inscription ${enrollment.id}: ${error.message}`);
      }
    }
    
    // 3. Migrer les présences
    console.log('\n3️⃣ Migration présences...');
    const [attendances] = await mysqlConnection.execute('SELECT * FROM attendance');
    console.log(`📤 ${attendances.length} présences trouvées dans MySQL`);
    
    for (const attendance of attendances) {
      try {
        await pgClient.query(`
          INSERT INTO attendance (child_id, date, check_in_time, check_out_time, notes)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING
        `, [
          attendance.child_id, attendance.date, attendance.check_in_time,
          attendance.check_out_time, attendance.notes
        ]);
        console.log(`   ✅ Présence ${attendance.date}`);
      } catch (error) {
        console.log(`   ❌ Erreur présence: ${error.message}`);
      }
    }
    
    // 4. Migrer les demandes d'absence
    console.log('\n4️⃣ Migration demandes d\'absence...');
    const [absences] = await mysqlConnection.execute('SELECT * FROM absence_requests');
    console.log(`📤 ${absences.length} demandes d'absence trouvées dans MySQL`);
    
    for (const absence of absences) {
      try {
        await pgClient.query(`
          INSERT INTO absence_requests (child_id, parent_id, start_date, end_date, reason, status, admin_notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          absence.child_id, absence.parent_id, absence.start_date, absence.end_date,
          absence.reason, absence.status, absence.admin_notes
        ]);
        console.log(`   ✅ Demande d'absence ${absence.id}`);
      } catch (error) {
        console.log(`   ❌ Erreur demande: ${error.message}`);
      }
    }
    
    // 5. Migrer les contacts
    console.log('\n5️⃣ Migration contacts...');
    const [contacts] = await mysqlConnection.execute('SELECT * FROM contacts');
    console.log(`📤 ${contacts.length} contacts trouvés dans MySQL`);
    
    for (const contact of contacts) {
      try {
        await pgClient.query(`
          INSERT INTO contacts (first_name, last_name, email, subject, message, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          contact.first_name, contact.last_name, contact.email,
          contact.subject, contact.message, contact.status
        ]);
        console.log(`   ✅ Contact ${contact.email}`);
      } catch (error) {
        console.log(`   ❌ Erreur contact: ${error.message}`);
      }
    }
    
    // 6. Migrer les notifications
    console.log('\n6️⃣ Migration notifications...');
    const [notifications] = await mysqlConnection.execute('SELECT * FROM notifications');
    console.log(`📤 ${notifications.length} notifications trouvées dans MySQL`);
    
    for (const notification of notifications) {
      try {
        await pgClient.query(`
          INSERT INTO notifications (user_id, title, message, type, is_read)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          notification.user_id, notification.title, notification.message,
          notification.type, notification.is_read === 1
        ]);
        console.log(`   ✅ Notification ${notification.id}`);
      } catch (error) {
        console.log(`   ❌ Erreur notification: ${error.message}`);
      }
    }
    
    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    
    pgClient.release();
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    if (pgPool) await pgPool.end();
  }
}

// Exécution
if (require.main === module) {
  migrateData().catch(console.error);
}

module.exports = { migrateData };
