# Plan de migration Multi-Tenant — Crèche Mima Elghalia

> Document de référence pour la transformation de l'application en plateforme SaaS multi-clients.
> Statut : **Proposition validée (décisions prises) — implémentation non démarrée**
> Date de rédaction : 2026-09-27

## 1. Contexte — Lecture de l'architecture actuelle

**Stack** : Node.js/Express (monolithe) + PostgreSQL (Neon) + React/Vite + Cloudinary pour les fichiers, déployé sur Render/Fly.

**Constat de l'audit du code existant :**
- **~35-40 tables** (users, children, enrollments, attendance, daily_reports, daily_meals, staff_messages, tasks, events, notifications, documents, testimonials, treatments, etc.) — **aucune n'a de notion de tenant**.
- **1 seule base Neon**, pool de connexions simple (`backend/config/db_postgres.js`), pas de Row-Level Security.
- **JWT** ne contient que `{userId, email, role}` — pas de `tenant_id` (voir `backend/routes_postgres/auth.js`).
- **~40 fichiers de routes** dans `backend/routes_postgres/`, chacun exécute ses propres `db.query(...)` directement (pas de couche repository unifiée) → chaque requête devra être auditée et scopée.
- **Fichiers** : Cloudinary avec des dossiers globaux (pas segmentés par client) + `backend/uploads/` local sur disque (non tenant-safe si on scale horizontalement).
- **CORS** : liste blanche d'origines codée en dur dans `backend/server.js` (1 seul domaine de prod).
- **Cron jobs globaux** (`backend/jobs/backupJob.js`, `eventJobs.js`, `treatmentJob.js`) supposent une seule crèche.
- **`nursery_settings`** : déjà une table clé/valeur — deviendra naturellement une table par-tenant.
- Rôles existants : `admin`, `developer`, `staff`, `parent` (voir `backend/middleware/auth.js`) — ajout nécessaire d'un rôle **super-admin plateforme** (cross-tenant).

## 2. Décisions prises

| Sujet | Décision |
|---|---|
| Stratégie d'isolation des données | **Shared DB + colonne `tenant_id` + Row-Level Security (RLS)** |
| Résolution du tenant côté frontend | **Sélection au login** (pas de sous-domaine, pas de domaine personnalisé pour l'instant) |
| Objectif business | **SaaS multi-clients** (chaque crèche = un client indépendant avec ses propres données/utilisateurs/admins) |

## 3. Plan de migration détaillé

### Phase 0 — Fondations & décisions (1-2 jours)
- Créer table `tenants` (id UUID, nom, slug, statut, plan, date création, `is_active`).
- Ajouter `tenant_id` directement sur `users` (email unique **par tenant**, pas globalement) → migration de la contrainte `UNIQUE(email)` vers `UNIQUE(tenant_id, email)`.
- Définir la stratégie de connexion DB : garder **1 pool Neon partagé**, injecter `SET app.current_tenant_id` par transaction pour la RLS.
- Ajouter le rôle `super_admin` (plateforme, cross-tenant, `tenant_id` NULL).

### Phase 1 — Modèle de données (3-5 jours)
1. **Migration SQL** : ajouter `tenant_id UUID NOT NULL REFERENCES tenants(id)` sur **toutes** les tables métier (users, children, enrollments, attendance, holidays, nursery_settings, notifications, daily_reports, daily_meals, daily_diaper_changes, child_supplies, staff_age_assignments, staff_messages, activity_logs, events, event_reminders, event_history, logs, tasks, announcements, testimonials, admin_documents, contacts, documents, enrollment_documents, treatments, treatment_administrations, payment_alerts, appointments, absence_requests, personal_memos, virtual_tour, etc.).
2. Ajouter un **index composite** `(tenant_id, ...)` sur chaque table pour remplacer les index simples existants (ex: `idx_children_name` → `(tenant_id, first_name, last_name)`).
3. **Row-Level Security (RLS)** :
   ```sql
   ALTER TABLE children ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON children
     USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
   ```
   Appliqué table par table — filet de sécurité en cas d'oubli d'un `WHERE tenant_id = ...` dans le code applicatif.
4. Script de **backfill** : assigner `tenant_id` = tenant "Mima Elghalia" (le client actuel) à toutes les lignes existantes.
5. Revoir les contraintes `UNIQUE` : `enrollments(parent_id, child_id)` → `(tenant_id, parent_id, child_id)`, `holidays(date)` → `(tenant_id, date)`, etc.

### Phase 2 — Backend Express (5-8 jours)
1. **`backend/config/db_postgres.js`** :
   - Ajouter une fonction `queryWithTenant(tenantId, text, params)` qui fait `SET LOCAL app.current_tenant_id` dans une transaction avant la requête.
   - Ou plus simple/robuste : wrapper `db.query` pour injecter automatiquement le `tenant_id` en paramètre WHERE (double protection avec RLS).
2. **Middleware `tenantContext.js`** (nouveau, dans `backend/middleware/`) :
   - Extrait `tenant_id` du JWT (`req.user.tenant_id`), le pose sur `req.tenantId`.
   - Exécute `SET app.current_tenant_id` sur la connexion utilisée pour la requête.
   - Bloque toute requête sans tenant valide (sauf routes `super_admin` et `auth/login`).
3. **`backend/middleware/auth.js`** : injecter `tenant_id` dans le payload JWT au login, adapter `requireRole`/`requireOwnershipOrStaff` pour toujours scoper par tenant.
4. **Flux de login multi-tenant** (sélection post-login) :
   - `POST /api/auth/login` : si l'utilisateur appartient à un seul tenant → token direct. Si plusieurs (rare mais à prévoir) → retourner la liste des tenants, puis `POST /api/auth/select-tenant` génère le token final.
   - Nouvelle route `POST /api/tenants/register` (onboarding self-service d'une nouvelle crèche) avec création automatique de l'admin + tenant.
5. **Audit exhaustif des 40 fichiers `routes_postgres/*.js`** : ajouter `AND tenant_id = $N` (ou `WHERE tenant_id = $1`) à **chaque** requête SQL. Partie la plus longue du chantier — à traiter fichier par fichier, potentiellement en parallèle par lots.
6. **Jobs cron** (`jobs/eventJobs.js`, `jobs/backupJob.js`, `jobs/treatmentJob.js`) : boucler sur tous les tenants actifs au lieu de supposer un seul contexte global.
7. **Nouveau module `routes_postgres/tenants.js` + `controllers/tenantsController.js`** : CRUD tenants réservé à `super_admin` (créer/suspendre/supprimer un client, gérer le plan/quota).
8. **Rate limiting & CORS** : passer d'une liste blanche statique à une résolution dynamique par tenant (domaine personnalisé stocké en base) si besoin plus tard — pour l'instant avec sélection post-login, CORS reste simple (un seul frontend).

### Phase 3 — Stockage fichiers (Cloudinary + uploads) (2-3 jours)
- Préfixer tous les dossiers Cloudinary par `tenant_id` (ou slug) : `creches/{tenant_slug}/enrollments/...`, `creches/{tenant_slug}/children/...`.
- Migrer `backend/uploads/` local vers un chemin `uploads/{tenant_id}/...` ou idéalement tout basculer sur Cloudinary (déjà en cours vu les scripts de migration existants dans `backend/scripts/`) pour éviter les problèmes de tenant-isolation sur disque partagé.
- Script de migration des fichiers existants du tenant "Mima Elghalia" vers son nouveau préfixe.

### Phase 4 — Frontend React (4-6 jours)
1. **`frontend/src/contexts/AuthContext.jsx`** : stocker `tenant` (id, nom, logo, couleur) en plus de `user`/`token`. Gérer l'écran de sélection de tenant si `login` renvoie plusieurs tenants.
2. **`frontend/src/services/api.js`** : le JWT porte le tenant (le backend le lit du token, pas besoin de header supplémentaire côté client si sélection au login).
3. **Nouvelle page `SelectTenantPage.jsx`** (si multi-tenant par user) + route protégée.
4. **Page super-admin** (`pages/dashboard/PlatformAdminPage.jsx`) : liste des tenants, création, suspension, statistiques globales.
5. **Theming par tenant** : `nursery_settings` devient déjà par-tenant → logo, nom, couleurs custom affichés dynamiquement (bonus SaaS).
6. Vérifier que les appels API dans les fichiers `.jsx/.js` du frontend n'assument pas de données globales (peu de risque ici car tout passe par le backend).

### Phase 5 — Sécurité, tests, migration des données (3-5 jours)
- **Tests d'isolation** : script automatisé qui crée 2 tenants factices et vérifie qu'aucune requête d'un tenant A ne peut lire/écrire les données de B (test critique de non-régression pour un SaaS).
- **Revue de sécurité** : vérifier que RLS est bien activée sur *toutes* les tables (script SQL de contrôle `pg_tables` vs `pg_policies`).
- **Migration production** : la base actuelle devient le tenant #1, downtime minimal via migration en une transaction (ajout colonnes + backfill + contraintes NOT NULL + activation RLS).
- Mettre à jour les scripts `init_database.js`, `scripts/init_production*.js`, `scripts/seed.js` pour créer un tenant par défaut au bootstrap.

### Phase 6 — Facturation & quotas (optionnel, si SaaS payant)
- Table `tenant_plans` / `tenant_subscriptions` (Stripe ou autre) — à ajouter seulement si la monétisation SaaS est prévue à court terme.
- Limites par plan (nb enfants, nb staff, stockage) vérifiées via middleware.

## 4. Modules/fichiers impactés (résumé)

| Zone | Fichiers |
|---|---|
| DB | `backend/database/schema_postgres.sql`, `backend/init_database.js`, nouvelle migration `003_add_multi_tenant.sql` |
| Middleware | `backend/middleware/auth.js`, nouveau `backend/middleware/tenantContext.js` |
| Config | `backend/config/db_postgres.js` |
| Routes | Les 40 fichiers de `backend/routes_postgres/` + nouveau `tenants.js` |
| Controllers | Les 14 fichiers de `backend/controllers/` |
| Jobs | `backend/jobs/eventJobs.js`, `backend/jobs/backupJob.js`, `backend/jobs/treatmentJob.js` |
| Storage | `backend/services/cloudinaryService.js`, `backend/middleware/upload.js` |
| Frontend | `frontend/src/contexts/AuthContext.jsx`, `frontend/src/services/api.js`, nouvelles pages `SelectTenantPage`, `PlatformAdminPage`, routing `frontend/src/routes/` |

## 5. Estimation globale

Environ **20-30 jours-développeur** pour un passage complet et sécurisé. Le plus gros poste est l'audit + réécriture des ~40 fichiers de routes pour scoper chaque requête SQL par tenant.

## 6. Ordre de démarrage recommandé

1. **Phase 0 + Phase 1** : schéma + migration SQL (valider le modèle de données avant le code applicatif).
2. **Phase 2** : middleware tenant + audit des routes (peut être parallélisé par lots de fichiers).
3. **Phase 3** : stockage fichiers.
4. **Phase 4** : frontend.
5. **Phase 5** : tests d'isolation + migration prod.
6. **Phase 6** : facturation (si applicable, plus tard).
