# 17 — Messagerie et notifications

## Objectif
Distinguer clairement les trois mécanismes de communication présents dans le code : messagerie interne, notifications in-app, e-mails transactionnels.

## 1. Messagerie interne (`staff_messages`)
- **Nature** : conversation point à point entre un parent et un membre du personnel/direction (pas de groupe).
- **Table** : `staff_messages` (`sender_id`, `recipient_id`, `subject`, `content`, `is_read`, `read_at`).
- **API** : `backend/routes_postgres/staff-messages.js` — création (`POST /`), liste (`GET /`), non lus (`GET /unread`), liste des conversations (`GET /conversations`), fil d'une conversation (`GET /conversation/:contactId`, `GET /:id/conversation`), marquage lu (`PATCH /:id/read`). Toutes réservées aux rôles `staff`, `admin`, `parent`.
- **Service** : `backend/services/staffMessageService.js` (logique non auditée ligne à ligne).
- **Frontend** : page `MessagesPage.jsx` (`/dashboard/messages` pour le staff, `/mon-espace/messages` pour le parent), formulaire dédié pour le staff `StaffMemoForm.jsx` (`/dashboard/staff/send-message`).
- **Côté staff**, l'accès à cette fonctionnalité est en pratique conditionné par la permission granulaire `messages.parents` (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)) au niveau de l'affichage frontend (`FEATURES.MESSAGES_PARENTS`) ; la route backend elle-même se contente d'un contrôle par **rôle**, pas par permission — un membre du `staff` sans la permission `messages.parents` pourrait donc appeler l'API directement. **Incohérence potentielle**, voir [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md).

## 2. Notifications internes (`notifications`)
- **Nature** : alertes affichées dans l'interface (cloche de notification), propres à un utilisateur.
- **Table** : `notifications` (`user_id`, `title`, `message`, `type` : `info|success|warning|error`, `is_read`, `related_id`, `related_type`).
- **API** : `backend/routes_postgres/notifications.js` — création unitaire (`POST /`), diffusion en masse (`POST /broadcast`), lecture (`GET /`, `/:id`), marquage lu (`PUT /:id/read`, `/read-all`, `/user/:user_id/read-all`), suppression (`DELETE /:id`), compteur non lus (`GET /user/:user_id/unread-count`), statistiques (`GET /stats/overview`).
- **Service** : `backend/services/notificationService.js` — probablement invoqué par les autres modules métier (approbation d'inscription, nouveau message, rappel de tâche...) pour créer une notification in-app en plus/à la place d'un e-mail. **À vérifier** : liste exhaustive des événements déclencheurs (non auditée fonction par fonction).
- Ces notifications sont **distinctes des e-mails** : elles ne nécessitent aucun service externe et ne sont visibles que si l'utilisateur est connecté à l'application.

## 3. E-mails transactionnels

### 3.1 Fournisseurs (confirmés dans le code)
`backend/emails/emailService.js` choisit le fournisseur au démarrage, par ordre de priorité :
1. **Resend** (API HTTP) si `RESEND_API_KEY` est définie — fournisseur **prioritaire**, recommandé par le code lui-même pour l'hébergement sur Render (évite les blocages de ports SMTP sortants).
2. **SMTP Hostinger** (`nodemailer`) si `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` sont définis — utilisé en **repli**.
3. Si aucun des deux n'est configuré : `emailProvider = 'none'`, toute tentative d'envoi échoue proprement avec un message explicite.

Ceci confirme l'architecture annoncée dans la mission (« Resend et/ou SMTP »), avec un ordre de priorité clair.

### 3.2 Catalogue des types d'e-mails (`backend/emails/emailTypes.js`)
| Type | Déclencheur métier | Template |
|---|---|---|
| `REGISTRATION_CONFIRMATION` | Soumission d'une demande d'inscription | `registration.html` |
| `ENROLLMENT_ACCEPTED` | Approbation d'une inscription (avec lien de création de mot de passe) | `accepted.html` |
| `ENROLLMENT_MISSING_DOCS` | Documents manquants détectés par la direction | `missing-docs.html` |
| `ENROLLMENT_REJECTED` | Rejet d'une inscription | `rejected.html` |
| `CONTACT_MESSAGE` | Soumission du formulaire de contact public | `contact.html` |
| `CONTACT_REPLY` | Réponse de la direction à un message de contact | `contact-reply.html` |
| `APPOINTMENT_CONFIRMATION` | Confirmation d'un rendez-vous | `appointment-confirmation.html` |
| `RESET_PASSWORD` | Demande de réinitialisation de mot de passe | (template dédié, voir `sendResetPasswordEmail`) |
| `GENERAL_NOTIFICATION` | Envoi générique (`sendGenericEmail`) | — |

Les templates HTML sont stockés dans `backend/emails/templates/` et utilisent un moteur de substitution maison (`replaceVariables`) supportant `{{variable}}`, `{{#if x}}...{{/if}}` et `{{#each array}}...{{/each}}` — **pas un moteur de templating tiers** (ex. Handlebars n'est pas une dépendance déclarée dans `backend/package.json`), implémentation par expressions régulières propre au projet.

### 3.3 Journalisation des e-mails
Chaque tentative d'envoi (succès ou échec) est enregistrée dans la table `email_logs` (`email_type`, `recipient_email`, `sender_email`, `subject`, `status`, `resend_id`, `error_message`, `metadata`), consultable par la direction via `GET /api/logs/email` et la page `MailboxPage.jsx` (`/dashboard/mailbox`, réservée `admin`/`developer`).

### 3.4 Traitement des échecs
En cas d'échec d'envoi, `emailService.sendEmail` :
1. Enregistre l'échec dans `email_logs` avec `status: FAILED` et le message d'erreur.
2. Déclenche un événement de journal technique critique (`activityLogService.logAction('EMAIL_FAILED', { severity: 'critical', ... })`), consultable dans le module « Journal d'activité » (`/dashboard/activity-logs`, `developer`), avec génération d'alerte automatique (voir `services/activityLogService.js`, module d'alertes du journal technique).
3. Ne lève pas d'exception bloquante vers l'appelant : celui-ci reçoit `{ success: false, error }` et doit décider s'il bloque le flux métier (ex. une inscription peut être approuvée même si l'e-mail de confirmation échoue, selon l'implémentation du contrôleur appelant — **à vérifier cas par cas**).

### 3.5 Tâches asynchrones liées aux e-mails/notifications
Pas de file de messages dédiée (pas de Redis/BullMQ observé). Les envois sont synchrones dans la requête HTTP qui les déclenche, sauf pour les rappels planifiés gérés par `node-cron` : `jobs/eventJobs.js` (rappels d'événements), `jobs/treatmentJob.js` (vérification des traitements médicaux dus), `jobs/attendanceJob.js` (clôture de présence en fin de journée), `jobs/backupJob.js` (sauvegarde quotidienne à 02h00).

## 4. Diagramme

Voir `documentsV2/diagrams/flux-metier.mmd` pour le flux d'inscription incluant les notifications e-mail associées.

## 5. Limites et points à vérifier
- Liste exhaustive des événements déclenchant une notification in-app via `notificationService.js` (non auditée fonction par fonction).
- Comportement exact en cas d'échec d'e-mail au sein du flux d'approbation d'inscription (blocage ou non) — à vérifier dans `enrollmentsController.approveEnrollment`.
- Contenu du template de réinitialisation de mot de passe (nom de fichier non confirmé dans `emailTypes.js` au-delà de la fonction `sendResetPasswordEmail`).
