# Entité : Inscription

**Description** : dossier de demande d'inscription (parent + enfant).

| Attribut | Remarque |
|---|---|
| id, child_id (UNIQUE) | |
| applicant_* , child_* | données saisies publiquement |
| status | pending, in_progress, approved, rejected_incomplete, rejected_deleted, archived |
| rejection_type | age_depasse, maladie_contagieuse, dossier_manquant, autre ; rejection_reason |
| approved_by/at, processed_by/at | |
| active_appointment_id, failed_appointments_count | |
| created_parent_user_id, password_token | |

**Cycle de vie** : pending → (approve) in_progress → approved ; (reject) → rejected_* ; archived.
**Qui** : création publique ; approbation/rejet/suppression/statut : admin ; consultation des documents : admin.
**Règles** : vérification de doublon enfant/e-mail ; e-mail à chaque transition.
**API** : `/api/enrollments/*` ; documents : `/:id/documents`.
**Sources** : `backend/routes_postgres/enrollments.js`, `controllers/enrollmentsController`, `backend/emails/`.
