/**
 * SERVICE NOTIFICATIONS PUSH EXPO
 * Envoi de notifications push via Expo Push API
 */

const { pool } = require('../config/db_postgres');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envoyer une notification push à un utilisateur
 * @param {number} userId - ID de l'utilisateur destinataire
 * @param {object} notification - Données de la notification
 */
async function sendPushNotification(userId, notification) {
    try {
        // Récupérer le token push de l'utilisateur
        const result = await pool.query(
            'SELECT push_token FROM users WHERE id = $1 AND push_token IS NOT NULL',
            [userId]
        );

        if (result.rows.length === 0 || !result.rows[0].push_token) {
            console.log(`⚠️ Pas de token push pour l'utilisateur ${userId}`);
            return { success: false, reason: 'no_token' };
        }

        const pushToken = result.rows[0].push_token;

        // Vérifier que c'est un token Expo valide
        if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
            console.log(`⚠️ Token push invalide pour l'utilisateur ${userId}`);
            return { success: false, reason: 'invalid_token' };
        }

        // Construire le message push
        const message = {
            to: pushToken,
            sound: 'default',
            title: notification.title,
            body: notification.message || notification.body,
            data: {
                type: notification.type,
                related_id: notification.related_id,
                title: notification.title,
            },
            badge: notification.badge || 1,
        };

        // Envoyer via Expo Push API
        const response = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const responseData = await response.json();

        if (responseData.data?.[0]?.status === 'ok') {
            console.log(`✅ Notification push envoyée à l'utilisateur ${userId}`);
            return { success: true };
        } else {
            console.error(`❌ Erreur envoi push:`, responseData);
            return { success: false, reason: 'send_error', details: responseData };
        }

    } catch (error) {
        console.error('❌ Erreur sendPushNotification:', error);
        return { success: false, reason: 'exception', error: error.message };
    }
}

/**
 * Envoyer une notification push à plusieurs utilisateurs
 * @param {number[]} userIds - IDs des utilisateurs destinataires
 * @param {object} notification - Données de la notification
 */
async function sendPushNotificationToMany(userIds, notification) {
    const results = await Promise.all(
        userIds.map(userId => sendPushNotification(userId, notification))
    );
    return results;
}

/**
 * Envoyer une notification push à tous les utilisateurs d'un rôle
 * @param {string} role - Rôle des utilisateurs (admin, staff, parent)
 * @param {object} notification - Données de la notification
 */
async function sendPushNotificationToRole(role, notification) {
    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE role = $1 AND push_token IS NOT NULL AND is_active = true',
            [role]
        );

        const userIds = result.rows.map(row => row.id);
        return await sendPushNotificationToMany(userIds, notification);

    } catch (error) {
        console.error('❌ Erreur sendPushNotificationToRole:', error);
        return [];
    }
}

module.exports = {
    sendPushNotification,
    sendPushNotificationToMany,
    sendPushNotificationToRole,
};
