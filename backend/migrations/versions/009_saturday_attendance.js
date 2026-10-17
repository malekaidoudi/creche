/**
 * Migration 009 - Présence le samedi (ex "Assistance au déjeuner")
 *
 * Le champ `lunch_assistance`, coché par les parents au moment de l'inscription,
 * n'était exploité nulle part (jamais transféré sur `children`, jamais affiché
 * côté staff/admin). Il est repensé en indicateur de présence le samedi :
 * la crèche ouvre le samedi avec des horaires réduits (cf. `attendanceJob.js`)
 * et le personnel a besoin de savoir quels enfants sont attendus ce jour-là.
 *
 * - `enrollments.lunch_assistance` / `enrollments_archive.lunch_assistance`
 *   renommés en `saturday_attendance` (conserve l'historique des dossiers).
 * - Nouvelle colonne `children.saturday_attendance` : c'est elle qui porte
 *   l'information durable et modifiable dans le temps (contrairement au
 *   champ d'inscription, figé et archivé après approbation).
 *
 * Rétro-compatible et idempotent.
 */

module.exports = {
  version: '009_saturday_attendance',
  name: 'Rename lunch_assistance to saturday_attendance (enrollments/enrollments_archive) + add children.saturday_attendance',

  up: async (client) => {
    // Renommage sur enrollments (idempotent : ne s'exécute que si l'ancienne colonne existe encore)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'enrollments' AND column_name = 'lunch_assistance'
        ) THEN
          ALTER TABLE enrollments RENAME COLUMN lunch_assistance TO saturday_attendance;
        END IF;
      END $$;
    `);

    // Renommage sur enrollments_archive
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'enrollments_archive' AND column_name = 'lunch_assistance'
        ) THEN
          ALTER TABLE enrollments_archive RENAME COLUMN lunch_assistance TO saturday_attendance;
        END IF;
      END $$;
    `);

    // Nouvelle colonne durable sur children
    await client.query(`
      ALTER TABLE children ADD COLUMN IF NOT EXISTS saturday_attendance BOOLEAN NOT NULL DEFAULT FALSE;
    `);
  },

  down: async (client) => {
    // Non destructif en production
  }
};
