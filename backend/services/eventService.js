/**
 * Service de gestion des événements
 * Logique métier pour les événements, tâches, RDV, anniversaires, etc.
 */

const { pool } = require('../config/db_postgres');
const { sendEventReminder, sendEventAssigned, sendEventOverdue } = require('./eventEmailService');

/**
 * Créer un événement
 */
async function createEvent(eventData, userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insérer l'événement
    const eventResult = await client.query(`
      INSERT INTO events (
        title, description, type, start_date, end_date, all_day,
        is_recurring, recurrence_rule, status, priority,
        created_by, assigned_to, child_id,
        reminder_enabled, reminder_offset,
        color, attendees, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      eventData.title,
      eventData.description || null,
      eventData.type,
      eventData.start_date,
      eventData.end_date || null,
      eventData.all_day || false,
      eventData.is_recurring || false,
      eventData.recurrence_rule ? JSON.stringify(eventData.recurrence_rule) : null,
      eventData.status || 'pending',
      eventData.priority || 'medium',
      userId,
      eventData.assigned_to || userId,
      eventData.child_id || null,
      eventData.reminder_enabled || false,
      eventData.reminder_offset || null,
      eventData.color || getDefaultColor(eventData.type),
      eventData.attendees ? JSON.stringify(eventData.attendees) : '[]',
      eventData.metadata ? JSON.stringify(eventData.metadata) : '{}'
    ]);
    
    const event = eventResult.rows[0];
    
    // Créer les rappels si activés
    if (eventData.reminder_enabled && eventData.reminders && eventData.reminders.length > 0) {
      for (const reminder of eventData.reminders) {
        const scheduledFor = new Date(event.start_date);
        scheduledFor.setMinutes(scheduledFor.getMinutes() - reminder.offset_minutes);
        
        await client.query(`
          INSERT INTO event_reminders (
            event_id, offset_minutes, notification_type, scheduled_for, recipient_id
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          event.id,
          reminder.offset_minutes,
          reminder.notification_type || 'email',
          scheduledFor,
          eventData.assigned_to || userId
        ]);
      }
    }
    
    // Logger la création
    await client.query(`
      INSERT INTO event_history (event_id, user_id, action)
      VALUES ($1, $2, 'created')
    `, [event.id, userId]);
    
    await client.query('COMMIT');
    
    // Créer une notification pour la personne assignée
    if (eventData.assigned_to && eventData.assigned_to !== userId) {
      await createEventNotification(event, eventData.assigned_to, userId);
    }
    
    // Envoyer email d'assignation si assigné à quelqu'un d'autre
    if (eventData.assigned_to && eventData.assigned_to !== userId && eventData.type === 'task') {
      const assignedUser = await getUserById(eventData.assigned_to);
      const creatorUser = await getUserById(userId);
      
      if (assignedUser && creatorUser) {
        await sendEventAssigned(event, assignedUser, creatorUser);
      }
    }
    
    return { success: true, event };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur createEvent:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Récupérer tous les événements avec filtres
 */
async function getEvents(filters = {}) {
  try {
    let query = `
      SELECT 
        e.*,
        u1.first_name || ' ' || u1.last_name as created_by_name,
        u2.first_name || ' ' || u2.last_name as assigned_to_name,
        c.first_name || ' ' || c.last_name as child_name,
        (SELECT COUNT(*) FROM event_comments ec WHERE ec.event_id = e.id AND ec.deleted_at IS NULL) as comments_count
      FROM events e
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.assigned_to = u2.id
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.deleted_at IS NULL
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Filtres
    if (filters.type) {
      paramCount++;
      query += ` AND e.type = $${paramCount}`;
      params.push(filters.type);
    }
    
    if (filters.status) {
      paramCount++;
      query += ` AND e.status = $${paramCount}`;
      params.push(filters.status);
    }
    
    if (filters.priority) {
      paramCount++;
      query += ` AND e.priority = $${paramCount}`;
      params.push(filters.priority);
    }
    
    if (filters.assigned_to) {
      paramCount++;
      query += ` AND e.assigned_to = $${paramCount}`;
      params.push(filters.assigned_to);
    }
    
    if (filters.child_id) {
      paramCount++;
      query += ` AND e.child_id = $${paramCount}`;
      params.push(filters.child_id);
    }
    
    if (filters.start_date) {
      paramCount++;
      query += ` AND e.start_date >= $${paramCount}`;
      params.push(filters.start_date);
    }
    
    if (filters.end_date) {
      paramCount++;
      query += ` AND e.start_date <= $${paramCount}`;
      params.push(filters.end_date);
    }
    
    // Tri
    query += ` ORDER BY e.start_date ASC`;
    
    // Pagination
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }
    
    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }
    
    const result = await pool.query(query, params);
    
    return { success: true, events: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getEvents:', error);
    throw error;
  }
}

/**
 * Récupérer un événement par ID
 */
async function getEventById(eventId) {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        u1.first_name || ' ' || u1.last_name as created_by_name,
        u2.first_name || ' ' || u2.last_name as assigned_to_name,
        c.first_name || ' ' || c.last_name as child_name
      FROM events e
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.assigned_to = u2.id
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.id = $1 AND e.deleted_at IS NULL
    `, [eventId]);
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Événement non trouvé' };
    }
    
    // Récupérer les commentaires
    const commentsResult = await pool.query(`
      SELECT 
        ec.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM event_comments ec
      JOIN users u ON ec.user_id = u.id
      WHERE ec.event_id = $1 AND ec.deleted_at IS NULL
      ORDER BY ec.created_at DESC
    `, [eventId]);
    
    // Récupérer les rappels
    const remindersResult = await pool.query(`
      SELECT * FROM event_reminders
      WHERE event_id = $1
      ORDER BY scheduled_for ASC
    `, [eventId]);
    
    const event = result.rows[0];
    event.comments = commentsResult.rows;
    event.reminders = remindersResult.rows;
    
    return { success: true, event };
    
  } catch (error) {
    console.error('❌ Erreur getEventById:', error);
    throw error;
  }
}

/**
 * Mettre à jour un événement
 */
async function updateEvent(eventId, updates, userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Récupérer l'événement actuel
    const currentResult = await client.query(
      'SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL',
      [eventId]
    );
    
    if (currentResult.rows.length === 0) {
      throw new Error('Événement non trouvé');
    }
    
    const current = currentResult.rows[0];
    
    // Construire la requête de mise à jour
    const fields = [];
    const values = [];
    let paramCount = 0;
    
    const allowedFields = [
      'title', 'description', 'type', 'start_date', 'end_date', 'all_day',
      'status', 'priority', 'assigned_to', 'child_id',
      'reminder_enabled', 'reminder_offset', 'color'
    ];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        paramCount++;
        fields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
      }
    }
    
    if (fields.length === 0) {
      throw new Error('Aucune mise à jour fournie');
    }
    
    paramCount++;
    values.push(eventId);
    
    const query = `
      UPDATE events
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    const event = result.rows[0];
    
    // Logger les changements
    for (const field of allowedFields) {
      if (updates[field] !== undefined && current[field] !== updates[field]) {
        await client.query(`
          INSERT INTO event_history (event_id, user_id, action, field_name, old_value, new_value)
          VALUES ($1, $2, 'updated', $3, $4, $5)
        `, [eventId, userId, field, String(current[field]), String(updates[field])]);
      }
    }
    
    await client.query('COMMIT');
    
    // Si l'assignation a changé, créer une notification
    if (updates.assigned_to && updates.assigned_to !== current.assigned_to && updates.assigned_to !== userId) {
      await createEventUpdateNotification(event, updates.assigned_to, userId, 'assigned');
    }
    
    return { success: true, event };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur updateEvent:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Changer le statut d'un événement
 */
async function updateEventStatus(eventId, status, userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Récupérer l'événement actuel
    const currentResult = await client.query(
      'SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL',
      [eventId]
    );
    
    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Événement non trouvé' };
    }
    
    const currentEvent = currentResult.rows[0];
    
    // Mettre à jour le statut
    const result = await client.query(`
      UPDATE events
      SET status = $1::varchar, 
          completed_at = CASE WHEN $1::varchar = 'completed' THEN NOW() ELSE completed_at END
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `, [status, eventId]);
    
    // Logger le changement dans l'historique
    if (userId) {
      await client.query(`
        INSERT INTO event_history (event_id, user_id, action, field_name, old_value, new_value)
        VALUES ($1, $2, 'status_changed', 'status', $3, $4)
      `, [eventId, userId, currentEvent.status, status]);
    }
    
    await client.query('COMMIT');
    
    return { success: true, event: result.rows[0] };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur updateEventStatus:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Supprimer un événement (soft delete)
 */
async function deleteEvent(eventId, userId) {
  try {
    const result = await pool.query(`
      UPDATE events
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, [eventId]);
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Événement non trouvé' };
    }
    
    // Logger la suppression
    await pool.query(`
      INSERT INTO event_history (event_id, user_id, action)
      VALUES ($1, $2, 'deleted')
    `, [eventId, userId]);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur deleteEvent:', error);
    throw error;
  }
}

/**
 * Ajouter un commentaire
 */
async function addComment(eventId, userId, comment) {
  try {
    const result = await pool.query(`
      INSERT INTO event_comments (event_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [eventId, userId, comment]);
    
    return { success: true, comment: result.rows[0] };
    
  } catch (error) {
    console.error('❌ Erreur addComment:', error);
    throw error;
  }
}

/**
 * Récupérer les événements à venir
 */
async function getUpcomingEvents(userId, days = 7) {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        u1.first_name || ' ' || u1.last_name as created_by_name,
        u2.first_name || ' ' || u2.last_name as assigned_to_name,
        c.first_name || ' ' || c.last_name as child_name
      FROM events e
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.assigned_to = u2.id
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.deleted_at IS NULL
        AND e.start_date >= NOW()
        AND e.start_date <= NOW() + INTERVAL '${days} days'
        AND (e.assigned_to = $1 OR e.created_by = $1)
      ORDER BY e.start_date ASC
      LIMIT 10
    `, [userId]);
    
    return { success: true, events: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getUpcomingEvents:', error);
    throw error;
  }
}

/**
 * Récupérer les événements en retard
 */
async function getOverdueEvents(userId) {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        u1.first_name || ' ' || u1.last_name as created_by_name,
        u2.first_name || ' ' || u2.last_name as assigned_to_name,
        c.first_name || ' ' || c.last_name as child_name
      FROM events e
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.assigned_to = u2.id
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.deleted_at IS NULL
        AND e.type = 'task'
        AND e.status != 'completed'
        AND e.start_date < NOW()
        AND (e.assigned_to = $1 OR e.created_by = $1)
      ORDER BY e.start_date ASC
    `, [userId]);
    
    return { success: true, events: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getOverdueEvents:', error);
    throw error;
  }
}

/**
 * Récupérer les tâches pour Kanban
 */
async function getTasksKanban(userId) {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        u1.first_name || ' ' || u1.last_name as created_by_name,
        u2.first_name || ' ' || u2.last_name as assigned_to_name,
        c.first_name || ' ' || c.last_name as child_name
      FROM events e
      LEFT JOIN users u1 ON e.created_by = u1.id
      LEFT JOIN users u2 ON e.assigned_to = u2.id
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.deleted_at IS NULL
        AND e.type = 'task'
        AND (e.assigned_to = $1 OR e.created_by = $1)
      ORDER BY e.start_date ASC
    `, [userId]);
    
    // Grouper par statut
    const kanban = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: []
    };
    
    result.rows.forEach(task => {
      if (kanban[task.status]) {
        kanban[task.status].push(task);
      }
    });
    
    return { success: true, kanban };
    
  } catch (error) {
    console.error('❌ Erreur getTasksKanban:', error);
    throw error;
  }
}

/**
 * Récupérer les événements pour le calendrier
 */
async function getCalendarEvents(startDate, endDate, userId) {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.type,
        e.start_date as start,
        e.end_date as end,
        e.all_day as "allDay",
        e.color,
        e.status,
        e.priority
      FROM events e
      WHERE e.deleted_at IS NULL
        AND e.start_date >= $1
        AND e.start_date <= $2
        AND (e.assigned_to = $3 OR e.created_by = $3)
      ORDER BY e.start_date ASC
    `, [startDate, endDate, userId]);
    
    return { success: true, events: result.rows };
    
  } catch (error) {
    console.error('❌ Erreur getCalendarEvents:', error);
    throw error;
  }
}

// =====================================================
// Helpers
// =====================================================

function getDefaultColor(type) {
  const colors = {
    memo: '#3B82F6',
    task: '#10B981',
    rdv: '#F59E0B',
    birthday: '#EC4899',
    vacation_reminder: '#8B5CF6',
    medical: '#EF4444',
    meeting: '#6366F1',
    custom: '#6B7280'
  };
  return colors[type] || '#6B7280';
}

async function getUserById(userId) {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Erreur getUserById:', error);
    return null;
  }
}

/**
 * Créer une notification pour une mise à jour d'événement
 */
async function createEventUpdateNotification(event, recipientId, updaterId, updateType) {
  try {
    const updater = await getUserById(updaterId);
    if (!updater) return;

    let title, message;
    
    if (updateType === 'assigned') {
      title = `🔄 Événement réassigné`;
      message = `${updater.first_name} ${updater.last_name} vous a assigné l'événement : "${event.title}"`;
    } else {
      title = `🔄 Événement modifié`;
      message = `${updater.first_name} ${updater.last_name} a modifié l'événement : "${event.title}"`;
    }

    const notificationType = 'event_updated';

    await pool.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, $4, $5, false)
    `, [recipientId, title, message, notificationType, event.id]);

    console.log(`✅ Notification de mise à jour créée pour l'utilisateur ${recipientId}`);
    
  } catch (error) {
    console.error('❌ Erreur createEventUpdateNotification:', error);
  }
}

/**
 * Créer une notification pour un événement
 */
async function createEventNotification(event, recipientId, creatorId) {
  try {
    const creator = await getUserById(creatorId);
    if (!creator) return;

    // Déterminer le type de notification selon le type d'événement
    const notificationTypes = {
      task: 'event_task',
      memo: 'event_memo',
      rdv: 'event_rdv',
      medical: 'event_medical',
      meeting: 'event_meeting',
      birthday: 'event_birthday',
      vacation_reminder: 'event_vacation',
      custom: 'event_custom'
    };

    const notificationType = notificationTypes[event.type] || 'event_general';

    // Déterminer le titre et le message selon le type
    let title, message;
    
    if (event.type === 'task') {
      title = `✅ Nouvelle tâche assignée`;
      message = `${creator.first_name} ${creator.last_name} vous a assigné une tâche : "${event.title}"`;
    } else if (event.type === 'memo') {
      title = `📝 Nouveau mémo`;
      message = `${creator.first_name} ${creator.last_name} vous a envoyé un mémo : "${event.title}"`;
    } else if (event.type === 'rdv') {
      title = `📅 Nouveau rendez-vous`;
      message = `${creator.first_name} ${creator.last_name} a programmé un rendez-vous : "${event.title}"`;
    } else if (event.type === 'medical') {
      title = `🏥 Rendez-vous médical`;
      message = `${creator.first_name} ${creator.last_name} a programmé un rendez-vous médical : "${event.title}"`;
    } else if (event.type === 'meeting') {
      title = `👥 Nouvelle réunion`;
      message = `${creator.first_name} ${creator.last_name} vous a invité à une réunion : "${event.title}"`;
    } else {
      title = `📆 Nouvel événement`;
      message = `${creator.first_name} ${creator.last_name} a créé un événement : "${event.title}"`;
    }

    // Ajouter la date
    const eventDate = new Date(event.start_date);
    const dateStr = eventDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    message += ` - ${dateStr}`;

    // Insérer la notification
    await pool.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, $4, $5, false)
    `, [recipientId, title, message, notificationType, event.id]);

    console.log(`✅ Notification créée pour l'utilisateur ${recipientId} - Événement: ${event.title}`);
    
  } catch (error) {
    console.error('❌ Erreur createEventNotification:', error);
    // Ne pas bloquer la création de l'événement si la notification échoue
  }
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  addComment,
  getUpcomingEvents,
  getOverdueEvents,
  getTasksKanban,
  getCalendarEvents
};
