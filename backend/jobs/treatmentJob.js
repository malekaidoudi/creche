/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB CRON TRAITEMENTS MÉDICAUX - CRÈCHE MIMA ELGHALIA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Système piloté par les événements (Option A) :
 * - Si aucun traitement n'est actif pour aujourd'hui, le cron reste ÉTEINT 💤 (0 requête vers Neon).
 * - Dès qu'un traitement actif existe, le job s'active (toutes les 2h entre 7h et 19h).
 * - Dès que tous les traitements sont terminés, le job s'éteint automatiquement.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const cron = require('node-cron');
const EventEmitter = require('events');
const db = require('../config/db_postgres');
const { checkAndNotifyTreatments, initTreatmentsTables } = require('../controllers/treatmentsController');

const treatmentEvents = new EventEmitter();

let treatmentJob = null;
let isJobRunning = false;

/**
 * Vérifie si la crèche a au moins un traitement médical actif pour aujourd'hui
 */
const hasActiveTreatmentsToday = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await db.query(`
            SELECT 1 FROM child_treatments
            WHERE status = 'active'
            AND $1 BETWEEN start_date AND end_date
            LIMIT 1
        `, [today]);
        return result.rows.length > 0;
    } catch (err) {
        return false;
    }
};

/**
 * Arrêter le job
 */
const stopTreatmentJob = () => {
    if (treatmentJob) {
        treatmentJob.stop();
        treatmentJob = null;
        isJobRunning = false;
        console.log('⏹️ [CRON TRAITEMENTS] Aucun traitement actif : job mis en veille 💤 (0 réveil Neon)');
    }
};

/**
 * Synchroniser l'état du cron en fonction des traitements actifs
 */
const syncTreatmentJob = async () => {
    try {
        const hasActive = await hasActiveTreatmentsToday();

        if (hasActive && !isJobRunning) {
            // Cron: toutes les 2 heures entre 7h et 19h (5 champs standard: min hour dom month dow)
            treatmentJob = cron.schedule('0 7-19/2 * * 1-6', async () => {
                console.log('⏰ [CRON] Vérification des traitements médicaux...');
                const result = await checkAndNotifyTreatments();
                console.log(`✅ [CRON] Traitements vérifiés: ${result.checked || 0}, Notifications: ${result.notifications || 0}`);

                // Vérifier si des traitements restent actifs après mise à jour
                const stillActive = await hasActiveTreatmentsToday();
                if (!stillActive) {
                    stopTreatmentJob();
                }
            }, {
                scheduled: true,
                timezone: 'Africa/Tunis'
            });

            isJobRunning = true;
            console.log('💊 [CRON TRAITEMENTS] Traitements actifs détectés : Cron démarré (toutes les 2h, 7h-19h) ✅');
        } else if (!hasActive && isJobRunning) {
            stopTreatmentJob();
        } else if (!hasActive && !isJobRunning) {
            console.log('💊 [CRON TRAITEMENTS] Aucun traitement actif aujourd\'hui : Cron en veille 💤 (0 réveil Neon)');
        }
    } catch (error) {
        console.error('❌ Erreur synchronisation job traitements:', error.message);
    }
};

/**
 * Démarrage initial au lancement du serveur
 */
const startTreatmentJob = async () => {
    try {
        // Initialiser les tables si nécessaire
        await initTreatmentsTables();

        // Synchroniser le cron au démarrage
        await syncTreatmentJob();

        // Écouter les changements de traitements pour ajuster le cron immédiatement
        treatmentEvents.on('change', () => {
            syncTreatmentJob();
        });

        return true;
    } catch (error) {
        console.error('❌ Erreur démarrage job traitements:', error.message);
        return false;
    }
};

module.exports = {
    startTreatmentJob,
    stopTreatmentJob,
    syncTreatmentJob,
    treatmentEvents
};
