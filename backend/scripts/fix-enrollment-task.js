/**
 * Script pour marquer les tâches d'inscription comme complétées
 * pour les dossiers déjà traités
 */
require('dotenv').config();
const db = require('../config/db_postgres');

async function fixEnrollmentTasks() {
    try {
        console.log('🔧 Recherche des tâches d\'inscription à corriger...');

        // Trouver toutes les tâches d'inscription en attente
        const pendingTasks = await db.query(`
      SELECT t.id, t.title, t.status
      FROM tasks t
      WHERE t.title LIKE '%Traiter dossier inscription #%'
        AND t.status != 'completed'
    `);

        console.log(`📋 ${pendingTasks.rows.length} tâche(s) d'inscription en attente trouvée(s)`);

        for (const task of pendingTasks.rows) {
            // Extraire l'ID du dossier du titre
            const match = task.title.match(/#(\d+)/);
            if (!match) continue;

            const enrollmentId = parseInt(match[1]);

            // Vérifier si le dossier a été traité
            const enrollment = await db.query(`
        SELECT id, status FROM enrollments WHERE id = $1
      `, [enrollmentId]);

            if (enrollment.rows.length === 0) {
                console.log(`  ⚠️ Dossier #${enrollmentId} non trouvé`);
                continue;
            }

            const status = enrollment.rows[0].status;

            // Si le dossier n'est plus en attente, marquer la tâche comme complétée
            if (status !== 'pending') {
                await db.query(`
          UPDATE tasks SET status = 'completed', completed_at = NOW()
          WHERE id = $1
        `, [task.id]);
                console.log(`  ✅ Tâche #${task.id} marquée comme complétée (dossier #${enrollmentId} status: ${status})`);
            } else {
                console.log(`  ℹ️ Dossier #${enrollmentId} toujours en attente, tâche conservée`);
            }
        }

        console.log('\n✅ Correction terminée');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

fixEnrollmentTasks();
