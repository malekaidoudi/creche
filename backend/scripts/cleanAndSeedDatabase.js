/**
 * Script de nettoyage et réinitialisation de la base de données
 * 1. Supprime les tables inutilisées
 * 2. Vide toutes les données
 * 3. Crée des données de test cohérentes
 */

require('dotenv').config();
const { pool } = require('../config/db_postgres');
const bcrypt = require('bcrypt');

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Supprimer les tables et vues inutilisées
    console.log('❌ Suppression des tables/vues inutilisées...');
    
    // Supprimer les vues
    const unusedViews = ['attendance_details', 'enrollment_details'];
    for (const view of unusedViews) {
      await client.query(`DROP VIEW IF EXISTS ${view} CASCADE`);
      console.log(`   ✓ Vue ${view} supprimée`);
    }
    
    // Supprimer les tables
    const unusedTables = ['articles', 'event_attachments'];
    for (const table of unusedTables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`   ✓ Table ${table} supprimée`);
    }
    
    // 2. Vider toutes les tables (dans le bon ordre pour respecter les FK)
    console.log('\n🗑️  Vidage des tables...');
    const tablesToTruncate = [
      'event_comments',
      'event_history',
      'event_reminders',
      'events',
      'logs',
      'notifications',
      'email_logs',
      'contact_messages',
      'children_documents',
      'enrollment_documents',
      'documents',
      'absence_requests',
      'attendance',
      'enrollments',
      'children',
      'users',
      'holidays',
      'nursery_settings'
    ];
    
    for (const table of tablesToTruncate) {
      try {
        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        console.log(`   ✓ ${table} vidée`);
      } catch (error) {
        console.log(`   ⚠️  ${table} - ${error.message}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Nettoyage terminé !');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function seedDatabase() {
  console.log('\n🌱 Création des données de test...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Créer les utilisateurs
    console.log('👥 Création des utilisateurs...');
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const users = [
      {
        email: 'crechemimaelghalia@gmail.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'Principal',
        role: 'admin',
        phone: '+216 25 95 35 32'
      },
      {
        email: 'staff@mimaelghalia.tn',
        password: hashedPassword,
        first_name: 'Fatma',
        last_name: 'Ben Ali',
        role: 'staff',
        phone: '+216 20 123 456'
      },
      {
        email: 'parent1@example.com',
        password: hashedPassword,
        first_name: 'Mohamed',
        last_name: 'Trabelsi',
        role: 'parent',
        phone: '+216 22 345 678'
      },
      {
        email: 'parent2@example.com',
        password: hashedPassword,
        first_name: 'Amira',
        last_name: 'Gharbi',
        role: 'parent',
        phone: '+216 23 456 789'
      },
      {
        email: 'parent3@example.com',
        password: hashedPassword,
        first_name: 'Karim',
        last_name: 'Mansour',
        role: 'parent',
        phone: '+216 24 567 890'
      }
    ];
    
    const userIds = [];
    for (const user of users) {
      const result = await client.query(`
        INSERT INTO users (email, password, first_name, last_name, role, phone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [user.email, user.password, user.first_name, user.last_name, user.role, user.phone]);
      userIds.push(result.rows[0].id);
      console.log(`   ✓ ${user.first_name} ${user.last_name} (${user.role})`);
    }
    
    // 2. Créer les enfants
    console.log('\n👶 Création des enfants...');
    const children = [
      {
        first_name: 'Youssef',
        last_name: 'Trabelsi',
        birth_date: '2022-03-15',
        gender: 'male',
        parent_id: userIds[2],
        medical_info: 'Aucune allergie connue'
      },
      {
        first_name: 'Lina',
        last_name: 'Trabelsi',
        birth_date: '2023-06-20',
        gender: 'female',
        parent_id: userIds[2],
        medical_info: 'Allergie aux arachides'
      },
      {
        first_name: 'Adam',
        last_name: 'Gharbi',
        birth_date: '2022-09-10',
        gender: 'male',
        parent_id: userIds[3],
        medical_info: 'Asthme léger'
      },
      {
        first_name: 'Salma',
        last_name: 'Gharbi',
        birth_date: '2023-01-25',
        gender: 'female',
        parent_id: userIds[3],
        medical_info: 'Aucune'
      },
      {
        first_name: 'Omar',
        last_name: 'Mansour',
        birth_date: '2022-11-05',
        gender: 'male',
        parent_id: userIds[4],
        medical_info: 'Aucune'
      },
      {
        first_name: 'Nour',
        last_name: 'Mansour',
        birth_date: '2023-04-18',
        gender: 'female',
        parent_id: userIds[4],
        medical_info: 'Eczéma'
      }
    ];
    
    const childIds = [];
    for (const child of children) {
      const result = await client.query(`
        INSERT INTO children (first_name, last_name, birth_date, gender, parent_id, medical_info, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id
      `, [child.first_name, child.last_name, child.birth_date, child.gender, child.parent_id, child.medical_info]);
      childIds.push(result.rows[0].id);
      console.log(`   ✓ ${child.first_name} ${child.last_name} (${child.birth_date})`);
    }
    
    // 3. Créer les inscriptions
    console.log('\n📝 Création des inscriptions...');
    for (let i = 0; i < childIds.length; i++) {
      await client.query(`
        INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, lunch_assistance, regulation_accepted)
        VALUES ($1, $2, 'approved', CURRENT_DATE - INTERVAL '30 days', $3, true)
      `, [childIds[i], children[i].parent_id, i % 2 === 0]);
      console.log(`   ✓ Inscription pour ${children[i].first_name}`);
    }
    
    // 4. Créer des présences pour la semaine
    console.log('\n📅 Création des présences...');
    const today = new Date();
    for (let day = 0; day < 5; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const childId of childIds) {
        const checkIn = `${dateStr} 08:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}:00`;
        const checkOut = Math.random() > 0.2 ? `${dateStr} 17:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}:00` : null;
        
        await client.query(`
          INSERT INTO attendance (child_id, date, check_in_time, check_out_time)
          VALUES ($1, $2, $3, $4)
        `, [childId, dateStr, checkIn, checkOut]);
      }
      console.log(`   ✓ Présences du ${dateStr}`);
    }
    
    // 5. Créer des jours fériés
    console.log('\n🎉 Création des jours fériés...');
    const holidays = [
      { name: 'Nouvel An', date: '2025-01-01' },
      { name: 'Fête de l\'Indépendance', date: '2025-03-20' },
      { name: 'Fête du Travail', date: '2025-05-01' },
      { name: 'Fête de la République', date: '2025-07-25' },
      { name: 'Aïd el-Fitr', date: '2025-03-31' },
      { name: 'Aïd el-Adha', date: '2025-06-07' }
    ];
    
    for (const holiday of holidays) {
      await client.query(`
        INSERT INTO holidays (name, date, is_closed)
        VALUES ($1, $2, true)
      `, [holiday.name, holiday.date]);
      console.log(`   ✓ ${holiday.name} - ${holiday.date}`);
    }
    
    // 6. Créer des paramètres de la crèche
    console.log('\n⚙️  Configuration de la crèche...');
    const settings = [
      { key: 'nursery_name', value: 'Mima Elghalia' },
      { key: 'nursery_name_ar', value: 'ميما الغالية' },
      { key: 'address', value: '8 Rue Bizerte Medenine 4100' },
      { key: 'phone', value: '+216 25 95 35 32' },
      { key: 'email', value: 'contact@mimaelghalia.tn' },
      { key: 'capacity', value: '30' },
      { key: 'opening_time', value: '07:30' },
      { key: 'closing_time', value: '18:00' }
    ];
    
    for (const setting of settings) {
      await client.query(`
        INSERT INTO nursery_settings (setting_key, value_fr, value_ar)
        VALUES ($1, $2, $2)
        ON CONFLICT (setting_key) DO UPDATE SET value_fr = $2, value_ar = $2
      `, [setting.key, setting.value]);
    }
    console.log('   ✓ Paramètres configurés');
    
    await client.query('COMMIT');
    console.log('\n✅ Données de test créées avec succès !');
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('RÉSUMÉ DES DONNÉES CRÉÉES:');
    console.log('='.repeat(60));
    console.log(`👥 Utilisateurs: ${users.length} (1 admin, 1 staff, 3 parents)`);
    console.log(`👶 Enfants: ${children.length}`);
    console.log(`📝 Inscriptions: ${children.length}`);
    console.log(`📅 Présences: ${childIds.length * 5} (5 jours)`);
    console.log(`🎉 Jours fériés: ${holidays.length}`);
    console.log(`⚙️  Paramètres: ${settings.length}`);
    console.log('\n📧 Identifiants de connexion:');
    console.log('   Admin: crechemimaelghalia@gmail.com / password');
    console.log('   Staff: staff@mimaelghalia.tn / password');
    console.log('   Parent: parent1@example.com / password');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la création des données:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Démarrage du nettoyage et réinitialisation...\n');
    
    // Demander confirmation
    console.log('⚠️  ATTENTION: Cette opération va:');
    console.log('   1. Supprimer les tables inutilisées');
    console.log('   2. VIDER TOUTES LES DONNÉES');
    console.log('   3. Créer de nouvelles données de test\n');
    
    await cleanDatabase();
    await seedDatabase();
    
    console.log('\n✅ Opération terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

main();
