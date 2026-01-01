/**
 * SERVICE DE NOTIFICATIONS CENTRALISÉ
 * Gère l'envoi de notifications pour tous les événements du système
 */

const { pool } = require('../config/db_postgres');
const pushNotificationService = require('./pushNotificationService');

/**
 * Types de notifications supportés
 */
const NOTIFICATION_TYPES = {
    // Jours fériés et vacances
    HOLIDAY_ADDED: 'holiday_added',
    HOLIDAY_REMOVED: 'holiday_removed',
    VACATION_ADDED: 'vacation_added',
    VACATION_REMOVED: 'vacation_removed',

    // Messages
    MESSAGE: 'message',
    STAFF_MESSAGE: 'staff_message',

    // Anniversaires
    BIRTHDAY_REMINDER: 'birthday_reminder',

    // Rendez-vous
    APPOINTMENT: 'appointment',
    APPOINTMENT_REMINDER: 'appointment_reminder',

    // Tâches
    TASK_ASSIGNED: 'task_assigned',
    TASK_UPDATED: 'task_updated',

    // Paramètres crèche
    SCHEDULE_CHANGED: 'schedule_changed',
    SATURDAY_CHANGED: 'saturday_changed',
    PHONE_CHANGED: 'phone_changed',

    // Activités et annonces
    ACTIVITY_PUBLISHED: 'activity_published',
    ANNOUNCEMENT: 'announcement',

    // Paiements
    PAYMENT_ALERT: 'payment_alert',

    // Événements
    EVENT: 'event',

    // Système
    SYSTEM: 'system',
    INFO: 'info'
};

/**
 * Créer une notification en base de données
 */
async function createNotification(userId, { title, message, type, relatedId = null, metadata = null }) {
    try {
        console.log('📝 Création notification:', { userId, title, type });

        const result = await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, related_id, metadata, is_read, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)
            RETURNING *
        `, [userId, title, message, type, relatedId, metadata ? JSON.stringify(metadata) : null]);

        console.log('✅ Notification créée:', result.rows[0]?.id);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Erreur création notification:', error.message);
        console.error('❌ Détails:', { userId, title, type, error: error.stack });
        return null;
    }
}

/**
 * Envoyer une notification à un utilisateur (DB + Push)
 */
async function sendNotification(userId, notificationData) {
    try {
        // Créer en base
        const notification = await createNotification(userId, notificationData);

        // Envoyer push notification
        await pushNotificationService.sendPushNotification(userId, {
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            related_id: notificationData.relatedId
        });

        return notification;
    } catch (error) {
        console.error('❌ Erreur sendNotification:', error);
        return null;
    }
}

/**
 * Envoyer une notification à plusieurs utilisateurs
 */
async function sendNotificationToMany(userIds, notificationData) {
    const results = await Promise.all(
        userIds.map(userId => sendNotification(userId, notificationData))
    );
    return results.filter(r => r !== null);
}

/**
 * Envoyer une notification à tous les utilisateurs d'un rôle
 */
async function sendNotificationToRole(role, notificationData, excludeUserId = null) {
    try {
        let query = 'SELECT id FROM users WHERE role = $1 AND is_active = true';
        const params = [role];

        if (excludeUserId) {
            query += ' AND id != $2';
            params.push(excludeUserId);
        }

        const result = await pool.query(query, params);
        const userIds = result.rows.map(row => row.id);

        return await sendNotificationToMany(userIds, notificationData);
    } catch (error) {
        console.error('❌ Erreur sendNotificationToRole:', error);
        return [];
    }
}

/**
 * Envoyer une notification à tous les parents et staff (pas les admins)
 */
async function sendNotificationToAllUsers(notificationData, excludeUserId = null) {
    try {
        console.log('📢 sendNotificationToAllUsers:', { title: notificationData.title, excludeUserId });

        // Exclure les admins - notifications uniquement pour parents et staff
        let query = "SELECT id FROM users WHERE role IN ('parent', 'staff') AND is_active = true";
        const params = [];

        if (excludeUserId) {
            query += ' AND id != $1';
            params.push(excludeUserId);
        }

        const result = await pool.query(query, params);
        const userIds = result.rows.map(row => row.id);

        console.log(`📢 Envoi à ${userIds.length} utilisateurs (parents + staff):`, userIds);

        return await sendNotificationToMany(userIds, notificationData);
    } catch (error) {
        console.error('❌ Erreur sendNotificationToAllUsers:', error.message);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS SPÉCIFIQUES
// ═══════════════════════════════════════════════════════════════

/**
 * Notification: Jour férié ajouté/activé
 */
async function notifyHolidayAdded(holiday, adminId) {
    const isVacation = holiday.type === 'school';
    const type = isVacation ? NOTIFICATION_TYPES.VACATION_ADDED : NOTIFICATION_TYPES.HOLIDAY_ADDED;

    const title = isVacation
        ? '🏖️ Nouvelle période de vacances'
        : '📅 Nouveau jour férié';

    const message = isVacation
        ? `La crèche sera fermée pour les vacances: ${holiday.name}`
        : `La crèche sera fermée le jour férié: ${holiday.name}`;

    console.log(`📢 Notification: ${title} - ${holiday.name}`);

    return await sendNotificationToAllUsers({
        title,
        message,
        type,
        relatedId: holiday.id,
        metadata: {
            holiday_key: holiday.holiday_key,
            holiday_name: holiday.name,
            holiday_name_ar: holiday.name_ar,
            holiday_type: holiday.type,
            action: 'added'
        }
    }, adminId);
}

/**
 * Notification: Jour férié supprimé/désactivé
 */
async function notifyHolidayRemoved(holiday, adminId) {
    const isVacation = holiday.type === 'school';
    const type = isVacation ? NOTIFICATION_TYPES.VACATION_REMOVED : NOTIFICATION_TYPES.HOLIDAY_REMOVED;

    const title = isVacation
        ? '🏖️ Vacances annulées'
        : '📅 Jour férié annulé';

    const message = isVacation
        ? `La crèche sera ouverte pendant: ${holiday.name}`
        : `La crèche sera ouverte le: ${holiday.name}`;

    console.log(`📢 Notification: ${title} - ${holiday.name}`);

    return await sendNotificationToAllUsers({
        title,
        message,
        type,
        relatedId: holiday.id,
        metadata: {
            holiday_key: holiday.holiday_key,
            holiday_name: holiday.name,
            holiday_name_ar: holiday.name_ar,
            holiday_type: holiday.type,
            action: 'removed'
        }
    }, adminId);
}

/**
 * Notification: Changement horaires crèche
 */
async function notifyScheduleChanged(oldSchedule, newSchedule, adminId) {
    const title = '⏰ Changement d\'horaires';
    const message = `Les horaires de la crèche ont été modifiés: ${newSchedule.opening_time} - ${newSchedule.closing_time}`;

    console.log(`📢 Notification: ${title}`);

    return await sendNotificationToAllUsers({
        title,
        message,
        type: NOTIFICATION_TYPES.SCHEDULE_CHANGED,
        metadata: {
            old_opening: oldSchedule?.opening_time,
            old_closing: oldSchedule?.closing_time,
            new_opening: newSchedule.opening_time,
            new_closing: newSchedule.closing_time
        }
    }, adminId);
}

/**
 * Notification: Changement travail samedi
 */
async function notifySaturdayChanged(isOpen, adminId) {
    const title = '📆 Changement samedi';
    const message = isOpen
        ? 'La crèche sera désormais ouverte le samedi'
        : 'La crèche sera désormais fermée le samedi';

    console.log(`📢 Notification: ${title}`);

    return await sendNotificationToAllUsers({
        title,
        message,
        type: NOTIFICATION_TYPES.SATURDAY_CHANGED,
        metadata: { saturday_open: isOpen }
    }, adminId);
}

/**
 * Notification: Changement numéro téléphone
 */
async function notifyPhoneChanged(newPhone, adminId) {
    const title = '📞 Nouveau numéro de téléphone';
    const message = `Le numéro de la crèche a changé: ${newPhone}`;

    console.log(`📢 Notification: ${title}`);

    return await sendNotificationToAllUsers({
        title,
        message,
        type: NOTIFICATION_TYPES.PHONE_CHANGED,
        metadata: { new_phone: newPhone }
    }, adminId);
}

/**
 * Notification: Tâche assignée
 */
async function notifyTaskAssigned(task, assignedToId, adminId) {
    const title = '📋 Nouvelle tâche assignée';
    const message = task.title;

    console.log(`📢 Notification tâche: ${title} -> User ${assignedToId}`);

    return await sendNotification(assignedToId, {
        title,
        message,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        relatedId: task.id,
        metadata: {
            task_id: task.id,
            task_title: task.title,
            priority: task.priority,
            due_date: task.due_date
        }
    });
}

/**
 * Notification: Rappel anniversaire (3 jours avant)
 */
async function notifyBirthdayReminder(child, parentId) {
    const title = '🎂 Anniversaire à venir';
    const message = `L'anniversaire de ${child.first_name} approche! Contactez la crèche pour organiser une fête.`;

    console.log(`📢 Notification anniversaire: ${child.first_name} -> Parent ${parentId}`);

    return await sendNotification(parentId, {
        title,
        message,
        type: NOTIFICATION_TYPES.BIRTHDAY_REMINDER,
        relatedId: child.id,
        metadata: {
            child_id: child.id,
            child_name: `${child.first_name} ${child.last_name}`,
            birthday: child.birth_date
        }
    });
}

/**
 * Notification: Nouvelle annonce
 */
async function notifyAnnouncement(announcement, adminId) {
    const title = '📢 Nouvelle annonce';
    const message = announcement.title;

    console.log(`📢 Notification annonce: ${announcement.title}`);

    return await sendNotificationToAllUsers({
        title,
        message,
        type: NOTIFICATION_TYPES.ANNOUNCEMENT,
        relatedId: announcement.id,
        metadata: {
            announcement_id: announcement.id,
            announcement_title: announcement.title
        }
    }, adminId);
}

/**
 * Notification: Activité publiée
 */
async function notifyActivityPublished(activity, authorId) {
    const title = '🎨 Nouvelle activité';
    const message = activity.title || 'Une nouvelle activité a été publiée';

    console.log(`📢 Notification activité: ${activity.title}`);

    return await sendNotificationToAllUsers({
        title,
        message,
        type: NOTIFICATION_TYPES.ACTIVITY_PUBLISHED,
        relatedId: activity.id,
        metadata: {
            activity_id: activity.id,
            activity_title: activity.title
        }
    }, authorId);
}

/**
 * Notification: Alerte paiement
 */
async function notifyPaymentAlert(parentId, childName, amount, adminId) {
    const title = '💰 Rappel de paiement';
    const message = `Un paiement de ${amount} TND est en attente pour ${childName}`;

    console.log(`📢 Notification paiement: ${childName} -> Parent ${parentId}`);

    return await sendNotification(parentId, {
        title,
        message,
        type: NOTIFICATION_TYPES.PAYMENT_ALERT,
        metadata: {
            child_name: childName,
            amount: amount
        }
    });
}

/**
 * Notification: Rendez-vous
 */
async function notifyAppointment(appointment, userId) {
    const title = '📅 Nouveau rendez-vous';
    const message = `Rendez-vous prévu le ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${appointment.time}`;

    console.log(`📢 Notification RDV: -> User ${userId}`);

    return await sendNotification(userId, {
        title,
        message,
        type: NOTIFICATION_TYPES.APPOINTMENT,
        relatedId: appointment.id,
        metadata: {
            appointment_id: appointment.id,
            date: appointment.date,
            time: appointment.time,
            subject: appointment.subject
        }
    });
}

module.exports = {
    NOTIFICATION_TYPES,
    createNotification,
    sendNotification,
    sendNotificationToMany,
    sendNotificationToRole,
    sendNotificationToAllUsers,
    // Notifications spécifiques
    notifyHolidayAdded,
    notifyHolidayRemoved,
    notifyScheduleChanged,
    notifySaturdayChanged,
    notifyPhoneChanged,
    notifyTaskAssigned,
    notifyBirthdayReminder,
    notifyAnnouncement,
    notifyActivityPublished,
    notifyPaymentAlert,
    notifyAppointment
};
