const db = require('../config/db_postgres');

/**
 * Récupérer les tâches du jour
 * GET /api/tasks/today
 */
exports.getTodayTasks = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Récupérer les tâches personnalisées du jour
    const customTasksResult = await db.query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.task_date,
        TO_CHAR(t.task_date, 'HH24:MI') as task_time,
        t.task_type,
        t.priority,
        t.status,
        t.created_by,
        t.assigned_to,
        u1.first_name as creator_first_name,
        u1.last_name as creator_last_name,
        u2.first_name as assigned_first_name,
        u2.last_name as assigned_last_name
      FROM tasks t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.task_date >= $1
        AND t.task_date < $2
        AND t.task_type = 'custom'
        AND t.status != 'cancelled'
      ORDER BY t.task_date ASC, t.priority DESC
    `, [today, tomorrow]);

    // Récupérer les rendez-vous du jour depuis la table APPOINTMENTS
    const appointmentsResult = await db.query(`
      SELECT 
        a.id as appointment_id,
        a.enrollment_id,
        a.child_first_name,
        a.child_last_name,
        a.parent_first_name,
        a.parent_last_name,
        a.parent_phone,
        a.parent_email,
        a.proposed_date as appointment_date,
        TO_CHAR(a.proposed_date, 'HH24:MI') as appointment_time,
        a.status as appointment_status,
        a.subject,
        a.description,
        a.appointment_type
      FROM appointments a
      WHERE a.proposed_date >= $1
        AND a.proposed_date < $2
        AND a.status NOT IN ('cancelled', 'completed', 'no_show')
      ORDER BY a.proposed_date ASC
    `, [today, tomorrow]);

    // Formater les tâches personnalisées
    const customTasks = customTasksResult.rows.map(task => ({
      id: task.id,
      type: 'custom',
      title: task.title,
      description: task.description,
      time: task.task_time,
      datetime: task.task_date,
      priority: task.priority,
      status: task.status,
      creator: task.creator_first_name ? `${task.creator_first_name} ${task.creator_last_name || ''}`.trim() : null,
      assigned: task.assigned_first_name ? `${task.assigned_first_name} ${task.assigned_last_name || ''}`.trim() : null
    }));

    // Formater les rendez-vous comme des tâches
    const appointmentTasks = appointmentsResult.rows.map(apt => ({
      id: apt.appointment_id,
      enrollment_id: apt.enrollment_id,
      type: 'appointment',
      appointment_type: apt.appointment_type,
      title: apt.subject || `RDV: ${apt.child_first_name} ${apt.child_last_name || ''}`.trim(),
      description: apt.description || `Rendez-vous avec ${apt.parent_first_name} ${apt.parent_last_name || ''}`.trim(),
      time: apt.appointment_time,
      datetime: apt.appointment_date,
      priority: 'high',
      status: apt.appointment_status,
      contact: {
        name: `${apt.parent_first_name} ${apt.parent_last_name || ''}`.trim(),
        phone: apt.parent_phone,
        email: apt.parent_email
      }
    }));

    // Combiner et trier par heure
    const allTasks = [...customTasks, ...appointmentTasks].sort((a, b) => {
      return new Date(a.datetime) - new Date(b.datetime);
    });

    res.json({
      success: true,
      count: allTasks.length,
      date: today.toLocaleDateString('fr-FR'),
      tasks: allTasks
    });

  } catch (error) {
    console.error('❌ Erreur récupération tâches du jour:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des tâches'
    });
  }
};

/**
 * Créer une nouvelle tâche
 * POST /api/tasks
 */
exports.createTask = async (req, res) => {
  try {
    const { title, description, task_date, task_time, priority, assigned_to } = req.body;
    const created_by = req.user.id;

    // Validation
    if (!title || !task_date) {
      return res.status(400).json({
        success: false,
        error: 'Le titre et la date sont obligatoires'
      });
    }

    // Combiner date et heure si fournie
    let fullDateTime = new Date(task_date);
    if (task_time) {
      const [hours, minutes] = task_time.split(':');
      fullDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    const result = await db.query(`
      INSERT INTO tasks (
        title, description, task_date, task_type, priority, 
        status, created_by, assigned_to
      )
      VALUES ($1, $2, $3, 'custom', $4, 'pending', $5, $6)
      RETURNING *
    `, [title, description, fullDateTime, priority || 'normal', created_by, assigned_to || null]);

    res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      task: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur création tâche:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la tâche'
    });
  }
};

/**
 * Mettre à jour le statut d'une tâche
 * PATCH /api/tasks/:id/status
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }

    const completed_at = status === 'completed' ? new Date() : null;

    const result = await db.query(`
      UPDATE tasks
      SET status = $1, completed_at = $2
      WHERE id = $3 AND task_type = 'custom'
      RETURNING *
    `, [status, completed_at, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Statut mis à jour',
      task: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut'
    });
  }
};

/**
 * Supprimer une tâche
 * DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM tasks
      WHERE id = $1 AND task_type = 'custom'
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Tâche supprimée'
    });

  } catch (error) {
    console.error('❌ Erreur suppression tâche:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
};
