# Système de notifications

## Canaux
| Canal | Implémentation |
|---|---|
| Interne | table `notifications` ; `services/notificationService.js` ; émetteurs : appointmentService, staffMessageService, eventService, announcementService, holidays |
| E-mail | `backend/emails/emailService.js` (voir [integrations](integrations.md)) ; événements : `services/eventEmailService.js` |
| Push | `services/pushNotificationService.js` → Expo, `users.push_token` ; **aucune application mobile dans le dépôt** ; la route d'enregistrement `POST /api/users/push-token` est déclarée après des routes paramétrées (accessibilité **À vérifier**) |
| Temps réel | absent |

## API
`/api/notifications` : voir [notification](../04-domain/notification.md) — plusieurs routes non protégées.
