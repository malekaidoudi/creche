# Tâches planifiées et tâches de fond (Cron Jobs)

L'application utilise la bibliothèque `node-cron` pour exécuter des traitements automatisés en arrière-plan.

---

## 1. Répertoire des tâches planifiées

| Tâche / Module | Fichier source | Expression Cron | Fuseau / Fréquence | Objectif |
|---|---|---|---|---|
| **Sauvegarde quotidienne** | `backend/jobs/backupJob.js` | `0 2 * * *` | `Africa/Tunis`<br>(Tous les jours à 02:00) | Exporte 20 tables de la base de données au format JSON sur le disque local (`backend/backups/data`) et purge les sauvegardes automatiques au-delà de 30 jours. |
| **Rappels d'événements** | `backend/services/eventService.js` | `0 */2 * * *` | Toutes les 2 heures | Recherche les événements à venir et envoie des rappels (notifications et e-mails). |
| **Génération des anniversaires** | `backend/services/eventService.js` | `0 0 * * *` | Tous les jours à minuit | Crée automatiquement les événements d'anniversaire des enfants pour la journée. |
| **Vérification des tâches en retard** | `backend/services/eventService.js` | `30 6 * * *` | Tous les jours à 06:30 | Identifie les tâches dont l'échéance est dépassée et alerte les personnes assignées. |
| **Rappels de rendez-vous** | `backend/services/appointmentService.js` | `0 */4 * * *` | Toutes les 4 heures | Détecte les rendez-vous d'inscription imminents et notifie les parents / administrateurs. |
| **Nettoyage hebdomadaire** | `backend/services/eventService.js` | `0 2 * * 0` | Dimanche à 02:00 | Purge les données périmées ou temporaires d'événements. |
| **Suivi des traitements médicaux** | `backend/controllers/treatmentsController.js` | `0 */2 7-19 * * 1-6` | `Africa/Tunis`<br>(Toutes les 2h entre 7h et 19h, lun-sam) | Analyse les traitements programmés du jour et génère les notifications pour les prises de médicaments. |
| **Auto-maintien Render (Keep-alive)** | `backend/server.js` | `setInterval` (14 min) | Si `RENDER_EXTERNAL_URL` définie | Envoie une requête HTTP sur l'API pour éviter la mise en veille de l'instance d'hébergement gratuit. |

---

## 2. Démarrage et cycle de vie

- Les jobs d'événements et de rendez-vous sont initialisés via la méthode globale `startAllJobs()` appelée lors du boot dans `backend/server.js`.
- Le job de sauvegarde est instancié directement dans son module `backend/jobs/backupJob.js`.
- **Limitation architecturale** : Les crons tournent directement au sein du processus Express Node.js. Si le serveur s'arrête ou redémarre pendant l'heure d'exécution, la tâche est manquée. En environnement multi-instances (horizontal scaling), les tâches s'exécuteraient en doublon en l'absence de verrou distribué (Redis / table de lock).
