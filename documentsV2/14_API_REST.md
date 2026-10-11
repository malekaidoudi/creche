# 14 — API REST

## Objectif
Catalogue des endpoints exposés par le backend, organisés par domaine, avec la méthode HTTP, le chemin, l'exigence d'authentification/autorisation et le fichier source. Pour le détail fin des permissions, voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md).

## Méthodologie
Cette liste a été établie en recherchant systématiquement tous les appels `router.get/post/put/patch/delete(...)` dans `backend/routes_postgres/*.js` (48 fichiers montés dans `backend/server.js`), avec leur chaîne de middlewares. Les corps de requête/réponse détaillés n'ont pas été retranscrits pour chaque endpoint (volume trop important) ; ils sont documentés pour les flux métier principaux dans [21_FLUX_METIER.md](./21_FLUX_METIER.md). Convention de lecture : « public » = aucune authentification requise ; « authentifié » = `auth.authenticateToken` requis, tout rôle ; sinon le ou les rôles/permissions sont précisés.

## Montage des routeurs (`backend/server.js`)
Chaque domaine est monté sous `/api/<préfixe>`. Table complète :

| Préfixe | Fichier |
|---|---|
| `/api/auth` | `routes_postgres/auth.js` |
| `/api/users` | `routes_postgres/users.js` |
| `/api/children` | `routes_postgres/children.js` |
| `/api/enrollments` | `routes_postgres/enrollments.js` |
| `/api/attendance` | `routes_postgres/attendance.js` |
| `/api/logs` | `routes_postgres/logs.js` |
| `/api/contacts`, `/api/contact` (alias) | `routes_postgres/contacts.js` |
| `/api/health` | `routes_postgres/health.js` |
| `/api/setup` | `routes_postgres/setup.js` |
| `/api/profile` | `routes_postgres/profile.js` |
| `/api/absence-requests` | `routes_postgres/absenceRequests.js` |
| `/api/notifications` | `routes_postgres/notifications.js` |
| `/api/nursery-settings` | `routes_postgres/nurserySettings.js` |
| `/api/holidays` | `routes_postgres/holidays.js` |
| `/api/schedule-settings` | `routes_postgres/schedule-settings.js` |
| `/api/user` | `routes_postgres/userChildren.js` |
| `/api/events` | `routes_postgres/events.js` |
| `/api/tasks` | `routes_postgres/tasks.js` |
| `/api/announcements` | `routes_postgres/announcements.js` |
| `/api/appointments` | `routes_postgres/appointments.js` |
| `/api/staff-messages` | `routes_postgres/staff-messages.js` |
| `/api/personal-memos` | `routes_postgres/personal-memos.js` |
| `/api/activities` | `routes_postgres/activities.js` |
| `/api/activity-logs` | `routes_postgres/activityLogs.js` |
| `/api/user-workflow` | `routes_postgres/userWorkflow.js` |
| `/api/debug` | `routes_postgres/debugEnrollments.js` |
| `/api/backup` | `routes_postgres/backup.js` |
| `/api/recovery` | `routes_postgres/recovery.js` |
| `/api/daily-reports` | `routes_postgres/dailyReports.js` |
| `/api/supplies` | `routes_postgres/supplies.js` |
| `/api/staff-assignments` | `routes_postgres/staffAssignments.js` |
| `/api/dashboard` | `routes_postgres/dashboardStats.js` |
| `/api/admin/contact-messages` | `routes_postgres/contactMessages.js` |
| `/api/virtual-tour` | `routes_postgres/virtualTour.js` |
| `/api/payment-alerts` | `routes_postgres/paymentAlerts.js` |
| `/api/documents` | `routes_postgres/documents.js` |
| `/api/cloudinary` | `routes_postgres/cloudinary.js` |
| `/api/cloudinary-explorer` | `routes_postgres/cloudinaryExplorer.js` |
| `/api/activity-feed` | `routes_postgres/activityFeed.js` |
| `/api/testimonials` | `routes_postgres/testimonials.js` |
| `/api/treatments` | `routes_postgres/treatments.js` |
| `/api/staff-permissions` | `routes_postgres/staffPermissions.js` |

## Authentification (`/api/auth`)
Voir le détail complet en [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md).

| Méthode | Chemin | Auth |
|---|---|---|
| POST | `/login` | public |
| POST | `/register` | public (rôle forcé `parent`) |
| GET | `/me` | jeton requis (vérifié manuellement, hors `authenticateToken`) |
| POST | `/logout` | jeton optionnel (révocation si présent) |
| POST | `/create-password` | public (jeton métier dans le corps) |
| POST | `/forgot-password` | public |
| POST | `/reset-password` | public (jeton métier dans le corps) |
| GET | `/verify-reset-token/:token` | public |

## Utilisateurs (`/api/users`)
| Méthode | Chemin | Auth |
|---|---|---|
| GET | `/children-summary`, `/has-children`, `/contacts`, `/`, `/online`, `/:id`, `/profile` | authentifié |
| POST | `/presence` | authentifié |
| POST | `/` | `admin`, `developer` |
| PUT | `/:id` | authentifié (logique de propriété interne — à vérifier en détail) |
| PUT | `/:id/password` | `admin`, `developer` |
| DELETE | `/:id` | `admin`, `developer` |
| PUT | `/profile`, `/change-password` | authentifié |

## Workflow de création de comptes (`/api/user-workflow`)
| Méthode | Chemin | Auth |
|---|---|---|
| POST | `/create-parent`, `/create-staff`, `/resend-password-link` | `admin` |
| POST | `/set-password`, `/register-parent` | public (jeton métier) |

## Enfants (`/api/children`)
| Méthode | Chemin | Auth |
|---|---|---|
| GET | `/simple`, `/my-count`, `/parent/:parentId`, `/birthdays/month`, `/stats`, `/unassociated`, `/`, `/stats/overview` | authentifié ou public selon la ligne (voir fichier ; `/birthdays/month`, `/stats`, `/unassociated`, `/stats/overview` observés sans middleware d'authentification) |
| GET | `/available`, `/orphans` | `requireStaff` |
| GET | `/:id` | `requireChildAccess` (propriétaire ou staff/admin) |
| GET | `/:id/medical`, `/:id/emergency-contacts` | `requireChildAccess` |
| POST | `/` | validation, authentifié |
| PUT | `/:id`, `/:id/medical`, `/:id/emergency-contacts` | `requireChildAccess` |
| PUT | `/:id/associate-parent`, `/:id/deactivate-parent` | `admin` |
| PUT | `/:id/suspend`, `/:id/reactivate` | `admin`, `developer` (+ `director`, rôle inexistant en base, voir §11) |
| DELETE | `/:id` | `admin` |
| POST/DELETE | `/:id/photo` | `requireChildPhotoAccess` (admin/developer libres, staff avec permission `children.photos.manage`, parent propriétaire) |

**Point de vigilance confirmé** : plusieurs routes `GET` de `children.js` (`/birthdays/month`, `/stats`, `/unassociated`, `/stats/overview`) n'ont **aucun middleware d'authentification** dans la définition de route observée. Cela signifie que ces agrégats (nombre d'enfants, anniversaires du mois...) seraient accessibles sans connexion si l'API est appelée directement. Voir [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md).

## Inscriptions (`/api/enrollments`)
Voir détail du workflow en [21_FLUX_METIER.md](./21_FLUX_METIER.md).
| Méthode | Chemin | Auth |
|---|---|---|
| POST | `/`, `/check-child`, `/check-email` | public |
| POST | `/:id/documents` | public (le candidat n'a pas encore de compte) |
| GET | `/:id/status` | public |
| GET | `/appointments/today` | authentifié |
| GET | `/`, `/:id` | `admin`/`developer` (via contrôleur) |
| POST | `/:id/approve` | `admin`, `developer` |
| PUT | `/:id/reject` | `admin`, `developer` |
| POST | `/:id/choose-appointment` | public (candidat) |
| PUT | `/:id/status` | authentifié |
| DELETE | `/:id` | `admin`/`developer` (à confirmer précisément) |
| GET | `/:id/documents`, `/:id/documents/:docId` | protection document (`requireDocumentAccess` probable — à vérifier) |
| POST | `/add-child` | authentifié |

## Présences (`/api/attendance`)
| Méthode | Chemin | Auth |
|---|---|---|
| GET | `/today`, `/child/:id/month`, `/currently-present`, `/stats`, `/date/:date`, `/report`, `/`, `/:id`, `/stats/overview`, `/child/:id/calendar` | authentifié |
| POST | `/check-in`, `/check-out` | permission `attendance.manage` |

## Rendez-vous (`/api/appointments`)
| Méthode | Chemin | Auth |
|---|---|---|
| POST | `/` | authentifié |
| GET | `/`, `/my`, `/:id` | authentifié |
| GET | `/today` | `admin`, `staff` |
| GET | `/pending` | `admin` |
| PATCH | `/:id/confirm`, `/:id/counter-propose`, `/:id/cancel` | authentifié |
| PATCH | `/:id/complete`, `/:id/status` ; POST `/:id/failed` | `admin`, `staff` |
| GET | `/by-enrollment/:enrollmentId` | public |
| POST | `/public/confirm`, `/public/counter-propose` | public (candidat sans compte) |

## Absences (`/api/absence-requests`)
| GET `/all` | permission `absences.manage` |
| GET `/today`, `/parent/:parentId` | authentifié |
| POST `/` | authentifié (parent) |
| PUT `/:id/acknowledge` | permission `absences.manage` |

## Bilans journaliers (`/api/daily-reports`) et fournitures (`/api/supplies`)
Toutes les routes exigent une authentification ; la création/modification des bilans et la gestion des stocks sont conditionnées par la permission `daily_reports.manage` au niveau du contrôleur (`controllers/dailyReportsController.js`, `controllers/suppliesController.js` — règle non ré-exprimée ligne à ligne dans le fichier de route lui-même, cf. délégation au contrôleur).

## Traitements médicaux (`/api/treatments`)
| POST `/`, PUT `/:id`, DELETE `/:id` | authentifié (parent, propriétaire via logique contrôleur) |
| GET `/my-children`, `/:id/history`, `/child/:childId/today` | authentifié |
| GET `/today`, POST `/:id/administer` | rôle `staff`/`admin`/`developer` **+** permission `medical.treatments.manage` |
| POST `/check-notifications` | public (déclenchement interne/cron — à vérifier si exposé sans protection volontairement) |

## Tâches (`/api/tasks`)
| POST `/`, PATCH `/:id`, POST `/:id/remind`, DELETE `/:id` | permission `tasks.manage` |
| GET `/my`, `/today`, `/overdue`, PATCH `/:id/status` | authentifié |

## Événements/planning (`/api/events`)
Toutes les routes exigent `authenticateToken` ; `/views/calendar` ajoute un middleware local `requirePlanningAccess` (correspondant probablement à la permission `staff.planning.view` — à vérifier précisément).

## Annonces (`/api/announcements`)
| POST `/`, PATCH `/:id/publish`, DELETE `/:id` | `admin` |
| GET `/`, `/my` | authentifié + middleware local `requireAnnouncementAccess` |

## Messagerie interne (`/api/staff-messages`)
Toutes les routes réservées aux rôles `staff`, `admin`, `parent` (pas `developer` explicitement listé — **à vérifier**, incohérence potentielle mineure car `developer` n'est pas alias automatique dans `requireRole` sauf s'il est explicitement couvert par la résolution `effectiveRole`, voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md) §3).

## Mémos personnels (`/api/personal-memos`)
Toutes les routes authentifiées, restreintes implicitement à l'auteur du mémo (logique métier dans `services/personalMemoService.js` — à vérifier).

## Activités / fil pédagogique (`/api/activities`)
Lecture authentifiée ; création avec validation (upload média, cf. `routes_postgres/activities.js` ligne 107) ; suppression, réactions et commentaires authentifiés.

## Permissions du personnel (`/api/staff-permissions`)
| GET `/catalog`, GET/PUT `/:userId` | `admin`, `developer` |
| GET `/me` | authentifié (tout rôle, source de vérité du frontend) |

## Affectations du personnel (`/api/staff-assignments`)
| GET `/`, PUT `/:staffId` | `admin` |
| GET `/my-assignment` | `admin`, `staff` |

## Administration & exploitation
| Domaine | Auth dominante | Fichier |
|---|---|---|
| Sauvegardes (`/api/backup`) | `admin`, `developer` | `backup.js` |
| Récupération d'urgence (`/api/recovery`) | clé de récupération dédiée (`verifyRecoveryKey`), pas un rôle applicatif | `recovery.js` |
| Diagnostic inscriptions (`/api/debug`) | `admin` | `debugEnrollments.js` |
| Explorateur Cloudinary (`/api/cloudinary-explorer`) | `admin`, `developer` | `cloudinaryExplorer.js` |
| Upload direct Cloudinary (`/api/cloudinary`) | authentifié | `cloudinary.js` |
| Journal technique (`/api/activity-logs`) | `developer` (majorité), `admin` (archivage/nettoyage/création) | `activityLogs.js` |
| Fil d'activité agrégé (`/api/activity-feed`) | `admin`/`developer` (`requireAdmin`) | `activityFeed.js` |
| Statistiques tableau de bord (`/api/dashboard`) | authentifié | `dashboardStats.js` |
| Messages de contact — vue admin (`/api/admin/contact-messages`) | authentifié (rôle non systématiquement re-vérifié par route — à confirmer) | `contactMessages.js` |
| Alertes de paiement (`/api/payment-alerts`) | `admin`, `staff` | `paymentAlerts.js` |
| Témoignages (`/api/testimonials`) | public en lecture (`/approved`, `/stats`) ; `admin`/`developer` en modération | `testimonials.js` |
| Visite virtuelle (`/api/virtual-tour`) | lecture publique ; écriture `admin` | `virtualTour.js` |
| Journal applicatif (`/api/logs`) | authentifié | `logs.js` |
| Contact public (`/api/contacts`) | création publique, lecture authentifiée | `contacts.js` |
| Santé du service (`/api/health`) | public | `health.js` |
| Initialisation (`/api/setup`) | création du premier admin publique (à sécuriser en production, voir [20_SECURITE_ET_JOURNALISATION.md](./20_SECURITE_ET_JOURNALISATION.md)) puis `admin`/`developer` | `setup.js` |
| Profil utilisateur (`/api/profile`) | authentifié | `profile.js` |
| Paramètres crèche (`/api/nursery-settings`) | lecture publique, écriture `admin`/`developer` | `nurserySettings.js` |
| Jours fériés (`/api/holidays`) | lecture publique, écriture authentifiée | `holidays.js` |
| Horaires de fermeture (`/api/schedule-settings`) | public | `schedule-settings.js` |
| Enfants du parent connecté (`/api/user`) | authentifié | `userChildren.js` |
| Notifications (`/api/notifications`) | authentifié (création/diffusion en masse via `/broadcast` — rôle non systématiquement précisé, à vérifier) | `notifications.js` |
| Documents (`/api/documents`) | mixte public/authentifié/protégé par ressource (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)) | `documents.js` |

## Format de réponse
Deux formes principales cohabitent :
- `{ success: boolean, data/... , error? }` (majorité des modules créés/réécrits récemment) ;
- `{ message, token?, user? }` ou `{ error }` directement, sans champ `success` (module `auth.js`, historique).

Codes d'erreur structurés observés (`code` dans la réponse JSON) : `NOT_AUTHENTICATED`, `NO_TOKEN`, `TOKEN_REVOKED`, `INVALID_TOKEN`, `INSUFFICIENT_PRIVILEGES`, `PERMISSION_DENIED`, `RESOURCE_ACCESS_DENIED`, `DOCUMENT_ACCESS_DENIED`, `RATE_LIMIT_EXCEEDED`, `FORBIDDEN`.

## Limites et points à vérifier
- Plusieurs middlewares locaux (`requireAnnouncementAccess`, `requirePlanningAccess`) n'ont pas été lus intégralement : leur correspondance exacte avec une permission du catalogue est probable mais non confirmée ligne à ligne.
- Le détail des corps de requête/réponse (schémas JSON complets) n'a pas été documenté pour chaque endpoint, par souci de volume ; il doit être consulté directement dans le fichier de route cité, ou dans `POSTMAN_COLLECTION.json` / `tests/Creche_API.postman_collection.json` (collections Postman présentes dans le dépôt, utiles comme points de départ mais non vérifiées comme à jour).
