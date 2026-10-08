# Répertoire exhaustif des Endpoints de l'API

Ce document répertorie l'ensemble des routes montées dans `backend/server.js` et déclarées dans les fichiers de routeurs de `backend/routes_postgres/`.

> [!NOTE]
> Légende de sécurité :
> - 🟢 **Protégé** : Requiert authentification (`authenticateToken`) et/ou vérification de rôle/permission.
> - 🔴 **Non protégé / Vulnérable** : Route sensible accessible sans authentification ou avec garde manquante.
> - 🌐 **Public normal** : Endpoint conçu pour être public (ex: formulaire de contact, inscription famille).

---

## 1. Utilisateurs & Profil (`/api/users` & `/api/profile`)

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/users` | 🟢 Auth | Liste paginée des utilisateurs |
| `GET` | `/api/users/contacts` | 🟢 Auth | Liste des contacts selon rôle (messagerie) |
| `GET` | `/api/users/online` | 🟢 Auth | Utilisateurs récemment actifs |
| `POST` | `/api/users/presence` | 🟢 Auth | Mise à jour du timestamp d'activité |
| `GET` | `/api/users/children-summary` | 🟢 Auth | Résumé des enfants de l'utilisateur connecté |
| `GET` | `/api/users/:id` | 🔴 **Public** | Détail d'un utilisateur par son identifiant (données exposées sans auth) |
| `POST` | `/api/users` | 🔴 **Public** | Création directe d'utilisateur sans vérification admin |
| `PUT` | `/api/users/:id` | 🔴 **Public** | Modification des données d'un utilisateur sans contrôle |
| `DELETE` | `/api/users/:id` | 🔴 **Public** | Suppression d'un utilisateur sans contrôle |
| `PUT` | `/api/users/:id/password` | 🔴 **Public** | Changement forcé du mot de passe de n'importe quel ID sans authentification ! |
| `GET` | `/api/users/profile` | 🟢 Auth | Profil de l'utilisateur connecté |
| `PUT` | `/api/users/profile` | 🟢 Auth | Mise à jour de son propre profil |
| `PUT` | `/api/users/change-password` | 🟢 Auth | Modification de son propre mot de passe (vérifie l'ancien) |
| `POST` | `/api/users/push-token` | 🟢 Auth | Enregistrement du jeton de notification Expo |
| `GET` | `/api/profile` | 🟢 Auth | Consultation du profil |
| `PUT` | `/api/profile` | 🟢 Auth | Mise à jour du profil |
| `POST` | `/api/profile/upload` | 🟢 Auth | Upload de photo de profil |
| `DELETE` | `/api/profile/image` | 🟢 Auth | Suppression de sa photo de profil |

---

## 2. Enfants (`/api/children`)

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/children` | 🟢 Auth | Liste des enfants avec filtres (recherche, statut, âge) |
| `GET` | `/api/children/simple` | 🟢 Auth | Liste allégée pour les sélecteurs |
| `GET` | `/api/children/my-count` | 🟢 Auth | Nombre d'enfants rattachés au parent connecté |
| `GET` | `/api/children/available` | 🟢 Staff/Admin | Enfants disponibles |
| `GET` | `/api/children/orphans` | 🟢 Staff/Admin | Enfants sans parent associé |
| `GET` | `/api/children/parent/:parentId`| 🟢 Auth | Enfants d'un parent spécifique |
| `GET` | `/api/children/:id` | 🟢 Auth + Check Accès | Fiche détaillée d'un enfant |
| `POST` | `/api/children` | 🟢 Staff/Admin | Création d'une fiche enfant |
| `PUT` | `/api/children/:id` | 🟢 Auth + Check Accès | Modification d'une fiche enfant |
| `DELETE`| `/api/children/:id` | 🟢 Admin | Suppression d'un enfant |
| `POST` | `/api/children/:id/photo` | 🟢 Auth + Permission | Dépôt de photo (permission `children.photos.manage`) |
| `DELETE`| `/api/children/:id/photo` | 🟢 Auth + Permission | Suppression de photo |
| `GET` | `/api/children/:id/medical` | 🟢 Auth | Informations médicales de l'enfant |
| `PUT` | `/api/children/:id/medical` | 🟢 Auth | Mise à jour des informations médicales |
| `GET` | `/api/children/:id/emergency-contacts` | 🟢 Auth | Contacts d'urgence |
| `PUT` | `/api/children/:id/emergency-contacts` | 🟢 Auth | Mise à jour des contacts d'urgence |
| `PUT` | `/api/children/:id/associate-parent` | 🟢 Admin | Rattachement d'un parent à un enfant |
| `PUT` | `/api/children/:id/deactivate-parent` | 🟢 Admin | Dissociation d'un parent |
| `GET` | `/api/children/birthdays/month` | 🔴 **Public** | Liste des anniversaires du mois (anomalie de protection) |
| `GET` | `/api/children/stats` | 🔴 **Public** | Statistiques sur les enfants (sans auth) |
| `GET` | `/api/children/stats/overview` | 🔴 **Public** | Vue synthétique des statistiques (sans auth) |

---

## 3. Inscriptions (`/api/enrollments`)

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `POST` | `/api/enrollments` | 🌐 Public | Soumission d'une nouvelle demande d'inscription |
| `POST` | `/api/enrollments/check-child` | 🌐 Public | Vérification si l'enfant existe déjà |
| `POST` | `/api/enrollments/check-email` | 🌐 Public | Vérification si l'e-mail est déjà utilisé |
| `POST` | `/api/enrollments/:id/documents` | 🌐 Public | Dépôt complémentaire de pièces pour un dossier |
| `GET` | `/api/enrollments/:id/status` | 🌐 Public | Consultation de l'état d'avancement du dossier |
| `GET` | `/api/enrollments` | 🔴 **Sans auth** | Liste de l'ensemble des dossiers d'inscription ! |
| `GET` | `/api/enrollments/:id` | 🔴 **Sans auth** | Consultation intégrale d'un dossier par ID |
| `POST` | `/api/enrollments/:id/approve` | 🔴 **Sans auth** | Approbation d'un dossier et génération compte parent |
| `PUT` | `/api/enrollments/:id/reject` | 🔴 **Sans auth** | Rejet d'un dossier avec motif |
| `POST` | `/api/enrollments/:id/choose-appointment` | 🌐 Public | Choix d'un créneau de rendez-vous |
| `PUT` | `/api/enrollments/:id/status` | 🔴 **Sans auth** | Forçage manuel du statut d'inscription |
| `DELETE`| `/api/enrollments/:id` | 🔴 **Sans auth** | Suppression d'un dossier d'inscription |
| `GET` | `/api/enrollments/:id/documents`| 🔴 **Sans auth** | Liste des documents d'une inscription |
| `GET` | `/api/enrollments/:id/documents/:docId` | 🔴 **Sans auth** | Téléchargement d'un document d'inscription |
| `POST` | `/api/enrollments/add-child` | 🟢 Parent | Ajout d'un nouvel enfant par un parent connecté |

---

## 4. Rendez-vous (`/api/appointments`)

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/appointments` | 🟢 Auth | Liste des rendez-vous |
| `POST` | `/api/appointments` | 🟢 Auth | Création d'un rendez-vous |
| `GET` | `/api/appointments/my` | 🟢 Auth | Rendez-vous de l'utilisateur connecté |
| `GET` | `/api/appointments/today` | 🟢 Staff/Admin | Rendez-vous du jour |
| `GET` | `/api/appointments/pending` | 🟢 Admin | Rendez-vous en attente de validation |
| `GET` | `/api/appointments/:id` | 🟢 Auth | Consultation d'un rendez-vous |
| `PATCH`| `/api/appointments/:id/confirm` | 🟢 Auth | Confirmation d'un rendez-vous |
| `PATCH`| `/api/appointments/:id/counter-propose` | 🟢 Auth | Contre-proposition de date |
| `PATCH`| `/api/appointments/:id/cancel` | 🟢 Auth | Annulation du rendez-vous |
| `PATCH`| `/api/appointments/:id/complete` | 🟢 Staff/Admin | Clôture finale du rendez-vous |
| `GET` | `/api/appointments/by-enrollment/:enrollmentId` | 🌐 Public | Recherche par dossier |
| `POST` | `/api/appointments/public/confirm` | 🌐 Public | Confirmation par la famille sans compte |
| `POST` | `/api/appointments/public/counter-propose` | 🌐 Public | Contre-proposition par la famille sans compte |

---

## 5. Présences & Absences (`/api/attendance` & `/api/absence-requests`)

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/attendance/today` | 🟢 Auth | Présences du jour (première déclaration active) |
| `POST` | `/api/attendance/check-in` | 🟢 Auth + `attendance.manage` | Pointage de l'arrivée d'un enfant |
| `POST` | `/api/attendance/check-out`| 🟢 Auth + `attendance.manage` | Pointage du départ d'un enfant |
| `GET` | `/api/attendance/child/:id/month` | 🟢 Auth | Présences mensuelles d'un enfant |
| `GET` | `/api/attendance/child/:id/calendar` | 🟢 Auth | Calendrier de présence d'un enfant |
| `GET` | `/api/absence-requests/all` | 🟢 Auth | Toutes les demandes d'absence |
| `GET` | `/api/absence-requests/today` | 🟢 Auth | Absences signalées aujourd'hui |
| `GET` | `/api/absence-requests/parent/:parentId` | 🟢 Auth | Demandes soumises par un parent |
| `POST` | `/api/absence-requests` | 🟢 Auth | Soumission d'une déclaration d'absence |
| `PUT` | `/api/absence-requests/:id/acknowledge` | 🟢 Auth | Prise en compte par l'équipe |

> *Note technique* : Le fichier `backend/routes_postgres/attendance.js` contient une seconde série de routes non protégées (`GET /report`, `GET /`, `GET /today`, `POST /`, `PUT /:id`, `DELETE /:id`). La première déclaration dans le fichier prime, mais la présence de ces doublons engendre un risque de sécurité majeur en cas de réorganisation du code.

---

## 6. Rapports journaliers & Fournitures (`/api/daily-reports` & `/api/supplies`)

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/daily-reports/children/today` | 🔴 **Sans auth** | Enfants à renseigner aujourd'hui |
| `POST` | `/api/daily-reports` | 🔴 **Sans auth** | Création / enregistrement d'un rapport |
| `PATCH`| `/api/daily-reports/:id/status` | 🔴 **Sans auth** | Changement de statut (brouillon, terminé, envoyé) |
| `DELETE`| `/api/daily-reports/:id` | 🔴 **Sans auth** | Suppression d'un rapport journalier |
| `GET` | `/api/daily-reports/parent/my-children` | 🔴 **Sans auth** | Consultation des rapports par les parents |
| `GET` | `/api/daily-reports/:childId/history` | 🔴 **Sans auth** | Historique des rapports d'un enfant |
| `GET` | `/api/daily-reports/:childId/:date` | 🔴 **Sans auth** | Rapport d'une date spécifique |
| `GET` | `/api/supplies/child/:childId` | 🔴 **Sans auth** | État des stocks d'un enfant |
| `POST` | `/api/supplies/child/:childId/refill` | 🔴 **Sans auth** | Réapprovisionnement d'une fourniture |
| `POST` | `/api/supplies/child/:childId/use` | 🔴 **Sans auth** | Décompte d'une fourniture utilisée |
| `GET` | `/api/supplies/child/:childId/history` | 🔴 **Sans auth** | Historique des mouvements de stock |
| `POST` | `/api/supplies/daily-brought` | 🔴 **Sans auth** | Enregistrement des fournitures apportées le jour même |

---

## 7. Traitements médicaux (`/api/treatments`)

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `POST` | `/api/treatments` | 🟢 Auth | Déclaration d'un nouveau traitement médical |
| `GET` | `/api/treatments/my-children` | 🟢 Auth | Traitements concernant les enfants du parent |
| `PUT` | `/api/treatments/:id` | 🟢 Auth | Mise à jour d'un traitement |
| `DELETE`| `/api/treatments/:id` | 🟢 Auth | Annulation d'un traitement |
| `GET` | `/api/treatments/today` | 🟢 Staff/Admin | Traitements programmés pour la journée |
| `POST` | `/api/treatments/:id/administer` | 🟢 Staff/Admin | Enregistrement de l'administration d'une dose |
| `GET` | `/api/treatments/:id/history` | 🟢 Auth | Historique des prises de médicaments |
| `GET` | `/api/treatments/child/:childId/today` | 🟢 Auth | Prises prévues pour un enfant aujourd'hui |
| `POST` | `/api/treatments/check-notifications` | 🔴 **Sans auth** | Déclenchement manuel de la vérification des alertes |

---

## 8. Messagerie & Notifications (`/api/staff-messages`, `/api/personal-memos`, `/api/notifications`)

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `POST` | `/api/staff-messages` | 🟢 Staff/Admin/Parent | Envoi d'un message interne (contrôle `messages.parents`) |
| `GET` | `/api/staff-messages` | 🟢 Staff/Admin/Parent | Boîte de réception |
| `GET` | `/api/staff-messages/unread` | 🟢 Staff/Admin/Parent | Nombre de messages non lus |
| `GET` | `/api/staff-messages/conversations` | 🟢 Staff/Admin/Parent | Liste des fils de discussion |
| `GET` | `/api/staff-messages/conversation/:contactId` | 🟢 Staff/Admin/Parent | Discussion avec un interlocuteur |
| `PATCH`| `/api/staff-messages/:id/read` | 🟢 Staff/Admin/Parent | Marquer un message comme lu |
| `POST` | `/api/personal-memos` | 🟢 Auth | Création d'un mémo personnel |
| `GET` | `/api/personal-memos` | 🟢 Auth | Liste de ses propres mémos |
| `GET` | `/api/personal-memos/today` | 🟢 Auth | Mémos pour la journée |
| `PATCH`| `/api/personal-memos/:id/complete` | 🟢 Auth | Validation d'un mémo |
| `DELETE`| `/api/personal-memos/:id` | 🟢 Auth | Suppression d'un mémo |
| `GET` | `/api/notifications` | 🟢 Auth | Liste de ses notifications |
| `GET` | `/api/notifications/:id` | 🟢 Auth | Détail d'une notification |
| `PUT` | `/api/notifications/:id/read` | 🟢 Auth | Marquer une notification comme lue |
| `POST` | `/api/notifications` | 🔴 **Sans auth** | Création d'une notification directe |
| `POST` | `/api/notifications/broadcast` | 🔴 **Sans auth** | Diffusion d'une notification à plusieurs utilisateurs |
| `PUT` | `/api/notifications/read-all` | 🔴 **Sans auth** | Marquer tout comme lu pour un utilisateur quelconque |
| `DELETE`| `/api/notifications/:id` | 🔴 **Sans auth** | Suppression d'une notification |

---

## 9. Activités, Événements, Tâches & Annonces

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/activities` | 🟢 Auth | Liste des activités partagées |
| `GET` | `/api/activities/:id` | 🟢 Auth | Détail d'une activité |
| `POST` | `/api/activities` | 🔴 **Sans auth en tête** | Publication d'une activité (anomalie de middleware) |
| `DELETE`| `/api/activities/:id` | 🟢 Auth | Suppression d'une activité |
| `POST` | `/api/activities/:id/reactions` | 🟢 Auth | Ajout d'une réaction émotionnelle |
| `POST` | `/api/activities/:id/comments` | 🟢 Auth | Ajout d'un commentaire |
| `DELETE`| `/api/activities/:id/comments/:commentId` | 🟢 Auth | Suppression d'un commentaire |
| `GET` | `/api/events` | 🟢 Auth | Événements du calendrier |
| `POST` | `/api/events` | 🟢 Auth | Création d'un événement |
| `PUT` | `/api/events/:id` | 🟢 Auth | Modification d'un événement |
| `DELETE`| `/api/events/:id` | 🟢 Auth | Suppression d'un événement |
| `GET` | `/api/tasks/my` | 🟢 Auth | Ses propres tâches |
| `POST` | `/api/tasks` | 🟢 Admin | Création d'une tâche |
| `PATCH`| `/api/tasks/:id/status` | 🟢 Auth | Changement d'état d'une tâche |
| `POST` | `/api/announcements` | 🟢 Admin | Création d'une annonce officielle |
| `GET` | `/api/announcements` | 🟢 Admin | Toutes les annonces |
| `GET` | `/api/announcements/my` | 🟢 Auth | Annonces visibles par l'utilisateur connecté |
| `PATCH`| `/api/announcements/:id/publish` | 🟢 Admin | Publication effective d'une annonce |

---

## 10. Documents & Cloudinary

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/documents/admin` | 🟢 Auth | Liste des documents administratifs |
| `POST` | `/api/documents/admin` | 🔴 **Sans auth direct** | Dépôt d'un document administratif |
| `DELETE`| `/api/documents/admin/:id` | 🔴 **Sans auth direct** | Suppression d'un document administratif |
| `GET` | `/api/documents/admin/:id/download` | 🟢 Auth | Téléchargement d'un document administratif |
| `GET` | `/api/documents/public/reglement` | 🌐 Public | Téléchargement du règlement intérieur |
| `GET` | `/api/documents/children/:childId` | 🟢 Auth | Documents rattachés à un enfant |
| `POST` | `/api/documents/children/:childId` | 🔴 **Sans auth direct** | Ajout de document pour un enfant |
| `POST` | `/api/cloudinary/signature` | 🟢 Auth | Génération d'une signature d'upload direct |
| `GET` | `/api/cloudinary-explorer/*` | 🟢 Admin/Developer | Gestion des dossiers et médias Cloudinary |

---

## 11. Paramètres & Configuration de la Crèche

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/nursery-settings` | 🌐 Public | Récupération des paramètres traduits |
| `GET` | `/api/nursery-settings/raw` | 🔴 **Public** | Paramètres bruts de configuration |
| `GET` | `/api/nursery-settings/annual-vacation` | 🌐 Public | Dates des vacances annuelles |
| `PUT` | `/api/nursery-settings/annual-vacation` | 🔴 **Public** | Modification des vacances annuelles sans auth ! |
| `POST` | `/api/nursery-settings/simple-update` | 🔴 **Public** | Mise à jour simple des paramètres sans auth ! |
| `PUT` | `/api/nursery-settings/:key` | 🔴 **Public** | Modification d'un paramètre spécifique sans auth ! |
| `POST` | `/api/nursery-settings` | 🔴 **Public** | Création d'un paramètre sans auth ! |
| `GET` | `/api/holidays` | 🌐 Public | Jours fériés enregistrés |
| `POST` | `/api/holidays` | 🟢 Admin/Developer | Ajout d'un jour férié |
| `PUT` | `/api/holidays/:id` | 🟢 Admin/Developer | Modification d'un jour férié |
| `DELETE`| `/api/holidays/:id` | 🟢 Admin/Developer | Suppression d'un jour férié |
| `POST` | `/api/holidays/sync` | 🟢 Admin/Developer | Synchronisation |
| `POST` | `/api/holidays/init` | 🔴 **Public** | Initialisation automatique sans auth ! |

---

## 12. Sauvegardes, Urgence & Administration Système

| Méthode | Route | Sécurité | Description |
|---|---|---|---|
| `GET` | `/api/backup` | 🟢 Auth | Liste des sauvegardes JSON disponibles |
| `POST` | `/api/backup` | 🟢 Auth | Déclenchement d'une sauvegarde manuelle |
| `GET` | `/api/backup/download/:filename` | 🟢 Auth | Téléchargement d'un fichier de sauvegarde |
| `DELETE`| `/api/backup/:filename` | 🟢 Auth | Suppression d'une sauvegarde |
| `POST` | `/api/backup/restore/:filename` | 🟢 Auth | Restauration d'une sauvegarde JSON |
| `GET` | `/api/backup/status` | 🟢 Auth | Statut des sauvegardes |
| `GET` | `/api/recovery/verify` | 🟢 `RECOVERY_KEY` | Vérification de la clé d'urgence |
| `GET` | `/api/recovery/backups` | 🟢 `RECOVERY_KEY` | Liste des sauvegardes disponibles en mode secours |
| `POST` | `/api/recovery/restore/:filename` | 🟢 `RECOVERY_KEY` | Restauration d'urgence |
| `GET` | `/api/activity-logs/dashboard` | 🟢 Developer | Vue synthétique des logs système |
| `GET` | `/api/activity-logs/*` | 🟢 Developer | Alertes, rapports, audit des actions |
| `POST` | `/api/setup/create-admin` | 🔴 **Public** | Création d'un compte admin de premier démarrage |
| `GET` | `/api/setup/check-users` | 🔴 **Public** | Vérification de la présence d'utilisateurs |
| `GET` | `/api/debug/enrollments` | 🟢 Admin | Outil de diagnostic des inscriptions |
| `GET` | `/api/admin/contact-messages` | 🟢 Auth | Messages reçus via le formulaire de contact |
| `POST` | `/api/admin/contact-messages/:id/reply` | 🟢 Auth | Réponse par e-mail au visiteur |
| `POST` | `/api/payment-alerts` | 🟢 Staff/Admin | Envoi d'alertes de paiement aux parents |
| `GET` | `/api/testimonials/approved` | 🌐 Public | Témoignages approuvés |
| `POST` | `/api/testimonials` | 🟢 Auth | Dépôt d'un avis |
| `PUT` | `/api/testimonials/:id/approve` | 🟢 Admin/Developer | Validation d'un témoignage |
