/**
 * Migration 011 - Rattrapage de schéma : colonnes `appointments` / `enrollments`
 *
 * Dette de traçabilité (cf. documentsV2/23_ANOMALIES_ET_RECOMMANDATIONS.md,
 * anomalie #11) : la baseline versionnée 001 définit des squelettes minimaux
 * pour ces deux tables, alors que le schéma réel de production (et le code
 * applicatif) utilisent de nombreuses colonnes ajoutées historiquement par
 * scripts non versionnés — impossible de reconstruire la base de zéro à partir
 * du dépôt seul. Cette migration documente et crée de manière idempotente
 * toutes les colonnes effectivement référencées par le code.
 *
 * Colonnes réellement utilisées (sources : controllers/appointmentsController.js,
 * services/appointmentService.js, controllers/enrollmentsController.js) :
 *
 * appointments : child_id, subject, title, description, proposed_date,
 *   confirmed_date, appointment_type, appointment_outcome, location, priority,
 *   proposed_by, last_proposed_by, pending_response_from, proposal_history,
 *   rescheduled_count, parent_first_name, parent_last_name, parent_email,
 *   parent_phone, child_first_name, child_last_name.
 *   NB : les colonnes `appointment_date`/`appointment_time` de la baseline
 *   restent utilisées par `createAppointmentForEnrollment` ; elles coexistent
 *   avec `proposed_date`/`confirmed_date` (le code les interprète selon le flux).
 *
 * enrollments : applicant_first_name, applicant_last_name, applicant_email,
 *   applicant_phone, child_first_name, child_last_name, child_birth_date,
 *   child_gender, child_medical_info, emergency_contact_name,
 *   emergency_contact_phone, emergency_contact_choice, created_parent_user_id,
 *   active_appointment_id, failed_appointments_count, approved_by, approved_at,
 *   new_status (colonne d'archivage lue lors des suppressions de dossier).
 *
 * La contrainte CHECK de `appointments.status` est élargie aux valeurs
 * réellement produites par le code : 'proposed', 'pending', 'confirmed',
 * 'scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show', 'failed'.
 *
 * Idempotent (ADD COLUMN IF NOT EXISTS / DO $$ blocs). Non destructif.
 */

module.exports = {
  version: '011_catchup_appointments_enrollments',
  name: 'Catch-up schema: columns used by code on appointments + enrollments, widen appointments.status CHECK',

  up: async (client) => {
    // ─── appointments : colonnes manquantes ──────────────────────────────
    await client.query(`
      ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
        ADD COLUMN IF NOT EXISTS title VARCHAR(255),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS proposed_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS confirmed_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS appointment_outcome VARCHAR(20),
        ADD COLUMN IF NOT EXISTS location VARCHAR(255),
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20),
        ADD COLUMN IF NOT EXISTS proposed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS last_proposed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS pending_response_from VARCHAR(20),
        ADD COLUMN IF NOT EXISTS proposal_history JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS rescheduled_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS parent_first_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS parent_last_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS child_first_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS child_last_name VARCHAR(100);
    `);

    // Élargissement du CHECK sur appointments.status (valeurs observées dans le code)
    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
        ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
          CHECK (status IN ('proposed','pending','confirmed','scheduled','rescheduled','completed','cancelled','no_show','failed'));
      EXCEPTION WHEN undefined_table THEN NULL;
      END $$;
    `);

    // ─── enrollments : colonnes manquantes ───────────────────────────────
    await client.query(`
      ALTER TABLE enrollments
        ADD COLUMN IF NOT EXISTS applicant_first_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS applicant_last_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS applicant_phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS child_first_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS child_last_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS child_birth_date DATE,
        ADD COLUMN IF NOT EXISTS child_gender VARCHAR(10),
        ADD COLUMN IF NOT EXISTS child_medical_info TEXT,
        ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS emergency_contact_choice VARCHAR(50),
        ADD COLUMN IF NOT EXISTS created_parent_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS active_appointment_id INTEGER,
        ADD COLUMN IF NOT EXISTS failed_appointments_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS new_status VARCHAR(50);
    `);
  },

  down: async (client) => {
    // Non destructif en production : les colonnes ajoutées ne sont pas retirées.
  }
};
