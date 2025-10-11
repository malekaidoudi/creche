const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

async function createParentExample() {
  let connection;
  
  try {
    console.log('🔄 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // Créer un parent d'exemple
    const parentData = {
      email: 'parent@example.com',
      password: await bcrypt.hash('parent123', 10),
      first_name: 'Fatima',
      last_name: 'Ben Ali',
      phone: '+216 98 765 432',
      role: 'parent',
      is_active: 1
    };
    
    console.log('👤 Création du parent d\'exemple...');
    const [parentResult] = await connection.execute(
      `INSERT INTO users (email, password, first_name, last_name, phone, role, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [parentData.email, parentData.password, parentData.first_name, parentData.last_name, 
       parentData.phone, parentData.role, parentData.is_active]
    );
    
    const parentId = parentResult.insertId;
    console.log(`✅ Parent créé avec l'ID: ${parentId}`);
    
    // Créer des enfants pour ce parent
    const children = [
      {
        first_name: 'Youssef',
        last_name: 'Ben Ali',
        birth_date: '2021-05-15',
        gender: 'M',
        parent_id: parentId,
        medical_info: 'Aucune allergie connue',
        emergency_contact: 'Grand-mère: +216 71 123 456'
      },
      {
        first_name: 'Lina',
        last_name: 'Ben Ali',
        birth_date: '2022-08-22',
        gender: 'F',
        parent_id: parentId,
        medical_info: 'Allergie aux arachides',
        emergency_contact: 'Oncle: +216 22 987 654'
      }
    ];
    
    console.log('👶 Création des enfants...');
    for (const child of children) {
      const [childResult] = await connection.execute(
        `INSERT INTO children (first_name, last_name, birth_date, gender, parent_id, medical_info, emergency_contact, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [child.first_name, child.last_name, child.birth_date, child.gender, 
         child.parent_id, child.medical_info, child.emergency_contact]
      );
      
      const childId = childResult.insertId;
      console.log(`✅ Enfant ${child.first_name} créé avec l'ID: ${childId}`);
      
      // Créer une demande d'inscription pour chaque enfant
      const [enrollmentResult] = await connection.execute(
        `INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, start_date, notes, created_at, updated_at) 
         VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), ?, NOW(), NOW())`,
        [childId, parentId, 'approved', `Inscription approuvée pour ${child.first_name}`]
      );
      
      console.log(`✅ Inscription créée pour ${child.first_name} avec l'ID: ${enrollmentResult.insertId}`);
      
      // Créer quelques présences d'exemple
      const attendanceData = [
        { date: '2024-01-15', check_in: '08:30:00', check_out: '16:45:00', status: 'present' },
        { date: '2024-01-16', check_in: '08:45:00', check_out: '17:00:00', status: 'present' },
        { date: '2024-01-17', check_in: '09:00:00', check_out: null, status: 'present' }
      ];
      
      for (const attendance of attendanceData) {
        await connection.execute(
          `INSERT INTO attendance (child_id, date, check_in_time, check_out_time, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [childId, attendance.date, attendance.check_in, attendance.check_out, attendance.status]
        );
      }
      
      console.log(`✅ Présences d'exemple créées pour ${child.first_name}`);
    }
    
    console.log('\n🎉 Compte parent d\'exemple créé avec succès !');
    console.log('📧 Email: parent@example.com');
    console.log('🔑 Mot de passe: parent123');
    console.log('👶 Enfants: Youssef (M, 2021) et Lina (F, 2022)');
    console.log('📋 Inscriptions approuvées avec présences d\'exemple');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du parent d\'exemple:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('ℹ️  Le parent d\'exemple existe déjà');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
if (require.main === module) {
  createParentExample();
}

module.exports = createParentExample;
