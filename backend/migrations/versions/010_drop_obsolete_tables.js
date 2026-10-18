/**
 * Migration 010 - Suppression des tables et colonnes obsolètes
 *
 * Inventaire vérifié par croisement du code applicatif (routes_postgres/,
 * controllers/, services/, middleware/, jobs/) — aucune référence
 * FROM/INTO/UPDATE/JOIN dans le code pour les objets listés ci-dessous.
 * Cf. documentsV2/23_ANOMALIES_ET_RECOMMANDATIONS.md, anomalies #9 et #10.
 *
 * TABLES SUPPRIMÉES (vestiges de la v1 monolithique ou artefacts de scripts) :
 * - contacts              : mini-CRM de l'ancien backend/routes/contacts.js ;
 *                           remplacée par contact_messages (formulaire public).
 * - documents             : gestion documentaire générique v1 ; remplacée par
 *                           enrollment_documents et children_documents.
 * - uploads               : stockage filesystem local v1 (routes/uploads.js) ;
 *                           remplacé par Cloudinary.
 * - children_archive      : copie vide de sécurité créée par
 *                           migrations/001_refactor_enrollments_workflow.sql,
 *                           jamais exploitée.
 * - enrollments_new_backup: artefact de migrations/001_rollback_enrollments_workflow.sql.
 * - event_attachments     : créée par database/migrations/create_events_system.sql,
 *                           jamais utilisée par le module events.
 * - payment_reminders     : créée par simplified_system.sql, fonctionnalité
 *                           jamais implémentée.
 * - test_migration        : artefact de scripts/test-postgres-connection.js.
 *
 * NON supprimées volontairement :
 * - schema_migrations     : bookkeeping interne du runner de migrations.
 * - holiday_policies      : référencée dans les listes de sauvegarde
 *                           (backup.js, backupJob.js, recovery.js) ; la supprimer
 *                           casserait les dumps — à traiter séparément.
 * - enrollments_archive   : table vivante (archivage réel des dossiers traités).
 *
 * COLONNES SUPPRIMÉES :
 * - enrollments.appointment_date / appointment_time : RDV désormais dans la
 *   table appointments (le code le confirme : "appointment_date n'existe pas
 *   sur enrollments", enrollmentsController.js).
 * - enrollments.parent_chose_rdv / parent_rdv_choice_date : écrites lors du
 *   choix du RDV parent mais jamais relues — write-only.
 * - tasks.is_confirmed, confirmed_at, original_date, reschedule_count :
 *   doublons du système appointments, jamais référencées.
 *
 * Idempotent (DROP ... IF EXISTS). Destructif : exécuter après sauvegarde
 * (module /api/backup ou backupJob.js).
 */

module.exports = {
  version: '010_drop_obsolete_tables',
  name: 'Drop obsolete tables (contacts, documents, uploads, archives/artefacts) and dead columns (enrollments, tasks)',

  up: async (client) => {
    // 1. Tables mortes
    await client.query(`
      DROP TABLE IF EXISTS contacts CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS uploads CASCADE;
      DROP TABLE IF EXISTS children_archive CASCADE;
      DROP TABLE IF EXISTS enrollments_new_backup CASCADE;
      DROP TABLE IF EXISTS event_attachments CASCADE;
      DROP TABLE IF EXISTS payment_reminders CASCADE;
      DROP TABLE IF EXISTS test_migration CASCADE;
    `);

    // 2. Colonnes mortes de enrollments (RDV gérés par la table appointments)
    await client.query(`
      ALTER TABLE enrollments
        DROP COLUMN IF EXISTS appointment_date,
        DROP COLUMN IF EXISTS appointment_time,
        DROP COLUMN IF EXISTS parent_chose_rdv,
        DROP COLUMN IF EXISTS parent_rdv_choice_date;
    `);

    // 3. Colonnes mortes de tasks (doublons du système appointments)
    await client.query(`
      ALTER TABLE tasks
        DROP COLUMN IF EXISTS is_confirmed,
        DROP COLUMN IF EXISTS confirmed_at,
        DROP COLUMN IF EXISTS original_date,
        DROP COLUMN IF EXISTS reschedule_count;
    `);
  },

  down: async (client) => {
    // Non réversible : les structures supprimées ne peuvent pas être restaurées
    // sans sauvegarde. Volontairement vide.
  }
};
