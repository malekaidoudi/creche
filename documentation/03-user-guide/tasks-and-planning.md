# Tâches, événements et planning

## Tâches (`/api/tasks`)
- Création, relance et suppression : **admin**. Consultation « mes tâches », du jour, en retard et changement de statut : utilisateur authentifié.
- Des tâches sont aussi créées automatiquement (ex. nouvelle inscription).

## Événements (`/api/events`)
- Calendrier, à venir, en retard, tableau kanban, commentaires, statut. Anniversaires générés chaque nuit. Rappels automatiques (toutes les 2 h) avec notification/e-mail.

## Planning
Pages : calendrier mensuel et hebdomadaire, calendrier des événements. Jours fermés : `GET /api/schedule-settings/closed-days/:year/:month`.

## Mémos personnels
Notes privées avec échéance : créer, lister, « aujourd'hui », terminer, supprimer.

## Limites
Les contrôles de rôle des routes d'événements sont **À vérifier** (guards sur lignes de continuation, voir [endpoints](../07-api/endpoints.md)).
