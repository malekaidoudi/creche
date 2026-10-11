# 00 — Index de la documentation

Documentation d'audit du projet **Mima Elghalia**, produite à partir du code source réel (voir [README.md](./README.md) pour la méthodologie). Tous les documents ci-dessous ont été créés ; aucun n'a été omis par rapport à l'arborescence cible de la mission.

## Pour les utilisateurs et la direction

| Document | Contenu |
|---|---|
| [01 — Présentation du projet](./01_PRESENTATION_PROJET.md) | Vue d'ensemble, architecture déclarée vs vérifiée, rôles, hébergement |
| [02 — Guide utilisateur général](./02_GUIDE_UTILISATEUR_GENERAL.md) | Connexion, navigation, langue, thème, erreurs courantes |
| [03 — Guide du Parent](./03_GUIDE_PARENT.md) | Procédures pas-à-pas pour le rôle `parent` |
| [04 — Guide du Personnel](./04_GUIDE_PERSONNEL.md) | Procédures pour le rôle `staff`, permissions communes et individuelles |
| [05 — Guide de l'Administrateur](./05_GUIDE_ADMINISTRATEUR.md) | Procédures pour le rôle `admin` (direction) |
| [06 — Guide du Développeur (utilisateur)](./06_GUIDE_DEVELOPPEUR_UTILISATEUR.md) | Usage du rôle `developer` côté interface |
| [07 — Catalogue des fonctionnalités](./07_CATALOGUE_FONCTIONNALITES.md) | Inventaire complet par espace, avec statut d'implémentation |
| [08 — Glossaire métier](./08_GLOSSAIRE_METIER.md) | Définitions des termes métier |

## Pour les développeurs

| Document | Contenu |
|---|---|
| [09 — Architecture technique](./09_ARCHITECTURE_TECHNIQUE.md) | Organisation générale, backend, frontend, conventions |
| [10 — Authentification](./10_AUTHENTIFICATION.md) | JWT, révocation, mots de passe |
| [11 — Autorisation et permissions](./11_AUTORISATION_ET_PERMISSIONS.md) | Rôles, permissions granulaires, matrice, risques |
| [12 — Modèle de données](./12_MODELE_DONNEES.md) | Schéma PostgreSQL, sources, évolutions, relations |
| [13 — Dictionnaire de données](./13_DICTIONNAIRE_DONNEES.md) | Détail table par table |
| [14 — API REST](./14_API_REST.md) | Catalogue des endpoints par domaine |
| [15 — Frontend et interface](./15_FRONTEND_ET_INTERFACE.md) | Routage, état, formulaires, conventions |
| [16 — Stockage des fichiers](./16_STOCKAGE_FICHIERS.md) | Cloudinary, stockage local, sécurité des accès |
| [17 — Messagerie et notifications](./17_MESSAGERIE_ET_NOTIFICATIONS.md) | Messagerie interne, notifications, e-mails |
| [18 — Configuration et environnement](./18_CONFIGURATION_ENVIRONNEMENT.md) | Variables d'environnement backend/frontend |
| [19 — Tests, déploiement, maintenance](./19_TESTS_DEPLOIEMENT_MAINTENANCE.md) | Commandes, CI, sauvegardes, récupération |
| [20 — Sécurité et journalisation](./20_SECURITE_ET_JOURNALISATION.md) | En-têtes HTTP, validation, logs, risques |
| [21 — Flux métier](./21_FLUX_METIER.md) | Parcours de bout en bout (inscription, présence, traitements...) |
| [22 — État des fonctionnalités](./22_ETAT_DES_FONCTIONNALITES.md) | Synthèse de maturité par fonctionnalité |
| [23 — Anomalies et recommandations](./23_ANOMALIES_ET_RECOMMANDATIONS.md) | Incohérences identifiées, recommandations, questions ouvertes |
| [24 — Références code](./24_REFERENCES_CODE.md) | Index rapide sujet → fichier |

## Diagrammes (`diagrams/`)
- [architecture-globale.mmd](./diagrams/architecture-globale.mmd)
- [authentification.mmd](./diagrams/authentification.mmd)
- [controle-acces.mmd](./diagrams/controle-acces.mmd)
- [modele-donnees.mmd](./diagrams/modele-donnees.mmd)
- [flux-metier.mmd](./diagrams/flux-metier.mmd)

Tous les diagrammes cibles demandés dans la mission ont été produits ; aucun n'a été omis.

## Rapport final de la mission

### Dossier créé et documents générés
`documentsV2/` créé à la racine du dépôt, avec **26 fichiers Markdown** (`README.md` + `00` à `24`) et **5 diagrammes Mermaid** (`diagrams/`), soit la totalité de l'arborescence cible décrite dans la mission.

### Parties du projet effectivement analysées
- Backend : `server.js`, l'intégralité des 48 fichiers de `routes_postgres/`, les contrôleurs et services cités dans les documents, les middlewares (`auth.js`, `activityLogger.js`, `upload.js`), les migrations versionnées (001-008) et plusieurs scripts SQL/Node historiques, la configuration (`.env.example`, `render.yaml`), les emails et leurs templates.
- Frontend : `App.jsx`, `main.jsx`, `AppRoutes.jsx`, les contextes (`AuthContext`, `LanguageContext`), le système de permissions (`access/`), le client API (`services/api.js`, `config/api.js`), la configuration Vite et Tailwind, et un sondage représentatif des pages par domaine.
- Base de données : schéma historique, migrations actives, rapport d'audit interne de l'équipe, et recoupement avec les requêtes SQL observées dans le code pour identifier les tables/colonnes non versionnées.
- Configuration et déploiement : variables d'environnement, workflows CI/CD, fichiers de déploiement Render/Vercel/GitHub Pages.

### Modules et fonctionnalités recensés
Voir le détail exhaustif dans [07_CATALOGUE_FONCTIONNALITES.md](./07_CATALOGUE_FONCTIONNALITES.md) et [22_ETAT_DES_FONCTIONNALITES.md](./22_ETAT_DES_FONCTIONNALITES.md).

### Systèmes techniques documentés
Authentification, autorisation/permissions, modèle de données, API REST, frontend, stockage de fichiers, messagerie/notifications/e-mails, configuration, tests/déploiement/maintenance, sécurité/journalisation.

### Modules non analysés en détail, et raison
- `backend/config/db_postgres.js` (paramètres de pool) : non lu intégralement, signalé comme limite dans [09](./09_ARCHITECTURE_TECHNIQUE.md).
- `frontend/src/contexts/SettingsContext.jsx`, `DialogContext.jsx`, `access/Can.jsx` : non audités ligne à ligne (comportements déduits de leur usage), signalés comme limites dans [15](./15_FRONTEND_ET_INTERFACE.md).
- Plusieurs pages frontend individuelles volumineuses (ex. `EnrollmentPage.jsx`, `ChildrenPage.jsx`) : analysées via leurs appels API et leur rôle dans le routage, pas ligne à ligne, faute de temps dans le cadre de cette mission.
- Contenu précis de `backend/services/notificationService.js`, `personalMemoService.js`, `staffMessageService.js` : usages déduits des routes qui les appellent, logique interne non entièrement vérifiée.
- État réel de la base de données de production (accès direct non disponible dans cet environnement) : les affirmations sur le schéma s'appuient sur le code et sur le rapport d'audit généré par l'équipe elle-même (`DB_AUDIT_REPORT.md`), avec les réserves indiquées en [12](./12_MODELE_DONNEES.md).

### Incohérences ou anomalies découvertes
Liste complète et numérotée dans [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md) (20 constats).

### Questions nécessitant une confirmation du responsable du projet
Voir la liste dédiée dans [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md).

### Vérifications réalisées et restant à effectuer
Voir la section correspondante dans [23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md).

### Confirmation du périmètre des modifications
Seuls des fichiers à l'intérieur de `documentsV2/` ont été créés au cours de cette mission. **Aucun fichier applicatif, de configuration, de migration ou de documentation préexistante n'a été modifié, déplacé ou supprimé.** Aucune commande de migration, de seed, de nettoyage de base de données ou de déploiement n'a été exécutée.
