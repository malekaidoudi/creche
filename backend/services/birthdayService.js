/**
 * Service de gestion des anniversaires
 * Génération automatique des événements d'anniversaire
 */

const { pool } = require('../config/db_postgres');
const { sendBirthdayReminder } = require('./eventEmailService');

/**
 * Générer les événements d'anniversaire pour tous les enfants
 */
async function generateBirthdayEvents() {
  const client = await pool.connect();
  
  try {
    console.log('🎂 Génération des événements d\'anniversaire...');
    
    await client.query('BEGIN');
    
    // Récupérer tous les enfants actifs
    const childrenResult = await client.query(`
      SELECT id, first_name, last_name, birth_date
      FROM children
      WHERE is_active = true
    `);
    
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    let created = 0;
    
    for (const child of childrenResult.rows) {
      // Créer l'événement pour cette année si pas encore passé
      const thisYearBirthday = new Date(child.birth_date);
      thisYearBirthday.setFullYear(currentYear);
      
      if (thisYearBirthday > new Date()) {
        const exists = await checkBirthdayEventExists(child.id, currentYear);
        if (!exists) {
          await createBirthdayEvent(client, child, currentYear);
          created++;
        }
      }
      
      // Créer l'événement pour l'année prochaine
      const existsNextYear = await checkBirthdayEventExists(child.id, nextYear);
      if (!existsNextYear) {
        await createBirthdayEvent(client, child, nextYear);
        created++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`✅ ${created} événement(s) d'anniversaire créé(s)`);
    return { success: true, created };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur generateBirthdayEvents:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Créer un événement d'anniversaire pour un enfant
 */
async function createBirthdayEvent(client, child, year) {
  const birthDate = new Date(child.birth_date);
  const birthdayThisYear = new Date(birthDate);
  birthdayThisYear.setFullYear(year);
  birthdayThisYear.setHours(0, 0, 0, 0);
  
  const age = year - birthDate.getFullYear();
  
  // Créer l'événement
  const eventResult = await client.query(`
    INSERT INTO events (
      title, description, type, start_date, all_day,
      is_recurring, status, priority, child_id,
      reminder_enabled, color, created_by
    ) VALUES ($1, $2, 'birthday', $3, true, true, 'pending', 'medium', $4, true, '#EC4899', 1)
    RETURNING *
  `, [
    `🎂 Anniversaire de ${child.first_name}`,
    `${child.first_name} ${child.last_name} aura ${age} ans`,
    birthdayThisYear,
    child.id
  ]);
  
  const event = eventResult.rows[0];
  
  // Créer un rappel 7 jours avant
  const reminderDate = new Date(birthdayThisYear);
  reminderDate.setDate(reminderDate.getDate() - 7);
  
  await client.query(`
    INSERT INTO event_reminders (
      event_id, offset_minutes, notification_type, scheduled_for
    ) VALUES ($1, $2, 'email', $3)
  `, [
    event.id,
    7 * 24 * 60, // 7 jours en minutes
    reminderDate
  ]);
  
  return event;
}

/**
 * Vérifier si un événement d'anniversaire existe déjà
 */
async function checkBirthdayEventExists(childId, year) {
  try {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    
    const result = await pool.query(`
      SELECT id FROM events
      WHERE type = 'birthday'
        AND child_id = $1
        AND start_date >= $2
        AND start_date <= $3
        AND deleted_at IS NULL
    `, [childId, startOfYear, endOfYear]);
    
    return result.rows.length > 0;
    
  } catch (error) {
    console.error('❌ Erreur checkBirthdayEventExists:', error);
    return false;
  }
}

/**
 * Récupérer les anniversaires du mois
 */
async function getBirthdaysThisMonth() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const result = await pool.query(`
      SELECT 
        e.*,
        c.first_name, c.last_name, c.birth_date, c.photo_url
      FROM events e
      JOIN children c ON e.child_id = c.id
      WHERE e.type = 'birthday'
        AND e.start_date >= $1
        AND e.start_date <= $2
        AND e.deleted_at IS NULL
      ORDER BY e.start_date ASC
    `, [startOfMonth, endOfMonth]);
    
    return { success: true, birthdays: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getBirthdaysThisMonth:', error);
    throw error;
  }
}

/**
 * Récupérer les prochains anniversaires
 */
async function getUpcomingBirthdays(days = 30) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const result = await pool.query(`
      SELECT 
        e.*,
        c.first_name, c.last_name, c.birth_date, c.photo_url
      FROM events e
      JOIN children c ON e.child_id = c.id
      WHERE e.type = 'birthday'
        AND e.start_date >= $1
        AND e.start_date <= $2
        AND e.deleted_at IS NULL
      ORDER BY e.start_date ASC
    `, [now, futureDate]);
    
    return { success: true, birthdays: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getUpcomingBirthdays:', error);
    throw error;
  }
}

/**
 * Envoyer les rappels d'anniversaire
 */
async function sendBirthdayReminders() {
  try {
    console.log('🎂 Envoi des rappels d\'anniversaire...');
    
    // Récupérer les rappels à envoyer
    const result = await pool.query(`
      SELECT 
        er.*,
        e.*,
        c.first_name, c.last_name, c.birth_date
      FROM event_reminders er
      JOIN events e ON er.event_id = e.id
      JOIN children c ON e.child_id = c.id
      WHERE er.sent = false
        AND er.notification_type = 'email'
        AND er.scheduled_for <= NOW()
        AND e.type = 'birthday'
        AND e.deleted_at IS NULL
    `);
    
    let sent = 0;
    
    for (const reminder of result.rows) {
      // Récupérer tous les staff
      const staffResult = await pool.query(`
        SELECT id, email, first_name, last_name
        FROM users
        WHERE role IN ('admin', 'staff')
          AND deleted_at IS NULL
      `);
      
      if (staffResult.rows.length > 0) {
        const daysUntil = Math.ceil((new Date(reminder.start_date) - new Date()) / (1000 * 60 * 60 * 24));
        
        const emailResult = await sendBirthdayReminder(
          {
            first_name: reminder.first_name,
            last_name: reminder.last_name,
            birth_date: reminder.birth_date
          },
          staffResult.rows,
          daysUntil
        );
        
        if (emailResult.success) {
          // Marquer comme envoyé
          await pool.query(`
            UPDATE event_reminders
            SET sent = true, sent_at = NOW()
            WHERE id = $1
          `, [reminder.id]);
          
          sent++;
        }
      }
    }
    
    console.log(`✅ ${sent} rappel(s) d'anniversaire envoyé(s)`);
    return { success: true, sent };
    
  } catch (error) {
    console.error('❌ Erreur sendBirthdayReminders:', error);
    throw error;
  }
}

module.exports = {
  generateBirthdayEvents,
  getBirthdaysThisMonth,
  getUpcomingBirthdays,
  sendBirthdayReminders
};
