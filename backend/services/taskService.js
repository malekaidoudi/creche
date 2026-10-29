/**
 * SERVICE TÂCHES
 * Gestion des tâches assignées par admin au staff
 */

const { pool, query } = require('../config/db_postgres');
const pushNotificationService = require('./pushNotificationService');

/**
 * Créer une nouvelle tâche
 */
async function createTask(taskData, creatorId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { title, description, assigned_to, due_date, priority = 'medium' } = taskData;
    const targetUserId = parseInt(assigned_to);
    const authorId = parseInt(creatorId);

    console.log('📝 Création tâche:', { title, assigned_to: targetUserId, creatorId: authorId, due_date, priority });

    // Créer la tâche
    const result = await client.query(`
      INSERT INTO tasks (title, description, assigned_to, created_by, due_date, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `, [title, description, targetUserId, authorId, due_date, priority]);

    const task = result.rows[0];

    // Créer notification pour le staff assigné
    let pushPayload = null;
    if (targetUserId && targetUserId !== authorId) {
      const creator = await getUserById(authorId);
      const creatorName = creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || 'La direction' : 'La direction';
      const taskTitle = '📋 Nouvelle tâche assignée';
      const taskMessage = `${creatorName} vous a assigné une tâche : "${title}"`;

      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
        VALUES ($1, $2, $3, 'task_assigned', $4, false, NOW())
      `, [targetUserId, taskTitle, taskMessage, task.id]);

      pushPayload = { userId: targetUserId, title: taskTitle, message: taskMessage, taskId: task.id };
    }

    await client.query('COMMIT');

    console.log(`✅ Tâche créée: ${title} → assignée à user ${targetUserId}`);

    if (pushPayload) {
      try {
        await pushNotificationService.sendPushToUser(pushPayload.userId, {
          title: pushPayload.title,
          message: pushPayload.message,
          url: `/dashboard/tasks?taskId=${pushPayload.taskId}`
        });
      } catch (pushErr) {
        console.warn('⚠️ Échec envoi push assignation tâche:', pushErr.message);
      }
    }

    return { success: true, task };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur createTask:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Récupérer les tâches d'un utilisateur
 */
async function getUserTasks(userId, filters = {}) {
  try {
    const { status, date } = filters;

    let query = `
      SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.assigned_to = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (date) {
      paramCount++;
      query += ` AND DATE(t.due_date) = $${paramCount}`;
      params.push(date);
    }

    query += ` ORDER BY t.priority DESC, t.due_date ASC`;

    const result = await query(query, params);

    return { success: true, tasks: result.rows };

  } catch (error) {
    console.error('❌ Erreur getUserTasks:', error);
    throw error;
  }
}

/**
 * Récupérer les tâches d'aujourd'hui
 * WORKFLOW:
 * - Chaque utilisateur voit les tâches qui lui sont ASSIGNÉES (pas celles qu'il a créées pour d'autres)
 * - Admin crée une tâche pour staff → staff la voit, admin ne la voit pas dans "aujourd'hui"
 * - Staff crée une tâche pour lui-même → il la voit
 */
async function getTodayTasks(userId) {
  try {
    // Chaque utilisateur voit uniquement les tâches qui lui sont assignées
    const result = await query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.assigned_to,
        t.created_by,
        t.due_date,
        t.status,
        t.priority,
        t.created_at,
        t.completed_at,
        'task' as type,
        u1.first_name || ' ' || u1.last_name as assigned_to_name,
        u1.role as assigned_to_role,
        u2.first_name || ' ' || u2.last_name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE DATE(t.due_date) = CURRENT_DATE
        AND t.status != 'completed'
        AND t.assigned_to = $1
      ORDER BY 
        CASE t.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        t.due_date ASC
    `, [userId]);

    return { success: true, tasks: result.rows };

  } catch (error) {
    console.error('❌ Erreur getTodayTasks:', error);
    throw error;
  }
}

/**
 * Récupérer les tâches en retard
 * WORKFLOW:
 * - Admin: voit TOUTES les tâches en retard (supervision globale)
 * - Staff: voit seulement les tâches qui lui sont ASSIGNÉES et en retard
 */
async function getOverdueTasks(userId = null, userRole = null) {
  try {
    // Si userId fourni, récupérer le rôle
    let role = userRole;
    if (userId && !role) {
      const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
      role = userResult.rows[0]?.role || 'staff';
    }

    // Pour admin: voir TOUTES les tâches en retard (supervision)
    // Pour staff: seulement celles qui lui sont assignées
    const whereClause = (role === 'admin')
      ? ''
      : 'AND t.assigned_to = $1';

    const result = await query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.assigned_to,
        t.created_by,
        t.due_date,
        t.status,
        t.priority,
        t.created_at,
        'task' as type,
        u1.first_name || ' ' || u1.last_name as assigned_to_name,
        u1.role as assigned_to_role,
        u2.first_name || ' ' || u2.last_name as created_by_name,
        CURRENT_DATE - DATE(t.due_date) as days_overdue
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE DATE(t.due_date) < CURRENT_DATE
        AND t.status != 'completed'
        ${whereClause}
      ORDER BY 
        CASE t.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        t.due_date ASC
    `, (role === 'admin') ? [] : [userId]);

    return { success: true, tasks: result.rows };

  } catch (error) {
    console.error('❌ Erreur getOverdueTasks:', error);
    throw error;
  }
}

/**
 * Mettre à jour le statut d'une tâche
 */
async function updateTaskStatus(taskId, status, userId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Récupérer la tâche actuelle
    const currentTask = await client.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (currentTask.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Tâche non trouvée' };
    }

    const task = currentTask.rows[0];

    // Mettre à jour le statut
    const result = await client.query(`
      UPDATE tasks
      SET status = $1,
          completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE NULL END,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, status, taskId]);

    const updatedTask = result.rows[0];

    // Si complétée, notifier le créateur et l'administration
    let pushPayloads = [];
    const completerId = parseInt(userId);
    if (status === 'completed') {
      const completer = await getUserById(completerId);
      const completerName = completer ? `${completer.first_name || ''} ${completer.last_name || ''}`.trim() || 'Une éducatrice' : 'Une éducatrice';
      const notifTitle = '✅ Tâche complétée';
      const notifMessage = `${completerName} a complété la tâche : "${task.title}"`;

      // Notifier le créateur de la tâche + tous les administrateurs actifs (sauf le compléteur s'il en fait partie)
      const adminQuery = await client.query(`
        SELECT id FROM users 
        WHERE (role = 'admin' OR id = $1)
          AND is_active = true 
          AND id != $2
      `, [task.created_by, completerId]);

      const recipientIds = [...new Set(adminQuery.rows.map(r => r.id))];

      for (const recId of recipientIds) {
        await client.query(`
          INSERT INTO notifications (user_id, title, message, type, related_id, is_read, created_at)
          VALUES ($1, $2, $3, 'task_completed', $4, false, NOW())
        `, [recId, notifTitle, notifMessage, task.id]);

        pushPayloads.push({
          userId: recId,
          title: notifTitle,
          message: notifMessage,
          taskId: task.id
        });
      }
    }

    await client.query('COMMIT');

    console.log(`✅ Tâche ${taskId} → statut: ${status}`);

    for (const p of pushPayloads) {
      try {
        await pushNotificationService.sendPushToUser(p.userId, {
          title: p.title,
          message: p.message,
          url: `/dashboard/tasks?taskId=${p.taskId}`
        });
      } catch (pushErr) {
        console.warn('⚠️ Échec envoi push complétion tâche:', pushErr.message);
      }
    }

    return { success: true, task: updatedTask };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur updateTaskStatus:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Envoyer un rappel pour une tâche en retard
 */
async function sendTaskReminder(taskId, adminId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const task = await client.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (task.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Tâche non trouvée' };
    }

    const taskData = task.rows[0];
    const admin = await getUserById(adminId);
    const title = '⏰ Rappel: Tâche en retard';
    const message = `${admin.first_name} ${admin.last_name} vous rappelle la tâche en retard : "${taskData.title}"`;

    // Créer notification de rappel
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'task_reminder', $4, false)
    `, [taskData.assigned_to, title, message, taskData.id]);

    await client.query('COMMIT');

    console.log(`✅ Rappel envoyé pour tâche ${taskId}`);

    await pushNotificationService.sendPushToUser(taskData.assigned_to, {
      title,
      message,
      url: `/dashboard/tasks?taskId=${taskData.id}`
    });

    return { success: true, message: 'Rappel envoyé' };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur sendTaskReminder:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Supprimer une tâche
 */
async function deleteTask(taskId) {
  try {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [taskId]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Tâche non trouvée' };
    }

    console.log(`✅ Tâche ${taskId} supprimée`);

    return { success: true, message: 'Tâche supprimée' };

  } catch (error) {
    console.error('❌ Erreur deleteTask:', error);
    throw error;
  }
}

/**
 * Récupérer un utilisateur par ID
 */
async function getUserById(userId) {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Erreur getUserById:', error);
    return null;
  }
}

/**
 * Mettre à jour une tâche (admin/staff avec permission)
 */
async function updateTask(taskId, updates) {
  try {
    const { title, description, assigned_to, due_date, priority } = updates;

    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (assigned_to !== undefined) {
      fields.push(`assigned_to = $${idx++}`);
      values.push(assigned_to);
    }
    if (due_date !== undefined) {
      fields.push(`due_date = $${idx++}`);
      values.push(due_date);
    }
    if (priority !== undefined) {
      fields.push(`priority = $${idx++}`);
      values.push(priority);
    }

    if (fields.length === 0) {
      return { success: false, error: 'Aucun champ à mettre à jour' };
    }

    fields.push(`updated_at = NOW()`);
    values.push(taskId);

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await query(query, values);

    if (result.rows.length === 0) {
      return { success: false, error: 'Tâche non trouvée' };
    }

    return { success: true, task: result.rows[0] };
  } catch (error) {
    console.error('❌ Erreur updateTask:', error);
    throw error;
  }
}

module.exports = {
  createTask,
  getUserTasks,
  getTodayTasks,
  getOverdueTasks,
  updateTaskStatus,
  updateTask,
  sendTaskReminder,
  deleteTask
};
