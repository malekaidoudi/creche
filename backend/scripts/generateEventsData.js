/**
 * Script pour générer des données de test pour le système d'événements
 * Usage: node scripts/generateEventsData.js
 */

require('dotenv').config();
const { pool } = require('../config/db_postgres');

async function generateEventsData() {
  const client = await pool.connect();
  
  try {
    console.log('🎯 Génération des données de test pour les événements...\n');
    
    await client.query('BEGIN');
    
    // Récupérer les IDs des utilisateurs et enfants
    const usersResult = await client.query('SELECT id, role, first_name, last_name FROM users ORDER BY id LIMIT 5');
    const childrenResult = await client.query('SELECT id, first_name, last_name FROM children WHERE is_active = true LIMIT 6');
    
    const users = usersResult.rows;
    const children = childrenResult.rows;
    
    console.log(`👥 ${users.length} utilisateurs trouvés`);
    console.log(`👶 ${children.length} enfants trouvés\n`);
    
    const adminId = users.find(u => u.role === 'admin')?.id || 1;
    const staffId = users.find(u => u.role === 'staff')?.id || 2;
    
    // Dates pour les événements
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const events = [
      // Mémos
      {
        title: '📝 Réunion pédagogique mensuelle',
        description: 'Discussion sur les nouvelles méthodes d\'apprentissage et le programme du mois prochain',
        type: 'memo',
        start_date: tomorrow,
        all_day: false,
        status: 'pending',
        priority: 'high',
        created_by: adminId,
        assigned_to: staffId,
        color: '#8B5CF6'
      },
      {
        title: '📝 Rappel: Vérifier les stocks de fournitures',
        description: 'Inventaire des jouets, matériel éducatif et produits d\'hygiène',
        type: 'memo',
        start_date: today,
        all_day: true,
        status: 'pending',
        priority: 'medium',
        created_by: adminId,
        assigned_to: staffId,
        color: '#8B5CF6'
      },
      {
        title: '📝 Note: Nouveau protocole de sécurité',
        description: 'Mise à jour des procédures d\'évacuation en cas d\'urgence',
        type: 'memo',
        start_date: yesterday,
        all_day: true,
        status: 'completed',
        priority: 'high',
        created_by: adminId,
        assigned_to: staffId,
        color: '#8B5CF6'
      },
      
      // Tâches
      {
        title: '✅ Préparer l\'activité peinture',
        description: 'Installer les chevalets, préparer les peintures et les tabliers pour l\'atelier de demain',
        type: 'task',
        start_date: today,
        all_day: false,
        status: 'in_progress',
        priority: 'medium',
        created_by: adminId,
        assigned_to: staffId,
        color: '#3B82F6'
      },
      {
        title: '✅ Appeler les parents de Youssef',
        description: 'Discuter du comportement et des progrès de l\'enfant',
        type: 'task',
        start_date: today,
        all_day: false,
        status: 'pending',
        priority: 'high',
        created_by: staffId,
        assigned_to: staffId,
        child_id: children[0]?.id,
        color: '#3B82F6'
      },
      {
        title: '✅ Nettoyer et désinfecter les jouets',
        description: 'Nettoyage hebdomadaire de tous les jouets et équipements',
        type: 'task',
        start_date: tomorrow,
        all_day: false,
        status: 'pending',
        priority: 'medium',
        created_by: adminId,
        assigned_to: staffId,
        color: '#3B82F6'
      },
      {
        title: '✅ Mettre à jour les dossiers médicaux',
        description: 'Vérifier et mettre à jour les fiches de santé de tous les enfants',
        type: 'task',
        start_date: nextWeek,
        all_day: true,
        status: 'pending',
        priority: 'high',
        created_by: adminId,
        assigned_to: staffId,
        color: '#3B82F6'
      },
      {
        title: '✅ Organiser la sortie au parc',
        description: 'Planifier la sortie éducative: autorisations, transport, accompagnateurs',
        type: 'task',
        start_date: lastWeek,
        all_day: true,
        status: 'completed',
        priority: 'high',
        created_by: adminId,
        assigned_to: staffId,
        color: '#3B82F6'
      },
      
      // RDV
      {
        title: '📅 Rendez-vous avec les parents de Lina',
        description: 'Entretien individuel pour discuter de l\'adaptation et du développement',
        type: 'rdv',
        start_date: tomorrow,
        all_day: false,
        status: 'pending',
        priority: 'high',
        created_by: staffId,
        assigned_to: staffId,
        child_id: children[1]?.id,
        color: '#10B981'
      },
      {
        title: '📅 Visite de la nouvelle famille',
        description: 'Présentation de la crèche et visite des installations',
        type: 'rdv',
        start_date: nextWeek,
        all_day: false,
        status: 'pending',
        priority: 'medium',
        created_by: adminId,
        assigned_to: adminId,
        color: '#10B981'
      },
      
      // RDV Médicaux
      {
        title: '🏥 Visite médicale - Adam',
        description: 'Contrôle de routine avec le pédiatre',
        type: 'medical',
        start_date: nextWeek,
        all_day: false,
        status: 'pending',
        priority: 'high',
        created_by: staffId,
        assigned_to: staffId,
        child_id: children[2]?.id,
        color: '#EF4444'
      },
      
      // Réunions
      {
        title: '👥 Réunion d\'équipe hebdomadaire',
        description: 'Point sur la semaine, planning et coordination',
        type: 'meeting',
        start_date: tomorrow,
        all_day: false,
        status: 'pending',
        priority: 'medium',
        created_by: adminId,
        assigned_to: adminId,
        color: '#F59E0B'
      },
      {
        title: '👥 Réunion parents-staff',
        description: 'Présentation du programme éducatif du trimestre',
        type: 'meeting',
        start_date: nextWeek,
        all_day: false,
        status: 'pending',
        priority: 'high',
        created_by: adminId,
        assigned_to: adminId,
        color: '#F59E0B'
      },
      
      // Rappels vacances
      {
        title: '🏖️ Fermeture pour les vacances d\'été',
        description: 'La crèche sera fermée du 1er au 31 août',
        type: 'vacation_reminder',
        start_date: new Date(today.getFullYear(), 6, 15), // 15 juillet
        all_day: true,
        status: 'pending',
        priority: 'high',
        created_by: adminId,
        assigned_to: adminId,
        color: '#EC4899'
      },
      
      // Événements personnalisés
      {
        title: '⭐ Journée portes ouvertes',
        description: 'Accueil des familles intéressées par la crèche',
        type: 'custom',
        start_date: nextWeek,
        all_day: true,
        status: 'pending',
        priority: 'high',
        created_by: adminId,
        assigned_to: adminId,
        color: '#6366F1'
      },
      {
        title: '⭐ Atelier cuisine avec les enfants',
        description: 'Préparation de gâteaux simples avec les plus grands',
        type: 'custom',
        start_date: tomorrow,
        all_day: false,
        status: 'pending',
        priority: 'low',
        created_by: staffId,
        assigned_to: staffId,
        color: '#6366F1'
      }
    ];
    
    let created = 0;
    
    for (const event of events) {
      // Formater les dates
      const startDate = event.start_date.toISOString();
      const endDate = event.all_day 
        ? startDate 
        : new Date(event.start_date.getTime() + 2 * 60 * 60 * 1000).toISOString(); // +2h
      
      await client.query(`
        INSERT INTO events (
          title, description, type, start_date, end_date, all_day,
          status, priority, created_by, assigned_to, child_id,
          color, reminder_enabled, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        event.title,
        event.description,
        event.type,
        startDate,
        endDate,
        event.all_day,
        event.status,
        event.priority,
        event.created_by,
        event.assigned_to,
        event.child_id || null,
        event.color,
        true,
        JSON.stringify({ generated: true })
      ]);
      
      created++;
      console.log(`✅ ${event.title}`);
    }
    
    await client.query('COMMIT');
    
    console.log(`\n🎉 ${created} événements créés avec succès !`);
    console.log('\n📊 Répartition:');
    console.log('   📝 Mémos: 3');
    console.log('   ✅ Tâches: 5');
    console.log('   📅 RDV: 2');
    console.log('   🏥 Médicaux: 1');
    console.log('   👥 Réunions: 2');
    console.log('   🏖️ Vacances: 1');
    console.log('   ⭐ Personnalisés: 2');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécution
generateEventsData()
  .then(() => {
    console.log('\n✅ Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'exécution:', error);
    process.exit(1);
  });
