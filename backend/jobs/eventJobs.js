/**
 * Jobs cron pour la gestion automatique des événements
 */

const cron = require('node-cron');
const db = require('../config/db_postgres');
const { sendEventReminder, sendEventOverdue } = require('../services/eventEmailService');
const { generateBirthdayEvents, sendBirthdayReminders } = require('../services/birthdayService');

/**
 * Job: Envoi des rappels d'événements
 * Fréquence: Toutes les 15 minutes
 */
function startReminderScheduler() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('🔔 [Job] Vérification des rappels à envoyer...');

      // Récupérer les rappels à envoyer
      const result = await db.query(`
        SELECT 
          er.*,
          e.*,
          u.email, u.first_name, u.last_name
        FROM event_reminders er
        JOIN events e ON er.event_id = e.id
        JOIN users u ON COALESCE(er.recipient_id, e.assigned_to) = u.id
        WHERE er.sent = false
          AND er.notification_type = 'email'
          AND er.scheduled_for <= NOW()
          AND e.deleted_at IS NULL
          AND e.type != 'birthday'
      `);

      let sent = 0;
      let errors = 0;

      for (const reminder of result.rows) {
        const user = {
          email: reminder.email,
          first_name: reminder.first_name,
          last_name: reminder.last_name
        };

        const emailResult = await sendEventReminder(
          reminder,
          user,
          reminder.offset_minutes
        );

        if (emailResult.success) {
          // Marquer comme envoyé
          await db.query(`
            UPDATE event_reminders
            SET sent = true, sent_at = NOW()
            WHERE id = $1
          `, [reminder.id]);

          sent++;
        } else {
          // Logger l'erreur
          await db.query(`
            UPDATE event_reminders
            SET error_message = $1
            WHERE id = $2
          `, [emailResult.error, reminder.id]);

          errors++;
        }
      }

      if (sent > 0 || errors > 0) {
        console.log(`✅ [Job] Rappels: ${sent} envoyé(s), ${errors} erreur(s)`);
      }

    } catch (error) {
      console.error('❌ [Job] Erreur reminderScheduler:', error);
    }
  });

  console.log('✅ Job reminderScheduler démarré (toutes les 15 minutes)');
}

/**
 * Job: Génération des anniversaires
 * Fréquence: Quotidien à 00:00
 */
function startBirthdayGenerator() {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🎂 [Job] Génération des événements d\'anniversaire...');

      const result = await generateBirthdayEvents();

      if (result.created > 0) {
        console.log(`✅ [Job] ${result.created} anniversaire(s) créé(s)`);
      }

      // Envoyer les rappels d'anniversaire
      await sendBirthdayReminders();

    } catch (error) {
      console.error('❌ [Job] Erreur birthdayGenerator:', error);
    }
  });

  console.log('✅ Job birthdayGenerator démarré (quotidien à 00:00)');
}

/**
 * Job: Détection des événements en retard
 * Fréquence: Quotidien à 06:00
 */
function startOverdueChecker() {
  cron.schedule('0 6 * * *', async () => {
    try {
      console.log('⚠️ [Job] Vérification des événements en retard...');

      // Récupérer les événements en retard non marqués
      const result = await db.query(`
        SELECT 
          e.*,
          u.email, u.first_name, u.last_name
        FROM events e
        JOIN users u ON e.assigned_to = u.id
        WHERE e.deleted_at IS NULL
          AND e.status NOT IN ('completed', 'cancelled', 'overdue')
          AND (
            (e.end_date IS NOT NULL AND e.end_date < NOW())
            OR (e.end_date IS NULL AND e.start_date < NOW())
          )
      `);

      let updated = 0;
      let notified = 0;

      for (const event of result.rows) {
        // Changer le statut en overdue
        await db.query(`
          UPDATE events
          SET status = 'overdue'
          WHERE id = $1
        `, [event.id]);

        updated++;

        // Envoyer email de notification
        const user = {
          email: event.email,
          first_name: event.first_name,
          last_name: event.last_name
        };

        const emailResult = await sendEventOverdue(event, user);

        if (emailResult.success) {
          notified++;
        }
      }

      if (updated > 0) {
        console.log(`✅ [Job] ${updated} événement(s) marqué(s) en retard, ${notified} notification(s) envoyée(s)`);
      }

    } catch (error) {
      console.error('❌ [Job] Erreur overdueChecker:', error);
    }
  });

  console.log('✅ Job overdueChecker démarré (quotidien à 06:00)');
}

/**
 * Job: Rappels pour RDV en attente de réponse
 * Fréquence: Toutes les heures
 * Crée une tâche + notification si un RDV est en attente depuis plus de 24h
 */
function startAppointmentReminderJob() {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('📅 [Job] Vérification des RDV en attente de réponse...');

      // RDV en attente depuis plus de 24h sans rappel récent
      const result = await db.query(`
        SELECT 
          a.*,
          u.first_name as parent_first_name,
          u.last_name as parent_last_name,
          u.email as parent_email
        FROM appointments a
        LEFT JOIN users u ON a.parent_id = u.id
        WHERE a.status IN ('proposed', 'counter_proposed')
          AND a.pending_response_from IS NOT NULL
          AND a.updated_at < NOW() - INTERVAL '24 hours'
          AND NOT EXISTS (
            SELECT 1 FROM events e 
            WHERE e.type = 'task' 
              AND e.status = 'pending'
              AND e.metadata::jsonb @> jsonb_build_object('appointment_id', a.id, 'is_appointment_reminder', true)
              AND e.created_at > NOW() - INTERVAL '24 hours'
          )
      `);

      let tasksCreated = 0;
      let notificationsSent = 0;

      for (const appointment of result.rows) {
        const parentName = `${appointment.parent_first_name || ''} ${appointment.parent_last_name || ''}`.trim() || 'Parent';
        const formattedDate = new Date(appointment.proposed_date).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
        });

        if (appointment.pending_response_from === 'admin') {
          // Admin doit répondre → créer tâche + notifier admins
          const admins = await db.query(`
            SELECT id, first_name, last_name FROM users WHERE role = 'admin' AND is_active = true
          `);

          if (admins.rows.length > 0) {
            // Créer tâche de rappel
            await db.query(`
              INSERT INTO events (title, description, type, status, priority, start_date, end_date, all_day, created_by, assigned_to, metadata)
              VALUES ($1, $2, 'task', 'pending', 'high', NOW(), NOW(), true, $3, $3, $4)
            `, [
              `⏰ Rappel RDV: ${parentName}`,
              `RDV en attente de réponse depuis plus de 24h. Date proposée: ${formattedDate}`,
              admins.rows[0].id,
              JSON.stringify({
                appointment_id: appointment.id,
                parent_id: appointment.parent_id,
                is_appointment_task: true,
                is_appointment_reminder: true
              })
            ]);
            tasksCreated++;

            // Notifier tous les admins
            for (const admin of admins.rows) {
              await db.query(`
                INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
                VALUES ($1, $2, $3, 'appointment_reminder', $4, false)
              `, [
                admin.id,
                '⏰ Rappel: RDV en attente',
                `Le RDV avec ${parentName} attend votre réponse depuis plus de 24h`,
                appointment.id
              ]);
              notificationsSent++;
            }
          }

        } else if (appointment.pending_response_from === 'parent') {
          // Parent doit répondre → notifier le parent seulement
          if (appointment.parent_id) {
            await db.query(`
              INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
              VALUES ($1, $2, $3, 'appointment_reminder', $4, false)
            `, [
              appointment.parent_id,
              '⏰ Rappel: RDV en attente',
              `Votre RDV du ${formattedDate} attend votre confirmation`,
              appointment.id
            ]);
            notificationsSent++;
          }
        }
      }

      if (tasksCreated > 0 || notificationsSent > 0) {
        console.log(`✅ [Job] Rappels RDV: ${tasksCreated} tâche(s), ${notificationsSent} notification(s)`);
      }

    } catch (error) {
      console.error('❌ [Job] Erreur appointmentReminderJob:', error);
    }
  });

  console.log('✅ Job appointmentReminderJob démarré (toutes les heures)');
}

/**
 * Job: Nettoyage des événements supprimés
 * Fréquence: Hebdomadaire (dimanche à 02:00)
 */
function startCleanupJob() {
  cron.schedule('0 2 * * 0', async () => {
    try {
      console.log('🧹 [Job] Nettoyage des événements supprimés...');

      // Supprimer définitivement les événements soft-deleted depuis plus de 30 jours
      const result = await db.query(`
        DELETE FROM events
        WHERE deleted_at IS NOT NULL
          AND deleted_at < NOW() - INTERVAL '30 days'
        RETURNING id
      `);

      if (result.rows.length > 0) {
        console.log(`✅ [Job] ${result.rows.length} événement(s) supprimé(s) définitivement`);
      }

    } catch (error) {
      console.error('❌ [Job] Erreur cleanupJob:', error);
    }
  });

  console.log('✅ Job cleanupJob démarré (hebdomadaire dimanche à 02:00)');
}

/**
 * Démarrer tous les jobs
 */
function startAllJobs() {
  console.log('\n🚀 Démarrage des jobs cron pour les événements...\n');

  startReminderScheduler();
  startBirthdayGenerator();
  startOverdueChecker();
  startAppointmentReminderJob();
  startCleanupJob();

  console.log('\n✅ Tous les jobs sont démarrés\n');
}

/**
 * Exécuter manuellement un job (pour tests)
 */
async function runJobManually(jobName) {
  console.log(`\n🔧 Exécution manuelle du job: ${jobName}\n`);

  switch (jobName) {
    case 'reminders':
      // Code du job reminderScheduler
      console.log('🔔 Envoi des rappels...');
      // ... (copier le code du job)
      break;

    case 'birthdays':
      console.log('🎂 Génération des anniversaires...');
      await generateBirthdayEvents();
      await sendBirthdayReminders();
      break;

    case 'overdue':
      console.log('⚠️ Vérification des retards...');
      // ... (copier le code du job)
      break;

    case 'cleanup':
      console.log('🧹 Nettoyage...');
      // ... (copier le code du job)
      break;

    default:
      console.log('❌ Job inconnu:', jobName);
  }

  console.log('\n✅ Job terminé\n');
}

module.exports = {
  startAllJobs,
  startReminderScheduler,
  startBirthdayGenerator,
  startOverdueChecker,
  startAppointmentReminderJob,
  startCleanupJob,
  runJobManually
};
