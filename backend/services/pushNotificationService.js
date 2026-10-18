/**
 * SERVICE DE NOTIFICATIONS PUSH (Web Push / VAPID)
 * Gère l'envoi de notifications OS natives (Android/iOS 16.4+ en PWA installée)
 * via le protocole Web Push, en complément des notifications in-app (notificationService.js).
 */

const webpush = require('web-push');
const { pool } = require('../config/db_postgres');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@mima-elghalia.com';

const isConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isConfigured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
    console.warn('⚠️ VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY non définis : les notifications push OS sont désactivées.');
}

/**
 * Enregistrer (ou mettre à jour) un abonnement push pour un utilisateur
 */
async function saveSubscription(userId, subscription, userAgent = null) {
    const { endpoint, keys } = subscription;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new Error('Abonnement push invalide: endpoint/keys manquants');
    }

    const result = await pool.query(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (endpoint) DO UPDATE
          SET user_id = EXCLUDED.user_id,
              p256dh = EXCLUDED.p256dh,
              auth = EXCLUDED.auth,
              user_agent = EXCLUDED.user_agent
        RETURNING *
    `, [userId, endpoint, keys.p256dh, keys.auth, userAgent]);

    return result.rows[0];
}

/**
 * Supprimer un abonnement push (désinscription explicite)
 */
async function removeSubscription(userId, endpoint) {
    await pool.query(
        'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
        [userId, endpoint]
    );
}

/**
 * Supprimer un abonnement devenu invalide (410 Gone / 404 renvoyés par le navigateur)
 */
async function removeSubscriptionByEndpoint(endpoint) {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
}

/**
 * Helper interne pour envoyer une notification à une liste d'enregistrements d'abonnements
 */
async function sendToSubscriptions(rows, payload) {
    await Promise.all(rows.map(async (row) => {
        const subscription = {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth }
        };

        try {
            await webpush.sendNotification(subscription, payload);
        } catch (error) {
            // 404/410 = abonnement expiré ou révoqué côté navigateur : on le supprime
            if (error.statusCode === 404 || error.statusCode === 410) {
                await removeSubscriptionByEndpoint(row.endpoint);
            } else {
                console.error('❌ Erreur envoi push:', error.statusCode, error.body || error.message);
            }
        }
    }));
}

/**
 * Envoyer une notification push à TOUS les abonnements d'un utilisateur
 */
async function sendPushToUser(userId, { title, message, url = '/', metadata = null, tag = null }) {
    if (!isConfigured || !userId) return;

    try {
        const result = await pool.query(
            'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) return;

        const payload = JSON.stringify({ title, message, url, metadata, tag });
        await sendToSubscriptions(result.rows, payload);
    } catch (error) {
        console.error('❌ Erreur sendPushToUser:', error.message);
    }
}

/**
 * Envoyer une notification push à plusieurs utilisateurs (optimisé en 1 seule requête SQL)
 */
async function sendPushToMany(userIds, { title, message, url = '/', metadata = null, tag = null }) {
    if (!isConfigured || !userIds?.length) return;

    try {
        const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
        if (uniqueIds.length === 0) return;

        const result = await pool.query(
            'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1::int[])',
            [uniqueIds]
        );

        if (result.rows.length === 0) return;

        const payload = JSON.stringify({ title, message, url, metadata, tag });
        await sendToSubscriptions(result.rows, payload);
    } catch (error) {
        console.error('❌ Erreur sendPushToMany:', error.message);
    }
}

module.exports = {
    isConfigured,
    getPublicKey: () => VAPID_PUBLIC_KEY,
    saveSubscription,
    removeSubscription,
    sendPushToUser,
    sendPushToMany
};
