# Vue d'ensemble du projet

## Objectif de l'application

Digitaliser la gestion quotidienne de la crèche Mima Elghalia : inscriptions, dossiers enfants, présences, suivi journalier, communication avec les parents, organisation interne.

## Informations d'identité (issues du code et des paramètres par défaut)

- Nom : Mima Elghalia / ميما الغالية — Médenine, Tunisie.
- Les coordonnées (adresse, téléphone, horaires, e-mail de contact) sont **stockées dans la table `nursery_settings`** et modifiables (voir [settings-and-holidays](../04-domain/settings-and-holidays.md)). Des valeurs différentes apparaissent dans le code (ex. adresse « 16 Rue Bizerte » dans `backend/init_database.js` vs « 8 Rue Bizerte » dans le `README.md` racine) → **valeur de production à vérifier**.

## Composition du dépôt

| Dossier | Contenu |
|---|---|
| `frontend/` | Application React (Vite, Tailwind) |
| `backend/` | API Express + PostgreSQL, jobs cron, e-mails, scripts |
| `docs/`, `tests/`, `backend/docs/` | Notes historiques, plans de test, corrections (partiellement obsolètes) |
| `scripts/`, `*.sh` | Scripts de maintenance/démarrage |
| `.github/workflows/deploy-frontend.yml` | Déploiement du frontend sur GitHub Pages |
| `FORMATION_PERSONNEL.html`, `PRESENTATION_*.html/md` | Supports de formation/présentation (non analysés en détail) |
| `venv/`, `.kilo/` | Environnement Python et copies de travail **versionnés par erreur** (voir audit) |

## Statut

Projet en cours de développement actif (versions affichées : backend 2.1.0 dans `server.js`, `package.json` 2.0.0 — incohérence mineure).

Voir aussi : [functional-overview](functional-overview.md) · [architecture-overview](architecture-overview.md).
