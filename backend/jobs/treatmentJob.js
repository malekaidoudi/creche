/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB CRON TRAITEMENTS MÉDICAUX - CRÈCHE MIMA ELGHALIA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Vérifie toutes les 15 minutes les traitements à administrer
 * et envoie des notifications au staff
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const cron = require('node-cron');
const { checkAndNotifyTreatments, initTreatmentsTables } = require('../controllers/treatmentsController');

let treatmentJob = null;

/**
 * Démarrer le job de vérification des traitements
 * Exécuté toutes les 15 minutes entre 7h et 19h
 */
const startTreatmentJob = async () => {
    try {
        // Initialiser les tables au démarrage
        await initTreatmentsTables();

        // Cron: toutes les 15 minutes, de 7h à 19h, du lundi au vendredi
        // Format: minute hour day-of-month month day-of-week
        treatmentJob = cron.schedule('*/15 7-19 * * 1-6', async () => {
            console.log('⏰ [CRON] Vérification des traitements médicaux...');
            const result = await checkAndNotifyTreatments();
            console.log(`✅ [CRON] Traitements vérifiés: ${result.checked || 0}, Notifications: ${result.notifications || 0}`);
        }, {
            scheduled: true,
            timezone: 'Africa/Tunis'
        });

        console.log('💊 Traitements:     Cron job actif (toutes les 15 min, 7h-19h) ✅');
        return true;
    } catch (error) {
        console.error('❌ Erreur démarrage job traitements:', error.message);
        return false;
    }
};

/**
 * Arrêter le job
 */
const stopTreatmentJob = () => {
    if (treatmentJob) {
        treatmentJob.stop();
        console.log('⏹️ Job traitements arrêté');
    }
};

module.exports = {
    startTreatmentJob,
    stopTreatmentJob
};
