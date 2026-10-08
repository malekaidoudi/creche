# Dette Technique et Propreté du Code

Ce document synthétise les points de dette technique identifiés dans l'architecture, la gestion de base de données et le code source.

---

## 1. Base de Données et Schéma

- **Absence d'un outil de migration centralisé** : 
  - Il n'existe aucun gestionnaire de migrations standardisé (ex: Knex, Prisma, Flyway, Umzug).
  - La structure de la base est éclatée entre `backend/init_database.js`, des requêtes `CREATE TABLE IF NOT EXISTS` disséminées dans les contrôleurs (`treatmentsController.js`, `permissionsService.js`, `db_postgres.js`), et des scripts SQL non orchestrés (`migrations/*`).
- **Contraintes de schéma obsolètes** :
  - `init_database.js` applique une contrainte `CHECK (role IN ('admin', 'staff', 'parent'))` qui rejette le rôle `developer` pourtant largement utilisé dans le backend.
  - La table `nursery_settings` est créée avec deux colonnes `setting_key, setting_value` dans `init_database.js`, alors que le code applicatif utilise les colonnes `setting_key, value_fr, value_ar, category, is_active`.
- **Faible normalisation des relations parents-enfants** :
  - La table `children` possède une colonne `parent_id` (relation 1-N simple), tandis qu'une table `parent_children` est mentionnée dans des scripts pour gérer du N-N sans être exploitée de manière homogène.

---

## 2. Architecture Backend

- **Duplication de logique (Contrôleurs vs Routeurs)** :
  - Une dizaine de fichiers de contrôleurs (`userController`, `attendanceController`, `tasksController`, etc.) sont présents mais abandonnés, car les requêtes SQL ont été directement réécrites à l'intérieur des routeurs `backend/routes_postgres/`.
- **Incohérence sur la gestion des secrets JWT** :
  - `backend/routes_postgres/auth.js` intègre une chaîne secrète de secours par défaut, tandis que `backend/middleware/auth.js` n'en a pas.
- **Sauvegarde locale risquée** :
  - Le système de sauvegarde (`backupJob.js`, `backup.js`) enregistre des fichiers JSON directement sur le conteneur applicatif au lieu d'un stockage objet distant sécurisé (S3 / R2).
  - La commande de restauration exécute des `TRUNCATE ... CASCADE` table par table sans transaction SQL globale (`BEGIN / ROLLBACK`), risquant de laisser la base dans un état corrompu en cas d'interruption.

---

## 3. Architecture Frontend

- **Contournement de session de développement (`mock_token_*`)** :
  - Le contexte d'authentification (`AuthContext.jsx`) contient du code permettant de simuler une connexion avec des jetons fictifs stockés en `localStorage`. Ce code de débogage ne doit pas subsister en production.
- **Gestion des droits UI décorrélée du backend** :
  - Le frontend gère des conditions d'affichage fines, mais le backend n'applique pas les contrôles correspondants sur les endpoints de l'API.
- **Mélange de styles CSS** :
  - Coexistence de classes utilitaires Tailwind avec des styles CSS inlinés et des composants tiers (FullCalendar) aux surcharges complexes.
