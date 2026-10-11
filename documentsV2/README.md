# documentsV2 — Documentation d'audit Mima Elghalia (ميما الغالية)

Ce dossier contient la documentation fonctionnelle et technique du projet **Mima Elghalia**, produite par un audit du **code source réel** du dépôt (backend Express/PostgreSQL + frontend React/Vite), à la date du **11 octobre 2026**.

## Principe fondateur : le code fait foi

Cette documentation a été rédigée en suivant une règle stricte : **aucune information n'est reprise depuis une documentation préexistante** (`documentation/`, `docs/`, `tests/*.md`, etc.). Ces dossiers existent déjà dans le dépôt mais peuvent être obsolètes, incomplets ou contredits par le code. Toute affirmation présente ici a été vérifiée directement dans :

- le code backend (`backend/`) : routes (`routes_postgres/`), contrôleurs (`controllers/`), middlewares (`middleware/`), services (`services/`), migrations (`migrations/versions/`, `migrations/*.sql`) ;
- le code frontend (`frontend/src/`) : routes (`routes/AppRoutes.jsx`), pages, contexts, services API, système de permissions (`access/`) ;
- les fichiers de configuration (`package.json`, `.env.example`, `vite.config.js`, workflows GitHub Actions) ;
- les scripts et rapports générés par l'équipe elle-même à partir de la base réelle (`backend/database/db-audit-report.json`, `backend/database/DB_AUDIT_REPORT.md`) lorsqu'ils reflètent un état observé de la base de production.

Quand une information n'a pas pu être vérifiée avec certitude, elle est explicitement marquée **« À vérifier »** avec la raison du doute, plutôt que d'être présentée comme un fait acquis.

## Ce qui n'a PAS été fait

- Aucun fichier applicatif n'a été modifié (backend, frontend, migrations, scripts).
- Aucune donnée n'a été modifiée en base, aucune migration n'a été exécutée.
- Les documentations existantes (`documentation/`, `docs/`, `documents/`, `tests/*.md`) n'ont pas été modifiées, déplacées ni supprimées.
- Aucun test applicatif n'a été exécuté contre un environnement réel (serveur de dev ou production) : les affirmations sur le comportement viennent de la lecture du code, pas d'une exécution.

## Structure du dossier

Voir **[00_INDEX_DOCUMENTATION.md](./00_INDEX_DOCUMENTATION.md)** pour la table des matières complète avec liens.

## Public visé

- **Utilisateurs finaux** (parents, personnel, direction) : fichiers `02` à `08`.
- **Développeurs** : fichiers `09` à `24`.

## Rapport final

Le bilan de cet audit (périmètre couvert, limites, anomalies, questions ouvertes) se trouve à la fin de **[00_INDEX_DOCUMENTATION.md](./00_INDEX_DOCUMENTATION.md)** et dans **[23_ANOMALIES_ET_RECOMMANDATIONS.md](./23_ANOMALIES_ET_RECOMMANDATIONS.md)**.
