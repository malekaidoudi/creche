/**
 * SERVICE TÂCHES
 * Gestion des tâches assignées par admin au staff
 */

const { pool } = require('../config/db_postgres');

/**
 * Créer une nouvelle tâche
 */
async function createTask(taskData, creatorId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { title, description, assigned_to, due_date, priority = 'medium' } = taskData;

    console.log('📝 Création tâche:', { title, assigned_to, creatorId, due_date, priority });

    // Créer la tâche
    const result = await client.query(`
      INSERT INTO tasks (title, description, assigned_to, created_by, due_date, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `, [title, description, assigned_to, creatorId, due_date, priority]);

    const task = result.rows[0];

    // Créer notification pour le staff assigné
    if (assigned_to !== creatorId) {
      const creator = await getUserById(creatorId);

      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
        VALUES ($1, $2, $3, 'task_assigned', $4, false)
      `, [
        assigned_to,
        '✅ Nouvelle tâche assignée',
        `${creator.first_name} ${creator.last_name} vous a assigné une tâche : "${title}"`,
        task.id
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ Tâche créée: ${title} → assignée à user ${assigned_to}`);

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

    const result = await pool.query(query, params);

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
    const result = await pool.query(`
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
      const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
      role = userResult.rows[0]?.role || 'staff';
    }

    // Pour admin: voir TOUTES les tâches en retard (supervision)
    // Pour staff: seulement celles qui lui sont assignées
    const whereClause = (role === 'admin')
      ? ''
      : 'AND t.assigned_to = $1';

    const result = await pool.query(`
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

    // Si complétée, notifier le créateur
    if (status === 'completed' && task.created_by !== userId) {
      const completer = await getUserById(userId);

      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
        VALUES ($1, $2, $3, 'task_completed', $4, false)
      `, [
        task.created_by,
        '✅ Tâche complétée',
        `${completer.first_name} ${completer.last_name} a complété la tâche : "${task.title}"`,
        task.id
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ Tâche ${taskId} → statut: ${status}`);

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

    // Créer notification de rappel
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES ($1, $2, $3, 'task_reminder', $4, false)
    `, [
      taskData.assigned_to,
      '⏰ Rappel: Tâche en retard',
      `${admin.first_name} ${admin.last_name} vous rappelle la tâche en retard : "${taskData.title}"`,
      taskData.id
    ]);

    await client.query('COMMIT');

    console.log(`✅ Rappel envoyé pour tâche ${taskId}`);

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
    const result = await pool.query(
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
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Erreur getUserById:', error);
    return null;
  }
}

module.exports = {
  createTask,
  getUserTasks,
  getTodayTasks,
  getOverdueTasks,
  updateTaskStatus,
  sendTaskReminder,
  deleteTask
};
