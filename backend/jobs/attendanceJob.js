/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB CRON CLÔTURE AUTOMATIQUE DES PRÉSENCES - CRÈCHE MIMA ELGHALIA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Exécute la clôture automatique des enfants non pointés en sortie :
 * - Du lundi au vendredi : à 18h00, 18h15 et 18h30 (fermeture standard)
 * - Le samedi : à 13h00, 13h15 et 13h30 (fermeture samedi)
 * - Filet de sécurité quotidien : à 20h00
 * 
 * Arrête automatiquement le compteur de présence, enregistre le départ à l'heure
 * officielle de fermeture et garantit que les enfants ne restent pas "présents".
 * ═══════════════════════════════════════════════════════════════════════════
 */

const cron = require('node-cron');
const { autoCloseExpiredAttendances } = require('../services/attendanceAutoCheckoutService');

let attendanceJob = null;
let eveningSafetyJob = null;

const startAttendanceJob = () => {
  try {
    // 1. Clôture automatique différée de 1 heure après les fermetures (demi-journée & samedi 14h00-14h30, semaine 19h00-19h30)
    attendanceJob = cron.schedule('0,15,30 14,19 * * 1-6', async () => {
      console.log('⏰ [CRON PRÉSENCE] Exécution de la clôture automatique différée (+1h après fermeture)...');
      const res = await autoCloseExpiredAttendances();
      if (res.totalClosed > 0) {
        console.log(`✅ [CRON PRÉSENCE] ${res.totalClosed} départ(s) automatique(s) clôturé(s) avec succès`);
      }
    }, {
      scheduled: true,
      timezone: 'Africa/Tunis'
    });

    // 2. Filet de sécurité en fin de soirée (20h30)
    eveningSafetyJob = cron.schedule('30 20 * * 1-6', async () => {
      console.log('⏰ [CRON PRÉSENCE] Filet de sécurité de 20h30 : vérification des présences orphelines...');
      const res = await autoCloseExpiredAttendances();
      if (res.totalClosed > 0) {
        console.log(`✅ [CRON PRÉSENCE] ${res.totalClosed} départ(s) clôturé(s) par le filet de sécurité`);
      }
    }, {
      scheduled: true,
      timezone: 'Africa/Tunis'
    });

    console.log('👶 [CRON PRÉSENCE] Job de clôture automatique initialisé (différé 14h/19h + sécurité 20h30) ✅');
    return true;
  } catch (error) {
    console.error('❌ Erreur démarrage job présence:', error.message);
    return false;
  }
};

const stopAttendanceJob = () => {
  if (attendanceJob) {
    attendanceJob.stop();
    attendanceJob = null;
  }
  if (eveningSafetyJob) {
    eveningSafetyJob.stop();
    eveningSafetyJob = null;
  }
  console.log('⏹️ [CRON PRÉSENCE] Job arrêté');
};

module.exports = {
  startAttendanceJob,
  stopAttendanceJob
};
