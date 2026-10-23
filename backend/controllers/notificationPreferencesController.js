const db = require('../config/db_postgres');

/**
 * Initialiser la table des préférences de notification si elle n'existe pas
 */
const initNotificationPreferencesTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_notification_preferences (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                attendance_reminder_enabled BOOLEAN DEFAULT true,
                attendance_reminder_time VARCHAR(5) DEFAULT '08:30',
                attendance_reminder_days INTEGER[] DEFAULT '{1,2,3,4,5,6}',
                daily_report_reminder_enabled BOOLEAN DEFAULT true,
                daily_report_reminder_time VARCHAR(5) DEFAULT '19:00',
                email_notifications BOOLEAN DEFAULT true,
                push_notifications BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table user_notification_preferences initialisée avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur initialisation user_notification_preferences:', error.message);
        return false;
    }
};

/**
 * Récupérer les préférences de notification de l'utilisateur connecté
 */
const getPreferences = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
        }

        const result = await db.query(
            `SELECT * FROM user_notification_preferences WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Valeurs par défaut si aucune ligne enregistrée
            return res.json({
                success: true,
                preferences: {
                    user_id: userId,
                    attendance_reminder_enabled: true,
                    attendance_reminder_time: '08:30',
                    attendance_reminder_days: [1, 2, 3, 4, 5, 6],
                    daily_report_reminder_enabled: true,
                    daily_report_reminder_time: '19:00',
                    email_notifications: true,
                    push_notifications: true
                }
            });
        }

        return res.json({
            success: true,
            preferences: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur récupération préférences notifications:', error.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * Mettre à jour ou créer les préférences de notification de l'utilisateur connecté
 */
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
        }

        const {
            attendance_reminder_enabled = true,
            attendance_reminder_time = '08:30',
            attendance_reminder_days = [1, 2, 3, 4, 5, 6],
            daily_report_reminder_enabled = true,
            daily_report_reminder_time = '19:00',
            email_notifications = true,
            push_notifications = true,
            timezone = 'Africa/Tunis'
        } = req.body;

        // Validation format de l'heure HH:MM
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        const safeAttendanceTime = timeRegex.test(attendance_reminder_time) ? attendance_reminder_time : '08:30';
        const safeReportTime = timeRegex.test(daily_report_reminder_time) ? daily_report_reminder_time : '19:00';

        // Assurer que la colonne timezone existe si table déjà créée
        try {
            await db.query(`ALTER TABLE user_notification_preferences ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Tunis'`);
        } catch (_) {}

        const result = await db.query(`
            INSERT INTO user_notification_preferences (
                user_id,
                attendance_reminder_enabled,
                attendance_reminder_time,
                attendance_reminder_days,
                daily_report_reminder_enabled,
                daily_report_reminder_time,
                email_notifications,
                push_notifications,
                timezone,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                attendance_reminder_enabled = EXCLUDED.attendance_reminder_enabled,
                attendance_reminder_time = EXCLUDED.attendance_reminder_time,
                attendance_reminder_days = EXCLUDED.attendance_reminder_days,
                daily_report_reminder_enabled = EXCLUDED.daily_report_reminder_enabled,
                daily_report_reminder_time = EXCLUDED.daily_report_reminder_time,
                email_notifications = EXCLUDED.email_notifications,
                push_notifications = EXCLUDED.push_notifications,
                timezone = EXCLUDED.timezone,
                updated_at = NOW()
            RETURNING *
        `, [
            userId,
            Boolean(attendance_reminder_enabled),
            safeAttendanceTime,
            attendance_reminder_days,
            Boolean(daily_report_reminder_enabled),
            safeReportTime,
            Boolean(email_notifications),
            Boolean(push_notifications),
            timezone || 'Africa/Tunis'
        ]);

        return res.json({
            success: true,
            message: 'Préférences enregistrées avec succès',
            preferences: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour préférences notifications:', error.message);
        return res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des préférences' });
    }
};

/**
 * Tester l'envoi immédiat d'une alerte de rappel (In-App + Web Push)
 */
const testReminder = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
        }

        const pushNotificationService = require('../services/pushNotificationService');
        const title = '⚠️ Alerte de présence (Test)';
        const message = "Test réussi ! Votre alerte de présence est bien configurée et prête à vous notifier si aucune présence n'est saisie.";

        // 1. Notification In-App
        await db.query(`
            INSERT INTO notifications (user_id, title, message, type, is_read)
            VALUES ($1, $2, $3, 'attendance_not_recorded', false)
        `, [userId, title, message]);

        // 2. Web Push
        let pushSent = false;
        try {
            const pushResult = await pushNotificationService.sendPushToUser(userId, {
                title,
                message,
                url: '/dashboard/attendance',
                tag: 'attendance-test'
            });
            pushSent = Boolean(pushResult?.success);
        } catch (pushErr) {
            console.warn('⚠️ Web Push non délivré:', pushErr.message);
        }

        return res.json({
            success: true,
            pushSent,
            message: pushSent
                ? 'Notification test envoyée avec succès sur votre téléphone !'
                : 'Notification enregistrée dans l\'application ! (Pour recevoir l\'alerte sur votre écran verrouillé, vérifiez que les Notifications Push sont actives ci-dessous)'
        });
    } catch (error) {
        console.error('❌ Erreur test notification:', error.message);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du test' });
    }
};

module.exports = {
    initNotificationPreferencesTable,
    getPreferences,
    updatePreferences,
    testReminder
};
