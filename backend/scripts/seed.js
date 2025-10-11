const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const seedDatabase = async () => {
  try {
    console.log('🌱 Démarrage du seeding de la base de données...');

    // Nettoyer les données existantes (dans l'ordre des dépendances)
    console.log('🧹 Nettoyage des données existantes...');
    await query('DELETE FROM enrollment_documents');
    await query('DELETE FROM attendance');
    await query('DELETE FROM uploads');
    await query('DELETE FROM enrollments');
    await query('DELETE FROM children');
    await query('DELETE FROM users');
    await query('DELETE FROM settings');
    await query('DELETE FROM logs');

    // Reset auto-increment
    await query('ALTER TABLE users AUTO_INCREMENT = 1');
    await query('ALTER TABLE children AUTO_INCREMENT = 1');
    await query('ALTER TABLE enrollments AUTO_INCREMENT = 1');
    await query('ALTER TABLE uploads AUTO_INCREMENT = 1');
    await query('ALTER TABLE attendance AUTO_INCREMENT = 1');
    await query('ALTER TABLE settings AUTO_INCREMENT = 1');
    await query('ALTER TABLE logs AUTO_INCREMENT = 1');

    console.log('✅ Nettoyage terminé');

    // 1. Créer les utilisateurs (admin, staff, parents)
    console.log('👥 Création des utilisateurs...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hashedStaffPassword = await bcrypt.hash('staff123', 10);
    const hashedParentPassword = await bcrypt.hash('parent123', 10);

    // Admin
    await query(`
      INSERT INTO users (email, password, first_name, last_name, phone, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin@creche.com', hashedPassword, 'Ahmed', 'Administrateur', '+216 20 123 456', 'admin', true]);

    // Staff
    await query(`
      INSERT INTO users (email, password, first_name, last_name, phone, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['staff@creche.com', hashedStaffPassword, 'Fatima', 'Éducatrice', '+216 25 789 012', 'staff', true]);

    // Parents
    const parents = [
      ['parent@creche.com', hashedParentPassword, 'Mohamed', 'Ben Ali', '+216 98 123 456', 'parent'],
      ['parent2@creche.com', hashedParentPassword, 'Amina', 'Trabelsi', '+216 97 234 567', 'parent'],
      ['parent3@creche.com', hashedParentPassword, 'Karim', 'Sassi', '+216 96 345 678', 'parent'],
      ['parent4@creche.com', hashedParentPassword, 'Leila', 'Gharbi', '+216 95 456 789', 'parent'],
      ['parent5@creche.com', hashedParentPassword, 'Omar', 'Bouazizi', '+216 94 567 890', 'parent']
    ];

    for (const parent of parents) {
      await query(`
        INSERT INTO users (email, password, first_name, last_name, phone, role, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [...parent, true]);
    }

    console.log('✅ Utilisateurs créés (1 admin, 1 staff, 5 parents)');

    // 2. Créer les enfants liés aux parents
    console.log('👶 Création des enfants...');
    
    const children = [
      [3, 'Yasmine', 'Ben Ali', '2021-03-15', 'F', 'Aucune allergie connue', 'Grand-mère Fatma', '+216 71 123 456'],
      [3, 'Adam', 'Ben Ali', '2022-08-22', 'M', 'Allergie aux arachides', 'Grand-père Ali', '+216 71 123 457'],
      [4, 'Lina', 'Trabelsi', '2020-11-10', 'F', 'Asthme léger', 'Tante Sonia', '+216 72 234 567'],
      [5, 'Sami', 'Sassi', '2021-07-05', 'M', 'Aucune', 'Oncle Mehdi', '+216 73 345 678'],
      [6, 'Nour', 'Gharbi', '2022-01-18', 'F', 'Intolérance lactose', 'Grand-mère Aicha', '+216 74 456 789'],
      [7, 'Rayan', 'Bouazizi', '2021-12-03', 'M', 'Aucune', 'Tante Rim', '+216 75 567 890'],
      [null, 'Ines', 'Orpheline', '2020-09-14', 'F', 'Suivi psychologique', 'Service social', '+216 70 000 000']
    ];

    for (const child of children) {
      await query(`
        INSERT INTO children (parent_id, first_name, last_name, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [...child, true]);
    }

    console.log('✅ Enfants créés (7 enfants, dont 1 orphelin)');

    // 3. Créer les inscriptions
    console.log('📝 Création des inscriptions...');
    
    const enrollments = [
      [3, 1, '2024-01-15', 'approved', true, true, '2024-01-20', '09:00:00', 'Inscription validée'],
      [4, 3, '2024-02-01', 'approved', false, true, '2024-02-05', '10:00:00', 'Inscription validée'],
      [5, 4, '2024-02-15', 'pending', true, false, null, null, 'En attente de documents'],
      [6, 5, '2024-03-01', 'approved', true, true, '2024-03-05', '14:00:00', 'Inscription validée'],
      [7, 6, '2024-03-10', 'rejected', false, false, null, null, 'Places complètes']
    ];

    for (const enrollment of enrollments) {
      await query(`
        INSERT INTO enrollments (parent_id, child_id, enrollment_date, status, lunch_assistance, regulation_accepted, appointment_date, appointment_time, admin_notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, enrollment);
    }

    console.log('✅ Inscriptions créées (3 approuvées, 1 en attente, 1 rejetée)');

    // 4. Créer les présences (derniers jours)
    console.log('📅 Création des présences...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const attendances = [
      // Aujourd'hui
      [1, today.toISOString().split('T')[0], '08:30:00', '16:30:00', 'Journée normale', 2],
      [3, today.toISOString().split('T')[0], '09:00:00', null, 'Présent', 2],
      [4, today.toISOString().split('T')[0], '08:45:00', '15:45:00', 'Parti plus tôt', 2],
      [5, today.toISOString().split('T')[0], '09:15:00', null, 'Présent', 2],
      
      // Hier
      [1, yesterday.toISOString().split('T')[0], '08:30:00', '16:30:00', 'Journée normale', 2],
      [3, yesterday.toISOString().split('T')[0], '09:00:00', '16:00:00', 'Journée normale', 2],
      [4, yesterday.toISOString().split('T')[0], '08:45:00', '16:15:00', 'Journée normale', 2],
      [6, yesterday.toISOString().split('T')[0], '09:30:00', '15:30:00', 'Arrivé en retard', 2]
    ];

    for (const attendance of attendances) {
      await query(`
        INSERT INTO attendance (child_id, date, check_in_time, check_out_time, notes, created_by) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, attendance);
    }

    console.log('✅ Présences créées (aujourd\'hui et hier)');

    // 5. Créer des uploads (documents par enfant + règlement interne)
    console.log('📁 Création des uploads...');
    
    const uploads = [
      // Documents par enfant
      ['yasmine_certificat_medical.pdf', 'Certificat médical Yasmine', '/uploads/child_1/yasmine_certificat_medical.pdf', 245760, 'application/pdf', 'document', 1, 3],
      ['yasmine_photo.jpg', 'Photo Yasmine', '/uploads/child_1/yasmine_photo.jpg', 102400, 'image/jpeg', 'photo', 1, 3],
      ['yasmine_carnet_sante.pdf', 'Carnet de santé Yasmine', '/uploads/child_1/yasmine_carnet_sante.pdf', 512000, 'application/pdf', 'document', 1, 3],
      
      ['adam_certificat_medical.pdf', 'Certificat médical Adam', '/uploads/child_2/adam_certificat_medical.pdf', 198432, 'application/pdf', 'document', 2, 3],
      ['adam_photo.jpg', 'Photo Adam', '/uploads/child_2/adam_photo.jpg', 87654, 'image/jpeg', 'photo', 2, 3],
      
      ['lina_certificat_medical.pdf', 'Certificat médical Lina', '/uploads/child_3/lina_certificat_medical.pdf', 276543, 'application/pdf', 'document', 3, 4],
      ['lina_photo.jpg', 'Photo Lina', '/uploads/child_3/lina_photo.jpg', 134567, 'image/jpeg', 'photo', 3, 4],
      ['lina_ordonnance_asthme.pdf', 'Ordonnance asthme Lina', '/uploads/child_3/lina_ordonnance_asthme.pdf', 156789, 'application/pdf', 'document', 3, 4],
      
      // Règlement interne
      ['reglement_interne_2024.pdf', 'Règlement interne 2024', '/uploads/internal/reglement_interne_2024.pdf', 1024000, 'application/pdf', 'internal_document', null, 1]
    ];

    for (const upload of uploads) {
      await query(`
        INSERT INTO uploads (filename, original_name, file_path, file_size, mime_type, category, child_id, uploaded_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, upload);
    }

    console.log('✅ Uploads créés (documents enfants + règlement interne)');

    // 6. Créer les paramètres système
    console.log('⚙️ Création des paramètres système...');
    
    const settings = [
      ['creche_name', 'Crèche Mima Elghalia', 'string', 'Nom de la crèche', true],
      ['creche_address', '123 Avenue Habib Bourguiba, Tunis', 'string', 'Adresse de la crèche', true],
      ['creche_phone', '+216 71 123 456', 'string', 'Téléphone de la crèche', true],
      ['creche_email', 'contact@mimaelghalia.tn', 'string', 'Email de contact', true],
      ['opening_hours', '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00", "saturday": "08:00-12:00", "sunday": "closed"}', 'json', 'Horaires d\'ouverture', true],
      ['max_capacity', '30', 'number', 'Capacité maximale d\'enfants', false],
      ['enrollment_fee', '50', 'number', 'Frais d\'inscription (TND)', true],
      ['monthly_fee', '200', 'number', 'Frais mensuels (TND)', true],
      ['smtp_host', 'smtp.gmail.com', 'string', 'Serveur SMTP', false],
      ['smtp_port', '587', 'number', 'Port SMTP', false],
      ['smtp_user', 'noreply@mimaelghalia.tn', 'string', 'Utilisateur SMTP', false],
      ['smtp_password', 'dummy_password', 'string', 'Mot de passe SMTP', false],
      ['auto_backup', 'true', 'boolean', 'Sauvegarde automatique', false],
      ['notification_emails', 'true', 'boolean', 'Notifications par email', false]
    ];

    for (const setting of settings) {
      await query(`
        INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public) 
        VALUES (?, ?, ?, ?, ?)
      `, setting);
    }

    console.log('✅ Paramètres système créés');

    // 7. Créer quelques logs d'exemple
    console.log('📋 Création des logs d\'exemple...');
    
    const logs = [
      ['info', 'Connexion utilisateur admin@creche.com', 'login', 1, '127.0.0.1', 'Mozilla/5.0', 'POST', '/api/auth/login', 200, 0.245, '{"success": true}'],
      ['info', 'Création enfant Yasmine Ben Ali', 'create_child', 1, '127.0.0.1', 'Mozilla/5.0', 'POST', '/api/children', 201, 0.156, '{"child_id": 1}'],
      ['info', 'Upload document certificat médical', 'upload_document', 3, '127.0.0.1', 'Mozilla/5.0', 'POST', '/api/uploads', 201, 0.789, '{"file_id": 1}'],
      ['info', 'Check-in enfant Yasmine', 'create_attendance', 2, '127.0.0.1', 'Mozilla/5.0', 'POST', '/api/attendance', 201, 0.123, '{"attendance_id": 1}'],
      ['warning', 'Tentative de connexion avec email incorrect', 'login_failed', null, '192.168.1.100', 'Mozilla/5.0', 'POST', '/api/auth/login', 401, 0.089, '{"error": "Invalid credentials"}']
    ];

    for (const log of logs) {
      await query(`
        INSERT INTO logs (level, message, action, user_id, ip_address, user_agent, request_method, request_url, response_status, execution_time, additional_data) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, log);
    }

    console.log('✅ Logs d\'exemple créés');

    console.log('🎉 Seeding terminé avec succès !');
    console.log('');
    console.log('📊 Résumé des données créées :');
    console.log('   👥 Utilisateurs : 7 (1 admin, 1 staff, 5 parents)');
    console.log('   👶 Enfants : 7 (6 avec parents, 1 orphelin)');
    console.log('   📝 Inscriptions : 5 (3 approuvées, 1 en attente, 1 rejetée)');
    console.log('   📅 Présences : 8 (aujourd\'hui et hier)');
    console.log('   📁 Documents : 9 (8 enfants + 1 règlement)');
    console.log('   ⚙️ Paramètres : 14');
    console.log('   📋 Logs : 5');
    console.log('');
    console.log('🔐 Comptes de test :');
    console.log('   Admin : admin@creche.com / admin123');
    console.log('   Staff : staff@creche.com / staff123');
    console.log('   Parent : parent@creche.com / parent123');

  } catch (error) {
    console.error('❌ Erreur lors du seeding :', error);
    throw error;
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Script de seed terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale :', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
