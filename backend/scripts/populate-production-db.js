#!/usr/bin/env node

/**
 * Script pour peupler la base de données de production avec des données de test
 * Usage: node scripts/populate-production-db.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuration base de données production (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ioMNXW9K2sbw@ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech:5432/mima_elghalia_db?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function populateDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Début du peuplement de la base de données production...');
    
    // 1. Créer les utilisateurs parents
    console.log('👥 Création des utilisateurs parents...');
    
    const parents = [
      {
        email: 'parent1@creche.com',
        password: await bcrypt.hash('parent123', 10),
        first_name: 'Ahmed',
        last_name: 'Ben Ali',
        phone: '+216 98 123 456',
        role: 'parent'
      },
      {
        email: 'parent2@creche.com', 
        password: await bcrypt.hash('parent123', 10),
        first_name: 'Fatima',
        last_name: 'Trabelsi',
        phone: '+216 98 234 567',
        role: 'parent'
      },
      {
        email: 'parent3@creche.com',
        password: await bcrypt.hash('parent123', 10),
        first_name: 'Mohamed',
        last_name: 'Khelifi',
        phone: '+216 98 345 678',
        role: 'parent'
      },
      {
        email: 'parent4@creche.com',
        password: await bcrypt.hash('parent123', 10),
        first_name: 'Amel',
        last_name: 'Bouaziz',
        phone: '+216 98 456 789',
        role: 'parent'
      }
    ];
    
    const parentIds = [];
    
    for (const parent of parents) {
      const result = await client.query(`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone
        RETURNING id
      `, [parent.email, parent.password, parent.first_name, parent.last_name, parent.phone, parent.role]);
      
      parentIds.push(result.rows[0].id);
      console.log(`✅ Parent créé: ${parent.first_name} ${parent.last_name} (ID: ${result.rows[0].id})`);
    }
    
    // 2. Créer les enfants
    console.log('👶 Création des enfants...');
    
    const children = [
      {
        first_name: 'Yasmine',
        last_name: 'Ben Ali',
        birth_date: '2021-03-15',
        gender: 'female',
        parent_id: parentIds[0],
        medical_info: 'Aucune allergie connue',
        emergency_contact_name: 'Ahmed Ben Ali',
        emergency_contact_phone: '+216 98 123 456'
      },
      {
        first_name: 'Adam',
        last_name: 'Ben Ali', 
        birth_date: '2022-08-22',
        gender: 'male',
        parent_id: parentIds[0],
        medical_info: 'Allergie aux arachides',
        emergency_contact_name: 'Ahmed Ben Ali',
        emergency_contact_phone: '+216 98 123 456'
      },
      {
        first_name: 'Lina',
        last_name: 'Trabelsi',
        birth_date: '2021-11-10',
        gender: 'female', 
        parent_id: parentIds[1],
        medical_info: 'RAS',
        emergency_contact_name: 'Fatima Trabelsi',
        emergency_contact_phone: '+216 98 234 567'
      },
      {
        first_name: 'Sami',
        last_name: 'Khelifi',
        birth_date: '2020-05-18',
        gender: 'male',
        parent_id: parentIds[2],
        medical_info: 'Asthme léger',
        emergency_contact_name: 'Mohamed Khelifi',
        emergency_contact_phone: '+216 98 345 678'
      },
      {
        first_name: 'Nour',
        last_name: 'Khelifi',
        birth_date: '2022-12-03',
        gender: 'female',
        parent_id: parentIds[2],
        medical_info: 'Aucune',
        emergency_contact_name: 'Mohamed Khelifi', 
        emergency_contact_phone: '+216 98 345 678'
      },
      {
        first_name: 'Amine',
        last_name: 'Bouaziz',
        birth_date: '2021-07-25',
        gender: 'male',
        parent_id: parentIds[3],
        medical_info: 'Intolérance lactose',
        emergency_contact_name: 'Amel Bouaziz',
        emergency_contact_phone: '+216 98 456 789'
      },
      {
        first_name: 'Salma',
        last_name: 'Bouaziz',
        birth_date: '2023-01-14',
        gender: 'female',
        parent_id: parentIds[3],
        medical_info: 'RAS',
        emergency_contact_name: 'Amel Bouaziz',
        emergency_contact_phone: '+216 98 456 789'
      },
      {
        first_name: 'Karim',
        last_name: 'Bouaziz',
        birth_date: '2020-09-08',
        gender: 'male',
        parent_id: parentIds[3],
        medical_info: 'Eczéma',
        emergency_contact_name: 'Amel Bouaziz',
        emergency_contact_phone: '+216 98 456 789'
      }
    ];
    
    const childIds = [];
    
    for (const child of children) {
      const result = await client.query(`
        INSERT INTO children (first_name, last_name, birth_date, gender, parent_id, medical_info, emergency_contact_name, emergency_contact_phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id
      `, [child.first_name, child.last_name, child.birth_date, child.gender, child.parent_id, child.medical_info, child.emergency_contact_name, child.emergency_contact_phone]);
      
      childIds.push(result.rows[0].id);
      console.log(`✅ Enfant créé: ${child.first_name} ${child.last_name} (ID: ${result.rows[0].id})`);
    }
    
    // 3. Créer les inscriptions approuvées
    console.log('📝 Création des inscriptions...');
    
    for (let i = 0; i < childIds.length; i++) {
      await client.query(`
        INSERT INTO enrollments (child_id, new_status, enrollment_date, approved_by, approved_at)
        VALUES ($1, 'approved', CURRENT_DATE - INTERVAL '30 days', 4, CURRENT_TIMESTAMP - INTERVAL '25 days')
        ON CONFLICT (child_id) DO UPDATE SET
          new_status = 'approved',
          approved_by = 4,
          approved_at = CURRENT_TIMESTAMP - INTERVAL '25 days'
      `, [childIds[i]]);
      
      console.log(`✅ Inscription approuvée pour enfant ID: ${childIds[i]}`);
    }
    
    // 4. Créer quelques enregistrements d'attendance
    console.log('📅 Création des enregistrements d\'attendance...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Attendance d'hier (complète)
    for (let i = 0; i < 4; i++) {
      const checkInTime = new Date(yesterday);
      checkInTime.setHours(8, Math.floor(Math.random() * 60)); // Entre 8h00 et 8h59
      
      const checkOutTime = new Date(yesterday);
      checkOutTime.setHours(16, Math.floor(Math.random() * 60)); // Entre 16h00 et 16h59
      
      await client.query(`
        INSERT INTO attendance (child_id, check_in_time, check_out_time, date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (child_id, date) DO UPDATE SET
          check_in_time = EXCLUDED.check_in_time,
          check_out_time = EXCLUDED.check_out_time
      `, [childIds[i], checkInTime, checkOutTime, yesterday.toISOString().split('T')[0]]);
    }
    
    // Attendance d'aujourd'hui (partielle)
    for (let i = 0; i < 3; i++) {
      const checkInTime = new Date(today);
      checkInTime.setHours(8, Math.floor(Math.random() * 60)); // Entre 8h00 et 8h59
      
      await client.query(`
        INSERT INTO attendance (child_id, check_in_time, date)
        VALUES ($1, $2, $3)
        ON CONFLICT (child_id, date) DO UPDATE SET
          check_in_time = EXCLUDED.check_in_time
      `, [childIds[i], checkInTime, today.toISOString().split('T')[0]]);
    }
    
    console.log('✅ Enregistrements d\'attendance créés');
    
    // 5. Vérification finale
    console.log('🔍 Vérification finale...');
    
    const verification = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'parent') as parents_count,
        (SELECT COUNT(*) FROM children WHERE is_active = true) as children_count,
        (SELECT COUNT(*) FROM enrollments WHERE new_status = 'approved') as approved_enrollments,
        (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE) as today_attendance
    `);
    
    const stats = verification.rows[0];
    console.log('📊 Statistiques finales:');
    console.log(`   - Parents: ${stats.parents_count}`);
    console.log(`   - Enfants actifs: ${stats.children_count}`);
    console.log(`   - Inscriptions approuvées: ${stats.approved_enrollments}`);
    console.log(`   - Présences aujourd'hui: ${stats.today_attendance}`);
    
    console.log('🎉 Base de données peuplée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution du script
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur script:', error);
      process.exit(1);
    });
}

module.exports = { populateDatabase };
