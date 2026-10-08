# Entités : Événement, tâche, mémo

| Entité | Table | API | Accès |
|---|---|---|---|
| Événement | `events` (+ commentaires, historique, rappels, pièces jointes — tables vues dans l'audit DB) | `/api/events` | authentifié ; guards fins **À vérifier** |
| Tâche | `tasks` | `/api/tasks` | création/relance/suppression : admin |
| Mémo personnel | `personal_memos` | `/api/personal-memos` | propriétaire |

**Cycle tâche/événement** : à faire → en cours → terminé ; statut modifiable via `PATCH /:id/status`. « En retard » détecté chaque jour 06:30.
**Automatismes** : anniversaires (minuit), rappels (2 h), nettoyage hebdomadaire (dimanche 02:00).
**Sources** : `routes_postgres/events.js`, `tasks.js`, `personal-memos.js`, `services/eventService.js`, `jobs/`.
