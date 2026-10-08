# Entités : Présence et demande d'absence

## Présence (`attendance`)
| Attribut | Remarque |
|---|---|
| child_id + date | UNIQUE |
| status | present, absent, late, early_departure |
| heures d'arrivée/départ, notes | noms exacts **À vérifier** |

Créée par check-in/check-out (permission `attendance.manage`) ou `POST /api/attendance`. Suppression : `DELETE /:id`.

## Demande d'absence (`absence_requests`)
Créée par un parent pour son enfant ; « acknowledge » par le personnel/admin. API : `/api/absence-requests` (`all`, `today`, `parent/:parentId`, `POST /`, `PUT /:id/acknowledge`).

**Sources** : `routes_postgres/attendance.js` (routes dupliquées), `absenceRequests.js`.
