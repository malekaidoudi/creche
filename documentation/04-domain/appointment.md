# Entité : Rendez-vous

**Description** : rendez-vous lié à une inscription (négociation de date).
**Attributs** : colonnes **À vérifier** (table vue uniquement dans l'audit DB) ; notions utilisées : enrollment_id, date proposée, auteur de la proposition, statut.
**Statuts (service)** : proposed, counter_proposed, confirmed, rescheduled, cancelled, completed ; le contrôleur utilise aussi `no_show`, `failed`.
**Cycle** : proposé → contre-proposé ↔ proposé → confirmé → terminé.
**Qui** : création/consultation : authentifié ; `pending` : admin ; `today`, `complete`, `status` : admin/staff ; actions publiques par n° dossier + e-mail.
**Effets** : notifications (`appointmentService`), e-mail de confirmation, rappels (cron toutes les 4 h).
**API** : `/api/appointments/*`.
**Sources** : `routes_postgres/appointments.js`, `services/appointmentService.js`, `controllers/appointmentsController.js`.
