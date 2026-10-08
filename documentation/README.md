# Documentation — Application de gestion de la crèche « Mima Elghalia »

> Documentation générée à partir de l'analyse du **code réel** du dépôt (frontend, backend, scripts, configuration).
> Toute information non confirmée par le code est marquée **« À vérifier dans le projet »** ou **« Non confirmé par le code analysé »**.
> Dernière analyse : octobre 2026.

## 1. Présentation

**Mima Elghalia** (ميما الغالية) est une crèche située à Médenine (Tunisie). L'application est composée de :

- un **site public** (accueil, formulaire d'inscription, contact, visite virtuelle, activités) ;
- un **espace parent** (« Mon Espace ») pour suivre son/ses enfant(s) ;
- un **tableau de bord** réservé au personnel et à la direction (enfants, inscriptions, présences, rapports journaliers, traitements médicaux, planning, messages, paramètres…).

L'interface est **bilingue français / arabe** (avec affichage de droite à gauche) et propose un thème clair/sombre.

## 2. Public cible

| Public | Documents recommandés |
|---|---|
| Parents | [Guide parent](02-users-and-roles/parent.md), [Guide d'utilisation](03-user-guide/) |
| Personnel (éducatrices) | [Guide personnel](02-users-and-roles/personnel.md) |
| Direction / Admin | [Guide admin](02-users-and-roles/admin.md) |
| Développeur / Équipe technique | [Technique](06-technical/), [API](07-api/), [Développement](08-development/) |
| Chef de projet / Audit | [Audit](09-audit/) |

## 3. Rôles identifiés dans le code

| Rôle (valeur technique) | Libellé | Remarque |
|---|---|---|
| `parent` | Parent | Accès à ses propres enfants |
| `staff` | Personnel / éducatrice | Droits « communs » + permissions individuelles activables |
| `admin` | Direction / administrateur | Toutes les permissions implicites |
| `developer` | Développeur | = admin + pages techniques (journal technique, stockage) |

Détails : [roles-overview](02-users-and-roles/roles-overview.md) · [matrice des permissions](02-users-and-roles/permissions-matrix.md).

## 4. Principales fonctionnalités (confirmées par le code)

Inscription en ligne et workflow d'approbation · gestion des enfants · comptes parents/personnel · présences · rapports journaliers (repas, couches, sommeil…) · traitements médicaux · fournitures par enfant · demandes d'absence · rendez-vous · tâches/événements/mémos · messagerie interne · annonces · fil d'activités (photos/vidéos, réactions, commentaires) · notifications internes + e-mails · documents (inscription, enfant, administratifs) · jours fériés/vacances · paramètres de la crèche · témoignages · courrier (messages du formulaire de contact) · sauvegardes · journal d'activité (développeur).

Statut détaillé : [implementation-status](09-audit/implementation-status.md).

## 5. Architecture générale

React 18 + Vite (SPA) ⇄ API REST Express (Node.js) ⇄ PostgreSQL (Neon) · Cloudinary (fichiers) · Resend/SMTP (e-mails). Voir [architecture-overview](01-overview/architecture-overview.md).

## 6. Table des matières

### 01 — Vue d'ensemble
- [project-overview](01-overview/project-overview.md)
- [functional-overview](01-overview/functional-overview.md)
- [architecture-overview](01-overview/architecture-overview.md)
- [glossary](01-overview/glossary.md)

### 02 — Utilisateurs et rôles
- [roles-overview](02-users-and-roles/roles-overview.md)
- [permissions-matrix](02-users-and-roles/permissions-matrix.md)
- [parent](02-users-and-roles/parent.md) · [personnel](02-users-and-roles/personnel.md) · [admin](02-users-and-roles/admin.md) · [developer](02-users-and-roles/developer.md)

### 03 — Guide d'utilisation (non technique)
- [getting-started](03-user-guide/getting-started.md) (connexion, mot de passe, navigation)
- [enrollment](03-user-guide/enrollment.md) (inscription et approbation)
- [children](03-user-guide/children.md)
- [attendance-and-absences](03-user-guide/attendance-and-absences.md)
- [daily-reports-and-supplies](03-user-guide/daily-reports-and-supplies.md)
- [treatments](03-user-guide/treatments.md)
- [appointments](03-user-guide/appointments.md)
- [tasks-and-planning](03-user-guide/tasks-and-planning.md)
- [messaging-and-notifications](03-user-guide/messaging-and-notifications.md)
- [activities-and-announcements](03-user-guide/activities-and-announcements.md)
- [documents](03-user-guide/documents.md)
- [administration](03-user-guide/administration.md)

### 04 — Domaine métier (entités)
- [entities-overview](04-domain/entities-overview.md) (inclut le diagramme des relations)
- [user](04-domain/user.md) · [child](04-domain/child.md) · [enrollment](04-domain/enrollment.md) · [appointment](04-domain/appointment.md)
- [attendance](04-domain/attendance.md) · [daily-report](04-domain/daily-report.md) · [treatment](04-domain/treatment.md) · [supply](04-domain/supply.md)
- [event-and-task](04-domain/event-and-task.md) · [message](04-domain/message.md) · [notification](04-domain/notification.md)
- [document](04-domain/document.md) · [activity-and-announcement](04-domain/activity-and-announcement.md) · [settings-and-holidays](04-domain/settings-and-holidays.md)

### 05 — Workflows
- [workflows-overview](05-workflows/workflows-overview.md)

### 06 — Technique
- [architecture](06-technical/architecture.md) · [authentication](06-technical/authentication.md) · [authorization](06-technical/authorization.md)
- [database](06-technical/database.md) · [file-storage](06-technical/file-storage.md) · [messaging-system](06-technical/messaging-system.md)
- [notification-system](06-technical/notification-system.md) · [backup-system](06-technical/backup-system.md) · [logging](06-technical/logging.md)
- [configuration](06-technical/configuration.md) · [integrations](06-technical/integrations.md) · [jobs](06-technical/jobs.md) · [ui-screens](06-technical/ui-screens.md)

### 07 — API
- [api-overview](07-api/api-overview.md) · [authentication-api](07-api/authentication-api.md) · [endpoints](07-api/endpoints.md)

### 08 — Développement
- [setup](08-development/setup.md) · [project-structure](08-development/project-structure.md) · [development-guide](08-development/development-guide.md)
- [testing](08-development/testing.md) · [deployment](08-development/deployment.md) · [troubleshooting](08-development/troubleshooting.md)

### 09 — Audit
- [implementation-status](09-audit/implementation-status.md) · [incomplete-features](09-audit/incomplete-features.md)
- [security-findings](09-audit/security-findings.md) · [technical-debt](09-audit/technical-debt.md)
- [inconsistencies](09-audit/inconsistencies.md) · [recommendations](09-audit/recommendations.md) · [corrections](09-audit/corrections.md)

## 7. Statut du projet et avertissements

> [!WARNING]
> L'audit (dossier `09-audit`) a mis en évidence des **failles de sécurité critiques** dans le backend (routes sans authentification permettant par ex. de changer le mot de passe de n'importe quel compte, de s'auto-inscrire administrateur, de modifier les paramètres de la crèche). Lire [security-findings](09-audit/security-findings.md) **avant toute mise en production ou exposition publique**.

- La documentation existante du dépôt (`README.md` racine, `docs/`, `tests/*.md`, `backend/docs/`) est en partie **obsolète** (ex. mentionne MySQL, Render, GitHub Pages alors que le code utilise PostgreSQL/Neon et pointe par défaut vers Fly.io). La présente documentation fait foi pour l'état du code analysé.
- Le schéma de base de données n'est pas versionné de façon centralisée : voir [database](06-technical/database.md).
- Aucun secret n'est recopié ici (`<SECRET>`, `<API_KEY>`, `<DATABASE_URL>`).
