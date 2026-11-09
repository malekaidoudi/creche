# 26 — Plans SaaS et feature flags

## Objectif
Proposition de grille tarifaire SaaS pour la transformation du produit en plateforme multi-clients (plusieurs crèches), avec le détail des modules/fonctionnalités activés par palier et les éléments d'implémentation technique associés. Document de **proposition** (statut : à valider par la direction), à mettre à jour une fois les décisions de pricing figées.

## Statut
Proposition — implémentation non démarrée. Dépend du plan de migration multi-tenant décrit dans `docs/MULTI_TENANT_PLAN.md` (prérequis technique : `tenant_id`, RLS, rôle `super_admin`).

## 1. Décisions de cadrage retenues

| Sujet | Décision |
|---|---|
| Cible | Crèches indépendantes (mono-site) **et** réseaux de crèches (multi-sites, en option sur le palier le plus haut) |
| Nombre de paliers | 3 plans : Essentiel / Pro / Premium |
| Modèle de tarification | Hybride : forfait mensuel par palier + quotas inclus (nb enfants, nb staff) + supplément par tranche au-delà des quotas |

## 2. Prérequis technique commun

- Table `tenants` (id, nom, slug, **plan**, quotas, `is_active`) et migration multi-tenant complète (`tenant_id` sur toutes les tables métier, Row-Level Security) — voir `docs/MULTI_TENANT_PLAN.md`.
- Nouvelle table `tenant_features` (ou colonne JSONB `tenants.feature_flags`) listant les modules activés pour un tenant donné.
- Nouveau middleware backend `requireFeature(code)`, sur le même modèle que `requirePermission(code)` de `backend/services/permissionsService.js` / `backend/middleware/auth.js` : il s'agit d'un **niveau de contrôle supplémentaire au-dessus** des 14 permissions granulaires existantes (celles-ci restent intra-tenant : « qui dans l'équipe a le droit de faire quoi » ; les feature flags de plan répondent à « qu'est-ce que ce tenant a le droit d'utiliser du tout »).
- Côté frontend : extension de `frontend/src/access/useAccess.js` / `FEATURES.js` pour exposer également les feature flags de plan (ex. `can('BILLING_MODULE')`), chargés via un futur `GET /api/tenants/me/features`.

## 3. Grille des 3 plans

### 3.1 Essentiel (mono-crèche, usage de base)
Quotas suggérés : jusqu'à 30 enfants / 5 membres du personnel inclus, supplément par tranche de 10 enfants au-delà.

Modules activés :
- Inscriptions en ligne (formulaire public, upload documents, suivi de dossier, RDV d'admission) — `routes_postgres/enrollments.js`, `appointments.js`
- Gestion enfants & parents (fiches, contacts parents/urgence/confiance, comptes parent sans email) — `routes_postgres/children.js`, `contacts.js`
- Présences avec clôture automatique à l'heure de fermeture — `routes_postgres/attendance.js`, `attendanceAutoCheckoutService.js`
- Bilans journaliers (repas, sieste, couches, stock fournitures enfant) — `routes_postgres/dailyReports.js`, `supplies.js`
- Fil d'activités pédagogiques, 1 photo par publication — `routes_postgres/activities.js`
- Messagerie interne parent ↔ personnel — `routes_postgres/staff-messages.js`
- Annonces, calendrier, jours fériés tunisiens — `announcements.js`, `holidays.js`
- Les 14 permissions granulaires du staff restent disponibles (cœur de produit, non restreint par plan) — `permissionsService.js`
- Notifications in-app
- Stockage Cloudinary réduit (quota à définir, ex. 2 Go)
- Sauvegardes automatiques, rétention courte (ex. 7 jours)

Modules désactivés : facturation/cotisations, traitements médicaux, suivi de croissance, photos multiples, assistant IA, multi-site, outils techniques plateforme.

### 3.2 Pro (palier principal, crèche structurée)
Quotas suggérés : jusqu'à 100 enfants / 15 membres du personnel inclus, supplément par tranche de 20 enfants au-delà.

Tout l'Essentiel, plus :
- **Facturation & cotisations** (`nursery_settings.billing_enabled`, `backend/services/billingService.js`, `routes_postgres/billing.js`) : grille tarifaire journée/demi-journée/samedi/assurance, remises fixes, encaissement espèces tracé, reçus PDF, relances, bilan recettes/dépenses
- Traitements médicaux (`routes_postgres/treatments.js`, permission `medical.treatments.manage`)
- Suivi de croissance (poids/taille, `child_growth_records`)
- Photos multiples et carrousel plein écran (jusqu'à 10 photos/post)
- Gestion des absences et des tâches internes avec notifications push
- Témoignages publics avec modération
- Statistiques générales et rapport de présence consolidé
- Thème/logo/couleurs personnalisés par tenant (`nursery_settings`)
- Stockage Cloudinary moyen (ex. 10 Go), sauvegardes 30 jours

Modules désactivés : assistant IA, multi-site, API/webhooks, outils techniques plateforme.

### 3.3 Premium (réseau ou crèche haut de gamme)
Quotas suggérés : jusqu'à 300 enfants / 40 membres du personnel inclus, supplément par tranche de 50 enfants au-delà.

Tout le Pro, plus :
- Assistant IA (Google Gemini, `backend/services/aiAssistantService.js`) — coût d'API variable, justifie le palier le plus élevé
- Sauvegardes avancées : rétention longue, restauration en un clic, export à la demande
- Stockage Cloudinary étendu (ex. 50 Go+)
- Support prioritaire, onboarding assisté
- **Add-on Multi-site / réseau** : un compte admin pilote plusieurs établissements — nécessite la Phase 6 (« Facturation & quotas ») du plan multi-tenant et une agrégation cross-tenant ; vendu en option, pas en standard sur ce palier
- API / Webhooks (à construire) pour intégration comptable externe ou export tiers

### 3.4 Jamais vendu, quel que soit le plan
- `/dashboard/activity-logs` (journal d'activité technique) et `/dashboard/storage` (Cloudinary Explorer) restent réservés au rôle `developer` / futur `super_admin` plateforme. Ce sont des outils d'exploitation pour l'opérateur SaaS, pas une fonctionnalité métier vendable à un client.

## 4. Tableau récapitulatif des quotas (exemple à valider)

| Palier | Enfants inclus | Staff inclus | Stockage | Rétention sauvegardes |
|---|---|---|---|---|
| Essentiel | 30 | 5 | ~2 Go | 7 jours |
| Pro | 100 | 15 | ~10 Go | 30 jours |
| Premium | 300 | 40 | ~50 Go+ | longue + restauration 1 clic |

Les montants de forfait et les tarifs de dépassement ne sont pas fixés dans ce document : ils relèvent d'une décision commerciale de la direction, à documenter ici une fois validés.

## 5. Suites possibles
- Chiffrer précisément les forfaits et dépassements par tranche (décision commerciale).
- Concevoir le schéma `tenant_features` / `tenant_plans` et le middleware `requireFeature`.
- Étendre `docs/MULTI_TENANT_PLAN.md` (Phase 6) avec le détail de la facturation SaaS elle-même (abonnement des tenants, pas à confondre avec la facturation des parents déjà existante côté `billingService.js`).
- Mettre à jour `documentsV2/14_API_REST.md` et `25_DICTIONNAIRE_DES_ROUTES_ET_NAVIGATION.md` lors de l'implémentation effective des routes `tenants`/`tenant-features`.
