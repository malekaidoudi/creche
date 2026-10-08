# Base de données

- **SGBD** : PostgreSQL (hébergement Neon). Accès : `pg`, SQL brut, aucun ORM. `backend/config/db_postgres.js` : pool max 5, fonction `query` avec retry, `runMigrations` (photo_shared_with_staff, testimonials, last_active, admin_documents).
- **Pas de schéma central versionné.**

## Où sont définies les tables
| Source | Tables |
|---|---|
| `backend/init_database.js` (14 tables) | users, children, enrollments, attendance, holidays, nursery_settings, notifications, daily_reports, daily_meals, daily_diaper_changes, child_supplies, daily_supplies_brought, staff_age_assignments (+ une autre, à confirmer dans le fichier) |
| `treatmentsController.js` | child_treatments, treatment_administrations |
| `permissionsService.js` (`ensureSchema`) | permissions, user_permissions |
| `db_postgres.js` | testimonials, admin_documents |
| `create_activity_logs_system.sql`, `migrations/*` | activity_logs et dérivés |
| Audit DB uniquement | appointments, tasks, events (+ comments/history/reminders/attachments), enrollment_documents, children_documents, parent_children, absence_requests, announcements, staff_messages, personal_memos, activities*, email_logs, logs, contact_messages, payment_reminders, holiday_policies, enrollments_archive |

## Contraintes notables
`users.role` CHECK admin/staff/parent (exclut `developer`) ; `enrollments.child_id` UNIQUE ; `attendance(child_id,date)` UNIQUE ; `child_supplies(child,type)` UNIQUE.

## Fiabilité des documents existants
`backend/scripts/database-analysis-report.json` (29 tables) et `backend/database/DB_AUDIT_REPORT.md` (30 nov. 2025, 28 tables) sont **antérieurs** au code actuel : colonnes de production **À vérifier** via un `pg_dump --schema-only`.

## Données de test
`init_database.js` insère des utilisateurs/enfants de test si `users` est vide.
